import {
    BadRequestError,
    Body,
    ForbiddenError,
    Get,
    NotFoundError,
    Param,
    Post,
    QueryParam,
    Req,
    UseBefore,
} from 'routing-controllers';
import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { Property } from '../models/property.entity';
import { CreatePhotoDto, CreatePropertyDto } from '../dto/property.dto';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import { Amenity } from '../models/amenity.entity';
import { EstateType } from '../models/estate-type.entity';
import { Photo } from '../models/photo.entity';
import dataSource from '../config/data-source';
import { UserType } from '../models/enums';
import { In } from 'typeorm';

@EntityController({
    baseRoute: '/properties',
    entity: Property,
})
class PropertyController extends BaseController {
    @Get('')
    async list(
        @QueryParam('city', { required: false, type: String }) city?: string,
        @QueryParam('typeId', { required: false, type: Number }) typeIdRaw?: number,
        @QueryParam('minPrice', { required: false, type: Number }) minPriceRaw?: number,
        @QueryParam('maxPrice', { required: false, type: Number }) maxPriceRaw?: number,
        @QueryParam('amenityIds', {
            required: false,
            type: Number,
            isArray: true,
        })
        amenityIdsRaw?: number[] | number,
        @QueryParam('limit', { required: false, type: Number }) limitRaw?: number,
        @QueryParam('offset', { required: false, type: Number }) offsetRaw?: number,
    ) {
        const typeId = this.parseOptionalInt(typeIdRaw);
        const minPrice = this.parseOptionalInt(minPriceRaw);
        const maxPrice = this.parseOptionalInt(maxPriceRaw);
        const limit = this.parseIntOrDefault(limitRaw, 20, 1);
        const offset = this.parseIntOrDefault(offsetRaw, 0, 0);

        const qb = this.repository
            .createQueryBuilder('property')
            .leftJoinAndSelect('property.amenities', 'amenity')
            .leftJoinAndSelect('property.type', 'type');

        if (city) {
            qb.andWhere('property.city ILIKE :city', { city: `%${city}%` });
        }
        if (typeId !== undefined) {
            qb.andWhere('property.type_id = :typeId', { typeId });
        }
        if (minPrice !== undefined) {
            qb.andWhere('property.price >= :minPrice', { minPrice });
        }
        if (maxPrice !== undefined) {
            qb.andWhere('property.price <= :maxPrice', { maxPrice });
        }

        const amenityIds = this.normalizeAmenityIds(amenityIdsRaw);
        if (amenityIds.length > 0) {
            qb.innerJoin('property.amenities', 'af', 'af.id IN (:...amenityIds)', {
                amenityIds,
            })
                .groupBy('property.id')
                .addGroupBy('type.id')
                .addGroupBy('amenity.id')
                .having('COUNT(DISTINCT af.id) = :amenitiesCount', {
                    amenitiesCount: amenityIds.length,
                });
        }

        qb.take(limit)
            .skip(offset)
            .orderBy('property.id', 'ASC');

        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            total,
        };
    }

    @Post('')
    @UseBefore(authMiddleware)
    async create(
        @Body({ type: CreatePropertyDto }) payload: CreatePropertyDto,
        @Req() request: RequestWithUser,
    ) {
        if (request.user.type !== UserType.LANDLORD) {
            throw new ForbiddenError('Only landlord can create property');
        }

        const typeRepository = dataSource.getRepository(EstateType);
        const type = await typeRepository.findOneBy({ id: payload.typeId });
        if (!type) {
            throw new NotFoundError('Estate type is not found');
        }

        const amenities = await this.loadAmenities(payload.amenityIds || []);

        const entity = this.repository.create({
            name: payload.name,
            price: payload.price,
            deposit: payload.deposit || null,
            description: payload.description || null,
            city: payload.city,
            address: payload.address,
            typeId: payload.typeId,
            ownerId: request.user.id,
            amenities,
        }) as Property;

        const created = await this.repository.save(entity);
        return created;
    }

    @Get('/:id')
    async getById(@Param('id') id: number) {
        const property = await this.repository.findOne({
            where: { id },
            relations: {
                type: true,
                amenities: true,
            },
        });
        if (!property) {
            throw new NotFoundError('Property is not found');
        }

        const photoRepository = dataSource.getRepository(Photo);
        const photos = await photoRepository.find({
            where: { propertyId: id },
            order: { id: 'ASC' },
        });

        return {
            ...property,
            photos,
        };
    }

    @Post('/:id/photos')
    @UseBefore(authMiddleware)
    async addPhoto(
        @Param('id') id: number,
        @Body({ type: CreatePhotoDto }) payload: CreatePhotoDto,
        @Req() request: RequestWithUser,
    ) {
        const property = await this.repository.findOneBy({ id });
        if (!property) {
            throw new NotFoundError('Property is not found');
        }
        if (property.ownerId !== request.user.id) {
            throw new ForbiddenError('Only owner can add photos');
        }

        const photoRepository = dataSource.getRepository(Photo);
        const photo = photoRepository.create({
            propertyId: id,
            photoAddr: payload.photoAddr,
        });

        return await photoRepository.save(photo);
    }

    private normalizeAmenityIds(raw: number[] | number | undefined): number[] {
        if (!raw) {
            return [];
        }

        const list = Array.isArray(raw) ? raw : [raw];
        const parsed = list.map((item) => Number(item)).filter((item) => Number.isInteger(item));

        return Array.from(new Set(parsed));
    }

    private parseOptionalInt(raw: number | undefined): number | undefined {
        if (raw === undefined) {
            return undefined;
        }

        const parsed = Number(raw);
        return Number.isInteger(parsed) ? parsed : undefined;
    }

    private parseIntOrDefault(raw: number | undefined, fallback: number, min: number): number {
        if (raw === undefined) {
            return fallback;
        }

        const parsed = Number(raw);
        if (!Number.isInteger(parsed) || parsed < min) {
            return fallback;
        }

        return parsed;
    }

    private async loadAmenities(amenityIds: number[]): Promise<Amenity[]> {
        if (amenityIds.length === 0) {
            return [];
        }

        const amenityRepository = dataSource.getRepository(Amenity);
        const amenities = await amenityRepository.findBy({ id: In(amenityIds) });

        if (amenities.length !== amenityIds.length) {
            throw new BadRequestError('Some amenityIds are invalid');
        }

        return amenities;
    }
}

export default PropertyController;
