import asyncio
import contextlib
import json
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import structlog
from aiokafka import AIOKafkaConsumer

from app.events.consts import IDENTITY_USER_EVENTS_TOPIC
from app.settings import Settings

logger = structlog.get_logger()


async def _consume_identity_user_events(consumer: AIOKafkaConsumer) -> None:
    async for msg in consumer:
        if msg.value is None:
            continue

        try:
            logger.info(
                "Получено событие пользователя из Kafka (property-service)",
                topic=msg.topic,
                partition=msg.partition,
                offset=msg.offset,
                payload=msg.value,
            )
        except Exception:
            logger.exception("Ошибка обработки сообщения Kafka в property-service")


@asynccontextmanager
async def kafka_user_events_consumer_resource(settings: Settings) -> AsyncIterator[None]:
    consumer = AIOKafkaConsumer(
        IDENTITY_USER_EVENTS_TOPIC,
        bootstrap_servers=settings.kafka_bootstrap_servers,
        group_id="property-service-user-events",
        auto_offset_reset="earliest",
        enable_auto_commit=True,
        value_deserializer=lambda b: json.loads(b.decode("utf-8")),
    )
    await consumer.start()
    task = asyncio.create_task(_consume_identity_user_events(consumer))

    try:
        yield
    finally:
        task.cancel()

        with contextlib.suppress(asyncio.CancelledError):
            await task

        await consumer.stop()
