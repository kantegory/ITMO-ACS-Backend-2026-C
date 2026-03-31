import { AppDataSource } from "../config/data-source";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../errors/http-errors";
import { Booking } from "../models/Booking";
import { Chat } from "../models/Chat";
import { Property } from "../models/Property";

interface CreateChatInput {
  propertyId: number;
  bookingId?: number;
}

export class ChatsService {
  private chatRepository = AppDataSource.getRepository(Chat);
  private propertyRepository = AppDataSource.getRepository(Property);
  private bookingRepository = AppDataSource.getRepository(Booking);

  async create(data: CreateChatInput, userId: number, userRole: string) {
    const { propertyId, bookingId } = data;

    const property = await this.propertyRepository.findOne({
      where: { id: propertyId },
    });

    if (!property) {
      throw new NotFoundError("Объект недвижимости не найден");
    }

    const ownerId = property.ownerId;

    if (bookingId !== undefined) {
      const booking = await this.bookingRepository.findOne({
        where: { id: bookingId },
      });

      if (!booking) {
        throw new NotFoundError("Бронирование не найдено");
      }

      if (booking.propertyId !== propertyId) {
        throw new BadRequestError("Бронирование не относится к указанному объекту недвижимости");
      }

      const occupierId = booking.occupierId;
      const isOwner = ownerId === userId;
      const isOccupier = occupierId === userId;
      const isAdmin = userRole === "ADMIN";

      if (!isOwner && !isOccupier && !isAdmin) {
        throw new ForbiddenError("У вас нет прав на создание чата для этого бронирования");
      }

      const existingChat = await this.chatRepository.findOne({
        where: { bookingId },
      });

      if (existingChat) {
        throw new ConflictError("Чат для этого бронирования уже существует");
      }

      const chat = this.chatRepository.create({
        ownerId,
        occupierId,
        propertyId,
        bookingId,
        lastMessageAt: new Date(),
      });

      return this.chatRepository.save(chat);
    }

    const occupierId = userId;

    if (ownerId === occupierId) {
      throw new BadRequestError("Нельзя создать чат с самим собой по собственному объекту");
    }

    const existingChatWithoutBooking = await this.chatRepository.findOne({
      where: {
        ownerId,
        occupierId,
        propertyId,
        bookingId: null as never,
      },
    });

    if (existingChatWithoutBooking) {
      throw new ConflictError("Чат по этому объекту уже существует");
    }

    const chat = this.chatRepository.create({
      ownerId,
      occupierId,
      propertyId,
      bookingId: null as never,
      lastMessageAt: new Date(),
    });

    return this.chatRepository.save(chat);
  }

  async getMy(
    userId: number,
    filters: {
      propertyId?: number;
      bookingId?: number;
    }
  ) {
    const queryBuilder = this.chatRepository.createQueryBuilder("chat");

    queryBuilder.where("chat.owner_id = :userId OR chat.occupier_id = :userId", {
      userId,
    });

    if (filters.propertyId !== undefined) {
      queryBuilder.andWhere("chat.property_id = :propertyId", {
        propertyId: filters.propertyId,
      });
    }

    if (filters.bookingId !== undefined) {
      queryBuilder.andWhere("chat.booking_id = :bookingId", {
        bookingId: filters.bookingId,
      });
    }

    queryBuilder.orderBy("chat.id", "ASC");

    return queryBuilder.getMany();
  }

  async getById(id: number, userId: number, userRole: string) {
    const chat = await this.chatRepository.findOne({
      where: { id },
    });

    if (!chat) {
      throw new NotFoundError("Чат не найден");
    }

    const isOwner = chat.ownerId === userId;
    const isOccupier = chat.occupierId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isOwner && !isOccupier && !isAdmin) {
      throw new ForbiddenError("У вас нет доступа к этому чату");
    }

    return chat;
  }

  async getAllForAdmin(
    userRole: string,
    filters: {
      propertyId?: number;
      userId?: number;
    }
  ) {
    if (userRole !== "ADMIN") {
      throw new ForbiddenError("Только администратор может просматривать все чаты");
    }

    const queryBuilder = this.chatRepository.createQueryBuilder("chat");

    if (filters.propertyId !== undefined) {
      queryBuilder.andWhere("chat.property_id = :propertyId", {
        propertyId: filters.propertyId,
      });
    }

    if (filters.userId !== undefined) {
      queryBuilder.andWhere(
        "(chat.owner_id = :userId OR chat.occupier_id = :userId)",
        { userId: filters.userId }
      );
    }

    queryBuilder.orderBy("chat.id", "ASC");

    return queryBuilder.getMany();
  }
}

export const chatsService = new ChatsService();
