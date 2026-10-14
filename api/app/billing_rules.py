import asyncio
import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from app.db import SessionLocal
from app.models import BillingInvoice, Tenant, SystemSetting


async def apply_billing_rules():
    now = datetime.now(timezone.utc)
    async with SessionLocal() as db:
        setting = await db.scalar(select(SystemSetting).where(SystemSetting.key == 'console'))
        auto_suspend = (setting.value if setting else {}).get('autoSuspend', True)
        suspend_days = max(1, int((setting.value if setting else {}).get('autoSuspendDays', '30')))
        invoices = (await db.scalars(select(BillingInvoice).where(BillingInvoice.status.in_(['pending', 'overdue'])))).all()
        for invoice in invoices:
            due = invoice.due_at.replace(tzinfo=invoice.due_at.tzinfo or timezone.utc)
            if due >= now: continue
            invoice.status = 'overdue'
            tenant = await db.get(Tenant, invoice.tenant_id)
            if tenant and tenant.status not in ('cancelled', 'suspended'):
                tenant.status = 'past_due'
                if auto_suspend and due < now - timedelta(days=suspend_days):
                    tenant.status, tenant.active = 'suspended', False
        await db.commit()


async def billing_loop():
    while True:
        try: await apply_billing_rules()
        except Exception: logging.getLogger(__name__).exception('Billing rules failed')
        await asyncio.sleep(3600)
