from functools import cache
from importlib.metadata import version

from pydantic import PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.enums import Env, LogMode

__version__ = version("identity-service")


class Settings(BaseSettings):
    environment: Env = Env.LOCAL
    log_level: str = "INFO"
    log_mode: LogMode = LogMode.PRETTY
    sentry_dsn: str | None = None

    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "identity_db"
    db_user: str = "postgres"
    db_password: str = "postgres"

    jwt_secret_key: str = "secret"
    jwt_access_token_lifetime: int = 300
    jwt_refresh_token_lifetime: int = 2_592_000

    service_auth_token: str = "service-secret"

    kafka_bootstrap_servers: str = "localhost:9092"

    model_config = SettingsConfigDict(env_file=".env")

    @property
    def db_dsn(self) -> str:
        dsn = PostgresDsn.build(
            scheme="postgresql+asyncpg",
            username=self.db_user,
            password=self.db_password,
            host=self.db_host,
            port=self.db_port,
            path=self.db_name,
        )

        return dsn.encoded_string()


@cache
def get_settings() -> Settings:
    return Settings()
