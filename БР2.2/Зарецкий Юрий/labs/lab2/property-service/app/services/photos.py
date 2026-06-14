import structlog

from app.db.photos import PhotosRepo
from app.db.properties import PropertiesRepo
from app.schemas.requests import CreatePhotoRequest, UpdatePhotoRequest
from app.schemas.responses import PhotoResponse
from app.services.errors import MaxPhotosExceededError, NotOwnerError, PhotoNotFoundError, PropertyNotFoundError

logger = structlog.get_logger()

MAX_PROPERTY_PHOTOS = 20


class PhotosService:
    def __init__(self, photos_repo: PhotosRepo, properties_repo: PropertiesRepo) -> None:
        self._photos_repo = photos_repo
        self._properties_repo = properties_repo

    async def list_photos(self, property_id: int) -> list[PhotoResponse]:
        prop = await self._properties_repo.get_by_id(property_id)

        if prop is None:
            raise PropertyNotFoundError

        rows = await self._photos_repo.list_by_property(property_id)

        return [PhotoResponse.model_validate(p) for p in rows]

    async def add_photo(self, user_id: int, property_id: int, data: CreatePhotoRequest) -> PhotoResponse:
        prop = await self._properties_repo.get_by_id(property_id)

        if prop is None:
            raise PropertyNotFoundError

        if prop.owner_id != user_id:
            raise NotOwnerError

        count = await self._photos_repo.count_by_property(property_id)

        if count >= MAX_PROPERTY_PHOTOS:
            raise MaxPhotosExceededError

        photo = await self._photos_repo.create(
            property_id=property_id,
            url=data.url,
            sort_order=data.sort_order,
            is_main=data.is_main,
        )

        logger.info("Добавлено фото", property_id=property_id, photo_id=photo.id)

        return PhotoResponse.model_validate(photo)

    async def update_photo(
        self,
        user_id: int,
        property_id: int,
        photo_id: int,
        data: UpdatePhotoRequest,
    ) -> PhotoResponse:
        prop = await self._properties_repo.get_by_id(property_id)

        if prop is None:
            raise PropertyNotFoundError

        if prop.owner_id != user_id:
            raise NotOwnerError

        photo = await self._photos_repo.update(
            photo_id,
            property_id,
            url=data.url,
            sort_order=data.sort_order,
            is_main=data.is_main,
        )

        if photo is None:
            raise PhotoNotFoundError

        logger.info("Обновлено фото", photo_id=photo_id, property_id=property_id)

        return PhotoResponse.model_validate(photo)

    async def delete_photo(self, user_id: int, property_id: int, photo_id: int) -> None:
        prop = await self._properties_repo.get_by_id(property_id)

        if prop is None:
            raise PropertyNotFoundError

        if prop.owner_id != user_id:
            raise NotOwnerError

        deleted = await self._photos_repo.delete(photo_id, property_id)

        if not deleted:
            raise PhotoNotFoundError

        logger.info("Удалено фото", photo_id=photo_id, property_id=property_id)
