import { AppDataSource } from "../config/data-source";
import { BadRequestError, ForbiddenError, NotFoundError } from "../errors/http-errors";
import { Booking, BookingStatus } from "../models/Booking";
import { Property } from "../models/Property";

interface CreateBookingInput {
  propertyId: number;
  startDate: string;
  endDate: string;
  guestsCount: number;
  specialRequest?: string;
}

interface UpdateBookingInput {
  status?: BookingStatus;
  specialRequest?: string;
  cancellationReason?: string;
}

export class BookingsService {
  private bookingRepository = AppDataSource.getRepository(Booking);
  private propertyRepository = AppDataSource.getRepository(Property);

  async create(data: CreateBookingInput, occupierId: number) {
    const { propertyId, startDate, endDate, guestsCount, specialRequest } = data;

    const property = await this.propertyRepository.findOne({ where: { id: propertyId } });
    if (!property) {
      throw new NotFoundError("Объект недвижимости не найден");
    }

    if (!property.isAvailable) {
      throw new BadRequestError("Объект недвижимости недоступен для бронирования");
    }

    if (property.ownerId === occupierId) {
      throw new BadRequestError("Нельзя бронировать собственный объект недвижимости");
    }

    if (!Number.isInteger(guestsCount) || guestsCount <= 0) {
      throw new BadRequestError("Количество гостей должно быть больше 0");
    }

    if (guestsCount > property.maxGuests) {
      throw new BadRequestError("Количество гостей превышает допустимый лимит");
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestError("Некорректный формат даты");
    }

    if (start >= end) {
      throw new BadRequestError("Дата начала должна быть раньше даты окончания");
    }

    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < property.minRentDays) {
      throw new BadRequestError("Срок аренды меньше минимально допустимого");
    }

    if (diffDays > property.maxRentDays) {
      throw new BadRequestError("Срок аренды больше максимально допустимого");
    }

    const overlappingBookings = await this.bookingRepository
      .createQueryBuilder("booking")
      .where("booking.property_id = :propertyId", { propertyId })
      .andWhere("booking.status IN (:...statuses)", {
        statuses: [BookingStatus.PENDING, BookingStatus.CONFIRMED],
      })
      .andWhere(
        `
        booking.start_date < :endDate
        AND booking.end_date > :startDate
        `,
        { startDate, endDate }
      )
      .getCount();

    if (overlappingBookings > 0) {
      throw new BadRequestError("На выбранные даты объект уже забронирован");
    }

    const totalPrice = (diffDays * Number(property.pricePerDay)).toFixed(2);

    const booking = this.bookingRepository.create({
      propertyId,
      occupierId,
      startDate,
      endDate,
      totalPrice,
      status: BookingStatus.PENDING,
      guestsCount,
      specialRequest,
    });

    return this.bookingRepository.save(booking);
  }

  async getAll(filters: {
    propertyId?: number;
    status?: BookingStatus;
    startDate?: string;
    endDate?: string;
  }) {
    const qb = this.bookingRepository.createQueryBuilder("booking");

    if (filters.propertyId) {
      qb.andWhere("booking.property_id = :propertyId", { propertyId: filters.propertyId });
    }

    if (filters.status) {
      qb.andWhere("booking.status = :status", { status: filters.status });
    }

    if (filters.startDate) {
      qb.andWhere("booking.start_date >= :startDate", { startDate: filters.startDate });
    }

    if (filters.endDate) {
      qb.andWhere("booking.end_date <= :endDate", { endDate: filters.endDate });
    }

    qb.orderBy("booking.id", "ASC");
    return qb.getMany();
  }

  async getIncoming(ownerId: number, filters: { propertyId?: number; status?: BookingStatus }) {
    const qb = this.bookingRepository
      .createQueryBuilder("booking")
      .leftJoinAndSelect("booking.property", "property")
      .leftJoinAndSelect("booking.occupier", "occupier")
      .where("property.ownerId = :ownerId", { ownerId });

    if (filters.propertyId !== undefined) {
      qb.andWhere("booking.property_id = :propertyId", { propertyId: filters.propertyId });
    }

    if (filters.status !== undefined) {
      qb.andWhere("booking.status = :status", { status: filters.status });
    }

    qb.orderBy("booking.id", "ASC");
    return qb.getMany();
  }

  async getMy(occupierId: number) {
    return this.bookingRepository.find({
      where: { occupierId },
      order: { id: "ASC" },
    });
  }

  async getById(id: number, userId: number, userRole: string) {
    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) {
      throw new NotFoundError("Бронирование не найдено");
    }

    const isOccupier = booking.occupierId === userId;
    const isOwner = booking.property.ownerId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isOccupier && !isOwner && !isAdmin) {
      throw new ForbiddenError("У вас нет доступа к этому бронированию");
    }

    return booking;
  }

  async update(id: number, data: UpdateBookingInput, userId: number, userRole: string) {
    const { status, specialRequest, cancellationReason } = data;

    if (status === BookingStatus.CONFIRMED) {
      return this.confirm(id, userId, userRole);
    }

    if (status === BookingStatus.CANCELLED) {
      return this.cancel(id, userId, userRole, cancellationReason);
    }

    if (status === BookingStatus.COMPLETED) {
      return this.complete(id, userId, userRole);
    }

    if (status !== undefined) {
      throw new BadRequestError("Недопустимый переход статуса бронирования");
    }

    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) {
      throw new NotFoundError("Бронирование не найдено");
    }

    const isOccupier = booking.occupierId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isOccupier && !isAdmin) {
      throw new ForbiddenError("У вас нет прав на обновление этого бронирования");
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestError("Редактировать пожелание можно только у бронирования со статусом PENDING");
    }

    if (specialRequest !== undefined) {
      booking.specialRequest = specialRequest;
    }

    return this.bookingRepository.save(booking);
  }

  async confirm(id: number, userId: number, userRole: string) {
    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) {
      throw new NotFoundError("Бронирование не найдено");
    }

    const isOwner = booking.property.ownerId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError("Только владелец объекта или администратор может подтвердить бронь");
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestError("Подтвердить можно только бронирование со статусом PENDING");
    }

    booking.status = BookingStatus.CONFIRMED;
    return this.bookingRepository.save(booking);
  }

  async cancel(id: number, userId: number, userRole: string, cancellationReason?: string) {
    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) {
      throw new NotFoundError("Бронирование не найдено");
    }

    const isOccupier = booking.occupierId === userId;
    const isOwner = booking.property.ownerId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isOccupier && !isOwner && !isAdmin) {
      throw new ForbiddenError("У вас нет прав на отмену этого бронирования");
    }

    if (![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status)) {
      throw new BadRequestError("Отменить можно только активное бронирование");
    }

    booking.status = BookingStatus.CANCELLED;
    booking.cancellationReason = cancellationReason;

    return this.bookingRepository.save(booking);
  }

  async complete(id: number, userId: number, userRole: string) {
    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) {
      throw new NotFoundError("Бронирование не найдено");
    }

    const isOwner = booking.property.ownerId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError("Только владелец объекта или администратор может завершить бронирование");
    }

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestError("Завершить можно только бронирование со статусом CONFIRMED");
    }

    if (new Date(booking.endDate) > new Date()) {
      throw new BadRequestError("Нельзя завершить бронирование раньше даты выезда");
    }

    booking.status = BookingStatus.COMPLETED;
    return this.bookingRepository.save(booking);
  }

  async delete(id: number, userId: number, userRole: string) {
    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) {
      throw new NotFoundError("Бронирование не найдено");
    }

    const isOccupier = booking.occupierId === userId;
    const isOwner = booking.property.ownerId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isOccupier && !isOwner && !isAdmin) {
      throw new ForbiddenError("У вас нет прав на удаление этого бронирования");
    }

    if (![BookingStatus.PENDING, BookingStatus.CANCELLED].includes(booking.status) && !isAdmin) {
      throw new BadRequestError("Удалять можно только бронирования со статусом PENDING или CANCELLED");
    }

    await this.bookingRepository.remove(booking);
  }
}

export const bookingsService = new BookingsService();
