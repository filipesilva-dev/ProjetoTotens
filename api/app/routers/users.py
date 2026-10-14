import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app import models as m
from app.schemas import ManagerIn, UserOut, ManagerPatch, ResetPassword
from app.security import manager_context, hash_password


router = APIRouter(prefix='/api/v1/users', tags=['store users'])


@router.get('', response_model=list[UserOut])
async def list_users(tenant_id: uuid.UUID = Depends(manager_context), db: AsyncSession = Depends(get_db)):
    return list((await db.scalars(select(m.User).where(m.User.tenant_id == tenant_id))).all())


@router.post('/employees', response_model=UserOut, status_code=201)
async def create_employee(data: ManagerIn, tenant_id: uuid.UUID = Depends(manager_context), db: AsyncSession = Depends(get_db)):
    if await db.scalar(select(m.User).where(m.User.email == str(data.email).lower())): raise HTTPException(409, 'Email já utilizado')
    user = m.User(tenant_id=tenant_id, name=data.name, email=str(data.email).lower(),
                  password_hash=hash_password(data.password), role='funcionario')
    db.add(user); await db.commit(); return user


@router.post('/kiosks', response_model=UserOut, status_code=201)
async def create_kiosk(data: ManagerIn, tenant_id: uuid.UUID = Depends(manager_context), db: AsyncSession = Depends(get_db)):
    if await db.scalar(select(m.User).where(m.User.email == str(data.email).lower())): raise HTTPException(409, 'Email já utilizado')
    tenant = await db.get(m.Tenant, tenant_id)
    plan = await db.get(m.Plan, tenant.plan_id) if tenant.plan_id else None
    count = await db.scalar(select(func.count()).select_from(m.User).where(m.User.tenant_id == tenant_id, m.User.role == 'totem', m.User.active.is_(True)))
    if plan and plan.max_totems >= 0 and count >= plan.max_totems: raise HTTPException(403, 'Limite de totens do plano atingido')
    user = m.User(tenant_id=tenant_id, name=data.name, email=str(data.email).lower(),
                  password_hash=hash_password(data.password), role='totem')
    db.add(user); await db.commit(); return user


@router.patch('/{user_id}', response_model=UserOut)
async def update_user(user_id: uuid.UUID, data: ManagerPatch, tenant_id: uuid.UUID = Depends(manager_context), db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(m.User).where(m.User.id == user_id, m.User.tenant_id == tenant_id, m.User.role.in_(['funcionario','totem'])))
    if not user: raise HTTPException(404, 'Usuário não encontrado')
    for k, v in data.model_dump(exclude_unset=True).items(): setattr(user, k, v)
    await db.commit(); return user


@router.post('/{user_id}/reset-password')
async def reset_user(user_id: uuid.UUID, data: ResetPassword, tenant_id: uuid.UUID = Depends(manager_context), db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(m.User).where(m.User.id == user_id, m.User.tenant_id == tenant_id, m.User.role.in_(['funcionario','totem'])))
    if not user: raise HTTPException(404, 'Usuário não encontrado')
    user.password_hash = hash_password(data.password)
    await db.execute(update(m.RefreshToken).where(m.RefreshToken.user_id == user.id).values(revoked=True))
    await db.commit(); return {'ok': True}
