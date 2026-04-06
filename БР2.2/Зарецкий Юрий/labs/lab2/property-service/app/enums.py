from enum import StrEnum


class Env(StrEnum):
    LOCAL = "local"
    STAGING = "staging"
    PRODUCTION = "production"


class LogMode(StrEnum):
    PRETTY = "pretty"
    JSON = "json"


class PropertyType(StrEnum):
    FLAT = "flat"
    ROOM = "room"
    HOUSE = "house"


class DealStatus(StrEnum):
    REQUESTED = "requested"
    APPROVED = "approved"
    CANCELLED = "cancelled"
