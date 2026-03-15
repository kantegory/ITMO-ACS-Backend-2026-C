import { Body, HttpError, Param, Patch } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import EntityController from '../../common/entity-controller';
import BaseController from '../../common/base-controller';
import { Message } from '../../models/message.entity';

import { ErrorResponseDto, MessageResponseDto, UpdateMessageDto } from './dto';

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
        @Body() body: UpdateMessageDto,
    ): Promise<MessageResponseDto> {
        const message = await this.repository.findOneBy({ id: String(id) }) as Message | null;
        if (!message) {
            throw new HttpError(404, 'Message not found');
        }

        message.text = body.text;
        message.edited = true;

        const updatedMessage = await this.repository.save(message) as Message;

        return {
            id: updatedMessage.id,
            createdAt: updatedMessage.createdAt,
            text: updatedMessage.text,
            sentBy: updatedMessage.sentBy,
            status: updatedMessage.status,
            edited: updatedMessage.edited,
            chatId: updatedMessage.chatId,
        };
    }
}

export default MessagesController;
