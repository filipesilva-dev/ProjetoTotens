import json
import hashlib
import hmac
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app import models as m
from app.providers import verify_mercado_signature, verify_abacate_signature, MercadoPagoProvider, AbacatePayProvider
from app.services import update_payment
from app.services import refresh_invoice
from app.config import get_settings


router = APIRouter(prefix='/api/v1/webhooks', tags=['webhooks'])


async def process(db: AsyncSession, provider: str, provider_id: str, event_id: str, status: str):
    payment = await db.scalar(select(m.Payment).where(m.Payment.provider == provider, m.Payment.provider_id == provider_id).with_for_update())
    if not payment:
        billing = await db.scalar(select(m.BillingInvoice).where(m.BillingInvoice.provider == provider, m.BillingInvoice.provider_id == provider_id).with_for_update())
        if not billing:
            # Unknown IDs are acknowledged; never resolve a tenant from the payload.
            return {'ok': True, 'ignored': True}
        seen = await db.scalar(select(m.WebhookEvent).where(m.WebhookEvent.provider == provider, m.WebhookEvent.event_id == event_id))
        if seen: return {'ok': True, 'duplicate': True}
        db.add(m.WebhookEvent(tenant_id=billing.tenant_id, provider=provider, event_id=event_id))
        if status.lower() in ('approved','paid') and billing.status != 'paid':
            from datetime import datetime, timezone
            billing.status, billing.paid_at = 'paid', datetime.now(timezone.utc)
            tenant = await db.get(m.Tenant, billing.tenant_id)
            tenant.status, tenant.active = 'active', True
        await db.commit()
        return {'ok': True}
    seen = await db.scalar(select(m.WebhookEvent).where(m.WebhookEvent.provider == provider, m.WebhookEvent.event_id == event_id))
    if seen: return {'ok': True, 'duplicate': True}
    db.add(m.WebhookEvent(tenant_id=payment.tenant_id, provider=provider, event_id=event_id))
    await update_payment(db, payment, status)
    return {'ok': True}


@router.post('/mercadopago')
async def mercadopago(request: Request, db: AsyncSession = Depends(get_db)):
    try: payload = await request.json()
    except json.JSONDecodeError: raise HTTPException(400, 'JSON inválido')
    provider_id = str(request.query_params.get('data.id') or payload.get('data', {}).get('id') or '')
    verify_mercado_signature(provider_id, request.headers.get('x-request-id'), request.headers.get('x-signature'))
    if payload.get('type') != 'payment': return {'ok': True, 'ignored': True}
    status = await MercadoPagoProvider().status(provider_id)
    event_id = str(payload.get('id') or f'payment:{provider_id}:{status}')
    return await process(db, 'mercadopago', provider_id, event_id, status)


@router.post('/abacatepay')
async def abacatepay(request: Request, db: AsyncSession = Depends(get_db)):
    raw = await request.body()
    verify_abacate_signature(raw, request.headers.get('x-webhook-signature'), request.query_params.get('webhookSecret'))
    try: payload = json.loads(raw)
    except json.JSONDecodeError: raise HTTPException(400, 'JSON inválido')
    event_id = str(payload.get('id') or '')
    data = payload.get('data') or {}
    provider_id = str(data.get('id') or (data.get('pix') or {}).get('id') or (data.get('transaction') or {}).get('id') or '')
    if not event_id or not provider_id: raise HTTPException(400, 'Evento inválido')
    if payload.get('event') not in ('transparent.completed', 'transparent.refunded', 'transparent.disputed'):
        return {'ok': True, 'ignored': True}
    status = await AbacatePayProvider().status(provider_id)
    return await process(db, 'abacatepay', provider_id, event_id, status)


@router.post('/notaas')
async def notaas(request: Request, db: AsyncSession = Depends(get_db)):
    secret = get_settings().notaas_webhook_secret
    raw = await request.body()
    signature = request.headers.get('x-notaas-signature')
    if not secret or not signature or not hmac.compare_digest(hmac.new(secret.encode(), raw, hashlib.sha256).hexdigest(), signature):
        raise HTTPException(401, 'Assinatura Notaas inválida')
    try: payload = json.loads(raw)
    except json.JSONDecodeError: raise HTTPException(400, 'JSON inválido')
    provider_id = str((payload.get('data') or {}).get('invoiceId') or '')
    event_id = str(payload.get('deliveryId') or '')
    if not provider_id or not event_id: raise HTTPException(400, 'Evento inválido')
    invoice = await db.scalar(select(m.FiscalInvoice).where(m.FiscalInvoice.provider_id == provider_id).with_for_update())
    if not invoice: return {'ok': True, 'ignored': True}
    if await db.scalar(select(m.WebhookEvent).where(m.WebhookEvent.provider == 'notaas', m.WebhookEvent.event_id == event_id)):
        return {'ok': True, 'duplicate': True}
    db.add(m.WebhookEvent(tenant_id=invoice.tenant_id, provider='notaas', event_id=event_id))
    await refresh_invoice(db, invoice.tenant_id, invoice.id)
    await db.commit()
    return {'ok': True}
