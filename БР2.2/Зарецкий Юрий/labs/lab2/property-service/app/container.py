from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from dependency_injector.containers import DeclarativeContainer, WiringConfiguration
from dependency_injector.ext.starlette import Lifespan
from dependency_injector.providers import Resource, Self, Singleton
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from app.logger import setup_logger
from app.settings import Settings, __version__, get_settings


@asynccontextmanager
async def db_engine_manager(settings: Settings) -> AsyncIterator[AsyncEngine]:
    engine = create_async_engine(url=settings.db_dsn)

    try:
        yield engine
    finally:
        await engine.dispose()


class Container(DeclarativeContainer):
    wiring_config = WiringConfiguration(packages=["app.handlers"], auto_wire=True)

    __self__ = Self()

    logger = Resource(provides=setup_logger)
    settings = Singleton(provides=get_settings)
    db_engine = Resource(provides=db_engine_manager, settings=settings.provided)

    lifespan = Singleton(provides=Lifespan, container=__self__)
    app = Singleton(provides=FastAPI, version=__version__, lifespan=lifespan)
