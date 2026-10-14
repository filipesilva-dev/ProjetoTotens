import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from app.config import get_settings
from app.db import SessionLocal
from app.models import Plan, Tenant, User, Category, Product, SystemSetting
from app.security import hash_password


async def seed():
    cfg = get_settings()
    async with SessionLocal() as db:
        plans = [('basic', 'Básico', 199, 1990, 1, 50), ('pro', 'Pro', 399, 3990, 3, -1),
                 ('enterprise', 'Enterprise', 899, 8990, -1, -1)]
        for index, (slug, name, monthly, yearly, totems, products) in enumerate(plans):
            if not await db.scalar(select(Plan).where(Plan.slug == slug)):
                db.add(Plan(slug=slug, name=name, description=f'Plano {name}', price_monthly=monthly,
                            price_yearly=yearly, features=['Cardápio digital', 'Pix', 'Relatórios'], max_totems=totems,
                            max_products=products, highlighted=slug == 'pro', sort_order=index))
        await db.flush()
        if not await db.scalar(select(SystemSetting).where(SystemSetting.key == 'console')):
            db.add(SystemSetting(key='console', value={'autoSuspend': True, 'welcomeMessage': 'Bem-vindo ao FastLanches!'}))
        if cfg.superadmin_email and cfg.superadmin_password:
            email = cfg.superadmin_email.lower()
            if not await db.scalar(select(User).where(User.email == email)):
                db.add(User(name='SuperAdmin', email=email, password_hash=hash_password(cfg.superadmin_password), role='superadmin'))
        if cfg.seed_tenant_email and cfg.seed_tenant_password:
            tenant = await db.scalar(select(Tenant).where(Tenant.slug == 'loja-exemplo'))
            if not tenant:
                plan = await db.scalar(select(Plan).where(Plan.slug == 'pro'))
                tenant = Tenant(slug='loja-exemplo', name='Loja Exemplo', owner_name='Gerente Exemplo',
                                owner_email=cfg.seed_tenant_email.lower(), plan_id=plan.id, status='trial',
                                contract_ends_at=datetime.now(timezone.utc) + timedelta(days=14))
                db.add(tenant); await db.flush()
                category = Category(tenant_id=tenant.id, name='Lanches', icon='burger', sort_order=1)
                db.add(category); await db.flush()
                db.add(Product(tenant_id=tenant.id, category_id=category.id, name='Hambúrguer Exemplo',
                               description='Produto de demonstração', price=25, available=True,
                               ingredients=['Alface','Tomate'], additions=[], allergens=['gluten']))
            if not await db.scalar(select(User).where(User.email == cfg.seed_tenant_email.lower())):
                db.add(User(tenant_id=tenant.id, name='Gerente Exemplo', email=cfg.seed_tenant_email.lower(),
                            password_hash=hash_password(cfg.seed_tenant_password), role='gerente'))
            if cfg.seed_kiosk_email and cfg.seed_kiosk_password and not await db.scalar(select(User).where(User.email == cfg.seed_kiosk_email.lower())):
                db.add(User(tenant_id=tenant.id, name='Totem Exemplo', email=cfg.seed_kiosk_email.lower(),
                            password_hash=hash_password(cfg.seed_kiosk_password), role='totem'))
        await db.commit()


if __name__ == '__main__': asyncio.run(seed())

