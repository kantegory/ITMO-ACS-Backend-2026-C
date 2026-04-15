import structlog

from app.db.comforts import ComfortsRepo
from app.schemas.requests import CreateComfortRequest, UpdateComfortRequest
from app.schemas.responses import ComfortResponse
from app.services.errors import ComfortNotFoundError

logger = structlog.get_logger()


class ComfortsService:
    def __init__(self, comforts_repo: ComfortsRepo) -> None:
        self._comforts_repo = comforts_repo

    async def list_all(self) -> list[ComfortResponse]:
        rows = await self._comforts_repo.list_all_ordered()

        return [ComfortResponse.model_validate(r) for r in rows]

    async def get_by_id(self, comfort_id: int) -> ComfortResponse:
        comfort = await self._comforts_repo.get_by_id(comfort_id)

        if comfort is None:
            raise ComfortNotFoundError

        return ComfortResponse.model_validate(comfort)

    async def create(self, data: CreateComfortRequest) -> ComfortResponse:
        comfort = await self._comforts_repo.create(name=data.name, icon=data.icon)
        logger.info("Создано удобство", comfort_id=comfort.id)

        return ComfortResponse.model_validate(comfort)

    async def update(self, comfort_id: int, data: UpdateComfortRequest) -> ComfortResponse:
        comfort = await self._comforts_repo.update(comfort_id, name=data.name, icon=data.icon)

        if comfort is None:
            raise ComfortNotFoundError

        logger.info("Обновлено удобство", comfort_id=comfort_id)

        return ComfortResponse.model_validate(comfort)

    async def delete(self, comfort_id: int) -> None:
        deleted = await self._comforts_repo.delete(comfort_id)

        if not deleted:
            raise ComfortNotFoundError

        logger.info("Удалено удобство", comfort_id=comfort_id)
