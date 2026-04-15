import asyncio
import contextlib
import json
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Protocol

import structlog
from aiokafka import AIOKafkaConsumer
from pydantic import ValidationError

from app.events.consts import IDENTITY_USER_EVENTS_TOPIC, USER_CREATED_EVENT, USER_UPDATED_EVENT
from app.events.schemas import IdentityUserCreatedPayload, IdentityUserUpdatedPayload, KafkaDomainEventEnvelope
from app.services.user_projection_kafka import UserProjectionKafkaService
from app.settings import Settings

logger = structlog.get_logger()


class ConsumedKafkaMessage(Protocol):
    topic: str
    partition: int
    offset: int
    value: object | None


async def _handle_identity_user_event(
    envelope: KafkaDomainEventEnvelope,
    *,
    partition: int,
    offset: int,
    projection_service: UserProjectionKafkaService,
) -> None:
    if envelope.event_type == USER_CREATED_EVENT:
        created = IdentityUserCreatedPayload.model_validate(envelope.payload)
        await projection_service.apply_user_created(created)

        return

    if envelope.event_type == USER_UPDATED_EVENT:
        updated = IdentityUserUpdatedPayload.model_validate(envelope.payload)
        await projection_service.apply_user_updated(updated)

        return

    logger.warning(
        "Неизвестный тип события в топике identity.user.events",
        topic=IDENTITY_USER_EVENTS_TOPIC,
        partition=partition,
        offset=offset,
        event_type=envelope.event_type,
    )


async def _process_property_message(
    msg: ConsumedKafkaMessage,
    *,
    projection_service: UserProjectionKafkaService,
) -> None:
    raw = msg.value

    if not isinstance(raw, dict):
        logger.warning(
            "Некорректное тело сообщения Kafka: ожидается объект JSON (property-service)",
            topic=msg.topic,
            partition=msg.partition,
            offset=msg.offset,
        )

        return

    try:
        envelope = KafkaDomainEventEnvelope.model_validate(raw)
    except ValidationError:
        logger.warning(
            "Некорректная структура конверта события Kafka (property-service)",
            topic=msg.topic,
            partition=msg.partition,
            offset=msg.offset,
        )

        return

    try:
        if msg.topic == IDENTITY_USER_EVENTS_TOPIC:
            await _handle_identity_user_event(
                envelope,
                partition=msg.partition,
                offset=msg.offset,
                projection_service=projection_service,
            )

            return

        logger.warning(
            "Неизвестный топик Kafka (property-service)",
            topic=msg.topic,
            partition=msg.partition,
            offset=msg.offset,
        )
    except ValidationError:
        logger.warning(
            "Некорректный payload доменного события (property-service)",
            topic=msg.topic,
            partition=msg.partition,
            offset=msg.offset,
            event_type=envelope.event_type,
        )
    except Exception:
        logger.exception(
            "Ошибка обработки сообщения Kafka (property-service)",
            topic=msg.topic,
            partition=msg.partition,
            offset=msg.offset,
            event_type=envelope.event_type,
        )


async def _consume_identity_user_events(
    consumer: AIOKafkaConsumer,
    *,
    projection_service: UserProjectionKafkaService,
) -> None:
    async for msg in consumer:
        if msg.value is None:
            continue

        await _process_property_message(msg, projection_service=projection_service)


@asynccontextmanager
async def kafka_user_events_consumer_resource(
    settings: Settings,
    projection_service: UserProjectionKafkaService,
) -> AsyncIterator[None]:
    consumer = AIOKafkaConsumer(
        IDENTITY_USER_EVENTS_TOPIC,
        bootstrap_servers=settings.kafka_bootstrap_servers,
        group_id="property-service-user-events",
        auto_offset_reset="earliest",
        enable_auto_commit=True,
        value_deserializer=lambda b: json.loads(b.decode("utf-8")),
    )
    await consumer.start()
    task = asyncio.create_task(
        _consume_identity_user_events(consumer, projection_service=projection_service),
    )

    try:
        yield
    finally:
        task.cancel()

        with contextlib.suppress(asyncio.CancelledError):
            await task

        await consumer.stop()
