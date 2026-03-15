
import {
    Body,
    Get,
    HttpCode,
    HttpError,
    Param,
    Post,
    QueryParams,
    Req,
    UseBefore,
} from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { In } from 'typeorm';

import EntityController from '../../common/entity-controller';
import BaseController from '../../common/base-controller';

import { EstateForRent } from '../../models/estate-for-rent.entity';
import { Amenity } from '../../models/amentity.entity';
import { EstateType } from '../../models/estate-type.entity';
import { Photo } from '../../models/photo.entity';
import dataSource from '../../config/data-source';
import authMiddleware, { RequestWithUser } from '../../middlewares/auth.middleware';
import {
    CreatePropertyPhotoDto,
    CreatePropertyDto,
    ErrorResponseDto,
    GetPropertiesQueryDto,
    PropertyDetailsResponseDto,
    PropertyPhotoDto,
    PropertiesListResponseDto,
    PropertyResponseDto,
} from './dto';



@EntityController({
    baseRoute: '/properties',
    entity: EstateForRent,
})
class PropertiesController extends BaseController {
    @Post('/')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({
        summary: 'Создать объект недвижимости',
        security: [{ bearerAuth: [] }],
    })
    @ResponseSchema(PropertyResponseDto, { statusCode: 201 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 400 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 401 })
    async createProperty(
        @Body({ type: CreatePropertyDto }) body: CreatePropertyDto,
        @Req() request: RequestWithUser,
    ): Promise<PropertyResponseDto> {
        const { name, price, deposit, description, city, address, typeId, amenityIds } = body;

        if (!request.user?.id) {
            throw new HttpError(401, 'Unauthorized');
        }

        const estateType = await dataSource.getRepository(EstateType).findOneBy({ id: typeId });
        if (!estateType) {
            throw new HttpError(400, 'Invalid typeId');
        }

        const amenities = await dataSource
            .getRepository(Amenity)
            .findBy({ id: In(amenityIds) });

        if (amenities.length !== amenityIds.length) {
            throw new HttpError(400, 'One or more amenityIds are invalid');
        }

        const property = this.repository.create({
            name,
            price,
            deposit,
            description,
            city,
            address,
            ownerId: String(request.user.id),
            typeId,
            amenities,
        });

        const savedProperty = (await this.repository.save(property)) as EstateForRent;

        return {
            id: savedProperty.id,
            createdAt: savedProperty.createdAt,
            name: savedProperty.name,
            price: savedProperty.price,
            deposit: savedProperty.deposit,
            description: savedProperty.description,
            ownerId: savedProperty.ownerId,
            city: savedProperty.city,
            address: savedProperty.address,
            typeId: savedProperty.typeId,
            amenityIds: amenities.map((amenity) => amenity.id),
        };
    }

    @Get('/:id')
    @OpenAPI({ summary: 'Получить объект недвижимости по ID' })
    @ResponseSchema(PropertyDetailsResponseDto, { statusCode: 200 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 404 })
    async getPropertyById(
        @Param('id') id: number,
    ): Promise<PropertyDetailsResponseDto> {
        const property = await this.repository
            .createQueryBuilder('property')
            .leftJoinAndSelect('property.type', 'type')
            .leftJoinAndSelect('property.photos', 'photo')
            .leftJoinAndSelect('property.amenities', 'amenity')
            .where('property.id = :id', { id: String(id) })
            .getOne() as EstateForRent | null;

        if (!property) {
            throw new HttpError(404, 'Property not found');
        }

        return {
            id: property.id,
            createdAt: property.createdAt,
            name: property.name,
            price: property.price,
            deposit: property.deposit,
            description: property.description,
            ownerId: property.ownerId,
            city: property.city,
            address: property.address,
            typeId: property.typeId,
            amenityIds: property.amenities?.map((a) => a.id) ?? [],
            type: property.type
                ? {
                    id: property.type.id,
                    name: property.type.name,
                }
                : null,
            photos: property.photos?.map((photo) => ({
                id: photo.id,
                propertyId: photo.propertyId,
                photoAddr: photo.photoAddr,
            })) ?? [],
            amenities: property.amenities?.map((amenity) => ({
                id: amenity.id,
                name: amenity.name,
            })) ?? [],
        };
    }

    @Post('/:id/photos')
    @HttpCode(201)
    @OpenAPI({ summary: 'Добавить фото к объекту по ID' })
    @ResponseSchema(PropertyPhotoDto, { statusCode: 201 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 400 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 404 })
    async addPropertyPhoto(
        @Param('id') id: number,
        @Body({ type: CreatePropertyPhotoDto }) body: CreatePropertyPhotoDto,
    ): Promise<PropertyPhotoDto> {
        const property = await this.repository.findOneBy({ id: String(id) });
        if (!property) {
            throw new HttpError(404, 'Property not found');
        }

        const photoRepository = dataSource.getRepository(Photo);
        const photo = photoRepository.create({
            propertyId: property.id,
            photoAddr: body.photoAddr,
        });

        const savedPhoto = await photoRepository.save(photo);

        return {
            id: savedPhoto.id,
            propertyId: savedPhoto.propertyId,
            photoAddr: savedPhoto.photoAddr,
        };
    }

    @Get('/')
    @OpenAPI({ summary: 'Поиск объектов недвижимости' })
    @ResponseSchema(PropertiesListResponseDto)
    async getProperties(
        @QueryParams() query: GetPropertiesQueryDto,
    ): Promise<PropertiesListResponseDto> {

        const { city, typeId, minPrice, maxPrice, amenityIds, limit, offset } = query;

        const qb = this.repository
            .createQueryBuilder('property')
            .leftJoinAndSelect('property.amenities', 'amenity');

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
        if (amenityIds && amenityIds.length > 0) {
            qb.innerJoin('property.amenities', 'filterAmenities')
                .andWhere('filterAmenities.id IN (:...amenityIds)', { amenityIds })
                .groupBy('property.id')
                .having('COUNT(DISTINCT filterAmenities.id) = :count', { count: amenityIds.length });
        }

        qb.take(limit);
        qb.skip(offset);

        const [properties, total] = await qb.getManyAndCount();

        return {
            data: (properties as EstateForRent[]).map((property) => ({
                id: property.id,
                createdAt: property.createdAt,
                name: property.name,
                price: property.price,
                deposit: property.deposit,
                description: property.description,
                ownerId: property.ownerId,
                city: property.city,
                address: property.address,
                typeId: property.typeId,
                amenityIds: property.amenities?.map((a) => a.id) ?? [],
            })),
            total,
        };
    }
}

export default PropertiesController;


