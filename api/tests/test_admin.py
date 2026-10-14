import asyncio
from test_api import setup, login
from app.main import app


def test_superadmin_plans_settings_exports_and_manager_creation(monkeypatch):
    from app.routers import admin
    delivered = []

    async def fake_email(*args):
        delivered.append(args)

    monkeypatch.setattr(admin, 'send_email', fake_email)

    async def run():
        engine, factory, client, _ = await setup()
        try:
            manager = await login(client, 'manager1@example.com')
            root = await login(client, 'root@example.com')
            assert (await client.get('/api/v1/admin/plans', headers=manager)).status_code == 403
            plan = await client.post('/api/v1/admin/plans', headers=root, json={
                'name': 'Novo', 'priceMonthly': 20, 'priceYearly': 200})
            assert plan.status_code == 201, plan.text
            plan_id = plan.json()['id']
            edited = await client.patch(f'/api/v1/admin/plans/{plan_id}', headers=root, json={'active': False})
            assert edited.status_code == 200 and edited.json()['active'] is False
            assert len((await client.get('/api/v1/admin/plans', headers=root)).json()) == 2
            values = {'sendInvoiceEmail': True, 'autoSuspend': True, 'autoSuspendDays': '30',
                      'welcomeMessage': 'Olá', 'supportEmail': 'help@example.com', 'maintenanceMode': False}
            assert (await client.put('/api/v1/admin/settings', headers=root, json=values)).status_code == 200
            assert (await client.get('/api/v1/admin/settings', headers=root)).json() == values
            tenant = await client.post('/api/v1/admin/tenants', headers=root, json={
                'slug': 'nova-loja', 'name': 'Nova Loja', 'ownerName': 'Maria',
                'ownerEmail': 'maria@example.com', 'planId': 'pro'})
            assert tenant.status_code == 201, tenant.text
            assert len(delivered) == 1
            managers = await client.get(f"/api/v1/admin/tenants/{tenant.json()['id']}/managers", headers=root)
            assert len(managers.json()) == 1
            csv = await client.get('/api/v1/admin/reports/export/tenants.csv', headers=root)
            assert csv.status_code == 200 and 'Nova Loja' in csv.text
            assert (await client.get('/api/v1/admin/reports/export/invoices.csv', headers=root)).status_code == 200
        finally:
            await client.aclose()
            app.dependency_overrides.clear()
            await engine.dispose()

    asyncio.run(run())
