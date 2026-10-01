import uuid
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl, AliasChoices


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True, alias_generator=lambda s: s.split('_')[0] + ''.join(p.title() for p in s.split('_')[1:]))


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class CategoryIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    icon: str = "default"
    sort_order: int = Field(default=0, validation_alias=AliasChoices("order", "sort_order"))
    active: bool = True


class CategoryOut(ORMModel):
    id: str
    name: str
    icon: str
    sort_order: int = Field(serialization_alias="order")
    active: bool


class ProductIn(BaseModel):
    category_id: str = Field(validation_alias=AliasChoices("categoryId", "category_id"))
    name: str = Field(min_length=1, max_length=140)
    description: str = ""
    price: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    image_url: HttpUrl | None = Field(default=None, validation_alias=AliasChoices("imageUrl", "image_url"))
    ingredients: list[str] = []
    allergens: list[str] = []
    additions: list[dict] = []
    available: bool = True
    active: bool = True


class ProductOut(ORMModel):
    id: str
    category_id: str
    name: str
    description: str
    price: Decimal
    image_url: str | None
    ingredients: list[str]
    allergens: list[str]
    available: bool
    additions: list[dict]


class OrderItemIn(BaseModel):
    product_id: str = Field(validation_alias=AliasChoices("productId", "product_id"))
    quantity: int = Field(ge=1, le=50)
    removed_ingredients: list[str] = Field(default=[], validation_alias=AliasChoices("removedIngredients", "removed_ingredients"))
    additions: list[dict] = []
    notes: str = Field(default="", max_length=500)


class CustomerIn(BaseModel):
    cpf: str | None = None
    email: EmailStr | None = None


class OrderIn(BaseModel):
    items: list[OrderItemIn] = Field(min_length=1, max_length=50)
    cpf: str | None = Field(default=None, min_length=11, max_length=14)
    invoice_email: EmailStr | None = Field(default=None, validation_alias=AliasChoices("invoiceEmail", "invoice_email"))
    kiosk_id: str | None = Field(default=None, max_length=100, validation_alias=AliasChoices("totemId", "kioskId", "kiosk_id"))
    customer: CustomerIn | None = None
    payment_method: str | None = Field(default="PIX", validation_alias=AliasChoices("paymentMethod", "payment_method"))

    def model_post_init(self, __context):
        if self.payment_method and self.payment_method.upper() != "PIX":
            raise ValueError("Somente pagamento via Pix é aceito")
        if self.customer:
            self.cpf = self.cpf or self.customer.cpf
            self.invoice_email = self.invoice_email or self.customer.email


class OrderItemOut(BaseModel):
    product_id: str = Field(validation_alias=AliasChoices("productId", "product_id"), serialization_alias="productId")
    product: ProductOut
    quantity: int
    removed_ingredients: list[str] = Field(validation_alias=AliasChoices("removedIngredients", "removed_ingredients"), serialization_alias="removedIngredients")
    additions: list[dict]
    notes: str
    unit_price: Decimal = Field(validation_alias=AliasChoices("unitPrice", "unit_price"), serialization_alias="unitPrice")


class OrderOut(ORMModel):
    id: uuid.UUID
    code: str
    status: str
    subtotal: Decimal
    total: Decimal
    cpf: str | None = None
    invoice_email: str | None
    kiosk_id: str | None
    created_at: datetime
    items: list[OrderItemOut]
    totem_id: str = "Totem 1"
    customer: CustomerIn | None = None


class PaymentOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=lambda s: s.split('_')[0] + ''.join(p.title() for p in s.split('_')[1:]))
    order_id: uuid.UUID
    status: str
    amount: Decimal
    qr_code: str | None = Field(validation_alias=AliasChoices("copyPaste", "qr_code"), serialization_alias="copyPaste")
    qr_code_base64: str | None = Field(validation_alias=AliasChoices("qrCodeImage", "qr_code_base64"), serialization_alias="qrCodeImage")
    ticket_url: str | None


class PixRequest(BaseModel):
    order_id: uuid.UUID = Field(validation_alias=AliasChoices("orderId", "order_id"))
    amount: Decimal | None = None  # Accepted for the existing frontend; server always uses the order total.


class StatusIn(BaseModel):
    status: str


class FiscalOut(ORMModel):
    id: uuid.UUID
    order_id: uuid.UUID
    status: str
    email: str
    access_key: str | None
    pdf_url: str | None
    xml_url: str | None
    error_detail: str | None
