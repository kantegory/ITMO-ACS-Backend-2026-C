from functools import cache
from importlib.metadata import version

from pydantic_settings import BaseSettings, SettingsConfigDict

from app.enums import Env, LogMode

# TODO: Указать название проекта
__version__ = version("template-cursor-rules")


class Settings(BaseSettings):
    environment: Env = Env.LOCAL
    log_level: str = "INFO"
    log_mode: LogMode = LogMode.PRETTY
    sentry_dsn: str | None = None

    # TODO: Указать настройки

    model_config = SettingsConfigDict(env_file=".env")


@cache
def get_settings() -> Settings:
    return Settings()
