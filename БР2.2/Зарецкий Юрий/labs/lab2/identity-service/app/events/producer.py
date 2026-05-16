from datetime import UTC, datetime
from typing import Any

from aiokafka import AIOKafkaProducer


class EventProducer:
    def __init__(self, producer: AIOKafkaProducer) -> None:
        self._producer = producer

    async def send(self, *, topic: str, event_type: str, payload: dict[str, Any]) -> None:
        message = {
            "event_type": event_type,
            "timestamp": datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            "payload": payload,
        }

        await self._producer.send_and_wait(topic, value=message)
