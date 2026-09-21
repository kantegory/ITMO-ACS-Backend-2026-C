import { Body, Get, Patch, Req, QueryParams, UseBefore } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import dataSource from '../config/data-source';

import { User } from '../models/user.entity';
import { Booking } from '../models/booking.entity';

import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';

import { UserResponseDto, UserUpdateDto, toUserResponseDto } from '../dto/user.dto';
import {
    BookingListQueryDto,
    BookingPageDto,
    toBookingDetailsDto,
} from '../dto/booking.dto';
import { ErrorDto } from '../dto/error.dto';
import { getSkipTake, buildPageMeta } from '../utils/pagination';

// Личный кабинет пользователя: свой профиль и история своих броней.
// Всё под /users/me — то есть "текущий пользователь всегда видит только себя",
// а кто он такой — определяет authMiddleware по токену (кладёт в request.user).
@EntityController({
    baseRoute: '/users',
    entity: User,
})
class UserController extends BaseController {
    // GET /users/me
    @Get('/me')
    @UseBefore(authMiddleware) // без валидного токена сюда не попасть — middleware вернёт 401 раньше
    @OpenAPI({ summary: 'Личный кабинет: свой профиль' })
    @ResponseSchema(UserResponseDto, { statusCode: 200 })
    @ResponseSchema(ErrorDto, { statusCode: 401 })
    async getMe(@Req() request: RequestWithUser): Promise<UserResponseDto> {
        // request.user.id — это id, который authMiddleware достал из токена
        const user = await this.repository.findOneBy({ id: request.user.id });

        return toUserResponseDto(user as User);
    }

    // PATCH /users/me — изменить свой профиль (только имя, фамилию, телефон)
    @Patch('/me')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Изменить свой профиль' })
    @ResponseSchema(UserResponseDto, { statusCode: 200 })
    @ResponseSchema(ErrorDto, { statusCode: 400 })
    @ResponseSchema(ErrorDto, { statusCode: 401 })
    async updateMe(
        @Req() request: RequestWithUser,
        @Body({ type: UserUpdateDto }) updateData: UserUpdateDto,
    ): Promise<UserResponseDto> {
        const user = await this.repository.findOneBy({ id: request.user.id });

        // Object.assign копирует только те поля, что реально прислали (UserUpdateDto — все поля опциональны)
        Object.assign(user as User, updateData);
        await this.repository.save(user as User);

        return toUserResponseDto(user as User);
    }

    // GET /users/me/bookings — история своих бронирований, с фильтром по статусу и пагинацией
    @Get('/me/bookings')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'История бронирований пользователя' })
    @ResponseSchema(BookingPageDto, { statusCode: 200 })
    @ResponseSchema(ErrorDto, { statusCode: 401 })
    async getMyBookings(
        @Req() request: RequestWithUser,
        @QueryParams({ type: BookingListQueryDto }) query: BookingListQueryDto,
    ): Promise<BookingPageDto> {
        const bookingRepository = dataSource.getRepository(Booking);

        // QueryBuilder — способ собрать SQL-запрос по кусочкам вместо простого find().
        // Нужен здесь, потому что запрос сложный: несколько join'ов + необязательные фильтры.
        const qb = bookingRepository
            .createQueryBuilder('booking')
            .leftJoinAndSelect('booking.restaurant_table', 'restaurant_table') // подтягиваем данные столика
            .leftJoinAndSelect('restaurant_table.restaurant', 'restaurant') // и ресторана этого столика
            .leftJoinAndSelect('booking.time_slot', 'time_slot') // и слота
            .where('booking.user_id = :userId', { userId: request.user.id }); // только брони текущего пользователя

        if (query.status) {
            qb.andWhere('booking.status = :status', { status: query.status });
        }

        qb.orderBy('booking.created_at', 'DESC'); // от новых к старым, как требует спецификация

        const { skip, take } = getSkipTake(query.page, query.limit);
        qb.skip(skip).take(take);

        const [items, total] = await qb.getManyAndCount(); // одним запросом получаем и страницу данных, и общее количество

        return {
            items: items.map(toBookingDetailsDto),
            meta: buildPageMeta(total, query.page, query.limit),
        };
    }
}

export default UserController;
