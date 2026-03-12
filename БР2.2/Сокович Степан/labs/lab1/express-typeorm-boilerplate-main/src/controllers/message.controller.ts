import {
    Body,
    ForbiddenError,
    NotFoundError,
    Param,
    Patch,
    Req,
    UseBefore,
} from 'routing-controllers';
import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { Message } from '../models/message.entity';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import { UpdateMessageDto } from '../dto/chat.dto';

@EntityController({
    baseRoute: '/messages',
    entity: Message,
})
class MessageController extends BaseController {
    @Patch('/:id')
    @UseBefore(authMiddleware)
    async update(
        @Param('id') id: number,
        @Body({ type: UpdateMessageDto }) payload: UpdateMessageDto,
        @Req() request: RequestWithUser,
    ) {
        const message = (await this.repository.findOneBy({ id })) as Message | null;
        if (!message) {
            throw new NotFoundError('Message is not found');
        }
        if (message.sentBy !== request.user.id) {
            throw new ForbiddenError('Only author can edit message');
        }

        message.text = payload.text;
        message.edited = true;
        return await this.repository.save(message);
    }
}

export default MessageController;
