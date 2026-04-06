from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import httpx
from dependency_injector.containers import DeclarativeContainer, WiringConfiguration
from dependency_injector.ext.starlette import Lifespan
from dependency_injector.providers import Resource, Self, Singleton
from fastapi import FastAPI
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from app.clients.identity import IdentityClient
from app.clients.property import PropertyClient
from app.db.conversations import ConversationsRepo
from app.db.messages import MessagesRepo
from app.db.reviews import ReviewsRepo
from app.logger import setup_logger
from app.services.conversations import ConversationsService
from app.services.messages import MessagesService
from app.services.reviews import ReviewsService
from app.settings import Settings, __version__, get_settings


@asynccontextmanager
async def db_engine_manager(settings: Settings) -> AsyncIterator[AsyncEngine]:
    engine = create_async_engine(url=settings.db_dsn)

    try:
        yield engine
    finally:
        await engine.dispose()


@asynccontextmanager
async def httpx_client_manager() -> AsyncIterator[httpx.AsyncClient]:
    timeout = httpx.Timeout(30.0)

    async with httpx.AsyncClient(timeout=timeout) as client:
        yield client


class Container(DeclarativeContainer):
    wiring_config = WiringConfiguration(packages=["app.handlers"], auto_wire=True)

    __self__ = Self()

    logger = Resource(provides=setup_logger)
    settings = Singleton(provides=get_settings)
    db_engine = Resource(provides=db_engine_manager, settings=settings.provided)
    http_client = Resource(provides=httpx_client_manager)

    identity_client = Singleton(IdentityClient, http_client=http_client.provided, settings=settings.provided)
    property_client = Singleton(PropertyClient, http_client=http_client.provided, settings=settings.provided)

    conversations_repo = Singleton(ConversationsRepo, engine=db_engine.provided)
    messages_repo = Singleton(MessagesRepo, engine=db_engine.provided)
    reviews_repo = Singleton(ReviewsRepo, engine=db_engine.provided)

    conversations_service = Singleton(
        ConversationsService,
        conversations_repo=conversations_repo,
        messages_repo=messages_repo,
        identity_client=identity_client,
        property_client=property_client,
    )
    messages_service = Singleton(
        MessagesService,
        messages_repo=messages_repo,
        conversations_repo=conversations_repo,
    )
    reviews_service = Singleton(
        ReviewsService,
        reviews_repo=reviews_repo,
        identity_client=identity_client,
        property_client=property_client,
    )

    lifespan = Singleton(provides=Lifespan, container=__self__)
    app = Singleton(provides=FastAPI, version=__version__, lifespan=lifespan)
