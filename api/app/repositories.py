from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class TenantRepository:
    def __init__(self, db: AsyncSession, model, tenant_id: UUID):
        self.db, self.model, self.tenant_id = db, model, tenant_id

    async def get(self, item_id: UUID):
        return await self.db.scalar(select(self.model).where(self.model.id == item_id, self.model.tenant_id == self.tenant_id))

    async def list(self):
        return list((await self.db.scalars(select(self.model).where(self.model.tenant_id == self.tenant_id))).all())

