import {
    Param,
    Body,
    Get,
    Post,
    Patch,
    Delete,
    QueryParams,
    UseBefore,
    Req,
    NotFoundError,
    UnauthorizedError,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { Accommodation } from '../models/accommodation.entity';
import { Address } from '../models/address.entity';
import { AccomPhoto } from '../models/accomPhoto.entity';
import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';

import {
    CreateAccommodationDto,
    UpdateAccommodationDto,
    PhotoUploadDto,
    AccommodationListQueryDto,
    MyAccommodationsQueryDto,
} from '../dto/accommodation';

@EntityController({ baseRoute: '/accommodations', entity: Accommodation })
@UseBefore(authMiddleware)
@OpenAPI({ tags: ['Accommodations'], security: [{ bearerAuth: [] }] })
export default class AccommodationController extends BaseController {
    @Get('/me')
    @OpenAPI({ summary: 'Get my accommodations' })
    async myAccommodations(
        @Req() req: RequestWithUser,
        @QueryParams() query: MyAccommodationsQueryDto,
    ) {
        const qb = this.repository
            .createQueryBuilder('accom')
            .leftJoinAndSelect('accom.address', 'address')
            .where('accom.landlord_id = :landlordId', {
                landlordId: req.user.id,
            });

        if (query.search) {
            qb.andWhere(
                '(accom.title ILIKE :search OR address.city ILIKE :search)',
                { search: `%${query.search}%` },
            );
        }

        const [items, total] = await qb.getManyAndCount();
        return { items, total };
    }

    @Get('')
    @OpenAPI({ summary: 'Get accommodations list' })
    async list(@QueryParams() query: AccommodationListQueryDto) {
        const {
            city,
            district,
            accom_type,
            rooms_num,
            page = 1,
            limit = 10,
            sort,
        } = query;

        const qb = this.repository
            .createQueryBuilder('accom')
            .leftJoinAndSelect('accom.address', 'address')
            .leftJoinAndSelect('accom.landlord', 'landlord');

        if (city)
            qb.andWhere('address.city ILIKE :city', { city: `%${city}%` });
        if (district)
            qb.andWhere('address.district ILIKE :district', {
                district: `%${district}%`,
            });
        if (accom_type)
            qb.andWhere('accom.accom_type = :accom_type', { accom_type });
        if (rooms_num)
            qb.andWhere('accom.rooms_num = :rooms_num', { rooms_num });

        if (sort) {
            const [field, order] = sort.split(':');
            const allowedFields = ['id', 'price', 'rooms_num', 'created_at'];
            const safeField = allowedFields.includes(field) ? field : 'id';
            const safeOrder = order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
            qb.orderBy(`accom.${safeField}`, safeOrder as any);
        }

        qb.skip((page - 1) * limit).take(limit);
        const [items, total] = await qb.getManyAndCount();
        return { items, total, page, limit };
    }

    @Get('/:id')
    @OpenAPI({ summary: 'Get accommodation by ID' })
    async read(@Param('id') id: number) {
        const accom = await this.repository.findOne({
            where: { id },
            relations: {
                address: true,
                landlord: true,
                photos: true,
                rent_terms: true,
            },
        });
        if (!accom) throw new NotFoundError('Accommodation not found');
        return accom;
    }

    @Post('')
    @OpenAPI({ summary: 'Create accommodation' })
    async create(
        @Req() request: RequestWithUser,
        @Body() body: CreateAccommodationDto,
    ) {
        const { user } = request;

        const addressRepo = dataSource.getRepository(Address);
        const addressData = {
            city: body.address.city,
            district: body.address.district,
            street: body.address.street,
            house_num: body.address.house_num,
            building: body.address.building || undefined,
        };

        const savedAddress = await addressRepo.save(addressData);

        const accomData = {
            landlord_id: user.id,
            address_id: savedAddress.id,
            accom_type: body.accommodation.accom_type,
            title: body.accommodation.title,
            description: body.accommodation.description,
            rooms_num: body.accommodation.rooms_num,
            living_space: body.accommodation.living_space,
            is_decorated: body.accommodation.is_decorated,
            is_rented: false,
            is_published: false,
            util_serv_pay: body.rent_terms.util_serv_pay,
            price: body.rent_terms.price,
            deposit: body.rent_terms.deposit,
            commission: body.rent_terms.commission,
            with_kids: body.rent_terms.with_kids,
            with_pets: body.rent_terms.with_pets,
        };

        const accom = await this.repository.save(accomData);
        return accom;
    }

    @Patch('/:id')
    @OpenAPI({ summary: 'Update accommodation' })
    async update(
        @Req() request: RequestWithUser,
        @Param('id') id: number,
        @Body() body: UpdateAccommodationDto,
    ) {
        const { user } = request;
        const accom = await this.repository.findOneBy({ id });

        if (!accom) throw new NotFoundError('Accommodation not found');
        if (accom.landlord_id !== user.id)
            throw new UnauthorizedError('Access denied');

        if (body.rent_terms) {
            Object.assign(accom, body.rent_terms);
            delete body.rent_terms;
        }

        Object.assign(accom, body);
        return await this.repository.save(accom);
    }

    @Delete('/:id')
    @OpenAPI({ summary: 'Delete accommodation' })
    async delete(@Req() request: RequestWithUser, @Param('id') id: number) {
        const { user } = request;
        const accom = await this.repository.findOneBy({ id });

        if (!accom) throw new NotFoundError('Accommodation not found');
        if (accom.landlord_id !== user.id)
            throw new UnauthorizedError('Access denied');

        await this.repository.remove(accom);
        return null;
    }

    @Post('/:id/photos')
    @OpenAPI({ summary: 'Upload photo' })
    async uploadPhoto(
        @Req() request: RequestWithUser,
        @Param('id') id: number,
        @Body() body: PhotoUploadDto,
    ) {
        const { user } = request;
        const accom = await this.repository.findOneBy({ id });

        if (!accom) throw new NotFoundError('Accommodation not found');
        if (accom.landlord_id !== user.id)
            throw new UnauthorizedError('Access denied');

        const photoRepo = dataSource.getRepository(AccomPhoto);
        const savedPhoto = await photoRepo.save({
            accom_id: id,
            photo_url: body.photo_url,
            is_main: body.is_main || false,
        });
        return savedPhoto;
    }

    @Delete('/:id/photos/:photoId')
    @OpenAPI({ summary: 'Delete photo' })
    async deletePhoto(
        @Req() request: RequestWithUser,
        @Param('id') id: number,
        @Param('photoId') photoId: number,
    ) {
        const { user } = request;
        const accom = await this.repository.findOneBy({ id });

        if (!accom) throw new NotFoundError('Accommodation not found');
        if (accom.landlord_id !== user.id)
            throw new UnauthorizedError('Access denied');

        const photoRepo = dataSource.getRepository(AccomPhoto);
        await photoRepo.delete({ id: photoId, accom_id: id });
        return null;
    }
}
