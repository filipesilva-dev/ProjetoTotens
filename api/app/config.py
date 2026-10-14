from functools import lru_cache
from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', extra='ignore')
    database_url: str = 'postgresql+asyncpg://fastlanches:fastlanches@db:5432/fastlanches'
    jwt_secret: str = 'CHANGE_ME_IN_ENV'
    jwt_issuer: str = 'fastlanches'
    access_minutes: int = 15
    refresh_days: int = 7
    cors_origins: str = 'http://localhost:5173'
    environment: str = 'development'
    payment_provider: str = 'mock'
    invoice_provider: str = 'mock'
    mercado_pago_access_token: str | None = None
    mercado_pago_webhook_secret: str | None = None
    payment_guest_email: str | None = None
    abacatepay_api_key: str | None = None
    abacatepay_webhook_secret: str | None = None
    abacatepay_public_key: str | None = None
    notaas_api_key: str | None = None
    notaas_webhook_secret: str | None = None
    fiscal_key_encryption_key: str | None = None
    superadmin_email: str | None = None
    superadmin_password: str | None = None
    seed_tenant_email: str | None = None
    seed_tenant_password: str | None = None
    seed_kiosk_email: str | None = None
    seed_kiosk_password: str | None = None
    public_base_url: str = 'http://localhost:8000'
    frontend_base_url: str = 'http://localhost:5173'
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from: str | None = None
    smtp_starttls: bool = True

    @model_validator(mode='after')
    def validate_production(self):
        if self.environment == 'production':
            if self.jwt_secret == 'CHANGE_ME_IN_ENV' or self.jwt_secret.startswith('replace-') or len(self.jwt_secret) < 32:
                raise ValueError('JWT_SECRET must be at least 32 characters in production')
            if self.payment_provider == 'mock':
                raise ValueError('Mock payments forbidden in production')
            if self.invoice_provider == 'mock':
                raise ValueError('Mock fiscal provider forbidden in production')
        return self

    @property
    def origins(self) -> list[str]:
        return [x.strip() for x in self.cors_origins.split(',') if x.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

