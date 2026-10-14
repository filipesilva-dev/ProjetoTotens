import asyncio
from sqlalchemy import select
from test_api import setup, login
from app.db import get_db
from app.main import app
from app.models import ContactMessage
from app.routers import auth


def test_signup_contact_and_kitchen_ticket(monkeypatch):
    sent = []

    async def fake_email(*args):
        sent.append(args)

    monkeypatch.setattr(auth, 'send_email', fake_email)

    async def run():
        engine, factory, client, tenants = await setup()
        try:
            signup = await client.post('/api/v1/tenants', json={'slug': 'new-shop', 'name': 'New Shop',
                'ownerName': 'Alice', 'ownerEmail': 'alice@example.com', 'password': 'securePassword123'})
            assert signup.status_code == 201, signup.text
            assert (await client.post('/api/v1/auth/login', json={'email': 'alice@example.com', 'password': 'securePassword123'})).status_code == 200
            assert len(sent) == 1
            contact = await client.post('/api/v1/contact', json={'name': 'Bob', 'email': 'bob@example.com', 'message': 'Please contact me'})
            assert contact.status_code == 201, contact.text
            async with factory() as db:
                assert await db.scalar(select(ContactMessage).where(ContactMessage.email == 'bob@example.com'))
            manager = await login(client, 'manager1@example.com')
            product = tenants[0][2]
            created = await client.post('/api/v1/orders', headers=manager | {'Idempotency-Key': 'kitchen-test'},
                json={'items': [{'productId': str(product.id), 'quantity': 1}], 'paymentMethod': 'PIX'})
            assert created.status_code == 201, created.text
            order_id = created.json()['id']
            assert (await client.get(f'/api/v1/orders/{order_id}/kitchen-ticket', headers=manager)).status_code == 409
            assert (await client.post('/api/v1/payments/pix', headers=manager, json={'orderId': order_id})).status_code == 200
            assert (await client.post(f'/api/v1/payments/{order_id}/simulate', headers=manager)).status_code == 200
            ticket = await client.get(f'/api/v1/orders/{order_id}/kitchen-ticket', headers=manager)
            assert ticket.status_code == 200 and ticket.content.startswith(b'%PDF')
            other = await login(client, 'manager2@example.com')
            assert (await client.get(f'/api/v1/orders/{order_id}/kitchen-ticket', headers=other)).status_code == 404
        finally:
            await client.aclose()
            app.dependency_overrides.clear()
            await engine.dispose()

    asyncio.run(run())
