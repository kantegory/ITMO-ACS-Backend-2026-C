import asyncio
import contextlib
import json
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Protocol

import structlog
from aiokafka import AIOKafkaConsumer
from pydantic import ValidationError

from app.events.consts import (
    DEAL_CREATED_EVENT,
    DEAL_STATUS_CHANGED_EVENT,
    IDENTITY_USER_EVENTS_TOPIC,
    PROPERTY_CREATED_EVENT,
    PROPERTY_DELETED_EVENT,
    PROPERTY_UPDATED_EVENT,
    RENTAL_DEAL_EVENTS_TOPIC,
    RENTAL_PROPERTY_EVENTS_TOPIC,
    USER_CREATED_EVENT,
    USER_UPDATED_EVENT,
)
from app.events.schemas import (
    DealCreatedPayload,
    DealStatusChangedPayload,
    KafkaDomainEventEnvelope,
    PropertyCreatedPayload,
    PropertyDeletedPayload,
    PropertyUpdatedPayload,
    UserCreatedPayload,
    UserUpdatedPayload,
)
from app.services.kafka_projection import EngagementKafkaProjectionService
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
) -> None:
    if envelope.event_type == USER_CREATED_EVENT:
        created = UserCreatedPayload.model_validate(envelope.payload)

        logger.info(
            "Зафиксировано событие пользователя (engagement-service, без локальной проекции)",
            topic=IDENTITY_USER_EVENTS_TOPIC,
            partition=partition,
            offset=offset,
            event_type=envelope.event_type,
            user_id=created.user_id,
        )

        return

    if envelope.event_type == USER_UPDATED_EVENT:
        updated = UserUpdatedPayload.model_validate(envelope.payload)

        logger.info(
            "Зафиксировано событие пользователя (engagement-service, без локальной проекции)",
            topic=IDENTITY_USER_EVENTS_TOPIC,
            partition=partition,
            offset=offset,
            event_type=envelope.event_type,
            user_id=updated.user_id,
        )

        return

    logger.warning(
        "Неизвестный тип события в топике identity.user.events",
        topic=IDENTITY_USER_EVENTS_TOPIC,
        partition=partition,
        offset=offset,
        event_type=envelope.event_type,
    )


async def _handle_rental_property_event(
    envelope: KafkaDomainEventEnvelope,
    *,
    partition: int,
    offset: int,
    projection_service: EngagementKafkaProjectionService,
) -> None:
    if envelope.event_type == PROPERTY_CREATED_EVENT:
        created = PropertyCreatedPayload.model_validate(envelope.payload)
        await projection_service.apply_property_created(created)

        return

    if envelope.event_type == PROPERTY_UPDATED_EVENT:
        updated = PropertyUpdatedPayload.model_validate(envelope.payload)
        await projection_service.apply_property_updated(updated)

        return

    if envelope.event_type == PROPERTY_DELETED_EVENT:
        deleted = PropertyDeletedPayload.model_validate(envelope.payload)
        await projection_service.apply_property_deleted(deleted)

        return

    logger.warning(
        "Неизвестный тип события в топике rental.property.events",
        topic=RENTAL_PROPERTY_EVENTS_TOPIC,
        partition=partition,
        offset=offset,
        event_type=envelope.event_type,
    )


async def _handle_rental_deal_event(
    envelope: KafkaDomainEventEnvelope,
    *,
    partition: int,
    offset: int,
    projection_service: EngagementKafkaProjectionService,
) -> None:
    if envelope.event_type == DEAL_CREATED_EVENT:
        created = DealCreatedPayload.model_validate(envelope.payload)
        await projection_service.apply_deal_created(created)

        return

    if envelope.event_type == DEAL_STATUS_CHANGED_EVENT:
        status_changed = DealStatusChangedPayload.model_validate(envelope.payload)
        await projection_service.apply_deal_status_changed(status_changed)

        return

    logger.warning(
        "Неизвестный тип события в топике rental.deal.events",
        topic=RENTAL_DEAL_EVENTS_TOPIC,
        partition=partition,
        offset=offset,
        event_type=envelope.event_type,
    )


async def _process_engagement_message(
    msg: ConsumedKafkaMessage,
    *,
    projection_service: EngagementKafkaProjectionService,
) -> None:
    raw = msg.value

    if not isinstance(raw, dict):
        logger.warning(
            "Некорректное тело сообщения Kafka: ожидается объект JSON (engagement-service)",
            topic=msg.topic,
            partition=msg.partition,
            offset=msg.offset,
        )

        return

    try:
        envelope = KafkaDomainEventEnvelope.model_validate(raw)
    except ValidationError:
        logger.warning(
            "Некорректная структура конверта события Kafka (engagement-service)",
            topic=msg.topic,
            partition=msg.partition,
            offset=msg.offset,
        )

        return

    try:
        if msg.topic == IDENTITY_USER_EVENTS_TOPIC:
            await _handle_identity_user_event(envelope, partition=msg.partition, offset=msg.offset)

            return

        if msg.topic == RENTAL_PROPERTY_EVENTS_TOPIC:
            await _handle_rental_property_event(
                envelope,
                partition=msg.partition,
                offset=msg.offset,
                projection_service=projection_service,
            )

            return

        if msg.topic == RENTAL_DEAL_EVENTS_TOPIC:
            await _handle_rental_deal_event(
                envelope,
                partition=msg.partition,
                offset=msg.offset,
                projection_service=projection_service,
            )

            return

        logger.warning(
            "Неизвестный топик Kafka (engagement-service)",
            topic=msg.topic,
            partition=msg.partition,
            offset=msg.offset,
        )
    except ValidationError:
        logger.warning(
            "Некорректный payload доменного события (engagement-service)",
            topic=msg.topic,
            partition=msg.partition,
            offset=msg.offset,
            event_type=envelope.event_type,
        )
    except Exception:
        logger.exception(
            "Ошибка обработки сообщения Kafka (engagement-service)",
            topic=msg.topic,
            partition=msg.partition,
            offset=msg.offset,
            event_type=envelope.event_type,
        )


async def _consume_engagement_topics(
    consumer: AIOKafkaConsumer,
    *,
    projection_service: EngagementKafkaProjectionService,
) -> None:
    async for msg in consumer:
        if msg.value is None:
            continue

        await _process_engagement_message(msg, projection_service=projection_service)


@asynccontextmanager
async def kafka_engagement_events_consumer_resource(
    settings: Settings,
    projection_service: EngagementKafkaProjectionService,
) -> AsyncIterator[None]:
    consumer = AIOKafkaConsumer(
        IDENTITY_USER_EVENTS_TOPIC,
        RENTAL_PROPERTY_EVENTS_TOPIC,
        RENTAL_DEAL_EVENTS_TOPIC,
        bootstrap_servers=settings.kafka_bootstrap_servers,
        group_id="engagement-service-events",
        auto_offset_reset="earliest",
        enable_auto_commit=True,
        value_deserializer=lambda b: json.loads(b.decode("utf-8")),
    )
    await consumer.start()
    task = asyncio.create_task(
        _consume_engagement_topics(consumer, projection_service=projection_service),
    )

    try:
        yield
    finally:
        task.cancel()

        with contextlib.suppress(asyncio.CancelledError):
            await task

        await consumer.stop()
