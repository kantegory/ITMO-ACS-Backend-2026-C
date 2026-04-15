from typing import Annotated

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException, Response
from starlette.status import (
    HTTP_201_CREATED,
    HTTP_204_NO_CONTENT,
    HTTP_400_BAD_REQUEST,
    HTTP_403_FORBIDDEN,
    HTTP_404_NOT_FOUND,
    HTTP_502_BAD_GATEWAY,
)

from app.container import Container
from app.handlers.deps import get_current_user_id
from app.schemas.queries import PaginationQuery
from app.schemas.requests import CreateConversationRequest
from app.schemas.responses import ConversationListResponse, ConversationResponse, UnreadCountResponse
from app.services.conversations import ConversationsService
from app.services.errors import (
    ConversationAccessDeniedError,
    ConversationNotFoundError,
    ExternalServiceError,
    PropertyNotFoundError,
    PropertyUnavailableForEngagementError,
    SelfConversationError,
    UserNotFoundError,
)

router = APIRouter(prefix="/api/conversations", tags=["Переписки"])


@router.get("", summary="Список переписок пользователя")
@inject
async def list_conversations(
    user_id: Annotated[int, Depends(get_current_user_id)],
    service: Annotated[ConversationsService, Depends(Provide[Container.conversations_service])],
    query: Annotated[PaginationQuery, Depends()],
) -> ConversationListResponse:
    params = query.to_page_params()

    return await service.list_for_user(user_id, page=params.page, limit=params.limit)


@router.get("/unread-count", summary="Количество непрочитанных сообщений")
@inject
async def unread_count(
    user_id: Annotated[int, Depends(get_current_user_id)],
    service: Annotated[ConversationsService, Depends(Provide[Container.conversations_service])],
) -> UnreadCountResponse:
    count = await service.get_unread_count(user_id)

    return UnreadCountResponse(count=count)


@router.post("", summary="Создать или продолжить переписку", status_code=HTTP_201_CREATED)
@inject
async def create_conversation(
    body: CreateConversationRequest,
    user_id: Annotated[int, Depends(get_current_user_id)],
    service: Annotated[ConversationsService, Depends(Provide[Container.conversations_service])],
) -> ConversationResponse:
    try:
        return await service.create(user_id, body)
    except SelfConversationError:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="Нельзя создать переписку с самим собой",
        ) from None
    except PropertyNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Объект не найден") from None
    except PropertyUnavailableForEngagementError:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="Объект недоступен для переписки",
        ) from None
    except UserNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Пользователь не найден") from None
    except ExternalServiceError:
        raise HTTPException(status_code=HTTP_502_BAD_GATEWAY, detail="Сервис недоступен") from None


@router.get("/{conversation_id}", summary="Детали переписки")
@inject
async def get_conversation(
    conversation_id: int,
    user_id: Annotated[int, Depends(get_current_user_id)],
    service: Annotated[ConversationsService, Depends(Provide[Container.conversations_service])],
) -> ConversationResponse:
    try:
        return await service.get_by_id(user_id, conversation_id)
    except ConversationNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Переписка не найдена") from None
    except ConversationAccessDeniedError:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Нет доступа к переписке") from None


@router.delete("/{conversation_id}", summary="Удалить переписку", status_code=HTTP_204_NO_CONTENT)
@inject
async def delete_conversation(
    conversation_id: int,
    user_id: Annotated[int, Depends(get_current_user_id)],
    service: Annotated[ConversationsService, Depends(Provide[Container.conversations_service])],
) -> Response:
    try:
        await service.delete(user_id, conversation_id)
    except ConversationNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Переписка не найдена") from None
    except ConversationAccessDeniedError:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Нет доступа к переписке") from None

    return Response(status_code=HTTP_204_NO_CONTENT)
