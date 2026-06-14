import json
import logging
from collections.abc import Callable, Mapping, MutableMapping
from typing import Any

from structlog import PrintLogger, configure
from structlog.contextvars import merge_contextvars
from structlog.dev import ConsoleRenderer
from structlog.processors import (
    EventRenamer,
    ExceptionRenderer,
    JSONRenderer,
    StackInfoRenderer,
    TimeStamper,
    UnicodeDecoder,
)
from structlog.stdlib import LoggerFactory, ProcessorFormatter, add_log_level, filter_by_level
from structlog.types import Processor

from app.enums import LogMode
from app.settings import get_settings

settings = get_settings()

shared_processors: list[Processor] = [
    merge_contextvars,
    add_log_level,
    TimeStamper(fmt="iso"),
    StackInfoRenderer(),
    ExceptionRenderer(),
    UnicodeDecoder(),
]


def get_renderer() -> list[Callable[[Any, str, Any], Any]]:
    if settings.log_mode == LogMode.JSON:
        return [
            EventRenamer(to="log"),
            JSONRenderer(ensure_ascii=False),
        ]

    return [ConsoleRenderer()]


def setup_logger() -> None:
    configure(
        processors=[
            *shared_processors,
            filter_by_level,
            ProcessorFormatter.wrap_for_formatter,
        ],
        context_class=dict,
        logger_factory=LoggerFactory(),
    )

    handler = logging.StreamHandler()
    handler.setFormatter(fmt=JsonFormatter())

    log_level_upper = settings.log_level.upper()
    misc_log_level = logging.INFO if settings.log_level.lower() == "debug" else log_level_upper

    root_logger = logging.getLogger()
    root_logger.addHandler(handler)
    root_logger.setLevel(log_level_upper)

    uv_logger = logging.getLogger("uvicorn")
    uv_logger.addHandler(handler)
    uv_logger.setLevel(misc_log_level)
    uv_logger.propagate = False


class JsonFormatter(ProcessorFormatter):
    def __init__(self, *args: Any, **kwargs: Any) -> None:  # noqa: ARG002 ANN401
        super().__init__(
            foreign_pre_chain=shared_processors,
            processors=[
                ProcessorFormatter.remove_processors_meta,
                flatten_processor,
                *get_renderer(),
            ],
        )


def flatten_processor(
    logger: PrintLogger,  # noqa: ARG001
    method_name: str,  # noqa: ARG001
    event_dict: MutableMapping[str, Any],
) -> Mapping[str, Any]:
    def flatten(
        event_dict: MutableMapping[str, Any],
        flatten_dict: dict[str, Any],
        depth: int = 1,
        depth_limit: int = 2,
    ) -> MutableMapping[str, Any]:
        for key, value in event_dict.items():
            if isinstance(value, dict) and depth < depth_limit:
                flatten(
                    event_dict={
                        f"{key}__{sub_key}": sub_value for sub_key, sub_value in value.items()
                    },
                    flatten_dict=flatten_dict,
                    depth=depth + 1,
                )
            elif isinstance(value, dict):
                flatten_dict[key] = json.dumps(obj=value, ensure_ascii=False)
            else:
                flatten_dict[key] = value

        return flatten_dict

    return flatten(event_dict=event_dict, flatten_dict={})
