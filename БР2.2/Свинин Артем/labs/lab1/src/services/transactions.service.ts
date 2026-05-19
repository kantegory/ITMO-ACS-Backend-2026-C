import { randomUUID } from "crypto";
import { AppDataSource } from "../config/data-source";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../errors/http-errors";
import { Booking, BookingStatus } from "../models/Booking";
import { PaymentMethod, Transaction, TransactionStatus } from "../models/Transaction";

interface CreateTransactionInput {
  bookingId: number;
  paymentMethod: PaymentMethod;
  currency?: string;
}

export class TransactionsService {
  private transactionRepository = AppDataSource.getRepository(Transaction);
  private bookingRepository = AppDataSource.getRepository(Booking);

  async create(data: CreateTransactionInput, userId: number, userRole: string) {
    const { bookingId, paymentMethod, currency } = data;

    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundError("Бронирование не найдено");
    }

    const isOccupier = booking.occupierId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isOccupier && !isAdmin) {
      throw new ForbiddenError("Только арендатор или администратор может создать транзакцию");
    }

    if (![BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(booking.status)) {
      throw new BadRequestError("Оплатить можно только бронирование со статусом PENDING или CONFIRMED");
    }

    const existingPaidTransaction = await this.transactionRepository.findOne({
      where: {
        bookingId,
        status: TransactionStatus.SUCCESS,
      },
    });

    if (existingPaidTransaction) {
      throw new ConflictError("Для этого бронирования уже существует успешная оплата");
    }

    if (!Object.values(PaymentMethod).includes(paymentMethod)) {
      throw new BadRequestError("Некорректный способ оплаты");
    }

    const amount = booking.totalPrice;
    const feeAmount = (Number(amount) * 0.05).toFixed(2);
    const transaction = this.transactionRepository.create({
      bookingId,
      paymentMethod,
      status: TransactionStatus.SUCCESS,
      paymentId: randomUUID(),
      currency: currency ?? "USD",
      amount,
      feeAmount,
      refundedAmount: "0.00",
    });

    return this.transactionRepository.save(transaction);
  }

  async getById(id: number, userId: number, userRole: string) {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundError("Транзакция не найдена");
    }

    const booking = transaction.booking;
    const isOccupier = booking.occupierId === userId;
    const isOwner = booking.property.ownerId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isOccupier && !isOwner && !isAdmin) {
      throw new ForbiddenError("У вас нет доступа к этой транзакции");
    }

    return transaction;
  }

  async getByBookingId(bookingId: number, userId: number, userRole: string) {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundError("Бронирование не найдено");
    }

    const isOccupier = booking.occupierId === userId;
    const isOwner = booking.property.ownerId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isOccupier && !isOwner && !isAdmin) {
      throw new ForbiddenError("У вас нет доступа к транзакциям этого бронирования");
    }

    return this.transactionRepository.find({
      where: { bookingId },
      order: {
        id: "ASC",
      },
    });
  }

  async refund(id: number, userId: number, userRole: string) {
    const transaction = await this.transactionRepository.findOne({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundError("Транзакция не найдена");
    }

    const booking = transaction.booking;
    const isOwner = booking.property.ownerId === userId;
    const isAdmin = userRole === "ADMIN";

    if (!isOwner && !isAdmin) {
      throw new ForbiddenError("Только владелец объекта или администратор может оформить возврат");
    }

    if (transaction.status === TransactionStatus.REFUNDED) {
      throw new ConflictError("Возврат по этой транзакции уже оформлен");
    }

    if (transaction.status !== TransactionStatus.SUCCESS) {
      throw new BadRequestError("Возврат можно сделать только для оплаченной транзакции");
    }

    transaction.status = TransactionStatus.REFUNDED;
    transaction.refundedAmount = transaction.amount;

    return this.transactionRepository.save(transaction);
  }
}

export const transactionsService = new TransactionsService();
