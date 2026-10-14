import asyncio
from datetime import datetime, timedelta, timezone
from test_api import setup, login
from app.routers import admin
from app.routers.webhooks import process
from app.db import get_db
from app.main import app


def test_boleto_mock_pdf_resend_and_webhook(monkeypatch):
    sent = []

    async def fake_email(*args):
        sent.append(args)

    monkeypatch.setattr(admin, 'send_email', fake_email)

    async def run():
        engine, factory, client, tenants = await setup()
        try:
            root = await login(client, 'root@example.com')
            payload = {'tenantId': str(tenants[0][0].id), 'planId': 'pro', 'amount': 99,
                       'dueAt': (datetime.now(timezone.utc) + timedelta(days=10)).isoformat()}
            result = await client.post('/api/v1/admin/invoices', headers=root, json=payload)
            assert result.status_code == 201, result.text
            item = result.json()
            assert item['barcode'].startswith('MOCK-')
            assert len(sent) == 1
            pdf = await client.get(f"/api/v1/admin/invoices/{item['id']}/pdf", headers=root)
            assert pdf.status_code == 200 and pdf.content.startswith(b'%PDF')
            assert (await client.post(f"/api/v1/admin/invoices/{item['id']}/resend", headers=root)).status_code == 200
            assert len(sent) == 2
            async with factory() as db:
                assert (await process(db, 'mock', 'mock-boleto-' + item['id'], 'event-1', 'paid'))['ok']
                assert (await process(db, 'mock', 'mock-boleto-' + item['id'], 'event-1', 'paid'))['duplicate']
            paid = await client.get(f"/api/v1/admin/invoices/{item['id']}", headers=root)
            assert paid.json()['status'] == 'paid'
        finally:
            await client.aclose()
            app.dependency_overrides.clear()
            await engine.dispose()

    asyncio.run(run())
