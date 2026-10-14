import uuid
from datetime import datetime, timezone
from sqlalchemy import String, ForeignKey, Numeric, Boolean, DateTime, Integer, JSON, UniqueConstraint, Index, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid
from app.db import Base


def uid(): return uuid.uuid4()
def now(): return datetime.now(timezone.utc)


class UUIDPK:
    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uid)


class Tenant(Base, UUIDPK):
    __tablename__ = 'tenants'
    slug: Mapped[str] = mapped_column(String(90), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(180))
    cnpj: Mapped[str | None] = mapped_column(String(14), nullable=True)
    owner_name: Mapped[str] = mapped_column(String(180))
    owner_email: Mapped[str] = mapped_column(String(320))
    owner_phone: Mapped[str | None] = mapped_column(String(30))
    address: Mapped[dict | None] = mapped_column(JSON)
    logo_emoji: Mapped[str] = mapped_column(String(12), default='🍔')
    status: Mapped[str] = mapped_column(String(20), default='trial')
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    plan_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey('plans.id'), nullable=True)
    cycle: Mapped[str] = mapped_column(String(12), default='monthly')
    totem_count: Mapped[int] = mapped_column(Integer, default=1)
    contract_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    fiscal_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    fiscal_api_key: Mapped[str | None] = mapped_column(Text)


class Plan(Base, UUIDPK):
    __tablename__ = 'plans'
    slug: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text, default='')
    price_monthly: Mapped[float] = mapped_column(Numeric(12, 2))
    price_yearly: Mapped[float] = mapped_column(Numeric(12, 2))
    features: Mapped[list] = mapped_column(JSON, default=list)
    max_totems: Mapped[int] = mapped_column(Integer)
    max_products: Mapped[int] = mapped_column(Integer)
    highlighted: Mapped[bool] = mapped_column(Boolean, default=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class User(Base, UUIDPK):
    __tablename__ = 'users'
    __table_args__ = (Index('ix_users_tenant_role', 'tenant_id', 'role'),)
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey('tenants.id'), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(180))
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(20))
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class RefreshToken(Base, UUIDPK):
    __tablename__ = 'refresh_tokens'
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey('tenants.id'), nullable=True)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey('users.id'))
    jti_hash: Mapped[str] = mapped_column(String(64), unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)


class PasswordResetToken(Base, UUIDPK):
    __tablename__ = 'password_reset_tokens'
    __table_args__ = (Index('ix_reset_user_expires', 'user_id', 'expires_at'),)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey('users.id'), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Category(Base, UUIDPK):
    __tablename__ = 'categories'
    __table_args__ = (UniqueConstraint('tenant_id', 'name'), Index('ix_categories_tenant_order', 'tenant_id', 'sort_order'))
    tenant_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey('tenants.id'), nullable=False)
    name: Mapped[str] = mapped_column(String(100))
    icon: Mapped[str] = mapped_column(String(30), default='burger')
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class Product(Base, UUIDPK):
    __tablename__ = 'products'
    __table_args__ = (Index('ix_products_tenant_category', 'tenant_id', 'category_id'),)
    tenant_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey('tenants.id'), nullable=False)
    category_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey('categories.id'))
    name: Mapped[str] = mapped_column(String(180))
    description: Mapped[str] = mapped_column(Text, default='')
    price: Mapped[float] = mapped_column(Numeric(12, 2))
    image_url: Mapped[str] = mapped_column(Text, default='')
    available: Mapped[bool] = mapped_column(Boolean, default=True)
    ingredients: Mapped[list] = mapped_column(JSON, default=list)
    additions: Mapped[list] = mapped_column(JSON, default=list)
    allergens: Mapped[list] = mapped_column(JSON, default=list)
    ncm: Mapped[str | None] = mapped_column(String(8))
    cfop: Mapped[str | None] = mapped_column(String(4))


class Order(Base, UUIDPK):
    __tablename__ = 'orders'
    __table_args__ = (UniqueConstraint('tenant_id', 'idempotency_key'), Index('ix_orders_tenant_created', 'tenant_id', 'created_at'))
    tenant_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey('tenants.id'), nullable=False)
    code: Mapped[str] = mapped_column(String(12))
    status: Mapped[str] = mapped_column(String(30), default='PENDING_PAYMENT')
    items: Mapped[list] = mapped_column(JSON)
    subtotal: Mapped[float] = mapped_column(Numeric(12, 2))
    total: Mapped[float] = mapped_column(Numeric(12, 2))
    customer: Mapped[dict | None] = mapped_column(JSON)
    totem_id: Mapped[str] = mapped_column(String(100), default='Totem 1')
    idempotency_key: Mapped[str] = mapped_column(String(150))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Payment(Base, UUIDPK):
    __tablename__ = 'payments'
    __table_args__ = (UniqueConstraint('provider', 'provider_id'), UniqueConstraint('tenant_id', 'order_id'), Index('ix_payments_tenant_status', 'tenant_id', 'status'))
    tenant_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey('tenants.id'), nullable=False)
    order_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey('orders.id'))
    provider: Mapped[str] = mapped_column(String(20))
    provider_id: Mapped[str] = mapped_column(String(180))
    status: Mapped[str] = mapped_column(String(30))
    amount: Mapped[float] = mapped_column(Numeric(12, 2))
    qr_code_image: Mapped[str | None] = mapped_column(Text)
    copy_paste: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class FiscalInvoice(Base, UUIDPK):
    __tablename__ = 'fiscal_invoices'
    __table_args__ = (UniqueConstraint('tenant_id', 'order_id'), Index('ix_fiscal_tenant_status', 'tenant_id', 'status'))
    tenant_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey('tenants.id'), nullable=False)
    order_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey('orders.id'))
    provider_id: Mapped[str | None] = mapped_column(String(180))
    status: Mapped[str] = mapped_column(String(30), default='pending')
    number: Mapped[str | None] = mapped_column(String(60))
    pdf_url: Mapped[str | None] = mapped_column(Text)
    xml_url: Mapped[str | None] = mapped_column(Text)
    error: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Subscription(Base, UUIDPK):
    __tablename__ = 'subscriptions'
    __table_args__ = (Index('ix_subscriptions_tenant_status', 'tenant_id', 'status'),)
    tenant_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey('tenants.id'), nullable=False)
    plan_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey('plans.id'))
    cycle: Mapped[str] = mapped_column(String(12))
    status: Mapped[str] = mapped_column(String(20), default='trial')
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    trial_ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class BillingInvoice(Base, UUIDPK):
    __tablename__ = 'billing_invoices'
    __table_args__ = (Index('ix_billing_tenant_status', 'tenant_id', 'status'), UniqueConstraint('provider', 'provider_id'))
    tenant_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey('tenants.id'), nullable=False)
    plan_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey('plans.id'))
    number: Mapped[str] = mapped_column(String(50), unique=True)
    amount: Mapped[float] = mapped_column(Numeric(12, 2))
    status: Mapped[str] = mapped_column(String(20), default='pending')
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    notes: Mapped[str | None] = mapped_column(Text)
    provider: Mapped[str | None] = mapped_column(String(20))
    provider_id: Mapped[str | None] = mapped_column(String(180))
    pix_qr_image: Mapped[str | None] = mapped_column(Text)
    pix_copy_paste: Mapped[str | None] = mapped_column(Text)
    boleto_url: Mapped[str | None] = mapped_column(Text)
    barcode: Mapped[str | None] = mapped_column(Text)


class WebhookEvent(Base, UUIDPK):
    __tablename__ = 'webhook_events'
    __table_args__ = (UniqueConstraint('provider', 'event_id'), Index('ix_webhook_tenant', 'tenant_id'))
    tenant_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey('tenants.id'), nullable=False)
    provider: Mapped[str] = mapped_column(String(20))
    event_id: Mapped[str] = mapped_column(String(180))
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class AuditLog(Base, UUIDPK):
    __tablename__ = 'audit_logs'
    actor_id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey('users.id'))
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey('tenants.id'), nullable=True)
    action: Mapped[str] = mapped_column(String(120))
    detail: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class SystemSetting(Base, UUIDPK):
    __tablename__ = 'system_settings'
    key: Mapped[str] = mapped_column(String(100), unique=True)
    value: Mapped[dict] = mapped_column(JSON)


class ContactMessage(Base, UUIDPK):
    __tablename__ = 'contact_messages'
    __table_args__ = (Index('ix_contact_tenant_created', 'tenant_id', 'created_at'),)
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey('tenants.id'), nullable=True)
    name: Mapped[str] = mapped_column(String(180))
    email: Mapped[str] = mapped_column(String(320))
    message: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
