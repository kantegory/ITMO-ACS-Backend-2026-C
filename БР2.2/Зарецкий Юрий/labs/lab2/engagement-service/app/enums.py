from enum import StrEnum


class Env(StrEnum):
    LOCAL = "local"
    STAGING = "staging"
    PRODUCTION = "production"


class LogMode(StrEnum):
    PRETTY = "pretty"
    JSON = "json"
