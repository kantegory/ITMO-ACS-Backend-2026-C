from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from dependency_injector.containers import DeclarativeContainer, WiringConfiguration
from dependency_injector.ext.starlette import Lifespan
from dependency_injector.providers import Resource, Self, Singleton
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from app.db.cities import CitiesRepo
from app.db.comforts import ComfortsRepo
from app.db.deals import DealsRepo
from app.db.photos import PhotosRepo
from app.db.properties import PropertiesRepo
from app.logger import setup_logger
from app.services.cities import CitiesService
from app.services.comforts import ComfortsService
from app.services.deals import DealsService
from app.services.photos import PhotosService
from app.services.properties import PropertiesService
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

    cities_repo = Singleton(CitiesRepo, engine=db_engine.provided)
    comforts_repo = Singleton(ComfortsRepo, engine=db_engine.provided)
    properties_repo = Singleton(PropertiesRepo, engine=db_engine.provided)
    photos_repo = Singleton(PhotosRepo, engine=db_engine.provided)
    deals_repo = Singleton(DealsRepo, engine=db_engine.provided)

    cities_service = Singleton(CitiesService, cities_repo=cities_repo)
    comforts_service = Singleton(ComfortsService, comforts_repo=comforts_repo)
    properties_service = Singleton(
        PropertiesService,
        properties_repo=properties_repo,
        cities_repo=cities_repo,
        comforts_repo=comforts_repo,
        photos_repo=photos_repo,
    )
    photos_service = Singleton(
        PhotosService,
        photos_repo=photos_repo,
        properties_repo=properties_repo,
    )
    deals_service = Singleton(
        DealsService,
        deals_repo=deals_repo,
        properties_repo=properties_repo,
    )

    lifespan = Singleton(provides=Lifespan, container=__self__)
    app = Singleton(provides=FastAPI, version=__version__, lifespan=lifespan)
