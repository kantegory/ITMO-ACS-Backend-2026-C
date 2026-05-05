import {
    Body,
    Delete,
    Get,
    Param,
    Patch,
    Post
} from 'routing-controllers';

import { ObjectLiteral } from 'typeorm';
import BaseController from '../common/base-controller';
import EntityController from '../common/entity-controller';
import dataSource from '../config/data-source';
import { Chat } from '../models/chat.entity';
import { Message } from '../models/message.entity';
import { Property } from '../models/property.entity';

class CreateMessageDto {
    sender!: string;
    content!: string;
}

@EntityController({
    baseRoute: '/properties/:propertyId/chats',
    entity: Chat,
})
class ChatController extends BaseController {

    @Get('')
    async getAll(@Param('propertyId') propertyId: number) {
        return this.repository.find({
            where: { property: { id: propertyId } },
            relations: ['messages'],
        });
    }

    @Post('')
    async create(@Param('propertyId') propertyId: number) {
        const propertyRepo = dataSource.getRepository(Property);
        const property = await propertyRepo.findOneBy({ id: propertyId });
        if (!property) throw new Error('Property not found');

        const chat = this.repository.create({ property });
        return this.repository.save(chat);
    }

    @Get('/:chatId')
    async getById(
        @Param('propertyId') propertyId: number,
        @Param('chatId') chatId: number,
    ): Promise<ObjectLiteral> {
        const chat = await this.repository.findOne({
            where: { id: chatId, property: { id: propertyId } },
            relations: ['messages'],
        });
        if (!chat) throw new Error('Chat not found');
        return chat;
    }

    @Post('/:chatId/messages')
    async addMessage(
        @Param('propertyId') propertyId: number,
        @Param('chatId') chatId: number,
        @Body() body: CreateMessageDto,
    ) {
        const chat = await this.repository.findOne({
            where: { id: chatId, property: { id: propertyId } },
        });
        if (!chat) throw new Error('Chat not found');

        const messageRepo = dataSource.getRepository(Message);
        const message = messageRepo.create({ ...body, chat });
        return messageRepo.save(message);
    }

    @Delete('/:chatId/messages/:messageId')
    async removeMessage(
        @Param('propertyId') propertyId: number,
        @Param('chatId') chatId: number,
        @Param('messageId') messageId: number,
    ) {
        const chat = await this.repository.findOne({
            where: { id: chatId, property: { id: propertyId } },
        });
        if (!chat) throw new Error('Chat not found');

        const messageRepo = dataSource.getRepository(Message);
        const message = await messageRepo.findOne({
            where: { id: messageId, chat: { id: chatId } },
        });
        if (!message) throw new Error('Message not found');
        return messageRepo.remove(message);
    }

    @Delete('/:chatId')
    async remove(
        @Param('propertyId') propertyId: number,
        @Param('chatId') chatId: number,
    ) {
        const chat = await this.repository.findOne({
            where: { id: chatId, property: { id: propertyId } },
        });
        if (!chat) throw new Error('Chat not found');
        return this.repository.remove(chat);
    }
}

export default ChatController;