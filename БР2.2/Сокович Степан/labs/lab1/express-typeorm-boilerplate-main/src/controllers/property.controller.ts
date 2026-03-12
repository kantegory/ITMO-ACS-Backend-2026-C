import {
    BadRequestError,
    Body,
    ForbiddenError,
    Get,
    NotFoundError,
    Param,
    Post,
    QueryParams,
    Req,
    UseBefore,
} from 'routing-controllers';
import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { Property } from '../models/property.entity';
import { ListPropertiesQueryDto, CreatePhotoDto, CreatePropertyDto } from '../dto/property.dto';
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
    async list(@QueryParams() query: ListPropertiesQueryDto) {
        const qb = this.repository
            .createQueryBuilder('property')
            .leftJoinAndSelect('property.amenities', 'amenity')
            .leftJoinAndSelect('property.type', 'type');

        if (query.city) {
            qb.andWhere('property.city ILIKE :city', { city: `%${query.city}%` });
        }
        if (query.typeId) {
            qb.andWhere('property.type_id = :typeId', { typeId: query.typeId });
        }
        if (query.minPrice !== undefined) {
            qb.andWhere('property.price >= :minPrice', { minPrice: query.minPrice });
        }
        if (query.maxPrice !== undefined) {
            qb.andWhere('property.price <= :maxPrice', { maxPrice: query.maxPrice });
        }

        const amenityIds = this.normalizeAmenityIds(query);
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

        qb.take(query.limit || 20)
            .skip(query.offset || 0)
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

    private normalizeAmenityIds(query: ListPropertiesQueryDto): number[] {
        const raw = query.amenityIds;
        if (!raw) {
            return [];
        }

        const list = Array.isArray(raw) ? raw : [raw];
        const parsed = list.map((item) => Number(item)).filter((item) => Number.isInteger(item));

        return Array.from(new Set(parsed));
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
