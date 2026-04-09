import {
    Param,
    Body,
    Get,
    Post,
    Patch,
    Delete,
    HttpCode,
    UseBefore,
    Req,
    QueryParam,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { In } from 'typeorm';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { Property } from '../models/property.entity';
import { CreatePropertyDto, UpdatePropertyDto } from '../dto/property.dto';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';
import { Comfort } from '../models/comfort.entity';

@EntityController({
    baseRoute: '/properties',
    entity: Property,
})
class PropertyController extends BaseController {
    @Get('')
    @OpenAPI({ summary: 'Search properties with filters' })
    async getAll(
        @QueryParam('search') search?: string,
        @QueryParam('cityId') cityId?: number,
        @QueryParam('type') type?: string,
        @QueryParam('priceMin') priceMin?: number,
        @QueryParam('priceMax') priceMax?: number,
        @QueryParam('roomsMin') roomsMin?: number,
        @QueryParam('roomsMax') roomsMax?: number,
        @QueryParam('guestsMin') guestsMin?: number,
        @QueryParam('sortBy') sortBy: string = 'createdAt',
        @QueryParam('sortOrder') sortOrder: 'ASC' | 'DESC' = 'DESC',
        @QueryParam('page') page: number = 1,
        @QueryParam('limit') limit: number = 20,
    ) {
        const qb = this.repository
            .createQueryBuilder('property')
            .leftJoinAndSelect('property.owner', 'owner')
            .leftJoinAndSelect('property.city', 'city')
            .leftJoinAndSelect('property.photos', 'photos')
            .where('property.isActive = :isActive', { isActive: true });

        if (search) {
            qb.andWhere(
                '(property.title LIKE :search OR property.description LIKE :search)',
                { search: `%${search}%` },
            );
        }
        if (cityId) qb.andWhere('property.cityId = :cityId', { cityId });
        if (type) qb.andWhere('property.type = :type', { type });
        if (priceMin) qb.andWhere('property.pricePerDay >= :priceMin', { priceMin });
        if (priceMax) qb.andWhere('property.pricePerDay <= :priceMax', { priceMax });
        if (roomsMin) qb.andWhere('property.roomsCount >= :roomsMin', { roomsMin });
        if (roomsMax) qb.andWhere('property.roomsCount <= :roomsMax', { roomsMax });
        if (guestsMin) qb.andWhere('property.maxGuests >= :guestsMin', { guestsMin });

        const allowedSortFields = ['createdAt', 'pricePerDay', 'area', 'roomsCount'];
        const actualSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
        qb.orderBy(`property.${actualSortBy}`, sortOrder);

        qb.skip((page - 1) * limit).take(limit);

        const [data, total] = await qb.getManyAndCount();

        return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    @Get('/my')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'My properties', security: [{ bearerAuth: [] }] })
    async getMyProperties(
        @Req() request: RequestWithUser,
        @QueryParam('isActive') isActive?: boolean,
    ) {
        const where: any = { ownerId: request.user.id };
        if (isActive !== undefined) where.isActive = isActive;

        return await this.repository.find({
            where,
            relations: ['city', 'photos'],
            order: { createdAt: 'DESC' },
        });
    }

    @Get('/user/:userId')
    @OpenAPI({ summary: "User's active properties" })
    async getUserProperties(@Param('userId') userId: number) {
        return await this.repository.find({
            where: { ownerId: userId, isActive: true },
            relations: ['city', 'photos'],
            order: { createdAt: 'DESC' },
        });
    }

    @Get('/:id')
    @OpenAPI({ summary: 'Get property details' })
    async getById(@Param('id') id: number) {
        const property = await this.repository.findOne({
            where: { id },
            relations: ['owner', 'city', 'comforts', 'photos'],
        });
        if (!property) return { message: 'Property not found' };
        return property;
    }

    @Post('')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Create property', security: [{ bearerAuth: [] }] })
    async create(
        @Req() request: RequestWithUser,
        @Body({ type: CreatePropertyDto }) data: CreatePropertyDto,
    ) {
        const { comfortIds, ...rest } = data;

        const property = this.repository.create({
            ...rest,
            ownerId: request.user.id,
        }) as Property;

        if (comfortIds && comfortIds.length > 0) {
            const comfortRepo = dataSource.getRepository(Comfort);
            property.comforts = await comfortRepo.findBy({ id: In(comfortIds) });
        }

        return await this.repository.save(property);
    }

    @Patch('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Update property', security: [{ bearerAuth: [] }] })
    async update(
        @Param('id') id: number,
        @Req() request: RequestWithUser,
        @Body({ type: UpdatePropertyDto }) data: UpdatePropertyDto,
    ) {
        const property = await this.repository.findOne({
            where: { id },
            relations: ['comforts'],
        }) as Property;
        if (!property) return { message: 'Property not found' };
        if (property.ownerId !== request.user.id) {
            return { message: 'Forbidden: not the owner' };
        }

        const { comfortIds, ...rest } = data;
        Object.assign(property, rest);

        if (comfortIds) {
            const comfortRepo = dataSource.getRepository(Comfort);
            property.comforts = await comfortRepo.findBy({ id: In(comfortIds) });
        }

        return await this.repository.save(property);
    }

    @Delete('/:id')
    @HttpCode(204)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Delete property', security: [{ bearerAuth: [] }] })
    async delete(
        @Param('id') id: number,
        @Req() request: RequestWithUser,
    ) {
        const property = await this.repository.findOneBy({ id }) as Property;
        if (!property) return { message: 'Property not found' };
        if (property.ownerId !== request.user.id) {
            return { message: 'Forbidden: not the owner' };
        }

        await this.repository.remove(property);
        return '';
    }
}

export default PropertyController;
