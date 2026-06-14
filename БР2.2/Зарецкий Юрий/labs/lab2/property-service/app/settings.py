from functools import cache
from importlib.metadata import version

from pydantic import PostgresDsn, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.enums import Env, LogMode

__version__ = version("property-service")


class Settings(BaseSettings):
    environment: Env = Env.LOCAL
    log_level: str = "INFO"
    log_mode: LogMode = LogMode.PRETTY
    sentry_dsn: str | None = None

    db_host: str = "localhost"
    db_port: int = 5433
    db_name: str = "property_rental_db"
    db_user: str = "postgres"
    db_password: SecretStr = SecretStr("postgres")

    jwt_secret_key: SecretStr = SecretStr("secret")
    jwt_access_token_lifetime: int = 300

    service_auth_token: SecretStr = SecretStr("service-secret")

    identity_service_url: str = "http://localhost:8001"

    kafka_bootstrap_servers: str = "localhost:9092"

    model_config = SettingsConfigDict(env_file=".env")

    @property
    def db_dsn(self) -> str:
        dsn = PostgresDsn.build(
            scheme="postgresql+asyncpg",
            username=self.db_user,
            password=self.db_password.get_secret_value(),
            host=self.db_host,
            port=self.db_port,
            path=self.db_name,
        )

        return dsn.encoded_string()


@cache
def get_settings() -> Settings:
    return Settings()
