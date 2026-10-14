import asyncio
from urllib.parse import parse_qs, urlparse
from app.routers import auth
from test_api import setup
from app.db import get_db
from app.main import app


def test_reset_password_is_single_use_and_revokes_sessions(monkeypatch):
    sent = []

    async def fake_email(to, subject, body):
        sent.append(body)

    monkeypatch.setattr(auth, 'send_email', fake_email)

    async def run():
        engine, factory, client, _ = await setup()
        try:
            original = await client.post('/api/v1/auth/login', json={'email': 'manager1@example.com', 'password': 'password123'})
            assert original.status_code == 200
            assert (await client.post('/api/v1/auth/forgot-password', json={'email': 'unknown@example.com'})).status_code == 200
            assert len(sent) == 0
            assert (await client.post('/api/v1/auth/forgot-password', json={'email': 'manager1@example.com'})).status_code == 200
            token = parse_qs(urlparse(sent[0].split()[-1]).query)['token'][0]
            payload = {'token': token, 'password': 'replacement123'}
            assert (await client.post('/api/v1/auth/reset-password', json=payload)).status_code == 200
            assert (await client.post('/api/v1/auth/reset-password', json=payload)).status_code == 400
            assert (await client.post('/api/v1/auth/login', json={'email': 'manager1@example.com', 'password': 'password123'})).status_code == 401
            assert (await client.post('/api/v1/auth/login', json={'email': 'manager1@example.com', 'password': 'replacement123'})).status_code == 200
        finally:
            await client.aclose()
            app.dependency_overrides.clear()
            await engine.dispose()

    asyncio.run(run())
