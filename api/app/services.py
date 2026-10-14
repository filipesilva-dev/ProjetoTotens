import logging
import re
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from app import models as m
from app.repositories import TenantRepository
from app.providers import payment_provider, invoice_provider
from app.config import get_settings
from app.schemas import OrderIn, TenantIn, BillingOut


log = logging.getLogger(__name__)


def fiscal_key(tenant: m.Tenant) -> str | None:
    if not tenant.fiscal_api_key:
        return get_settings().notaas_api_key
    from cryptography.fernet import Fernet
    encryption_key = get_settings().fiscal_key_encryption_key
    if not encryption_key: raise RuntimeError('FISCAL_KEY_ENCRYPTION_KEY obrigatório')
    return Fernet(encryption_key.encode()).decrypt(tenant.fiscal_api_key.encode()).decode()


async def plan_by_ref(db: AsyncSession, ref: str) -> m.Plan:
    try: plan_uuid = uuid.UUID(ref)
    except ValueError: plan_uuid = None
    plan = await db.scalar(select(m.Plan).where((m.Plan.slug == ref) | (m.Plan.id == plan_uuid)))
    if not plan or not plan.active: raise HTTPException(404, 'Plano não encontrado')
    return plan


async def tenant_data(db: AsyncSession, tenant: m.Tenant) -> dict:
    plan = await db.get(m.Plan, tenant.plan_id) if tenant.plan_id else None
    return {'id': tenant.id, 'slug': tenant.slug, 'name': tenant.name, 'cnpj': tenant.cnpj,
            'logoEmoji': tenant.logo_emoji, 'ownerName': tenant.owner_name, 'ownerEmail': tenant.owner_email,
            'ownerPhone': tenant.owner_phone, 'address': tenant.address, 'planId': plan.slug if plan else '',
            'cycle': tenant.cycle, 'status': tenant.status, 'totemCount': tenant.totem_count,
            'createdAt': tenant.created_at, 'contractEndsAt': tenant.contract_ends_at}


async def create_tenant(db: AsyncSession, data: TenantIn) -> m.Tenant:
    if await db.scalar(select(m.Tenant).where(m.Tenant.slug == data.slug)):
        raise HTTPException(409, 'Slug já utilizado')
    plan = await plan_by_ref(db, data.plan_id)
    tenant = m.Tenant(slug=data.slug, name=data.name, cnpj=re.sub(r'\D', '', data.cnpj or '') or None,
                      owner_name=data.owner_name, owner_email=str(data.owner_email), owner_phone=data.owner_phone,
                      address=data.address, logo_emoji=data.logo_emoji, plan_id=plan.id, cycle=data.cycle,
                      contract_ends_at=datetime.now(timezone.utc) + timedelta(days=14))
    db.add(tenant)
    await db.flush()
    return tenant


def category_data(x: m.Category):
    return {'id': x.id, 'name': x.name, 'icon': x.icon, 'order': x.sort_order}


def product_data(x: m.Product):
    return {'id': x.id, 'name': x.name, 'description': x.description, 'price': x.price, 'imageUrl': x.image_url,
            'categoryId': x.category_id, 'available': x.available, 'ingredients': x.ingredients or [],
            'additions': x.additions or [], 'allergens': x.allergens or [], 'ncm': x.ncm, 'cfop': x.cfop}


async def create_order(db: AsyncSession, tenant_id: uuid.UUID, data: OrderIn, key: str):
    existing = await db.scalar(select(m.Order).where(m.Order.tenant_id == tenant_id, m.Order.idempotency_key == key))
    if existing: return existing
    snapshots = []
    subtotal = Decimal('0.00')
    for item in data.items:
        product = await TenantRepository(db, m.Product, tenant_id).get(item.product_id)
        if not product or not product.available: raise HTTPException(422, f'Produto indisponível: {item.product_id}')
        allowed_removals = set(product.ingredients or [])
        if not set(item.removed_ingredients).issubset(allowed_removals): raise HTTPException(422, 'Ingrediente inválido')
        allowed_additions = {str(a['id']): a for a in (product.additions or [])}
        selected = []
        for addition in item.additions:
            found = allowed_additions.get(str(addition.id))
            if not found: raise HTTPException(422, 'Adicional inválido')
            selected.append(found)
        unit = Decimal(str(product.price)) + sum((Decimal(str(a['price'])) for a in selected), Decimal('0'))
        subtotal += unit * item.quantity
        snapshots.append({'productId': str(product.id), 'product': product_data(product) | {'id': str(product.id), 'categoryId': str(product.category_id), 'price': float(product.price)},
                          'quantity': item.quantity, 'removedIngredients': item.removed_ingredients, 'additions': selected,
                          'notes': item.notes, 'unitPrice': float(unit), 'ncm': product.ncm, 'cfop': product.cfop})
    if data.payment_method != 'PIX': raise HTTPException(422, 'Somente PIX está disponível')
    order = m.Order(tenant_id=tenant_id, code=str(uuid.uuid4().int % 900000 + 100000), items=snapshots,
                    subtotal=subtotal, total=subtotal, customer=data.customer.model_dump(exclude_none=True) if data.customer else None,
                    totem_id=data.totem_id, idempotency_key=key)
    db.add(order)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        existing = await db.scalar(select(m.Order).where(m.Order.tenant_id == tenant_id, m.Order.idempotency_key == key))
        if existing: return existing
        raise
    await db.refresh(order)
    return order


async def create_charge(db: AsyncSession, tenant_id: uuid.UUID, order_id: uuid.UUID):
    order = await db.scalar(select(m.Order).where(m.Order.id == order_id, m.Order.tenant_id == tenant_id).with_for_update())
    if not order: raise HTTPException(404, 'Pedido não encontrado')
    if order.status != 'PENDING_PAYMENT': raise HTTPException(409, 'Pedido não aguarda pagamento')
    existing = await db.scalar(select(m.Payment).where(m.Payment.tenant_id == tenant_id, m.Payment.order_id == order_id))
    if existing: return existing
    provider = payment_provider()
    charge = await provider.create_pix(order.id, Decimal(str(order.total)), (order.customer or {}).get('email'))
    payment = m.Payment(tenant_id=tenant_id, order_id=order.id, provider=provider.name, provider_id=charge['id'],
                        status=charge['status'], amount=order.total, qr_code_image=charge['qr'], copy_paste=charge['copy'])
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    return payment


def payment_data(payment: m.Payment):
    return {'orderId': payment.order_id, 'qrCodeImage': payment.qr_code_image or '', 'copyPaste': payment.copy_paste or '',
            'amount': payment.amount, 'status': payment.status}


async def update_payment(db: AsyncSession, payment: m.Payment, provider_status: str):
    paid = provider_status.lower() in ('approved', 'paid')
    payment.status = provider_status.lower()
    order = await db.scalar(select(m.Order).where(m.Order.id == payment.order_id, m.Order.tenant_id == payment.tenant_id).with_for_update())
    if not order: raise HTTPException(404, 'Pedido não encontrado')
    if paid and order.status == 'PENDING_PAYMENT':
        order.status = 'PAID'
        await issue_invoice(db, order)
    elif provider_status.lower() in ('cancelled', 'canceled', 'expired', 'rejected', 'failed') and order.status == 'PENDING_PAYMENT':
        order.status = 'CANCELED'
    await db.commit()


async def issue_invoice(db: AsyncSession, order: m.Order):
    existing = await db.scalar(select(m.FiscalInvoice).where(m.FiscalInvoice.tenant_id == order.tenant_id,
                                                            m.FiscalInvoice.order_id == order.id))
    if existing and existing.status in ('queued', 'processing', 'issued'): return existing
    tenant = await db.get(m.Tenant, order.tenant_id)
    if not tenant.fiscal_enabled: return None
    invoice = existing or m.FiscalInvoice(tenant_id=order.tenant_id, order_id=order.id)
    if not existing:
        db.add(invoice)
        await db.flush()
    try:
        result = await invoice_provider().issue(order.items, Decimal(str(order.total)), order.customer, fiscal_key(tenant))
        invoice.provider_id = str(result.get('invoiceId') or result.get('id'))
        invoice.status = result.get('status', 'queued')
        invoice.number = str(result.get('numero')) if result.get('numero') is not None else None
        invoice.pdf_url = result.get('pdfUrl')
        invoice.xml_url = result.get('xmlUrl')
        invoice.error = None
    except Exception as exc:
        log.exception('Fiscal issue failed for order %s', order.id)
        invoice.status, invoice.error = 'error', str(exc)[:1000]
    return invoice


async def refresh_invoice(db: AsyncSession, tenant_id: uuid.UUID, invoice_id: uuid.UUID):
    invoice = await TenantRepository(db, m.FiscalInvoice, tenant_id).get(invoice_id)
    if not invoice: raise HTTPException(404, 'Nota não encontrada')
    if invoice.provider_id and invoice.status not in ('issued', 'cancelled'):
        tenant = await db.get(m.Tenant, tenant_id)
        data = await invoice_provider().status(invoice.provider_id, fiscal_key(tenant))
        invoice.status = data.get('status', invoice.status)
        invoice.number = str(data.get('numero')) if data.get('numero') is not None else invoice.number
        invoice.pdf_url = data.get('pdfUrl') or invoice.pdf_url
        invoice.xml_url = data.get('xmlUrl') or invoice.xml_url
        invoice.error = data.get('motivo') or data.get('errorMessage') if invoice.status == 'error' else None
        await db.commit()
    return invoice


async def billing_data(db: AsyncSession, invoice: m.BillingInvoice) -> dict:
    tenant = await db.get(m.Tenant, invoice.tenant_id)
    plan = await db.get(m.Plan, invoice.plan_id)
    return {'id': invoice.id, 'number': invoice.number, 'tenantId': tenant.id, 'tenantName': tenant.name,
            'tenantSlug': tenant.slug, 'planId': plan.slug, 'planName': plan.name, 'amount': invoice.amount,
            'status': invoice.status, 'issuedAt': invoice.issued_at, 'dueAt': invoice.due_at,
            'paidAt': invoice.paid_at, 'notes': invoice.notes, 'pixQrImage': invoice.pix_qr_image,
            'pixCopyPaste': invoice.pix_copy_paste, 'boletoUrl': invoice.boleto_url,
            'barcode': invoice.barcode}


def audit(db, actor, action, tenant_id=None, detail=None):
    db.add(m.AuditLog(actor_id=actor.id, tenant_id=tenant_id, action=action, detail=detail or {}))
