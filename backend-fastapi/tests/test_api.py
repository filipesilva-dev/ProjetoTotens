from datetime import datetime, timezone
from decimal import Decimal
import uuid

import pytest
from fastapi.testclient import TestClient

from app.deps import get_current_user, get_tenant
from app.main import app
from app.db import get_db
from app.models import Category, Order, OrderStatus, Product, Tenant, User
from app.services import valid_mp_signature, verify_cpf


class ScalarRows:
    def __init__(self, rows):
        self.rows = rows

    def all(self):
        return self.rows


class FakeDB:
    """Lightweight AsyncSession stand-in for API contract tests; no external DB required."""

    def __init__(self, *, scalar=None, rows=None):
        self.scalar_value = scalar
        self.scalar_index = 0
        self.rows = rows or []
        self.added = []

    async def scalar(self, _statement):
        if isinstance(self.scalar_value, list):
            value = self.scalar_value[self.scalar_index]
            self.scalar_index += 1
            return value
        if callable(self.scalar_value):
            return self.scalar_value(_statement)
        return self.scalar_value

    async def scalars(self, _statement):
        return ScalarRows(self.rows)

    def add(self, obj):
        self.added.append(obj)

    async def commit(self):
        return None

    async def refresh(self, _obj):
        return None

    async def flush(self):
        for obj in self.added:
            if isinstance(obj, Order):
                obj.id = obj.id or uuid.uuid4()
                obj.created_at = obj.created_at or datetime.now(timezone.utc)
                obj.status = obj.status or OrderStatus.awaiting_payment


tenant = Tenant(id=uuid.uuid4(), name="Loja teste", slug="test")
admin = User(id=uuid.uuid4(), tenant_id=tenant.id, email="admin@example.com", password_hash="x")


def client_for(db: FakeDB) -> TestClient:
    async def override_db():
        yield db

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_tenant] = lambda: tenant
    app.dependency_overrides[get_current_user] = lambda: admin
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_overrides():
    app.dependency_overrides.clear()
    yield
    app.dependency_overrides.clear()


def test_health_check():
    with TestClient(app) as client:
        response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_openapi_publishes_api_routes():
    with TestClient(app) as client:
        response = client.get("/openapi.json")
    assert response.status_code == 200
    paths = response.json()["paths"]
    assert "/api/v1/orders" in paths
    assert "/api/v1/payments/pix" in paths
    assert "/api/v1/webhooks/mercadopago" in paths


def test_categories_return_frontend_shape_and_order():
    db = FakeDB(rows=[Category(id="burgers", tenant_id=tenant.id, name="Burgers", icon="burger", sort_order=2, active=True)])
    with client_for(db) as client:
        response = client.get("/api/v1/categories")
    assert response.status_code == 200
    assert response.json() == [{"id": "burgers", "name": "Burgers", "icon": "burger", "order": 2, "active": True}]


def test_products_return_frontend_camel_case_shape():
    product = Product(id="b1", tenant_id=tenant.id, category_id="burgers", name="X-Burger",
                      description="Burger", price=Decimal("28.00"), image_url="https://example.com/b.jpg",
                      ingredients=["Cebola"], additions=[{"id": "a1", "name": "Bacon", "price": 5}],
                      allergens=["gluten"], available=True)
    with client_for(FakeDB(rows=[product])) as client:
        response = client.get("/api/v1/products")
    assert response.status_code == 200
    assert response.json()[0]["categoryId"] == "burgers"
    assert response.json()[0]["imageUrl"] == "https://example.com/b.jpg"
    assert response.json()[0]["additions"][0]["id"] == "a1"


def test_missing_order_returns_404_without_leaking_other_tenant():
    with client_for(FakeDB()) as client:
        response = client.get(f"/api/v1/orders/{uuid.uuid4()}")
    assert response.status_code == 404
    assert response.json()["detail"] == "Pedido não encontrado"


def test_create_order_recalculates_product_and_addition_prices():
    product = Product(id="b1", tenant_id=tenant.id, category_id="burgers", name="X-Burger",
                      description="Burger", price=Decimal("28.00"), image_url="https://example.com/b.jpg",
                      ingredients=["Cebola"], additions=[{"id": "a1", "name": "Bacon extra", "price": 5}],
                      allergens=["gluten"], available=True, active=True)
    db = FakeDB(scalar=[None, 1], rows=[product])
    with client_for(db) as client:
        response = client.post("/api/v1/orders", headers={"Idempotency-Key": "order-key-0001"}, json={
            "items": [{"productId": "b1", "quantity": 2, "unitPrice": 0,
                       "additions": [{"id": "a1", "name": "Bacon extra", "price": 0}]}],
            "customer": {"email": "cliente@example.com"}, "paymentMethod": "PIX"
        })
    assert response.status_code == 201
    body = response.json()
    assert Decimal(body["total"]) == Decimal("66.00")
    assert body["status"] == "PENDING_PAYMENT"
    assert Decimal(body["items"][0]["unitPrice"]) == Decimal("33.00")
    assert db.added[0].total == Decimal("66.00")


def test_cpf_validation_accepts_valid_and_rejects_invalid():
    assert verify_cpf("529.982.247-25") == "52998224725"
    with pytest.raises(Exception, match="CPF inválido"):
        verify_cpf("111.111.111-11")


def test_mercadopago_signature_is_verified_with_constant_time_comparison():
    import hashlib
    import hmac

    key = "webhook-secret"
    payment_id = "12345"
    request_id = "req-1"
    digest = hmac.new(key.encode(), f"id:{payment_id};request-id:{request_id};".encode(), hashlib.sha256).hexdigest()
    assert valid_mp_signature(f"ts=1,v1={digest}", request_id, payment_id, key)
    assert not valid_mp_signature("ts=1,v1=bad", request_id, payment_id, key)
    assert not valid_mp_signature(f"ts=1,v1={digest}", request_id, payment_id, "wrong-secret")
