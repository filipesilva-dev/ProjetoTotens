import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app import models as m
from app.schemas import PlanOut, CategoryIn, CategoryOut, ProductIn, ProductOut
from app.security import tenant_context, manager_context
from app.repositories import TenantRepository
from app.services import plan_by_ref, category_data, product_data


router = APIRouter(prefix='/api/v1', tags=['catalog'])


@router.get('/public/settings')
async def public_settings(db: AsyncSession = Depends(get_db)):
    settings = await db.scalar(select(m.SystemSetting).where(m.SystemSetting.key == 'console'))
    return {'welcomeMessage': (settings.value if settings else {}).get('welcomeMessage', 'Bem-vindo ao FastLanches!')}


@router.get('/plans', response_model=list[PlanOut])
async def plans(db: AsyncSession = Depends(get_db)):
    return list((await db.scalars(select(m.Plan).where(m.Plan.active.is_(True)).order_by(m.Plan.sort_order))).all())


@router.get('/plans/{ref}', response_model=PlanOut)
async def plan(ref: str, db: AsyncSession = Depends(get_db)):
    return await plan_by_ref(db, ref)


@router.get('/categories', response_model=list[CategoryOut])
async def categories(tenant_id: uuid.UUID = Depends(tenant_context), db: AsyncSession = Depends(get_db)):
    return [category_data(x) for x in await TenantRepository(db, m.Category, tenant_id).list()]


@router.post('/categories', response_model=CategoryOut, status_code=201)
async def create_category(data: CategoryIn, tenant_id: uuid.UUID = Depends(manager_context), db: AsyncSession = Depends(get_db)):
    x = m.Category(tenant_id=tenant_id, name=data.name, icon=data.icon, sort_order=data.order)
    db.add(x); await db.commit(); await db.refresh(x)
    return category_data(x)


@router.patch('/categories/{item_id}', response_model=CategoryOut)
async def update_category(item_id: uuid.UUID, data: CategoryIn, tenant_id: uuid.UUID = Depends(manager_context), db: AsyncSession = Depends(get_db)):
    x = await TenantRepository(db, m.Category, tenant_id).get(item_id)
    if not x: raise HTTPException(404, 'Categoria não encontrada')
    x.name, x.icon, x.sort_order = data.name, data.icon, data.order
    await db.commit(); return category_data(x)


@router.delete('/categories/{item_id}', status_code=204)
async def delete_category(item_id: uuid.UUID, tenant_id: uuid.UUID = Depends(manager_context), db: AsyncSession = Depends(get_db)):
    x = await TenantRepository(db, m.Category, tenant_id).get(item_id)
    if not x: raise HTTPException(404, 'Categoria não encontrada')
    used = await db.scalar(select(m.Product.id).where(m.Product.tenant_id == tenant_id, m.Product.category_id == item_id).limit(1))
    if used: raise HTTPException(409, 'Categoria contém produtos')
    await db.delete(x); await db.commit()


@router.get('/products', response_model=list[ProductOut])
async def products(tenant_id: uuid.UUID = Depends(tenant_context), db: AsyncSession = Depends(get_db)):
    return [product_data(x) for x in await TenantRepository(db, m.Product, tenant_id).list()]


@router.get('/products/{item_id}', response_model=ProductOut)
async def product(item_id: uuid.UUID, tenant_id: uuid.UUID = Depends(tenant_context), db: AsyncSession = Depends(get_db)):
    x = await TenantRepository(db, m.Product, tenant_id).get(item_id)
    if not x: raise HTTPException(404, 'Produto não encontrado')
    return product_data(x)


async def save_product(db: AsyncSession, tenant_id: uuid.UUID, data: ProductIn, x: m.Product | None = None):
    if not await TenantRepository(db, m.Category, tenant_id).get(data.category_id):
        raise HTTPException(422, 'Categoria inválida')
    if not x:
        x = m.Product(tenant_id=tenant_id)
        db.add(x)
    x.name, x.description, x.price = data.name, data.description, data.price
    x.image_url, x.category_id, x.available = data.image_url, data.category_id, data.available
    x.ingredients = data.ingredients
    x.additions = [{'id': str(a.id or uuid.uuid4()), 'name': a.name, 'price': float(a.price)} for a in data.additions]
    x.allergens, x.ncm, x.cfop = data.allergens, data.ncm, data.cfop
    await db.commit(); await db.refresh(x)
    return product_data(x)


@router.post('/products', response_model=ProductOut, status_code=201)
async def create_product(data: ProductIn, tenant_id: uuid.UUID = Depends(manager_context), db: AsyncSession = Depends(get_db)):
    tenant = await db.get(m.Tenant, tenant_id)
    plan = await db.get(m.Plan, tenant.plan_id) if tenant.plan_id else None
    count = await db.scalar(select(func.count()).select_from(m.Product).where(m.Product.tenant_id == tenant_id))
    if plan and plan.max_products >= 0 and count >= plan.max_products:
        raise HTTPException(403, 'Limite de produtos do plano atingido')
    return await save_product(db, tenant_id, data)


@router.put('/products/{item_id}', response_model=ProductOut)
async def update_product(item_id: uuid.UUID, data: ProductIn, tenant_id: uuid.UUID = Depends(manager_context), db: AsyncSession = Depends(get_db)):
    x = await TenantRepository(db, m.Product, tenant_id).get(item_id)
    if not x: raise HTTPException(404, 'Produto não encontrado')
    return await save_product(db, tenant_id, data, x)


@router.delete('/products/{item_id}', status_code=204)
async def delete_product(item_id: uuid.UUID, tenant_id: uuid.UUID = Depends(manager_context), db: AsyncSession = Depends(get_db)):
    x = await TenantRepository(db, m.Product, tenant_id).get(item_id)
    if not x: raise HTTPException(404, 'Produto não encontrado')
    await db.delete(x); await db.commit()
