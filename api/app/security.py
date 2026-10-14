import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError
import jwt
from jwt import InvalidTokenError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import get_settings
from app.db import get_db
from app.models import User, RefreshToken, Tenant


hasher = PasswordHasher()
bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return hasher.hash(password)


def verify_password(stored: str, password: str) -> bool:
    try:
        return hasher.verify(stored, password)
    except (VerifyMismatchError, VerificationError):
        return False


def make_token(user: User, kind: str, jti: str | None = None) -> str:
    settings = get_settings()
    expiry = datetime.now(timezone.utc) + (timedelta(minutes=settings.access_minutes) if kind == 'access' else timedelta(days=settings.refresh_days))
    claims = {'sub': str(user.id), 'role': user.role, 'tenant_id': str(user.tenant_id) if user.tenant_id else None,
              'typ': kind, 'iss': settings.jwt_issuer, 'exp': expiry, 'iat': datetime.now(timezone.utc), 'jti': jti or str(uuid.uuid4())}
    return jwt.encode(claims, settings.jwt_secret, algorithm='HS256')


def decode_token(token: str, kind: str) -> dict:
    try:
        claims = jwt.decode(token, get_settings().jwt_secret, algorithms=['HS256'], issuer=get_settings().jwt_issuer)
        if claims.get('typ') != kind:
            raise InvalidTokenError('wrong token type')
        return claims
    except InvalidTokenError:
        raise HTTPException(status_code=401, detail='Token inválido')


async def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer), db: AsyncSession = Depends(get_db)) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail='Token ausente')
    claims = decode_token(credentials.credentials, 'access')
    user = await db.get(User, uuid.UUID(claims['sub']))
    if not user or not user.active or user.role != claims.get('role') or str(user.tenant_id) != str(claims.get('tenant_id')):
        raise HTTPException(status_code=401, detail='Sessão inválida')
    if user.tenant_id:
        tenant = await db.get(Tenant, user.tenant_id)
        if not tenant or not tenant.active or tenant.status in ('suspended', 'cancelled'):
            raise HTTPException(status_code=403, detail='Loja inativa')
    return user


async def tenant_context(user: User = Depends(current_user)) -> uuid.UUID:
    if user.role not in ('gerente', 'funcionario', 'totem') or not user.tenant_id:
        raise HTTPException(status_code=403, detail='Acesso de loja necessário')
    return user.tenant_id


async def manager_context(user: User = Depends(current_user)) -> uuid.UUID:
    if user.role != 'gerente' or not user.tenant_id:
        raise HTTPException(status_code=403, detail='Gerente necessário')
    return user.tenant_id


async def superadmin(user: User = Depends(current_user)) -> User:
    if user.role != 'superadmin' or user.tenant_id is not None:
        raise HTTPException(status_code=403, detail='SuperAdmin necessário')
    return user


def jti_hash(jti: str) -> str:
    return hashlib.sha256(jti.encode()).hexdigest()


async def issue_tokens(db: AsyncSession, user: User):
    jti = str(uuid.uuid4())
    refresh = make_token(user, 'refresh', jti)
    db.add(RefreshToken(user_id=user.id, tenant_id=user.tenant_id, jti_hash=jti_hash(jti),
                        expires_at=datetime.now(timezone.utc) + timedelta(days=get_settings().refresh_days)))
    await db.commit()
    return {'accessToken': make_token(user, 'access'), 'refreshToken': refresh, 'token_type': 'bearer',
            'user': {'id': user.id, 'name': user.name, 'email': user.email, 'role': user.role,
                     'tenantId': user.tenant_id, 'active': user.active}}


async def rotate_refresh(db: AsyncSession, token: str):
    claims = decode_token(token, 'refresh')
    record = await db.scalar(select(RefreshToken).where(RefreshToken.jti_hash == jti_hash(claims['jti'])).with_for_update())
    if not record or record.revoked:
        raise HTTPException(401, 'Refresh token revogado')
    user = await db.get(User, record.user_id)
    if not user or not user.active or str(user.tenant_id) != str(claims.get('tenant_id')):
        raise HTTPException(401, 'Sessão inválida')
    if user.tenant_id:
        tenant = await db.get(Tenant, user.tenant_id)
        if not tenant or not tenant.active or tenant.status in ('suspended', 'cancelled'):
            raise HTTPException(403, 'Loja inativa')
    record.revoked = True
    await db.flush()
    return await issue_tokens(db, user)
