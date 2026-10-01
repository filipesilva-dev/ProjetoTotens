from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    database_url: str = "postgresql+asyncpg://fastlanches:local-dev-only@localhost:5432/fastlanches"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret: str = "unsafe-development-secret"
    jwt_expire_minutes: int = 720
    cors_origins: str = "http://localhost:5173"
    mercadopago_access_token: str = ""
    mercadopago_webhook_secret: str = ""
    mercadopago_webhook_url: str = ""
    fiscal_provider: str = "mock"
    fiscal_api_url: str = ""
    fiscal_api_token: str = ""
    default_tenant_slug: str = "demo"
    bootstrap_admin_email: str = "admin@example.com"
    bootstrap_admin_password: str = "change-me-now"

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
