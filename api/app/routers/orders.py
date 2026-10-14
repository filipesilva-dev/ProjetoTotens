import uuid
from datetime import datetime
from decimal import Decimal
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app import models as m
from app.schemas import OrderIn, OrderOut, PixIn, PixOut, FiscalOut, SubscriptionIn
from app.security import tenant_context, manager_context
from app.repositories import TenantRepository
from app.services import create_order, create_charge, payment_data, update_payment, refresh_invoice, plan_by_ref, issue_invoice
from app.providers import payment_provider
from app.config import get_settings
from app.services import fiscal_key
from fastapi.responses import Response
from fastapi.responses import StreamingResponse
import io
import csv
import httpx


router = APIRouter(prefix='/api/v1', tags=['orders and payments'])


@router.post('/orders', response_model=OrderOut, status_code=201)
async def order_create(data: OrderIn, idempotency_key: str = Header(..., alias='Idempotency-Key'),
                       tenant_id: uuid.UUID = Depends(tenant_context), db: AsyncSession = Depends(get_db)):
    if not idempotency_key.strip(): raise HTTPException(422, 'Idempotency-Key obrigatório')
    return await create_order(db, tenant_id, data, idempotency_key)


@router.get('/orders', response_model=list[OrderOut])
async def order_list(tenant_id: uuid.UUID = Depends(tenant_context), db: AsyncSession = Depends(get_db)):
    return await TenantRepository(db, m.Order, tenant_id).list()


@router.get('/orders/{order_id}', response_model=OrderOut)
async def order_get(order_id: uuid.UUID, tenant_id: uuid.UUID = Depends(tenant_context), db: AsyncSession = Depends(get_db)):
    order = await TenantRepository(db, m.Order, tenant_id).get(order_id)
    if not order: raise HTTPException(404, 'Pedido não encontrado')
    return order


@router.get('/orders/{order_id}/kitchen-ticket')
async def kitchen_ticket(order_id: uuid.UUID, tenant_id: uuid.UUID = Depends(manager_context), db: AsyncSession = Depends(get_db)):
    from reportlab.pdfgen import canvas
    order = await TenantRepository(db, m.Order, tenant_id).get(order_id)
    if not order: raise HTTPException(404, 'Pedido não encontrado')
    if order.status not in ('PAID', 'PREPARING', 'READY', 'DELIVERED'):
        raise HTTPException(409, 'Pedido ainda não foi pago')
    stream = io.BytesIO()
    pdf = canvas.Canvas(stream, pagesize=(280, 500))
    pdf.setTitle(f'Comanda {order.code}')
    pdf.drawString(15, 475, f'COZINHA - PEDIDO {order.code}')
    pdf.drawString(15, 450, f'Totem: {order.totem_id}')
    y = 425
    for item in order.items:
        pdf.drawString(15, y, f"{item['quantity']}x {item['product']['name']}"[:43]); y -= 22
        if item.get('removedIngredients'):
            pdf.drawString(20, y, ('SEM: ' + ', '.join(item['removedIngredients']))[:43]); y -= 22
        if item.get('additions'):
            pdf.drawString(20, y, ('+ ' + ', '.join(a['name'] for a in item['additions']))[:43]); y -= 22
        if item.get('notes'):
            pdf.drawString(20, y, ('OBS: ' + item['notes'])[:43]); y -= 22
        if y < 30:
            pdf.showPage(); y = 475
    pdf.save(); stream.seek(0)
    return StreamingResponse(stream, media_type='application/pdf',
                             headers={'Content-Disposition': f'inline; filename="comanda-{order.code}.pdf"'})


@router.patch('/orders/{order_id}/status', response_model=OrderOut)
async def order_status(order_id: uuid.UUID, status: str, tenant_id: uuid.UUID = Depends(manager_context), db: AsyncSession = Depends(get_db)):
    order = await TenantRepository(db, m.Order, tenant_id).get(order_id)
    if not order: raise HTTPException(404, 'Pedido não encontrado')
    allowed = {'PAID': 'PREPARING', 'PREPARING': 'READY', 'READY': 'DELIVERED'}
    if allowed.get(order.status) != status: raise HTTPException(409, 'Transição de pedido inválida')
    order.status = status; await db.commit(); return order


@router.post('/payments/pix', response_model=PixOut)
async def pix(data: PixIn, tenant_id: uuid.UUID = Depends(tenant_context), db: AsyncSession = Depends(get_db)):
    return payment_data(await create_charge(db, tenant_id, data.order_id))


@router.get('/payments/{order_id}/status')
async def payment_status(order_id: uuid.UUID, tenant_id: uuid.UUID = Depends(tenant_context), db: AsyncSession = Depends(get_db)):
    payment = await db.scalar(select(m.Payment).where(m.Payment.tenant_id == tenant_id, m.Payment.order_id == order_id))
    if not payment: raise HTTPException(404, 'Pagamento não encontrado')
    if payment.status not in ('approved', 'paid') and payment.provider != 'mock':
        provider = payment_provider()
        if provider.name != payment.provider: raise HTTPException(503, 'Provedor configurado mudou')
        await update_payment(db, payment, await provider.status(payment.provider_id))
    return {'orderId': order_id, 'status': payment.status}


@router.post('/payments/{order_id}/cancel')
async def payment_cancel(order_id: uuid.UUID, tenant_id: uuid.UUID = Depends(tenant_context), db: AsyncSession = Depends(get_db)):
    payment = await db.scalar(select(m.Payment).where(m.Payment.tenant_id == tenant_id, m.Payment.order_id == order_id))
    if not payment: raise HTTPException(404, 'Pagamento não encontrado')
    if payment.status in ('approved','paid'): raise HTTPException(409, 'Pagamento já confirmado')
    provider = payment_provider()
    if provider.name != payment.provider: raise HTTPException(503, 'Provedor configurado mudou')
    result = await provider.cancel(payment.provider_id)
    await update_payment(db, payment, result)
    return {'orderId': order_id, 'status': payment.status}


@router.post('/payments/{order_id}/simulate')
async def simulate_payment(order_id: uuid.UUID, tenant_id: uuid.UUID = Depends(manager_context), db: AsyncSession = Depends(get_db)):
    from app.config import get_settings
    if get_settings().environment == 'production' or get_settings().payment_provider != 'mock': raise HTTPException(404)
    payment = await db.scalar(select(m.Payment).where(m.Payment.tenant_id == tenant_id, m.Payment.order_id == order_id))
    if not payment: raise HTTPException(404, 'Pagamento não encontrado')
    await update_payment(db, payment, 'approved')
    return {'status': payment.status}


@router.get('/fiscal-invoices', response_model=list[FiscalOut])
async def fiscal_list(tenant_id: uuid.UUID = Depends(manager_context), db: AsyncSession = Depends(get_db)):
    return await TenantRepository(db, m.FiscalInvoice, tenant_id).list()


@router.get('/fiscal-invoices/{invoice_id}', response_model=FiscalOut)
async def fiscal_get(invoice_id: uuid.UUID, tenant_id: uuid.UUID = Depends(manager_context), db: AsyncSession = Depends(get_db)):
    return await refresh_invoice(db, tenant_id, invoice_id)


@router.get('/fiscal-invoices/{invoice_id}/pdf')
async def fiscal_pdf(invoice_id: uuid.UUID, tenant_id: uuid.UUID = Depends(manager_context), db: AsyncSession = Depends(get_db)):
    invoice = await TenantRepository(db, m.FiscalInvoice, tenant_id).get(invoice_id)
    if not invoice or not invoice.provider_id or invoice.status != 'issued': raise HTTPException(404, 'PDF indisponível')
    if get_settings().invoice_provider != 'notaas': raise HTTPException(404, 'PDF mock indisponível')
    tenant = await db.get(m.Tenant, tenant_id)
    key = fiscal_key(tenant)
    async with httpx.AsyncClient(timeout=20) as client:
        result = await client.get(f'https://platform.notaas.com.br/api/v1/nfe/invoices/{invoice.provider_id}/danfe', headers={'x-api-key': key})
        result.raise_for_status()
    return Response(content=result.content, media_type='application/pdf', headers={'Content-Disposition': 'inline; filename="danfe.pdf"'})


@router.post('/fiscal-invoices/{invoice_id}/retry', response_model=FiscalOut)
async def fiscal_retry(invoice_id: uuid.UUID, tenant_id: uuid.UUID = Depends(manager_context), db: AsyncSession = Depends(get_db)):
    invoice = await TenantRepository(db, m.FiscalInvoice, tenant_id).get(invoice_id)
    if not invoice: raise HTTPException(404, 'Nota não encontrada')
    if invoice.status != 'error': raise HTTPException(409, 'Nota não está em erro')
    order = await TenantRepository(db, m.Order, tenant_id).get(invoice.order_id)
    await issue_invoice(db, order); await db.commit()
    return invoice


@router.post('/subscriptions')
async def subscribe(data: SubscriptionIn, tenant_id: uuid.UUID = Depends(manager_context), db: AsyncSession = Depends(get_db)):
    from datetime import datetime, timedelta, timezone
    plan = await plan_by_ref(db, data.plan_id)
    tenant = await db.get(m.Tenant, tenant_id)
    existing = await db.scalar(select(m.Subscription).where(m.Subscription.tenant_id == tenant_id, m.Subscription.status == 'trial'))
    if existing: raise HTTPException(409, 'Assinatura de teste já existente')
    tenant.plan_id, tenant.cycle = plan.id, data.cycle
    subscription = m.Subscription(tenant_id=tenant_id, plan_id=plan.id, cycle=data.cycle,
                                  trial_ends_at=datetime.now(timezone.utc) + timedelta(days=14))
    db.add(subscription); await db.commit(); await db.refresh(subscription)
    return {'id': subscription.id, 'tenantId': tenant_id, 'planId': plan.slug, 'cycle': data.cycle,
            'status': subscription.status, 'trialEndsAt': subscription.trial_ends_at}


@router.get('/reports/summary')
async def tenant_reports(tenant_id: uuid.UUID = Depends(manager_context), db: AsyncSession = Depends(get_db)):
    from collections import Counter
    from zoneinfo import ZoneInfo
    local_now = datetime.now(ZoneInfo('America/Sao_Paulo')).date()
    rows = await TenantRepository(db, m.Order, tenant_id).list()
    today = [o for o in rows if o.created_at.replace(tzinfo=o.created_at.tzinfo or ZoneInfo('UTC')).astimezone(ZoneInfo('America/Sao_Paulo')).date() == local_now]
    paid = [o for o in today if o.status in ('PAID','PREPARING','READY','DELIVERED')]
    revenue = sum((o.total for o in paid), Decimal('0'))
    hourly = [0] * 24
    top = Counter()
    for order in paid:
        hourly[order.created_at.replace(tzinfo=order.created_at.tzinfo or ZoneInfo('UTC')).astimezone(ZoneInfo('America/Sao_Paulo')).hour] += float(order.total)
        for item in order.items:
            top[item['product']['name']] += item['quantity']
    return {'revenue': revenue, 'orders': len(today), 'averageTicket': revenue / len(paid) if paid else 0,
            'hourly': hourly, 'topProducts': [{'name': name, 'count': count} for name, count in top.most_common(5)]}


@router.get('/reports/orders.csv')
async def orders_csv(tenant_id: uuid.UUID = Depends(manager_context), db: AsyncSession = Depends(get_db)):
    rows = await TenantRepository(db, m.Order, tenant_id).list()
    stream = io.StringIO()
    stream.write('\ufeff')
    writer = csv.writer(stream)
    writer.writerow(['Pedido', 'Data', 'Status', 'Total', 'Totem'])
    for order in rows:
        writer.writerow([order.code, order.created_at.isoformat(), order.status, str(order.total), order.totem_id])
    return StreamingResponse(iter([stream.getvalue()]), media_type='text/csv; charset=utf-8',
                             headers={'Content-Disposition': 'attachment; filename="pedidos.csv"'})
