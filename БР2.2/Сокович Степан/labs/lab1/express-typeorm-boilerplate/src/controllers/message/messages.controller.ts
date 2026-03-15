import { Body, HttpError, Param, Patch } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import EntityController from '../../common/entity-controller';
import BaseController from '../../common/base-controller';
import { Message, MessageStatus } from '../../models/message.entity';
import { ApiMessageStatus } from '../chat/dto';

import { ErrorResponseDto, MessageResponseDto, UpdateMessageDto } from './dto';

const modelToApiMessageStatus: Record<MessageStatus, ApiMessageStatus> = {
    [MessageStatus.SENT]: ApiMessageStatus.SENT,
    [MessageStatus.RECEIVED]: ApiMessageStatus.RECEIVED,
    [MessageStatus.READ]: ApiMessageStatus.READ,
};

@EntityController({
    baseRoute: '/messages',
    entity: Message,
})
class MessagesController extends BaseController {
    @Patch('/:id')
    @OpenAPI({ summary: 'Редактировать текст сообщения' })
    @ResponseSchema(MessageResponseDto, { statusCode: 200 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 400 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 404 })
    async patchMessage(
        @Param('id') id: number,
        @Body({ type: UpdateMessageDto }) body: UpdateMessageDto,
    ): Promise<MessageResponseDto> {
        const message = await this.repository.findOneBy({ id: String(id) }) as Message | null;
        if (!message) {
            throw new HttpError(404, 'Сообщение не найдено');
        }

        message.text = body.text;
        message.edited = true;

        const updatedMessage = await this.repository.save(message) as Message;

        return {
            id: Number(updatedMessage.id),
            createdAt: updatedMessage.createdAt,
            text: updatedMessage.text,
            sentBy: Number(updatedMessage.sentBy),
            status: modelToApiMessageStatus[updatedMessage.status],
            edited: updatedMessage.edited,
            chatId: Number(updatedMessage.chatId),
        };
    }
}

export default MessagesController;
