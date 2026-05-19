import { AppDataSource } from "../config/data-source";
import { BadRequestError, ForbiddenError, NotFoundError } from "../errors/http-errors";
import { Chat } from "../models/Chat";
import { Message } from "../models/Message";

interface CreateMessageInput {
  chatId: number;
  content: string;
}

export class MessagesService {
  private messageRepository = AppDataSource.getRepository(Message);
  private chatRepository = AppDataSource.getRepository(Chat);

  private ensureChatAccess(chat: Chat, userId: number, userRole: string) {
    const isOwner = chat.ownerId === userId;
    const isOccupier = chat.occupierId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isOwner && !isOccupier && !isAdmin) {
      throw new ForbiddenError("У вас нет доступа к этому чату");
    }
  }

  async create(data: CreateMessageInput, userId: number, userRole: string) {
    const { chatId, content } = data;

    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundError("Чат не найден");
    }

    this.ensureChatAccess(chat, userId, userRole);

    if (!content || !content.trim()) {
      throw new BadRequestError("Сообщение не может быть пустым");
    }

    const message = this.messageRepository.create({
      chatId,
      senderId: userId,
      content: content.trim(),
      isRead: false,
    });

    const savedMessage = await this.messageRepository.save(message);

    chat.lastMessageAt = new Date();
    await this.chatRepository.save(chat);

    return savedMessage;
  }

  async getByChatId(
    chatId: number,
    userId: number,
    userRole: string,
    page = 1,
    pageSize = 10
  ) {
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundError("Чат не найден");
    }

    this.ensureChatAccess(chat, userId, userRole);

    const normalizedPage = Math.max(page, 1);
    const normalizedPageSize = Math.min(Math.max(pageSize, 1), 100);
    const skip = (normalizedPage - 1) * normalizedPageSize;

    const [items, total] = await this.messageRepository.findAndCount({
      where: { chatId },
      order: {
        id: "ASC",
      },
      skip,
      take: normalizedPageSize,
    });

    return {
      items,
      total,
      page: normalizedPage,
      pageSize: normalizedPageSize,
    };
  }

  async markAsRead(id: number, userId: number, userRole: string) {
    const message = await this.messageRepository.findOne({
      where: { id },
    });

    if (!message) {
      throw new NotFoundError("Сообщение не найдено");
    }

    this.ensureChatAccess(message.chat, userId, userRole);

    if (message.senderId === userId) {
      throw new BadRequestError("Нельзя пометить как прочитанное собственное сообщение");
    }

    if (message.isRead) {
      return message;
    }

    message.isRead = true;
    message.readAt = new Date();

    return this.messageRepository.save(message);
  }
}

export const messagesService = new MessagesService();
