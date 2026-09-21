import {
    Get,
    Post,
    Patch,
    Param,
    Body,
    Req,
    QueryParams,
    UseBefore,
    HttpCode,
    NotFoundError,
    ForbiddenError,
} from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import dataSource from '../config/data-source';

import { Booking } from '../models/booking.entity';
import { RestaurantAdmin } from '../models/restaurant-admin.entity';
import { Role } from '../models/enums/role.enum';
import { BookingStatus } from '../models/enums/booking-status.enum';

import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import requireRole from '../middlewares/roles.middleware';
import { isRestaurantAdmin } from '../services/restaurant-access.service';
import { createBooking, canTransition } from '../services/booking.service';

import {
    BookingCreateDto,
    BookingStatusUpdateDto,
    BookingListQueryDto,
    BookingDto,
    BookingDetailsDto,
    BookingPageDto,
    toBookingDto,
    toBookingDetailsDto,
} from '../dto/booking.dto';
import { ErrorDto } from '../dto/error.dto';
import { ConflictError } from '../errors/http-errors';
import { getSkipTake, buildPageMeta } from '../utils/pagination';

// Какие связи нужно подгрузить, чтобы показать бронь вместе с рестораном/столиком/слотом
// (используется и в getOne, и в updateStatus — вынесено, чтобы не повторять список дважды)
const DETAILS_RELATIONS = [
    'restaurant_table',
    'restaurant_table.restaurant',
    'time_slot',
];

// Самый "логически тяжёлый" контроллер — бронирование столиков.
// Основные проверки (свободен ли столик, не в прошлом ли дата и т.п.) вынесены
// в services/booking.service.ts, а здесь — права доступа и связывание с HTTP.
@EntityController({
    baseRoute: '/bookings',
    entity: Booking,
})
class BookingController extends BaseController {
    // POST /bookings — любой авторизованный пользователь может создать бронь себе
    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Забронировать столик' })
    @ResponseSchema(BookingDto, { statusCode: 201 })
    @ResponseSchema(ErrorDto, { statusCode: 400 })
    @ResponseSchema(ErrorDto, { statusCode: 404 })
    @ResponseSchema(ErrorDto, { statusCode: 409 })
    async create(
        @Req() request: RequestWithUser,
        @Body({ type: BookingCreateDto }) data: BookingCreateDto,
    ): Promise<BookingDto> {
        // все проверки (столик/слот существуют и активны, вместимость, дата не в прошлом,
        // столик свободен) делает сервис — контроллер просто передаёт данные дальше
        const booking = await createBooking(request.user.id, data);

        return toBookingDto(booking);
    }

    // GET /bookings — список броней для администраторов.
    // ADMIN видит все, RESTAURANT_ADMIN — только брони своих ресторанов.
    @Get('')
    @UseBefore(authMiddleware, requireRole(Role.ADMIN, Role.RESTAURANT_ADMIN))
    @OpenAPI({ summary: 'Брони ресторана' })
    @ResponseSchema(BookingPageDto, { statusCode: 200 })
    async list(
        @Req() request: RequestWithUser,
        @QueryParams({ type: BookingListQueryDto }) query: BookingListQueryDto,
    ): Promise<BookingPageDto> {
        const qb = this.repository
            .createQueryBuilder('booking')
            .leftJoinAndSelect('booking.restaurant_table', 'restaurant_table')
            .leftJoinAndSelect('restaurant_table.restaurant', 'restaurant')
            .leftJoinAndSelect('booking.time_slot', 'time_slot');

        if (request.user.role === Role.RESTAURANT_ADMIN) {
            // узнаём, администратором каких именно ресторанов является этот пользователь,
            // и ограничиваем выборку только ими
            const adminRecords = await dataSource
                .getRepository(RestaurantAdmin)
                .find({ where: { user_id: request.user.id } });
            const restaurantIds = adminRecords.map((r) => r.restaurant_id);

            if (restaurantIds.length === 0) {
                // человек с ролью RESTAURANT_ADMIN, но не назначенный ни на один ресторан —
                // отдаём пустой список, а не ошибку
                return {
                    items: [],
                    meta: buildPageMeta(0, query.page, query.limit),
                };
            }

            qb.andWhere('restaurant.id IN (:...restaurantIds)', {
                restaurantIds,
            });
        }

        if (query.restaurant_id !== undefined) {
            qb.andWhere('restaurant.id = :restaurantId', {
                restaurantId: query.restaurant_id,
            });
        }
        if (query.date) {
            qb.andWhere('booking.booking_date = :date', { date: query.date });
        }
        if (query.status) {
            qb.andWhere('booking.status = :status', { status: query.status });
        }

        qb.orderBy('booking.created_at', 'DESC');

        const { skip, take } = getSkipTake(query.page, query.limit);
        qb.skip(skip).take(take);

        const [items, total] = await qb.getManyAndCount();

        return {
            items: (items as Booking[]).map(toBookingDetailsDto),
            meta: buildPageMeta(total, query.page, query.limit),
        };
    }

    // GET /bookings/{bookingId} — сам владелец брони, администратор её ресторана или ADMIN
    @Get('/:bookingId')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Информация о брони' })
    @ResponseSchema(BookingDetailsDto, { statusCode: 200 })
    @ResponseSchema(ErrorDto, { statusCode: 403 })
    @ResponseSchema(ErrorDto, { statusCode: 404 })
    async getOne(
        @Req() request: RequestWithUser,
        @Param('bookingId') bookingId: number,
    ): Promise<BookingDetailsDto> {
        const booking = await this.repository.findOne({
            where: { id: Number(bookingId) },
            relations: DETAILS_RELATIONS,
        });

        if (!booking) {
            throw new NotFoundError('Booking not found');
        }

        // assertCanAccess сам бросит 403, если доступа нет — здесь просто ждём результата
        await this.assertCanAccess(request.user, booking as Booking);

        return toBookingDetailsDto(booking as Booking);
    }

    // PATCH /bookings/{bookingId}/status — сменить статус брони
    @Patch('/:bookingId/status')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Изменить статус брони' })
    @ResponseSchema(BookingDto, { statusCode: 200 })
    @ResponseSchema(ErrorDto, { statusCode: 403 })
    @ResponseSchema(ErrorDto, { statusCode: 404 })
    @ResponseSchema(ErrorDto, { statusCode: 409 })
    async updateStatus(
        @Req() request: RequestWithUser,
        @Param('bookingId') bookingId: number,
        @Body({ type: BookingStatusUpdateDto }) data: BookingStatusUpdateDto,
    ): Promise<BookingDto> {
        const booking = await this.repository.findOne({
            where: { id: Number(bookingId) },
            relations: DETAILS_RELATIONS,
        });

        if (!booking) {
            throw new NotFoundError('Booking not found');
        }

        const typedBooking = booking as Booking;
        // isStaff = true, если это ADMIN или администратор ресторана этой брони
        const isStaff = await this.assertCanAccess(request.user, typedBooking);

        // обычный пользователь (не staff) может только ОТМЕНИТЬ свою бронь — ничего больше
        if (!isStaff && data.status !== BookingStatus.CANCELLED) {
            throw new ForbiddenError('Users can only cancel their own booking');
        }

        // проверяем, что переход между статусами вообще допустим
        // (например, нельзя из CANCELLED снова перейти в CONFIRMED)
        if (!canTransition(typedBooking.status, data.status)) {
            throw new ConflictError(
                `Cannot transition booking from ${typedBooking.status} to ${data.status}`,
            );
        }

        typedBooking.status = data.status;
        await this.repository.save(typedBooking);

        return toBookingDto(typedBooking);
    }

    // Общая проверка доступа к конкретной брони: владелец, ADMIN или администратор её ресторана.
    // Если доступа нет — сразу бросает 403. Если есть — возвращает true/false: является ли
    // пользователь "персоналом" (ADMIN/администратор ресторана) или просто владельцем брони.
    private async assertCanAccess(
        user: { id: number; role: Role },
        booking: Booking,
    ): Promise<boolean> {
        const isOwner = booking.user_id === user.id;
        const isAdmin = user.role === Role.ADMIN;
        const isRestaurantStaff =
            user.role === Role.RESTAURANT_ADMIN &&
            (await isRestaurantAdmin(
                user.id,
                booking.restaurant_table.restaurant_id,
            ));

        if (!isOwner && !isAdmin && !isRestaurantStaff) {
            throw new ForbiddenError('Insufficient permissions');
        }

        return isAdmin || isRestaurantStaff;
    }
}

export default BookingController;
