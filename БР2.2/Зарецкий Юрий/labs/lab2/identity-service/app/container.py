import sentry_sdk
from dependency_injector.containers import DeclarativeContainer, WiringConfiguration
from dependency_injector.ext.starlette import Lifespan
from dependency_injector.providers import Resource, Self, Singleton
from fastapi import FastAPI
from sentry_sdk.types import Event, Hint

from app.logger import setup_logger
from app.settings import Settings, __version__, get_settings


def sentry_manager(settings: Settings) -> None:
    def _sentry_before_send(event: Event, hint: Hint) -> Event | None:  # noqa: ARG001
        if event.get("logger") or (
            (exceptions := event.get("exception", {}).get("values", []))
            and exceptions[-1].get("mechanism", {}).get("handled")
        ):
            return None

        return event

    if settings.sentry_dsn is not None:
        sentry_sdk.init(
            dsn=settings.sentry_dsn,
            release=__version__,
            environment=settings.environment,
            traces_sample_rate=0.0,
            before_send=_sentry_before_send,
        )


class Container(DeclarativeContainer):
    wiring_config = WiringConfiguration(packages=["app.handlers"], auto_wire=True)

    __self__ = Self()

    logger = Resource(provides=setup_logger)
    settings = Singleton(provides=get_settings)
    sentry = Resource(provides=sentry_manager, settings=settings.provided)

    lifespan = Singleton(provides=Lifespan, container=__self__)
    app = Singleton(provides=FastAPI, version=__version__, lifespan=lifespan)
