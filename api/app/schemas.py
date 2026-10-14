from datetime import datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class ApiSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class LoginIn(ApiSchema):
    email: EmailStr
    password: str


class UserOut(ApiSchema):
    id: UUID
    name: str
    email: EmailStr
    role: str
    tenant_id: UUID | None = Field(alias='tenantId')
    active: bool


class Tokens(ApiSchema):
    access_token: str = Field(alias='accessToken')
    refresh_token: str = Field(alias='refreshToken')
    token_type: str = 'bearer'
    user: UserOut


class RefreshIn(ApiSchema):
    refresh_token: str = Field(alias='refreshToken')


class ManagerIn(ApiSchema):
    name: str = Field(min_length=2)
    email: EmailStr
    password: str = Field(min_length=8)


class ManagerPatch(ApiSchema):
    name: str | None = None
    email: EmailStr | None = None
    active: bool | None = None


class ResetPassword(ApiSchema):
    password: str = Field(min_length=8)


class TenantIn(ApiSchema):
    slug: str = Field(pattern=r'^[a-z0-9]+(?:-[a-z0-9]+)*$', max_length=90)
    name: str = Field(min_length=2)
    owner_name: str = Field(alias='ownerName', min_length=2)
    owner_email: EmailStr = Field(alias='ownerEmail')
    owner_phone: str | None = Field(None, alias='ownerPhone')
    cnpj: str | None = None
    address: dict | None = None
    logo_emoji: str = Field('🍔', alias='logoEmoji')
    plan_id: str = Field('pro', alias='planId')
    cycle: str = 'monthly'


class SignupIn(TenantIn):
    password: str = Field(min_length=8)


class TenantPatch(ApiSchema):
    slug: str | None = Field(None, pattern=r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
    name: str | None = None
    owner_name: str | None = Field(None, alias='ownerName')
    owner_email: EmailStr | None = Field(None, alias='ownerEmail')
    owner_phone: str | None = Field(None, alias='ownerPhone')
    address: dict | None = None
    cnpj: str | None = None
    logo_emoji: str | None = Field(None, alias='logoEmoji')
    totem_count: int | None = Field(None, alias='totemCount', ge=1)
    plan_id: str | None = Field(None, alias='planId')
    cycle: str | None = None


class StatusIn(ApiSchema):
    status: str


class TenantOut(ApiSchema):
    id: UUID
    slug: str
    name: str
    cnpj: str | None
    logo_emoji: str = Field(alias='logoEmoji')
    owner_name: str = Field(alias='ownerName')
    owner_email: str = Field(alias='ownerEmail')
    owner_phone: str | None = Field(alias='ownerPhone')
    address: dict | None
    plan_id: str = Field(alias='planId')
    cycle: str
    status: str
    totem_count: int = Field(alias='totemCount')
    created_at: datetime = Field(alias='createdAt')
    contract_ends_at: datetime | None = Field(alias='contractEndsAt')


class PlanOut(ApiSchema):
    id: UUID
    slug: str
    slug: str
    name: str
    description: str
    price_monthly: Decimal = Field(alias='priceMonthly')
    price_yearly: Decimal = Field(alias='priceYearly')
    features: list[str]
    max_totems: int = Field(alias='maxTotems')
    max_products: int = Field(alias='maxProducts')
    highlighted: bool
    active: bool
    sort_order: int = Field(alias='sortOrder')


class CategoryIn(ApiSchema):
    name: str = Field(min_length=1, max_length=100)
    icon: str = 'burger'
    order: int = 0


class CategoryOut(CategoryIn):
    id: UUID


class Addition(ApiSchema):
    id: UUID | None = None
    name: str
    price: Decimal = Field(ge=0)


class ProductIn(ApiSchema):
    name: str = Field(min_length=1)
    description: str = ''
    price: Decimal = Field(ge=0)
    image_url: str = Field('', alias='imageUrl')
    category_id: UUID = Field(alias='categoryId')
    available: bool = True
    ingredients: list[str] = Field(default_factory=list)
    additions: list[Addition] = Field(default_factory=list)
    allergens: list[str] = Field(default_factory=list)
    ncm: str | None = Field(None, pattern=r'^\d{8}$')
    cfop: str | None = Field(None, pattern=r'^\d{4}$')


class ProductOut(ProductIn):
    id: UUID


class Customer(ApiSchema):
    cpf: str | None = None
    email: EmailStr | None = None


class CartItemIn(ApiSchema):
    product_id: UUID = Field(alias='productId')
    quantity: int = Field(ge=1, le=100)
    removed_ingredients: list[str] = Field(default_factory=list, alias='removedIngredients')
    additions: list[Addition] = Field(default_factory=list)
    notes: str | None = Field(None, max_length=500)


class OrderIn(ApiSchema):
    items: list[CartItemIn] = Field(min_length=1)
    customer: Customer | None = None
    payment_method: str = Field('PIX', alias='paymentMethod')
    totem_id: str = Field('Totem 1', alias='totemId')


class OrderOut(ApiSchema):
    id: UUID
    code: str
    status: str
    items: list[dict]
    subtotal: Decimal
    total: Decimal
    created_at: datetime = Field(alias='createdAt')
    totem_id: str = Field(alias='totemId')
    customer: dict | None


class PixIn(ApiSchema):
    order_id: UUID = Field(alias='orderId')
    amount: Decimal | None = None  # accepted for old frontend, ignored; server order total is authoritative


class PixOut(ApiSchema):
    order_id: UUID = Field(alias='orderId')
    qr_code_image: str = Field(alias='qrCodeImage')
    copy_paste: str = Field(alias='copyPaste')
    amount: Decimal
    status: str


class SubscriptionIn(ApiSchema):
    plan_id: str = Field(alias='planId')
    cycle: str = Field(pattern='^(monthly|yearly)$')


class FiscalOut(ApiSchema):
    id: UUID
    order_id: UUID = Field(alias='orderId')
    status: str
    number: str | None
    pdf_url: str | None = Field(alias='pdfUrl')
    xml_url: str | None = Field(alias='xmlUrl')
    error: str | None


class BillingIn(ApiSchema):
    tenant_id: UUID = Field(alias='tenantId')
    plan_id: str = Field(alias='planId')
    amount: Decimal = Field(gt=0)
    due_at: datetime = Field(alias='dueAt')
    notes: str | None = None


class BillingOut(ApiSchema):
    id: UUID
    number: str
    tenant_id: UUID = Field(alias='tenantId')
    tenant_name: str = Field(alias='tenantName')
    tenant_slug: str = Field(alias='tenantSlug')
    plan_id: str = Field(alias='planId')
    plan_name: str = Field(alias='planName')
    amount: Decimal
    status: str
    issued_at: datetime = Field(alias='issuedAt')
    due_at: datetime = Field(alias='dueAt')
    paid_at: datetime | None = Field(alias='paidAt')
    notes: str | None
    pix_qr_image: str | None = Field(alias='pixQrImage')
    pix_copy_paste: str | None = Field(alias='pixCopyPaste')
    boleto_url: str | None = Field(alias='boletoUrl')
    barcode: str | None

