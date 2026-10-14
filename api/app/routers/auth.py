import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import quote
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import update
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app import models as m
from app.schemas import LoginIn, RefreshIn, SignupIn, Tokens, TenantOut
from app.security import verify_password, hash_password, issue_tokens, rotate_refresh, current_user
from app.services import create_tenant, tenant_data
from app.config import get_settings
from app.mailer import send_email


router = APIRouter(prefix='/api/v1', tags=['authentication'])


class ForgotIn(BaseModel):
    email: EmailStr


class ResetIn(BaseModel):
    token: str
    password: str = Field(min_length=8)


def set_refresh_cookie(response: Response, token: str):
    settings = get_settings()
    response.set_cookie('refresh_token', token, max_age=settings.refresh_days * 86400,
                        httponly=True, secure=settings.environment == 'production',
                        samesite='lax', path='/api/v1/auth')


@router.post('/auth/login', response_model=Tokens)
async def login(data: LoginIn, response: Response, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(m.User).where(m.User.email == str(data.email).lower()))
    if not user or not user.active or not verify_password(user.password_hash, data.password):
        raise HTTPException(401, 'Credenciais inválidas')
    if user.tenant_id:
        tenant = await db.get(m.Tenant, user.tenant_id)
        if not tenant or not tenant.active or tenant.status in ('suspended', 'cancelled'):
            raise HTTPException(403, 'Loja inativa')
    result = await issue_tokens(db, user)
    set_refresh_cookie(response, result['refreshToken'])
    return result


@router.post('/auth/refresh', response_model=Tokens)
async def refresh(request: Request, response: Response, data: RefreshIn | None = None, db: AsyncSession = Depends(get_db)):
    token = request.cookies.get('refresh_token') or (data.refresh_token if data else None)
    if not token:
        raise HTTPException(401, 'Refresh token ausente')
    result = await rotate_refresh(db, token)
    set_refresh_cookie(response, result['refreshToken'])
    return result


@router.post('/auth/logout')
async def logout(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    from app.security import decode_token, jti_hash
    token = request.cookies.get('refresh_token')
    if token:
        try:
            claims = decode_token(token, 'refresh')
            await db.execute(update(m.RefreshToken).where(m.RefreshToken.jti_hash == jti_hash(claims['jti'])).values(revoked=True))
            await db.commit()
        except HTTPException:
            pass
    response.delete_cookie('refresh_token', path='/api/v1/auth')
    return {'ok': True}


@router.post('/auth/forgot-password')
async def forgot_password(data: ForgotIn, db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(m.User).where(m.User.email == str(data.email).lower(), m.User.active == True))
    if user:
        token = secrets.token_urlsafe(32)
        db.add(m.PasswordResetToken(user_id=user.id, token_hash=hashlib.sha256(token.encode()).hexdigest(),
                                    expires_at=datetime.now(timezone.utc) + timedelta(minutes=30)))
        await db.commit()
        link = f"{get_settings().frontend_base_url.rstrip('/')}/redefinir-senha?token={quote(token)}"
        await send_email(user.email, 'Redefinir senha', f'Acesse o link em até 30 minutos: {link}')
    return {'ok': True}


@router.post('/auth/reset-password')
async def reset_password(data: ResetIn, db: AsyncSession = Depends(get_db)):
    record = await db.scalar(select(m.PasswordResetToken).where(
        m.PasswordResetToken.token_hash == hashlib.sha256(data.token.encode()).hexdigest()).with_for_update())
    if not record or record.used_at or record.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(400, 'Link inválido ou expirado')
    user = await db.get(m.User, record.user_id)
    if not user or not user.active:
        raise HTTPException(400, 'Link inválido ou expirado')
    user.password_hash = hash_password(data.password)
    record.used_at = datetime.now(timezone.utc)
    await db.execute(update(m.RefreshToken).where(m.RefreshToken.user_id == user.id).values(revoked=True))
    await db.commit()
    return {'ok': True}


@router.get('/auth/me')
async def me(user: m.User = Depends(current_user)):
    return {'id': user.id, 'name': user.name, 'email': user.email, 'role': user.role, 'tenantId': user.tenant_id}


@router.post('/tenants', response_model=TenantOut, status_code=201)
async def signup(data: SignupIn, db: AsyncSession = Depends(get_db)):
    if await db.scalar(select(m.User).where(m.User.email == str(data.owner_email).lower())):
        raise HTTPException(409, 'Email já utilizado')
    tenant = await create_tenant(db, data)
    db.add(m.User(tenant_id=tenant.id, name=data.owner_name, email=str(data.owner_email).lower(),
                  password_hash=hash_password(data.password), role='gerente'))
    await db.commit()
    await send_email(tenant.owner_email, 'Bem-vindo ao FastLanches',
                     f'Sua loja {tenant.name} foi criada. Você já pode acessar o painel.')
    return await tenant_data(db, tenant)

