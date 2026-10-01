import uuid
from fastapi import Depends, Header, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.db import get_db
from app.models import Tenant, User

bearer = HTTPBearer(auto_error=False)


async def get_tenant(
    x_tenant: str | None = Header(default=None, alias="X-Tenant"),
    db: AsyncSession = Depends(get_db),
) -> Tenant:
    slug = x_tenant or settings.default_tenant_slug
    tenant = await db.scalar(select(Tenant).where(Tenant.slug == slug, Tenant.active.is_(True)))
    if not tenant:
        raise HTTPException(404, "Tenant não encontrado", headers={"X-Error-Code": "tenant_not_found"})
    return tenant


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    tenant: Tenant = Depends(get_tenant), db: AsyncSession = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(401, "Autenticação necessária")
    try:
        data = jwt.decode(credentials.credentials, settings.jwt_secret, algorithms=["HS256"])
        user = await db.scalar(select(User).where(User.id == uuid.UUID(data["sub"]), User.tenant_id == tenant.id))
    except (JWTError, ValueError, KeyError):
        user = None
    if not user or not user.active:
        raise HTTPException(401, "Token inválido ou expirado")
    return user
