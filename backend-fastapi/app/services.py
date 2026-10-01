import hashlib
import hmac
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import httpx
from fastapi import HTTPException
from pwdlib import PasswordHash
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.models import Category, FiscalDocument, FiscalStatus, Order, OrderItem, OrderStatus, Payment, PaymentStatus, Product, Tenant, User

password_hash = PasswordHash.recommended()


def verify_cpf(value: str | None) -> str | None:
    if not value:
        return None
    cpf = "".join(ch for ch in value if ch.isdigit())
    if len(cpf) != 11 or cpf == cpf[0] * 11:
        raise HTTPException(422, "CPF inválido", headers={"X-Error-Code": "invalid_cpf"})
    for length in (9, 10):
        total = sum(int(cpf[i]) * (length + 1 - i) for i in range(length))
        digit = (total * 10) % 11
        if digit == 10:
            digit = 0
        if digit != int(cpf[length]):
            raise HTTPException(422, "CPF inválido", headers={"X-Error-Code": "invalid_cpf"})
    return cpf


async def create_pix(order: Order, db: AsyncSession) -> Payment:
    if not settings.mercadopago_access_token:
        raise HTTPException(503, "Mercado Pago não configurado", headers={"X-Error-Code": "payment_provider_unavailable"})
    payload = {
        "transaction_amount": float(order.total), "description": f"Pedido {order.code}",
        "payment_method_id": "pix", "external_reference": str(order.id),
        "notification_url": settings.mercadopago_webhook_url,
        "payer": {"email": order.invoice_email or "comprador@fastlanches.local"},
        "date_of_expiration": (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat(),
    }
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post("https://api.mercadopago.com/v1/payments", json=payload,
            headers={"Authorization": f"Bearer {settings.mercadopago_access_token}", "X-Idempotency-Key": str(order.id)})
    if response.status_code >= 400:
        raise HTTPException(502, "Falha ao criar cobrança Pix", headers={"X-Error-Code": "payment_provider_error"})
    data = response.json()
    details = data.get("point_of_interaction", {}).get("transaction_data", {})
    payment = Payment(tenant_id=order.tenant_id, order_id=order.id, provider_id=str(data["id"]),
        status=PaymentStatus.pending, amount=order.total, qr_code=details.get("qr_code"),
        qr_code_base64=details.get("qr_code_base64"), ticket_url=details.get("ticket_url"))
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    return payment


def valid_mp_signature(signature: str | None, request_id: str | None, payment_id: str, secret: str) -> bool:
    if not signature or not request_id or not secret:
        return False
    values = dict(part.strip().split("=", 1) for part in signature.split(",") if "=" in part)
    manifest = f"id:{payment_id};request-id:{request_id};"
    expected = hmac.new(secret.encode(), manifest.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(values.get("v1", ""), expected)


async def sync_payment_status(payment: Payment, db: AsyncSession, raw: dict) -> None:
    if not settings.mercadopago_access_token or not payment.provider_id:
        return
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(f"https://api.mercadopago.com/v1/payments/{payment.provider_id}",
            headers={"Authorization": f"Bearer {settings.mercadopago_access_token}"})
    if response.status_code != 200:
        return
    info = response.json()
    order = await db.scalar(select(Order).where(Order.id == payment.order_id, Order.tenant_id == payment.tenant_id))
    status = {"approved": PaymentStatus.approved, "rejected": PaymentStatus.rejected,
              "cancelled": PaymentStatus.cancelled, "expired": PaymentStatus.expired}.get(info.get("status"), PaymentStatus.pending)
    payment.raw_webhook = raw
    # A late pending notification must never downgrade a terminal payment state.
    if payment.status == PaymentStatus.approved and status != PaymentStatus.approved:
        return
    payment.status = status
    if order and status == PaymentStatus.approved:
        order.status = OrderStatus.paid
    await db.commit()


async def issue_fiscal(order: Order, db: AsyncSession) -> FiscalDocument:
    if not order.invoice_email:
        raise HTTPException(422, "Pedido sem e-mail para envio da nota", headers={"X-Error-Code": "invoice_email_required"})
    if order.status not in (OrderStatus.paid, OrderStatus.preparing, OrderStatus.ready, OrderStatus.completed):
        raise HTTPException(409, "Nota só pode ser solicitada após pagamento aprovado", headers={"X-Error-Code": "order_not_paid"})
    existing = await db.scalar(select(FiscalDocument).where(FiscalDocument.order_id == order.id))
    if existing:
        return existing
    doc = FiscalDocument(tenant_id=order.tenant_id, order_id=order.id, email=order.invoice_email,
                         status=FiscalStatus.processing)
    db.add(doc)
    if settings.fiscal_provider == "mock":
        doc.status = FiscalStatus.failed
        doc.error_detail = "Provedor fiscal mock: configure um integrador NFC-e e os dados fiscais da empresa."
    elif settings.fiscal_api_url and settings.fiscal_api_token:
        # Provider-specific payload/contract belongs in an adapter; do not claim a legal invoice was emitted here.
        doc.status = FiscalStatus.failed
        doc.error_detail = "Adaptador do provedor fiscal ainda não implementado."
    else:
        doc.status = FiscalStatus.failed
        doc.error_detail = "Provedor fiscal não configurado."
    await db.commit()
    await db.refresh(doc)
    return doc


async def daily_code(db: AsyncSession, tenant: Tenant) -> str:
    today = datetime.now(timezone.utc).date()
    count = await db.scalar(select(func.count(Order.id)).where(Order.tenant_id == tenant.id,
        func.date(Order.created_at) == today)) or 0
    return f"{(count + 1) % 1000:03d}"
