import uuid
import csv
import io
import secrets
from datetime import timedelta
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app import models as m
from app.schemas import TenantIn, TenantPatch, TenantOut, StatusIn, ManagerIn, ManagerPatch, ResetPassword, UserOut, BillingIn, BillingOut
from app.security import superadmin, hash_password
from app.repositories import TenantRepository
from app.services import create_tenant, tenant_data, plan_by_ref, billing_data, audit
from app.providers import payment_provider
from decimal import Decimal
from pydantic import BaseModel, Field
from cryptography.fernet import Fernet
from app.config import get_settings
from app.mailer import send_email


router = APIRouter(prefix='/admin', tags=['superadmin'], dependencies=[Depends(superadmin)])


class FiscalConfig(BaseModel):
    enabled: bool
    api_key: str | None = None


@router.get('/tenants/{tenant_id}/fiscal')
async def get_fiscal_config(tenant_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    tenant = await db.get(m.Tenant, tenant_id)
    if not tenant: raise HTTPException(404, 'Loja não encontrada')
    return {'enabled': tenant.fiscal_enabled,
            'apiKeyConfigured': bool(tenant.fiscal_api_key or get_settings().notaas_api_key)}


class ConsoleSettings(BaseModel):
    sendInvoiceEmail: bool = True
    autoSuspend: bool
    autoSuspendDays: str = '30'
    welcomeMessage: str
    supportEmail: str = 'suporte@fastlanches.com'
    maintenanceMode: bool = False


class PlanIn(BaseModel):
    name: str = Field(min_length=2)
    description: str = ''
    priceMonthly: Decimal = Field(ge=0)
    priceYearly: Decimal = Field(ge=0)
    features: list[str] = Field(default_factory=list)
    maxTotems: int = 1
    maxProducts: int = 50
    highlighted: bool = False
    sortOrder: int = 0
    active: bool = True


class PlanPatch(BaseModel):
    name: str | None = None
    description: str | None = None
    priceMonthly: Decimal | None = None
    priceYearly: Decimal | None = None
    features: list[str] | None = None
    maxTotems: int | None = None
    maxProducts: int | None = None
    highlighted: bool | None = None
    sortOrder: int | None = None
    active: bool | None = None


def plan_data(plan: m.Plan):
    return {'id': plan.id, 'slug': plan.slug, 'name': plan.name, 'description': plan.description,
            'priceMonthly': plan.price_monthly, 'priceYearly': plan.price_yearly,
            'features': plan.features, 'maxTotems': plan.max_totems, 'maxProducts': plan.max_products,
            'highlighted': plan.highlighted, 'active': plan.active, 'sortOrder': plan.sort_order}


@router.get('/plans')
async def plan_list(db: AsyncSession = Depends(get_db)):
    return [plan_data(p) for p in (await db.scalars(select(m.Plan).order_by(m.Plan.sort_order))).all()]


@router.post('/plans', status_code=201)
async def plan_create(data: PlanIn, actor: m.User = Depends(superadmin), db: AsyncSession = Depends(get_db)):
    import re
    base = re.sub(r'[^a-z0-9]+', '-', data.name.lower()).strip('-') or 'plan'
    slug = base
    if await db.scalar(select(m.Plan).where(m.Plan.slug == slug)):
        slug = f'{base}-{uuid.uuid4().hex[:6]}'
    plan = m.Plan(slug=slug, name=data.name, description=data.description,
                  price_monthly=data.priceMonthly, price_yearly=data.priceYearly,
                  features=data.features, max_totems=data.maxTotems, max_products=data.maxProducts,
                  highlighted=data.highlighted, active=data.active, sort_order=data.sortOrder)
    db.add(plan)
    audit(db, actor, 'plan.create', detail={'slug': slug})
    await db.commit()
    return plan_data(plan)


@router.patch('/plans/{plan_id}')
async def plan_update(plan_id: uuid.UUID, data: PlanPatch, actor: m.User = Depends(superadmin), db: AsyncSession = Depends(get_db)):
    plan = await db.get(m.Plan, plan_id)
    if not plan: raise HTTPException(404, 'Plano não encontrado')
    fields = data.model_dump(exclude_unset=True)
    mapping = {'priceMonthly': 'price_monthly', 'priceYearly': 'price_yearly', 'maxTotems': 'max_totems',
               'maxProducts': 'max_products', 'sortOrder': 'sort_order'}
    for key, value in fields.items():
        if value is not None: setattr(plan, mapping.get(key, key), value)
    audit(db, actor, 'plan.update', detail={'planId': str(plan_id), 'fields': list(fields)})
    await db.commit()
    return plan_data(plan)


class AdminTenantCreate(TenantIn):
    manager_password: str | None = Field(None, alias='managerPassword', min_length=8)


@router.get('/settings', response_model=ConsoleSettings)
async def get_console_settings(db: AsyncSession = Depends(get_db)):
    settings = await db.scalar(select(m.SystemSetting).where(m.SystemSetting.key == 'console'))
    return ConsoleSettings(**(settings.value if settings else {'autoSuspend': True, 'welcomeMessage': 'Bem-vindo ao FastLanches!'}))


@router.put('/settings', response_model=ConsoleSettings)
async def put_console_settings(data: ConsoleSettings, actor: m.User = Depends(superadmin), db: AsyncSession = Depends(get_db)):
    settings = await db.scalar(select(m.SystemSetting).where(m.SystemSetting.key == 'console'))
    if not settings:
        settings = m.SystemSetting(key='console', value={})
        db.add(settings)
    settings.value = data.model_dump()
    audit(db, actor, 'settings.update')
    await db.commit()
    return settings.value


@router.put('/tenants/{tenant_id}/fiscal')
async def fiscal_config(tenant_id: uuid.UUID, data: FiscalConfig, actor: m.User = Depends(superadmin), db: AsyncSession = Depends(get_db)):
    tenant = await db.get(m.Tenant, tenant_id)
    if not tenant: raise HTTPException(404, 'Loja não encontrada')
    if data.api_key:
        encryption_key = get_settings().fiscal_key_encryption_key
        if not encryption_key: raise HTTPException(503, 'FISCAL_KEY_ENCRYPTION_KEY não configurada')
        tenant.fiscal_api_key = Fernet(encryption_key.encode()).encrypt(data.api_key.encode()).decode()
    tenant.fiscal_enabled = data.enabled
    audit(db, actor, 'tenant.fiscal_config', tenant_id, {'enabled': data.enabled})
    await db.commit()
    return {'enabled': tenant.fiscal_enabled, 'apiKeyConfigured': bool(tenant.fiscal_api_key or get_settings().notaas_api_key)}


@router.get('/tenants', response_model=list[TenantOut])
async def tenants(db: AsyncSession = Depends(get_db)):
    return [await tenant_data(db, x) for x in (await db.scalars(select(m.Tenant))).all()]


@router.post('/tenants', response_model=TenantOut, status_code=201)
async def tenant_create(data: AdminTenantCreate, actor: m.User = Depends(superadmin), db: AsyncSession = Depends(get_db)):
    if await db.scalar(select(m.User).where(m.User.email == str(data.owner_email).lower())):
        raise HTTPException(409, 'Email já utilizado')
    tenant = await create_tenant(db, data)
    generated = data.manager_password or secrets.token_urlsafe(16)
    db.add(m.User(tenant_id=tenant.id, name=data.owner_name, email=str(data.owner_email).lower(),
                  password_hash=hash_password(generated), role='gerente'))
    audit(db, actor, 'manager.create', tenant.id)
    audit(db, actor, 'tenant.create', tenant.id)
    await db.commit()
    if not data.manager_password:
        await send_email(tenant.owner_email, 'Acesso FastLanches',
                         f'Sua loja foi criada. Senha inicial: {generated}. Troque-a após o primeiro acesso.')
    return await tenant_data(db, tenant)


@router.get('/tenants/{tenant_id}', response_model=TenantOut)
async def tenant_get(tenant_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    tenant = await db.get(m.Tenant, tenant_id)
    if not tenant: raise HTTPException(404, 'Loja não encontrada')
    return await tenant_data(db, tenant)


@router.patch('/tenants/{tenant_id}', response_model=TenantOut)
async def tenant_update(tenant_id: uuid.UUID, data: TenantPatch, actor: m.User = Depends(superadmin), db: AsyncSession = Depends(get_db)):
    tenant = await db.get(m.Tenant, tenant_id)
    if not tenant: raise HTTPException(404, 'Loja não encontrada')
    fields = data.model_dump(exclude_unset=True)
    if fields.get('slug') and fields['slug'] != tenant.slug and await db.scalar(select(m.Tenant).where(m.Tenant.slug == fields['slug'])):
        raise HTTPException(409, 'Slug já utilizado')
    if fields.get('plan_id'):
        fields['plan_id'] = (await plan_by_ref(db, fields['plan_id'])).id
    for k, v in fields.items(): setattr(tenant, k, v)
    audit(db, actor, 'tenant.update', tenant.id, {'fields': list(data.model_fields_set)})
    await db.commit(); return await tenant_data(db, tenant)


@router.patch('/tenants/{tenant_id}/status', response_model=TenantOut)
async def tenant_status(tenant_id: uuid.UUID, data: StatusIn, actor: m.User = Depends(superadmin), db: AsyncSession = Depends(get_db)):
    tenant = await db.get(m.Tenant, tenant_id)
    if not tenant: raise HTTPException(404, 'Loja não encontrada')
    if data.status not in ('trial','active','past_due','suspended','cancelled'): raise HTTPException(422, 'Status inválido')
    tenant.status = data.status
    tenant.active = data.status not in ('suspended','cancelled')
    audit(db, actor, 'tenant.status', tenant.id, {'status': data.status})
    await db.commit(); return await tenant_data(db, tenant)


@router.delete('/tenants/{tenant_id}', response_model=TenantOut)
async def tenant_deactivate(tenant_id: uuid.UUID, actor: m.User = Depends(superadmin), db: AsyncSession = Depends(get_db)):
    return await tenant_status(tenant_id, StatusIn(status='cancelled'), actor, db)


@router.get('/tenants/{tenant_id}/managers', response_model=list[UserOut])
async def managers(tenant_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    if not await db.get(m.Tenant, tenant_id): raise HTTPException(404, 'Loja não encontrada')
    return list((await db.scalars(select(m.User).where(m.User.tenant_id == tenant_id, m.User.role == 'gerente'))).all())


@router.post('/tenants/{tenant_id}/managers', response_model=UserOut, status_code=201)
async def manager_create(tenant_id: uuid.UUID, data: ManagerIn, actor: m.User = Depends(superadmin), db: AsyncSession = Depends(get_db)):
    if not await db.get(m.Tenant, tenant_id): raise HTTPException(404, 'Loja não encontrada')
    if await db.scalar(select(m.User).where(m.User.email == str(data.email).lower())): raise HTTPException(409, 'Email já utilizado')
    user = m.User(tenant_id=tenant_id, name=data.name, email=str(data.email).lower(), password_hash=hash_password(data.password), role='gerente')
    db.add(user); await db.flush()
    audit(db, actor, 'manager.create', tenant_id, {'userId': str(user.id)})
    await db.commit(); return user


@router.patch('/tenants/{tenant_id}/managers/{user_id}', response_model=UserOut)
async def manager_update(tenant_id: uuid.UUID, user_id: uuid.UUID, data: ManagerPatch, actor: m.User = Depends(superadmin), db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(m.User).where(m.User.id == user_id, m.User.tenant_id == tenant_id, m.User.role == 'gerente'))
    if not user: raise HTTPException(404, 'Gerente não encontrado')
    for k, v in data.model_dump(exclude_unset=True).items(): setattr(user, k, v)
    audit(db, actor, 'manager.update', tenant_id, {'userId': str(user_id), 'fields': list(data.model_fields_set)})
    await db.commit(); return user


@router.delete('/tenants/{tenant_id}/managers/{user_id}', response_model=UserOut)
async def manager_deactivate(tenant_id: uuid.UUID, user_id: uuid.UUID, actor: m.User = Depends(superadmin), db: AsyncSession = Depends(get_db)):
    return await manager_update(tenant_id, user_id, ManagerPatch(active=False), actor, db)


@router.post('/tenants/{tenant_id}/managers/{user_id}/reset-password')
async def manager_reset(tenant_id: uuid.UUID, user_id: uuid.UUID, data: ResetPassword, actor: m.User = Depends(superadmin), db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(m.User).where(m.User.id == user_id, m.User.tenant_id == tenant_id, m.User.role == 'gerente'))
    if not user: raise HTTPException(404, 'Gerente não encontrado')
    user.password_hash = hash_password(data.password)
    await db.execute(update(m.RefreshToken).where(m.RefreshToken.user_id == user.id).values(revoked=True))
    audit(db, actor, 'manager.reset_password', tenant_id, {'userId': str(user_id)})
    await db.commit(); return {'ok': True}


@router.get('/tenants/{tenant_id}/products')
async def tenant_products(tenant_id: uuid.UUID, actor: m.User = Depends(superadmin), db: AsyncSession = Depends(get_db)):
    from app.services import product_data
    if not await db.get(m.Tenant, tenant_id): raise HTTPException(404, 'Loja não encontrada')
    audit(db, actor, 'tenant.products.read', tenant_id); await db.commit()
    return [product_data(x) for x in await TenantRepository(db, m.Product, tenant_id).list()]


@router.get('/tenants/{tenant_id}/orders')
async def tenant_orders(tenant_id: uuid.UUID, actor: m.User = Depends(superadmin), db: AsyncSession = Depends(get_db)):
    if not await db.get(m.Tenant, tenant_id): raise HTTPException(404, 'Loja não encontrada')
    audit(db, actor, 'tenant.orders.read', tenant_id); await db.commit()
    return await TenantRepository(db, m.Order, tenant_id).list()


@router.get('/invoices', response_model=list[BillingOut])
async def invoices(db: AsyncSession = Depends(get_db)):
    await db.execute(update(m.BillingInvoice).where(m.BillingInvoice.status == 'pending',
                    m.BillingInvoice.due_at < datetime.now(timezone.utc)).values(status='overdue'))
    await db.commit()
    return [await billing_data(db, x) for x in (await db.scalars(select(m.BillingInvoice))).all()]


@router.get('/invoices/{invoice_id}', response_model=BillingOut)
async def invoice_get(invoice_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    invoice = await db.get(m.BillingInvoice, invoice_id)
    if not invoice: raise HTTPException(404, 'Fatura não encontrada')
    return await billing_data(db, invoice)


@router.post('/invoices', response_model=BillingOut, status_code=201)
async def invoice_create(data: BillingIn, actor: m.User = Depends(superadmin), db: AsyncSession = Depends(get_db)):
    tenant = await db.get(m.Tenant, data.tenant_id)
    if not tenant: raise HTTPException(404, 'Loja não encontrada')
    if data.due_at.replace(tzinfo=timezone.utc) <= datetime.now(timezone.utc):
        raise HTTPException(422, 'Vencimento deve ser futuro')
    plan = await plan_by_ref(db, data.plan_id)
    invoice = m.BillingInvoice(tenant_id=data.tenant_id, plan_id=plan.id, number=str(uuid.uuid4())[:8].upper(),
                               amount=data.amount, due_at=data.due_at, notes=data.notes)
    db.add(invoice); await db.flush()
    provider = payment_provider()
    charge = await provider.create_boleto(invoice.id, Decimal(str(invoice.amount)), data.due_at,
                                          {'name': tenant.owner_name, 'email': tenant.owner_email,
                                           'cnpj': tenant.cnpj, 'address': tenant.address})
    invoice.provider, invoice.provider_id = provider.name, charge['id']
    invoice.pix_qr_image, invoice.pix_copy_paste = charge['qr'], charge['copy']
    invoice.boleto_url, invoice.barcode = charge['url'], charge['barcode']
    audit(db, actor, 'billing.create', data.tenant_id)
    await db.commit()
    settings = await db.scalar(select(m.SystemSetting).where(m.SystemSetting.key == 'console'))
    if not settings or settings.value.get('sendInvoiceEmail', True):
        await send_email(tenant.owner_email, f'Boleto FastLanches {invoice.number}',
                         f'Valor: R$ {invoice.amount}. Vencimento: {invoice.due_at.date()}. '
                         f'Boleto: {invoice.boleto_url or "consulte o painel"}. Linha digitável: {invoice.barcode or "indisponível"}')
    return await billing_data(db, invoice)


@router.get('/invoices/{invoice_id}/status', response_model=BillingOut)
async def invoice_status(invoice_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    invoice = await db.get(m.BillingInvoice, invoice_id)
    if not invoice: raise HTTPException(404, 'Fatura não encontrada')
    if invoice.status == 'pending' and invoice.provider_id:
        provider = payment_provider()
        if provider.name != invoice.provider: raise HTTPException(503, 'Provedor configurado mudou')
        status = await provider.status(invoice.provider_id)
        if status in ('approved','paid'):
            invoice.status, invoice.paid_at = 'paid', datetime.now(timezone.utc)
            tenant = await db.get(m.Tenant, invoice.tenant_id)
            tenant.status, tenant.active = 'active', True
            await db.commit()
    if invoice.status == 'pending' and invoice.due_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        invoice.status = 'overdue'
        await db.commit()
    return await billing_data(db, invoice)


@router.post('/invoices/{invoice_id}/cancel', response_model=BillingOut)
async def invoice_cancel(invoice_id: uuid.UUID, actor: m.User = Depends(superadmin), db: AsyncSession = Depends(get_db)):
    invoice = await db.get(m.BillingInvoice, invoice_id)
    if not invoice: raise HTTPException(404, 'Fatura não encontrada')
    if invoice.status in ('paid', 'cancelled'): raise HTTPException(409, 'Fatura não pode ser cancelada')
    provider = payment_provider()
    if invoice.provider_id:
        if provider.name != invoice.provider: raise HTTPException(503, 'Provedor configurado mudou')
        external_status = await provider.cancel(invoice.provider_id)
        if external_status not in ('cancelled','canceled'): raise HTTPException(502, 'Provedor não confirmou cancelamento')
    invoice.status = 'cancelled'; audit(db, actor, 'billing.cancel', invoice.tenant_id)
    await db.commit(); return await billing_data(db, invoice)


@router.post('/invoices/{invoice_id}/resend')
async def invoice_resend(invoice_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    invoice = await db.get(m.BillingInvoice, invoice_id)
    if not invoice: raise HTTPException(404, 'Fatura não encontrada')
    tenant = await db.get(m.Tenant, invoice.tenant_id)
    await send_email(tenant.owner_email, f'Boleto FastLanches {invoice.number}',
                     f'Valor: R$ {invoice.amount}. Vencimento: {invoice.due_at.date()}. '
                     f'Boleto: {invoice.boleto_url or "consulte o painel"}. Linha digitável: {invoice.barcode or "indisponível"}')
    return {'ok': True}


@router.get('/invoices/{invoice_id}/pdf')
async def invoice_pdf(invoice_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    from reportlab.pdfgen import canvas
    invoice = await db.get(m.BillingInvoice, invoice_id)
    if not invoice: raise HTTPException(404, 'Fatura não encontrada')
    tenant = await db.get(m.Tenant, invoice.tenant_id)
    stream = io.BytesIO()
    pdf = canvas.Canvas(stream)
    pdf.setTitle(f'Instruções de pagamento {invoice.number}')
    lines = ['FastLanches - Instruções de pagamento', f'Numero: {invoice.number}',
             f'Cliente: {tenant.name}', f'Valor: R$ {invoice.amount}',
             f'Vencimento: {invoice.due_at.date()}', f'Status: {invoice.status}',
             f'Linha digitavel: {invoice.barcode or "Consulte o provedor"}',
             f'Boleto oficial: {invoice.boleto_url or "Ambiente de desenvolvimento"}']
    for position, line in enumerate(lines):
        pdf.drawString(40, 780 - position * 30, line[:105])
    pdf.save()
    stream.seek(0)
    return StreamingResponse(stream, media_type='application/pdf',
                             headers={'Content-Disposition': f'attachment; filename="instrucoes-boleto-{invoice.number}.pdf"'})


@router.get('/reports/revenue')
async def revenue(db: AsyncSession = Depends(get_db)):
    active = await db.scalar(select(func.count()).select_from(m.Tenant).where(m.Tenant.status == 'active'))
    new_tenants = await db.scalar(select(func.count()).select_from(m.Tenant))
    plans = {p.id: p for p in (await db.scalars(select(m.Plan))).all()}
    tenants = (await db.scalars(select(m.Tenant).where(m.Tenant.status == 'active'))).all()
    mrr = sum(float(plans[t.plan_id].price_monthly if t.cycle == 'monthly' else plans[t.plan_id].price_yearly / 12)
              for t in tenants if t.plan_id in plans)
    return {'mrr': round(mrr, 2), 'churn': 0, 'newTenants': new_tenants, 'activeTenants': active}


@router.get('/audit')
async def audit_list(db: AsyncSession = Depends(get_db)):
    return list((await db.scalars(select(m.AuditLog).order_by(m.AuditLog.created_at.desc()).limit(200))).all())


def csv_response(name: str, rows: list[list[str]]):
    buffer = io.StringIO()
    buffer.write('\ufeff')
    writer = csv.writer(buffer)
    writer.writerows(rows)
    return StreamingResponse(iter([buffer.getvalue()]), media_type='text/csv; charset=utf-8',
                             headers={'Content-Disposition': f'attachment; filename="{name}"'})


@router.get('/reports/export/tenants.csv')
async def export_tenants(db: AsyncSession = Depends(get_db)):
    tenants = (await db.scalars(select(m.Tenant).order_by(m.Tenant.created_at))).all()
    rows = [['Nome', 'Slug', 'CNPJ', 'Responsável', 'Email', 'Status', 'Totens', 'Cliente desde']]
    rows += [[t.name, t.slug, t.cnpj or '', t.owner_name, t.owner_email, t.status,
              str(t.totem_count), t.created_at.isoformat()] for t in tenants]
    return csv_response('fastlanches-clientes.csv', rows)


@router.get('/reports/export/invoices.csv')
async def export_invoices(db: AsyncSession = Depends(get_db)):
    invoices = (await db.scalars(select(m.BillingInvoice).order_by(m.BillingInvoice.issued_at))).all()
    rows = [['Número', 'Tenant ID', 'Plano ID', 'Valor', 'Status', 'Emissão', 'Vencimento', 'Pago em']]
    rows += [[i.number, str(i.tenant_id), str(i.plan_id), str(i.amount), i.status,
              i.issued_at.isoformat(), i.due_at.isoformat(), i.paid_at.isoformat() if i.paid_at else ''] for i in invoices]
    return csv_response('fastlanches-boletos.csv', rows)
