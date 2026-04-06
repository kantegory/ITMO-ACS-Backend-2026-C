from typing import Annotated

from dependency_injector.wiring import Provide, inject
from fastapi import APIRouter, Depends, HTTPException
from starlette.status import HTTP_201_CREATED, HTTP_403_FORBIDDEN, HTTP_404_NOT_FOUND

from app.container import Container
from app.handlers.deps import get_current_user_id
from app.schemas.queries import MessagesQuery
from app.schemas.requests import SendMessageRequest
from app.schemas.responses import MarkReadResponse, MessageListResponse, MessageResponse
from app.services.errors import ConversationAccessDeniedError, ConversationNotFoundError
from app.services.messages import MessagesService

router = APIRouter(prefix="/api/conversations/{conversation_id}/messages", tags=["Сообщения"])


@router.get("", summary="Сообщения переписки")
@inject
async def list_messages(
    conversation_id: int,
    user_id: Annotated[int, Depends(get_current_user_id)],
    service: Annotated[MessagesService, Depends(Provide[Container.messages_service])],
    query: Annotated[MessagesQuery, Depends()],
) -> MessageListResponse:
    params = query.to_page_params()

    try:
        return await service.list_for_conversation(
            user_id,
            conversation_id,
            page=params.page,
            limit=params.limit,
        )
    except ConversationNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Переписка не найдена") from None
    except ConversationAccessDeniedError:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Нет доступа к переписке") from None


@router.post("", summary="Отправить сообщение", status_code=HTTP_201_CREATED)
@inject
async def send_message(
    conversation_id: int,
    body: SendMessageRequest,
    user_id: Annotated[int, Depends(get_current_user_id)],
    service: Annotated[MessagesService, Depends(Provide[Container.messages_service])],
) -> MessageResponse:
    try:
        return await service.send(user_id, conversation_id, body)
    except ConversationNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Переписка не найдена") from None
    except ConversationAccessDeniedError:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Нет доступа к переписке") from None


@router.post("/mark-read", summary="Пометить сообщения прочитанными")
@inject
async def mark_read(
    conversation_id: int,
    user_id: Annotated[int, Depends(get_current_user_id)],
    service: Annotated[MessagesService, Depends(Provide[Container.messages_service])],
) -> MarkReadResponse:
    try:
        marked = await service.mark_read(user_id, conversation_id)
    except ConversationNotFoundError:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail="Переписка не найдена") from None
    except ConversationAccessDeniedError:
        raise HTTPException(status_code=HTTP_403_FORBIDDEN, detail="Нет доступа к переписке") from None

    return MarkReadResponse(marked=marked)
