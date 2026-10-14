import asyncio
import base64
import hashlib
import hmac
import uuid
from decimal import Decimal
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select
from app.db import Base, get_db
from app.main import app
from app.models import Plan, Tenant, User, Category, Product, Payment, Order, WebhookEvent
from app.security import hash_password
from app.routers.webhooks import process
from app.providers import verify_abacate_signature, verify_mercado_signature
from app.providers import AbacatePayProvider, MercadoPagoProvider, NotaasProvider
from app.config import get_settings
from fastapi import HTTPException


async def setup():
    get_settings().jwt_secret = 'unit-test-only-key-with-at-least-32-characters'
    engine = create_async_engine('sqlite+aiosqlite:///:memory:')
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as db:
        plan = Plan(slug='pro', name='Pro', price_monthly=199, price_yearly=1990,
                    features=[], max_totems=3, max_products=200)
        db.add(plan); await db.flush()
        tenants = []
        for n in (1, 2):
            tenant = Tenant(slug=f'loja-{n}', name=f'Loja {n}', owner_name=f'Gerente {n}',
                            owner_email=f'manager{n}@example.com', plan_id=plan.id)
            db.add(tenant); await db.flush()
            db.add(User(tenant_id=tenant.id, name=f'Gerente {n}', email=f'manager{n}@example.com',
                        password_hash=hash_password('password123'), role='gerente'))
            cat = Category(tenant_id=tenant.id, name='Lanches', icon='burger', sort_order=1)
            db.add(cat); await db.flush()
            product = Product(tenant_id=tenant.id, category_id=cat.id, name=f'Burger {n}', price=Decimal('20.00'),
                              ingredients=[], additions=[], allergens=[])
            db.add(product)
            tenants.append((tenant, cat, product))
        db.add(User(name='Root', email='root@example.com', password_hash=hash_password('password123'), role='superadmin'))
        await db.commit()
    async def dep():
        async with factory() as db:
            yield db
    app.dependency_overrides[get_db] = dep
    client = AsyncClient(transport=ASGITransport(app=app), base_url='http://test')
    return engine, factory, client, tenants


async def login(client, email):
    response = await client.post('/api/v1/auth/login', json={'email': email, 'password': 'password123'})
    assert response.status_code == 200, response.text
    return {'Authorization': 'Bearer ' + response.json()['accessToken']}


def test_crud_tenant_isolation_and_admin():
    async def run():
        engine, factory, client, tenants = await setup()
        try:
            a, b = tenants
            h1, h2, hs = await login(client, 'manager1@example.com'), await login(client, 'manager2@example.com'), await login(client, 'root@example.com')
            response = await client.get('/api/v1/products', headers=h1)
            assert response.status_code == 200 and len(response.json()) == 1
            assert response.json()[0]['name'] == 'Burger 1'
            assert (await client.get('/api/v1/products/' + str(b[2].id), headers=h1)).status_code == 404
            assert (await client.delete('/api/v1/products/' + str(b[2].id), headers=h1)).status_code == 404
            assert (await client.get('/api/v1/admin/tenants', headers=h1)).status_code == 403
            assert (await client.get('/admin/tenants', headers=h1)).status_code == 403
            assert (await client.get('/api/v1/products', headers=hs)).status_code == 403
            assert len((await client.get('/api/v1/admin/tenants', headers=hs)).json()) == 2
            assert len((await client.get('/admin/tenants', headers=hs)).json()) == 2
            assert len((await client.get(f'/api/v1/admin/tenants/{b[0].id}/products', headers=hs)).json()) == 1
            manager = await client.post(f'/api/v1/admin/tenants/{b[0].id}/managers', headers=hs,
                                        json={'name':'New Manager','email':'new@example.com','password':'password123'})
            assert manager.status_code == 201, manager.text
            assert manager.json()['tenantId'] == str(b[0].id)
            manager_id = manager.json()['id']
            assert len((await client.get(f'/api/v1/admin/tenants/{b[0].id}/managers', headers=hs)).json()) == 2
            reset = await client.post(f'/api/v1/admin/tenants/{b[0].id}/managers/{manager_id}/reset-password',
                                      headers=hs, json={'password':'new-password-123'})
            assert reset.status_code == 200
            assert (await client.delete(f'/api/v1/admin/tenants/{b[0].id}/managers/{manager_id}', headers=hs)).json()['active'] is False
            r = await client.post('/api/v1/products', headers=h1, json={'name':'New','price':'7.50','categoryId':str(a[1].id)})
            assert r.status_code == 201, r.text
            assert len((await client.get('/api/v1/products', headers=h2)).json()) == 1
            suspended = await client.patch(f'/api/v1/admin/tenants/{b[0].id}/status', headers=hs, json={'status':'suspended'})
            assert suspended.status_code == 200
            assert (await client.get('/api/v1/products', headers=h2)).status_code == 403
            assert (await client.post('/api/v1/auth/login', json={'email':'manager2@example.com','password':'password123'})).status_code == 403
        finally:
            await client.aclose(); app.dependency_overrides.clear(); await engine.dispose()
    asyncio.run(run())


def test_order_server_price_and_webhook_idempotency():
    async def run():
        engine, factory, client, tenants = await setup()
        try:
            a, b = tenants
            h1 = await login(client, 'manager1@example.com')
            payload = {'items':[{'productId':str(a[2].id),'quantity':2, 'unitPrice':0}], 'paymentMethod':'PIX'}
            r = await client.post('/api/v1/orders', headers=h1 | {'Idempotency-Key':'key-1'}, json=payload)
            assert r.status_code == 201, r.text
            assert Decimal(r.json()['total']) == Decimal('40.00')
            again = await client.post('/api/v1/orders', headers=h1 | {'Idempotency-Key':'key-1'}, json=payload)
            assert again.json()['id'] == r.json()['id']
            assert (await client.post('/api/v1/orders', headers=h1 | {'Idempotency-Key':'key-2'},
                json={'items':[{'productId':str(b[2].id),'quantity':1}],'paymentMethod':'PIX'})).status_code == 422
            charge = await client.post('/api/v1/payments/pix', headers=h1, json={'orderId':r.json()['id'],'amount':1})
            assert charge.status_code == 200, charge.text
            assert Decimal(charge.json()['amount']) == Decimal('40.00')
            h2 = await login(client, 'manager2@example.com')
            assert (await client.get('/api/v1/orders/' + r.json()['id'], headers=h2)).status_code == 404
            assert (await client.get('/api/v1/payments/' + r.json()['id'] + '/status', headers=h2)).status_code == 404
            async with factory() as db:
                payment = await db.scalar(select(Payment).where(Payment.order_id == uuid.UUID(r.json()['id'])))
                first = await process(db, 'mock', payment.provider_id, 'event-1', 'approved')
                second = await process(db, 'mock', payment.provider_id, 'event-1', 'approved')
                assert first['ok'] and second['duplicate']
                order = await db.get(Order, uuid.UUID(r.json()['id']))
                assert order.status == 'PAID'
                order.status = 'PREPARING'
                await db.commit()
                await process(db, 'mock', payment.provider_id, 'event-2', 'approved')
                await db.refresh(order)
                assert order.status == 'PREPARING'
                events = (await db.scalars(select(WebhookEvent))).all()
                assert len(events) == 2
        finally:
            await client.aclose(); app.dependency_overrides.clear(); await engine.dispose()
    asyncio.run(run())


def test_webhook_signatures_reject_forgery():
    config = get_settings()
    config.abacatepay_webhook_secret = 'test-secret'
    config.abacatepay_public_key = 'test-public-key'
    config.mercado_pago_webhook_secret = 'test-mp-secret'
    with pytest.raises(HTTPException):
        verify_abacate_signature(b'{}', 'forged', 'wrong')
    with pytest.raises(HTTPException):
        verify_mercado_signature('123', 'req', 'ts=123,v1=forged')
    raw = b'{"id":"evt-1"}'
    signature = base64.b64encode(hmac.new(b'test-public-key', raw, hashlib.sha256).digest()).decode()
    verify_abacate_signature(raw, signature, 'test-secret')
    mp_sig = hmac.new(b'test-mp-secret', b'id:123;request-id:req;ts:123;', hashlib.sha256).hexdigest()
    verify_mercado_signature('123', 'req', f'ts=123,v1={mp_sig}')


def test_provider_contracts(monkeypatch):
    import httpx
    from app import providers
    real_client = httpx.AsyncClient
    calls = []
    def handler(request):
        calls.append((request.method, request.url.path, request.content))
        if request.url.path == '/v1/payments':
            return httpx.Response(201, json={'id': 123, 'status':'pending', 'point_of_interaction': {'transaction_data': {'qr_code':'PIX', 'qr_code_base64':'AAA'}}})
        if request.url.path == '/v2/transparents/create':
            return httpx.Response(200, json={'data': {'id':'pix_char_1','status':'PENDING','brCode':'PIX','brCodeBase64':'data:image/png;base64,AAA'}})
        if request.url.path == '/api/v1/nfe/emitir':
            return httpx.Response(202, json={'invoiceId':'invoice-1','status':'queued'})
        return httpx.Response(404)
    monkeypatch.setattr(providers.httpx, 'AsyncClient', lambda **kw: real_client(transport=httpx.MockTransport(handler)))
    get_settings().mercado_pago_access_token = 'test-token'
    get_settings().abacatepay_api_key = 'test-token'
    async def run():
        order_id = uuid.uuid4()
        mp = await MercadoPagoProvider().create_pix(order_id, Decimal('25.00'), 'payer@example.com')
        ab = await AbacatePayProvider().create_pix(order_id, Decimal('25.00'), None)
        nf = await NotaasProvider().issue([{'productId':str(order_id),'product':{'name':'Burger'}, 'ncm':'21069090', 'cfop':'5102',
                                           'quantity':1,'unitPrice':25}], Decimal('25.00'), None, 'test-key')
        assert mp['copy'] == ab['copy'] == 'PIX'
        assert nf['invoiceId'] == 'invoice-1'
        assert b'"amount":2500' in calls[1][2]
        assert b'"modelo":65' in calls[2][2]
    asyncio.run(run())

