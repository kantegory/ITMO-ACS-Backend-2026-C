import {
    Get,
    Post,
    Delete,
    Param,
    Body,
    UseBefore,
    HttpCode,
    OnUndefined,
    NotFoundError,
} from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import dataSource from '../config/data-source';

import { RestaurantPhoto } from '../models/restaurant-photo.entity';
import { Restaurant } from '../models/restaurant.entity';

import authMiddleware from '../middlewares/auth.middleware';
import restaurantAdminMiddleware from '../middlewares/restaurant-admin.middleware';

import {
    RestaurantPhotoCreateDto,
    RestaurantPhotoDto,
    toRestaurantPhotoDto,
} from '../dto/restaurant-photo.dto';
import { ErrorDto } from '../dto/error.dto';

// Фотографии ресторана: список открыт всем, изменения — только ADMIN
// или администратор именно этого ресторана (restaurantAdminMiddleware).
@EntityController({
    baseRoute: '/restaurants/:restaurantId/photos',
    entity: RestaurantPhoto,
})
class RestaurantPhotoController extends BaseController {
    @Get('')
    @OpenAPI({ summary: 'Фотографии ресторана' })
    @ResponseSchema(RestaurantPhotoDto, { isArray: true, statusCode: 200 })
    @ResponseSchema(ErrorDto, { statusCode: 404 })
    async list(
        @Param('restaurantId') restaurantId: number,
    ): Promise<RestaurantPhotoDto[]> {
        const restaurant = await dataSource
            .getRepository(Restaurant)
            .findOneBy({ id: restaurantId });
        if (!restaurant) {
            throw new NotFoundError('Restaurant not found');
        }

        const photos = await this.repository.find({
            where: { restaurant_id: Number(restaurantId) },
            order: { sort_order: 'ASC' },
        });

        return (photos as RestaurantPhoto[]).map(toRestaurantPhotoDto);
    }

    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware, restaurantAdminMiddleware)
    @OpenAPI({ summary: 'Добавить фотографию' })
    @ResponseSchema(RestaurantPhotoDto, { statusCode: 201 })
    @ResponseSchema(ErrorDto, { statusCode: 404 })
    async create(
        @Param('restaurantId') restaurantId: number,
        @Body({ type: RestaurantPhotoCreateDto }) data: RestaurantPhotoCreateDto,
    ): Promise<RestaurantPhotoDto> {
        const restaurant = await dataSource
            .getRepository(Restaurant)
            .findOneBy({ id: restaurantId });
        if (!restaurant) {
            throw new NotFoundError('Restaurant not found');
        }

        // если новое фото делают главным — сначала снимаем флаг с прежнего главного фото,
        // иначе упадём на частичном уникальном индексе (см. restaurant-photo.entity.ts)
        if (data.is_main) {
            await this.repository.update(
                { restaurant_id: Number(restaurantId), is_main: true },
                { is_main: false },
            );
        }

        const photo = this.repository.create({
            ...data,
            restaurant_id: Number(restaurantId),
        });
        await this.repository.save(photo);

        return toRestaurantPhotoDto(photo as RestaurantPhoto);
    }

    @Delete('/:photoId')
    @OnUndefined(204)
    @UseBefore(authMiddleware, restaurantAdminMiddleware)
    @OpenAPI({ summary: 'Удалить фотографию' })
    @ResponseSchema(ErrorDto, { statusCode: 404 })
    async remove(
        @Param('restaurantId') restaurantId: number,
        @Param('photoId') photoId: number,
    ): Promise<void> {
        const photo = await this.repository.findOneBy({
            id: photoId,
            restaurant_id: Number(restaurantId), // проверяем оба условия разом — чтобы нельзя было удалить фото чужого ресторана, зная только id фото
        });

        if (!photo) {
            throw new NotFoundError('Photo not found');
        }

        await this.repository.remove(photo);
    }
}

export default RestaurantPhotoController;
