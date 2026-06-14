import json
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from aiokafka import AIOKafkaProducer
from dependency_injector.containers import DeclarativeContainer, WiringConfiguration
from dependency_injector.ext.starlette import Lifespan
from dependency_injector.providers import Resource, Self, Singleton
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from app.db.users import UsersRepo
from app.events.producer import EventProducer
from app.logger import setup_logger
from app.services.auth import AuthService
from app.services.users import UsersService
from app.settings import Settings, __version__, get_settings


@asynccontextmanager
async def db_engine_manager(settings: Settings) -> AsyncIterator[AsyncEngine]:
    engine = create_async_engine(url=settings.db_dsn)

    try:
        yield engine
    finally:
        await engine.dispose()


@asynccontextmanager
async def kafka_producer_manager(settings: Settings) -> AsyncIterator[AIOKafkaProducer]:
    producer = AIOKafkaProducer(
        bootstrap_servers=settings.kafka_bootstrap_servers,
        value_serializer=lambda v: json.dumps(v, default=str).encode("utf-8"),
    )

    await producer.start()

    try:
        yield producer
    finally:
        await producer.stop()


class Container(DeclarativeContainer):
    wiring_config = WiringConfiguration(packages=["app.handlers"], auto_wire=True)

    __self__ = Self()

    logger = Resource(provides=setup_logger)
    settings = Singleton(provides=get_settings)
    db_engine = Resource(provides=db_engine_manager, settings=settings.provided)
    kafka_producer = Resource(provides=kafka_producer_manager, settings=settings.provided)
    event_producer = Singleton(EventProducer, producer=kafka_producer.provided)

    users_repo = Singleton(UsersRepo, engine=db_engine.provided)
    auth_service = Singleton(
        AuthService,
        users_repo=users_repo,
        settings=settings,
        event_producer=event_producer,
    )
    users_service = Singleton(
        UsersService,
        users_repo=users_repo,
        auth_service=auth_service,
        event_producer=event_producer,
    )

    lifespan = Singleton(provides=Lifespan, container=__self__)
    app = Singleton(provides=FastAPI, version=__version__, lifespan=lifespan)
