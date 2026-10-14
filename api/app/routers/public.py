from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_db
from app import models as m
from app.mailer import send_email
from app.config import get_settings

router = APIRouter(prefix='/api/v1', tags=['public'])


class ContactIn(BaseModel):
    name: str = Field(min_length=2, max_length=180)
    email: EmailStr
    message: str = Field(min_length=10, max_length=5000)


@router.post('/contact', status_code=201)
async def contact(data: ContactIn, db: AsyncSession = Depends(get_db)):
    item = m.ContactMessage(name=data.name.strip(), email=str(data.email).lower(), message=data.message.strip())
    db.add(item)
    await db.commit()
    settings = await db.scalar(select(m.SystemSetting).where(m.SystemSetting.key == 'console'))
    recipient = (settings.value if settings else {}).get('supportEmail') or get_settings().smtp_from
    if recipient:
        await send_email(recipient, f'Contato FastLanches {item.id}',
                         f'De: {item.name} <{item.email}>\n\n{item.message}')
    return {'id': item.id, 'ok': True}
