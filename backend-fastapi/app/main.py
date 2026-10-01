from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import uuid
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.db import engine, get_db
from app.deps import get_current_user, get_tenant
from app.models import Base, Category, FiscalDocument, Order, OrderItem, OrderStatus, Payment, PaymentStatus, Product, Tenant, User
from app.schemas import CategoryIn, CategoryOut, FiscalOut, LoginIn, OrderIn, OrderOut, PaymentOut, PixRequest, ProductIn, ProductOut, StatusIn, TokenOut
from app.services import create_pix, issue_fiscal, password_hash, sync_payment_status, valid_mp_signature, verify_cpf


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Tables are managed by Alembic; no implicit production schema creation.
    yield
    await engine.dispose()


app = FastAPI(title="FastLanches API", version="1.0.0", description="Multi-tenant kiosk ordering backend", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.allowed_origins, allow_credentials=True,
                   allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], allow_headers=["*"])


def order_payload(order: Order) -> dict:
    status = {"awaiting_payment": "PENDING_PAYMENT", "paid": "PAID", "preparing": "PREPARING",
              "ready": "READY", "completed": "DELIVERED", "cancelled": "CANCELED"}[order.status.value]
    items = []
    for line in order.items:
        product = line.__dict__.get("product")
        items.append({"productId": line.product_id, "product": {
            "id": line.product_id, "name": line.product_name, "description": product.description if product else "",
            "price": float(line.unit_price), "imageUrl": product.image_url if product else "",
            "categoryId": product.category_id if product else "", "available": True,
            "ingredients": product.ingredients if product else [], "additions": product.additions if product else [],
            "allergens": product.allergens if product else []}, "quantity": line.quantity,
            "removedIngredients": line.removed_ingredients, "additions": line.additions,
            "notes": line.notes, "unitPrice": line.unit_price})
    return {"id": str(order.id), "code": order.code, "status": status, "items": items,
            "subtotal": order.total, "total": order.total, "createdAt": order.created_at,
            "totemId": order.kiosk_id or "Totem 1",
            "customer": {"cpf": order.cpf, "email": order.invoice_email} if order.cpf or order.invoice_email else None,
            "invoiceEmail": order.invoice_email, "kioskId": order.kiosk_id}


def payment_payload(order_id: uuid.UUID, payment: Payment) -> dict:
    status = {"pending": "WAITING", "approved": "PAID", "rejected": "REJECTED",
              "cancelled": "CANCELED", "expired": "EXPIRED"}[payment.status.value]
    image = f"data:image/png;base64,{payment.qr_code_base64}" if payment.qr_code_base64 else None
    return {"orderId": str(order_id), "status": status, "amount": payment.amount,
            "copyPaste": payment.qr_code, "qrCodeImage": image, "ticketUrl": payment.ticket_url}


@app.get("/health", tags=["system"])
async def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc)}


@app.post("/api/v1/auth/login", response_model=TokenOut, tags=["admin"])
async def login(data: LoginIn, tenant: Tenant = Depends(get_tenant), db: AsyncSession = Depends(get_db)):
    user = await db.scalar(select(User).where(User.tenant_id == tenant.id, User.email == data.email))
    if not user or not user.active or not password_hash.verify(data.password, user.password_hash):
        raise HTTPException(401, "E-mail ou senha inválidos", headers={"X-Error-Code": "invalid_credentials"})
    token = jwt.encode({"sub": str(user.id), "tenant": str(tenant.id), "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)}, settings.jwt_secret, algorithm="HS256")
    return TokenOut(access_token=token)


@app.get("/api/v1/categories", response_model=list[CategoryOut], tags=["catalog"])
async def categories(tenant: Tenant = Depends(get_tenant), db: AsyncSession = Depends(get_db)):
    stmt = select(Category).where(Category.tenant_id == tenant.id, Category.active.is_(True))
    return (await db.scalars(stmt.order_by(Category.sort_order, Category.name))).all()


@app.post("/api/v1/categories", response_model=CategoryOut, status_code=201, tags=["admin"])
async def create_category(data: CategoryIn, tenant: Tenant = Depends(get_tenant), db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    obj = Category(id=str(uuid.uuid4()), tenant_id=tenant.id, **data.model_dump())
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@app.put("/api/v1/categories/{category_id}", response_model=CategoryOut, tags=["admin"])
async def update_category(category_id: uuid.UUID, data: CategoryIn, tenant: Tenant = Depends(get_tenant), db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    obj = await db.scalar(select(Category).where(Category.id == category_id, Category.tenant_id == tenant.id))
    if not obj:
        raise HTTPException(404, "Categoria não encontrada")
    for key, value in data.model_dump().items():
        setattr(obj, key, value)
    await db.commit()
    await db.refresh(obj)
    return obj


@app.delete("/api/v1/categories/{category_id}", status_code=204, tags=["admin"])
async def delete_category(category_id: uuid.UUID, tenant: Tenant = Depends(get_tenant), db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    obj = await db.scalar(select(Category).where(Category.id == category_id, Category.tenant_id == tenant.id))
    if not obj:
        raise HTTPException(404, "Categoria não encontrada")
    obj.active = False
    await db.commit()
    return Response(status_code=204)


@app.get("/api/v1/products", response_model=list[ProductOut], tags=["catalog"])
async def products(category_id: uuid.UUID | None = None, available: bool | None = None,
                   tenant: Tenant = Depends(get_tenant), db: AsyncSession = Depends(get_db)):
    stmt = select(Product).where(Product.tenant_id == tenant.id, Product.active.is_(True))
    if category_id:
        stmt = stmt.where(Product.category_id == category_id)
    if available is not None:
        stmt = stmt.where(Product.available.is_(available))
    return (await db.scalars(stmt.order_by(Product.name))).all()


@app.get("/api/v1/products/{product_id}", response_model=ProductOut, tags=["catalog"])
async def product(product_id: uuid.UUID, tenant: Tenant = Depends(get_tenant), db: AsyncSession = Depends(get_db)):
    obj = await db.scalar(select(Product).where(Product.id == product_id, Product.tenant_id == tenant.id, Product.active.is_(True)))
    if not obj:
        raise HTTPException(404, "Produto não encontrado")
    return obj


@app.post("/api/v1/products", response_model=ProductOut, status_code=201, tags=["admin"])
async def create_product(data: ProductIn, tenant: Tenant = Depends(get_tenant), db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    category = await db.scalar(select(Category).where(Category.id == data.category_id, Category.tenant_id == tenant.id, Category.active.is_(True)))
    if not category:
        raise HTTPException(422, "Categoria inválida para este estabelecimento")
    values = data.model_dump()
    values["image_url"] = str(values["image_url"]) if values["image_url"] else None
    obj = Product(id=str(uuid.uuid4()), tenant_id=tenant.id, **values)
    db.add(obj)
    await db.commit()
    await db.refresh(obj)
    return obj


@app.put("/api/v1/products/{product_id}", response_model=ProductOut, tags=["admin"])
async def update_product(product_id: uuid.UUID, data: ProductIn, tenant: Tenant = Depends(get_tenant), db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    obj = await db.scalar(select(Product).where(Product.id == product_id, Product.tenant_id == tenant.id))
    category = await db.scalar(select(Category).where(Category.id == data.category_id, Category.tenant_id == tenant.id))
    if not obj or not category:
        raise HTTPException(404, "Produto ou categoria não encontrado")
    values = data.model_dump()
    values["image_url"] = str(values["image_url"]) if values["image_url"] else None
    for key, value in values.items():
        setattr(obj, key, value)
    await db.commit()
    await db.refresh(obj)
    return obj


@app.delete("/api/v1/products/{product_id}", status_code=204, tags=["admin"])
async def delete_product(product_id: uuid.UUID, tenant: Tenant = Depends(get_tenant), db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    obj = await db.scalar(select(Product).where(Product.id == product_id, Product.tenant_id == tenant.id))
    if not obj:
        raise HTTPException(404, "Produto não encontrado")
    obj.active = False
    await db.commit()
    return Response(status_code=204)


@app.post("/api/v1/orders", response_model=OrderOut, status_code=201, tags=["orders"])
async def create_order(data: OrderIn, response: Response, idempotency_key: str = Header(alias="Idempotency-Key", min_length=8, max_length=100),
                       tenant: Tenant = Depends(get_tenant), db: AsyncSession = Depends(get_db)):
    previous = await db.scalar(select(Order).where(Order.tenant_id == tenant.id, Order.idempotency_key == idempotency_key))
    if previous:
        response.status_code = 200
        return order_payload(previous)
    cpf = verify_cpf(data.cpf)
    ids = list({item.product_id for item in data.items})
    found = {p.id: p for p in (await db.scalars(select(Product).where(Product.id.in_(ids), Product.tenant_id == tenant.id, Product.active.is_(True), Product.available.is_(True)))).all()}
    if len(found) != len(ids):
        raise HTTPException(409, "Um ou mais produtos estão indisponíveis", headers={"X-Error-Code": "product_unavailable"})
    total = Decimal("0.00")
    lines = []
    for item in data.items:
        p = found[item.product_id]
        allowed = {a["id"]: a for a in (p.additions or [])}
        selected = []
        addition_total = Decimal("0.00")
        for addition in item.additions:
            option = allowed.get(addition.get("id"))
            if not option:
                raise HTTPException(422, "Adicional inválido para este produto", headers={"X-Error-Code": "invalid_addition"})
            price = Decimal(str(option["price"]))
            selected.append({"id": option["id"], "name": option["name"], "price": float(price)})
            addition_total += price
        unit_price = p.price + addition_total
        total += unit_price * item.quantity
        lines.append(OrderItem(tenant_id=tenant.id, product_id=p.id, product_name=p.name,
            unit_price=unit_price, quantity=item.quantity, removed_ingredients=item.removed_ingredients,
            additions=selected, notes=item.notes))
    order = Order(tenant_id=tenant.id, code="000", status=OrderStatus.awaiting_payment, total=total,
        cpf=cpf, invoice_email=data.invoice_email, kiosk_id=data.kiosk_id, idempotency_key=idempotency_key, items=lines)
    db.add(order)
    await db.flush()
    order.code = f"{(await db.scalar(select(func.count(Order.id)).where(Order.tenant_id == tenant.id)) or 1) % 1000:03d}"
    await db.commit()
    await db.refresh(order)
    return order_payload(order)


@app.get("/api/v1/orders/{order_id}", response_model=OrderOut, tags=["orders"])
async def get_order(order_id: uuid.UUID, tenant: Tenant = Depends(get_tenant), db: AsyncSession = Depends(get_db)):
    order = await db.scalar(select(Order).where(Order.id == order_id, Order.tenant_id == tenant.id))
    if not order:
        raise HTTPException(404, "Pedido não encontrado")
    return order_payload(order)


@app.get("/api/v1/orders", response_model=list[OrderOut], tags=["admin"])
async def list_orders(status: str | None = None, limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0),
                      tenant: Tenant = Depends(get_tenant), db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    stmt = select(Order).where(Order.tenant_id == tenant.id).order_by(Order.created_at.desc()).limit(limit).offset(offset)
    if status:
        status_map = {"PENDING_PAYMENT": "awaiting_payment", "PROCESSING": "paid", "PAID": "paid",
                      "CANCELED": "cancelled", "PREPARING": "preparing", "READY": "ready", "DELIVERED": "completed"}
        normalized = status_map.get(status.upper(), status.lower())
        stmt = stmt.where(Order.status == normalized)
    return [order_payload(o) for o in (await db.scalars(stmt)).all()]


@app.patch("/api/v1/orders/{order_id}/status", response_model=OrderOut, tags=["admin"])
async def update_order_status(order_id: uuid.UUID, data: StatusIn, tenant: Tenant = Depends(get_tenant), db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    status_map = {"PENDING_PAYMENT": "awaiting_payment", "PROCESSING": "paid", "PAID": "paid",
                  "CANCELED": "cancelled", "PREPARING": "preparing", "READY": "ready", "DELIVERED": "completed"}
    try:
        status = OrderStatus(status_map.get(data.status.upper(), data.status.lower()))
    except ValueError:
        raise HTTPException(422, "Status inválido") from None
    order = await db.scalar(select(Order).where(Order.id == order_id, Order.tenant_id == tenant.id))
    if not order:
        raise HTTPException(404, "Pedido não encontrado")
    if order.status == OrderStatus.awaiting_payment and status != OrderStatus.cancelled:
        raise HTTPException(409, "Pedido aguardando confirmação do pagamento")
    order.status = status
    await db.commit()
    await db.refresh(order)
    return order_payload(order)


@app.post("/api/v1/payments/pix", response_model=PaymentOut, tags=["payments"])
async def generate_pix(data: PixRequest, tenant: Tenant = Depends(get_tenant), db: AsyncSession = Depends(get_db)):
    order_id = data.order_id
    order = await db.scalar(select(Order).where(Order.id == order_id, Order.tenant_id == tenant.id))
    if not order:
        raise HTTPException(404, "Pedido não encontrado")
    old = await db.scalar(select(Payment).where(Payment.order_id == order.id, Payment.tenant_id == tenant.id))
    if old:
        return payment_payload(order.id, old)
    payment = await create_pix(order, db)
    return payment_payload(order.id, payment)


@app.get("/api/v1/payments/pix/{order_id}", response_model=PaymentOut, tags=["payments"])
async def payment_status(order_id: uuid.UUID, tenant: Tenant = Depends(get_tenant), db: AsyncSession = Depends(get_db)):
    payment = await db.scalar(select(Payment).where(Payment.order_id == order_id, Payment.tenant_id == tenant.id))
    if not payment:
        raise HTTPException(404, "Cobrança não encontrada")
    return payment_payload(order_id, payment)


@app.post("/api/v1/webhooks/mercadopago", status_code=200, tags=["payments"])
async def mercadopago_webhook(request: Request, x_signature: str | None = Header(None), x_request_id: str | None = Header(None), db: AsyncSession = Depends(get_db)):
    body = await request.json()
    payment_id = str(body.get("data", {}).get("id") or request.query_params.get("data.id") or "")
    if not payment_id or not valid_mp_signature(x_signature, x_request_id, payment_id, settings.mercadopago_webhook_secret):
        raise HTTPException(401, "Assinatura do webhook inválida")
    payment = await db.scalar(select(Payment).where(Payment.provider_id == payment_id))
    if payment:
        await sync_payment_status(payment, db, body)
    return {"received": True}


@app.post("/api/v1/orders/{order_id}/invoice", response_model=FiscalOut, tags=["fiscal"])
async def request_invoice(order_id: uuid.UUID, tenant: Tenant = Depends(get_tenant), db: AsyncSession = Depends(get_db)):
    order = await db.scalar(select(Order).where(Order.id == order_id, Order.tenant_id == tenant.id))
    if not order:
        raise HTTPException(404, "Pedido não encontrado")
    return await issue_fiscal(order, db)


@app.get("/api/v1/orders/{order_id}/invoice", response_model=FiscalOut, tags=["fiscal"])
async def invoice_status(order_id: uuid.UUID, tenant: Tenant = Depends(get_tenant), db: AsyncSession = Depends(get_db)):
    doc = await db.scalar(select(FiscalDocument).where(FiscalDocument.order_id == order_id, FiscalDocument.tenant_id == tenant.id))
    if not doc:
        raise HTTPException(404, "Nota fiscal ainda não solicitada")
    return doc


@app.get("/api/v1/reports/daily", tags=["reports"])
async def daily_report(tenant: Tenant = Depends(get_tenant), db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    today = datetime.now(timezone.utc).date()
    orders = (await db.scalars(select(Order).where(Order.tenant_id == tenant.id, func.date(Order.created_at) == today))).all()
    paid = [o for o in orders if o.status in (OrderStatus.paid, OrderStatus.preparing, OrderStatus.ready, OrderStatus.completed)]
    gross = sum((o.total for o in paid), Decimal("0.00"))
    return {"date": today, "sales": gross, "orders": len(paid), "average_ticket": gross / len(paid) if paid else Decimal("0.00"), "pix_percentage": 100.0 if paid else 0.0}


@app.get("/api/v1/reports/top-products", tags=["reports"])
async def top_products(limit: int = Query(5, ge=1, le=50), tenant: Tenant = Depends(get_tenant), db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    rows = await db.execute(select(OrderItem.product_id, OrderItem.product_name, func.sum(OrderItem.quantity).label("quantity"))
        .join(Order, Order.id == OrderItem.order_id).where(Order.tenant_id == tenant.id, Order.status.in_([OrderStatus.paid, OrderStatus.preparing, OrderStatus.ready, OrderStatus.completed]))
        .group_by(OrderItem.product_id, OrderItem.product_name).order_by(func.sum(OrderItem.quantity).desc()).limit(limit))
    return [{"product_id": str(row.product_id), "name": row.product_name, "quantity": row.quantity} for row in rows]


@app.get("/api/v1/reports/summary", tags=["reports"])
async def reports_summary(start: datetime, end: datetime, tenant: Tenant = Depends(get_tenant), db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    if end <= start:
        raise HTTPException(422, "O fim do período deve ser posterior ao início")
    orders = (await db.scalars(select(Order).where(Order.tenant_id == tenant.id, Order.created_at >= start, Order.created_at < end))).all()
    paid = [o for o in orders if o.status != OrderStatus.cancelled and o.status != OrderStatus.awaiting_payment]
    return {"start": start, "end": end, "sales": sum((o.total for o in paid), Decimal("0.00")), "orders": len(paid), "payment_methods": {"pix": 100 if paid else 0}}
