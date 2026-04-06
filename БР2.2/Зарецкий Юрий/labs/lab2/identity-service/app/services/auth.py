import hashlib
from datetime import UTC, datetime, timedelta
from typing import cast

import bcrypt
import structlog
from jose import JWTError, jwt

from app.consts import OAUTH2_TOKEN_TYPE
from app.db.users import User, UsersRepo
from app.schemas.requests import LoginRequest, RefreshTokenRequest, RegisterRequest
from app.schemas.responses import AuthResponse, TokensResponse, UserResponse
from app.services.errors import EmailAlreadyRegisteredError, InvalidCredentialsError, InvalidTokenError
from app.settings import Settings

logger = structlog.get_logger()

BCRYPT_ROUNDS = 12
BCRYPT_LEGACY_UTF8_PREFIX_LEN = 72


class AuthService:
    def __init__(self, users_repo: UsersRepo, settings: Settings) -> None:
        self._users_repo = users_repo
        self._settings = settings

    def hash_password(self, password: str) -> str:
        salt = bcrypt.gensalt(rounds=BCRYPT_ROUNDS)
        key = hashlib.sha256(password.encode("utf-8")).digest()
        digest = bcrypt.hashpw(key, salt)

        return digest.decode("utf-8")

    def verify_password(self, plain: str, password_hash: str) -> bool:
        encoded = password_hash.encode("utf-8")
        key = hashlib.sha256(plain.encode("utf-8")).digest()

        if bcrypt.checkpw(key, encoded):
            return True

        legacy = plain.encode("utf-8")[:BCRYPT_LEGACY_UTF8_PREFIX_LEN]

        return bool(bcrypt.checkpw(legacy, encoded))

    def _create_access_token(self, user_id: int) -> str:
        expire = datetime.now(UTC) + timedelta(seconds=self._settings.jwt_access_token_lifetime)
        payload = {"sub": str(user_id), "exp": int(expire.timestamp()), "type": "access"}

        return cast("str", jwt.encode(payload, self._settings.jwt_secret_key, algorithm="HS256"))

    def _create_refresh_token(self, user_id: int) -> str:
        expire = datetime.now(UTC) + timedelta(seconds=self._settings.jwt_refresh_token_lifetime)
        payload = {"sub": str(user_id), "exp": int(expire.timestamp()), "type": "refresh"}

        return cast("str", jwt.encode(payload, self._settings.jwt_secret_key, algorithm="HS256"))

    def validate_access_token(self, token: str) -> int:
        try:
            payload = jwt.decode(token, self._settings.jwt_secret_key, algorithms=["HS256"])
        except JWTError:
            logger.info("Отклонён некорректный access-токен")

            raise InvalidTokenError from None

        if payload.get("type") != "access":
            raise InvalidTokenError

        sub = payload.get("sub")

        if sub is None:
            raise InvalidTokenError

        return int(sub)

    def _build_auth_response(self, user: User) -> AuthResponse:
        access = self._create_access_token(user.id)
        refresh = self._create_refresh_token(user.id)
        tokens = TokensResponse(access_token=access, refresh_token=refresh, token_type=OAUTH2_TOKEN_TYPE)

        return AuthResponse(tokens=tokens, user=UserResponse.model_validate(user))

    async def register(self, data: RegisterRequest) -> AuthResponse:
        existing = await self._users_repo.get_by_email(str(data.email))

        if existing is not None:
            logger.info("Попытка регистрации с занятым email", email=str(data.email))

            raise EmailAlreadyRegisteredError

        password_hash = self.hash_password(data.password)
        user = await self._users_repo.create(
            email=str(data.email),
            full_name=data.full_name,
            password_hash=password_hash,
            phone=data.phone,
        )

        logger.info("Зарегистрирован пользователь", user_id=user.id)

        return self._build_auth_response(user)

    async def login(self, data: LoginRequest) -> AuthResponse:
        user = await self._users_repo.get_by_email(str(data.email))

        if user is None or not self.verify_password(data.password, user.password_hash):
            logger.info("Неудачная попытка входа", email=str(data.email))

            raise InvalidCredentialsError

        logger.info("Успешный вход", user_id=user.id)

        return self._build_auth_response(user)

    async def refresh(self, data: RefreshTokenRequest) -> TokensResponse:
        try:
            payload = jwt.decode(
                data.refresh_token,
                self._settings.jwt_secret_key,
                algorithms=["HS256"],
            )
        except JWTError:
            logger.info("Отклонён некорректный refresh-токен")

            raise InvalidTokenError from None

        if payload.get("type") != "refresh":
            raise InvalidTokenError

        sub = payload.get("sub")

        if sub is None:
            raise InvalidTokenError

        user_id = int(sub)
        user = await self._users_repo.get_by_id(user_id)

        if user is None or user.id is None:
            logger.info("Refresh-токен для несуществующего пользователя", user_id=user_id)

            raise InvalidTokenError

        access = self._create_access_token(user.id)
        new_refresh = self._create_refresh_token(user.id)

        logger.info("Обновлена пара токенов", user_id=user.id)

        return TokensResponse(access_token=access, refresh_token=new_refresh, token_type=OAUTH2_TOKEN_TYPE)
