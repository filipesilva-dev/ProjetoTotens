import asyncio
import uuid
from sqlalchemy import select
from test_api import setup, login
from app.main import app
from app.models import FiscalInvoice


def test_nfce_issues_once_after_confirmed_pix_and_is_tenant_scoped():
    async def run():
        engine, factory, client, tenants = await setup()
        try:
            a, b = tenants
            async with factory() as db:
                tenant = await db.get(type(a[0]), a[0].id)
                product = await db.get(type(a[2]), a[2].id)
                tenant.fiscal_enabled = True
                product.ncm, product.cfop = '21069090', '5102'
                await db.commit()
            manager = await login(client, 'manager1@example.com')
            other = await login(client, 'manager2@example.com')
            order = await client.post('/api/v1/orders', headers=manager | {'Idempotency-Key': 'fiscal-1'},
                json={'items': [{'productId': str(a[2].id), 'quantity': 1}], 'paymentMethod': 'PIX'})
            assert order.status_code == 201, order.text
            order_id = order.json()['id']
            assert (await client.get('/api/v1/fiscal-invoices', headers=manager)).json() == []
            assert (await client.post('/api/v1/payments/pix', headers=manager, json={'orderId': order_id})).status_code == 200
            assert (await client.post(f'/api/v1/payments/{order_id}/simulate', headers=manager)).status_code == 200
            notes = (await client.get('/api/v1/fiscal-invoices', headers=manager)).json()
            assert len(notes) == 1 and notes[0]['status'] == 'issued'
            assert (await client.get(f"/api/v1/fiscal-invoices/{notes[0]['id']}", headers=other)).status_code == 404
            async with factory() as db:
                assert len((await db.scalars(select(FiscalInvoice).where(FiscalInvoice.order_id == uuid.UUID(order_id)))).all()) == 1
        finally:
            await client.aclose()
            app.dependency_overrides.clear()
            await engine.dispose()

    asyncio.run(run())
