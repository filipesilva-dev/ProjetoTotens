import asyncio
import logging
import smtplib
from email.message import EmailMessage
from app.config import get_settings

log = logging.getLogger(__name__)


async def send_email(recipient: str, subject: str, body: str) -> None:
    settings = get_settings()
    if not settings.smtp_host or not settings.smtp_from:
        if settings.environment != 'development':
            raise RuntimeError('SMTP não configurado')
        log.info('DEV EMAIL to=%s subject=%s body=%s', recipient, subject, body)
        return

    def deliver():
        message = EmailMessage()
        message['From'] = settings.smtp_from
        message['To'] = recipient
        message['Subject'] = subject
        message.set_content(body)
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as smtp:
            if settings.smtp_starttls:
                smtp.starttls()
            if settings.smtp_user:
                smtp.login(settings.smtp_user, settings.smtp_password or '')
            smtp.send_message(message)

    await asyncio.to_thread(deliver)
