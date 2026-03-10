import {
    Param,
    Body,
    Get,
    Post,
    Patch,
    Delete,
    QueryParam,
    UseBefore,
    Req,
    NotFoundError,
    UnauthorizedError,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import {
    IsString,
    IsNumber,
    IsBoolean,
    IsOptional,
    IsArray,
    ValidateNested,
    IsIn,
    IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { Accommodation } from '../models/accommodation.entity';
import { Address } from '../models/address.entity';
import { AccomPhoto } from '../models/accomPhoto.entity';
import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';

const VALID_ACCOM_TYPES = ['flat', 'house', 'room', 'townhouse', 'dacha'];

export class AddressDto {
    @IsString() city: string;
    @IsOptional() @IsString() district?: string;
    @IsString() street: string;
    @IsString() house_num: string;
    @IsOptional() @IsNumber() @Type(() => Number) building?: number;
}

export class RentTermsDto {
    @IsOptional() @IsString() util_serv_pay?: string;
    @IsNumber() @Type(() => Number) price: number;
    @IsOptional() @IsNumber() @Type(() => Number) deposit?: number;
    @IsOptional() @IsNumber() @Type(() => Number) commission?: number;
    @IsBoolean() @Type(() => Boolean) with_kids: boolean;
    @IsBoolean() @Type(() => Boolean) with_pets: boolean;
}

export class PhotoUploadDto {
    @IsUrl() photo_url: string;
    @IsOptional() @IsBoolean() @Type(() => Boolean) is_main?: boolean;
}

export class AccommodationBaseDto {
    @IsString() @IsIn(VALID_ACCOM_TYPES) accom_type: string;
    @IsString() title: string;
    @IsOptional() @IsString() description?: string;
    @IsNumber() @Type(() => Number) rooms_num: number;
    @IsOptional() @IsNumber() @Type(() => Number) living_space?: number;
    @IsBoolean() @Type(() => Boolean) is_decorated: boolean;
}

export class CreateAccommodationDto {
    @ValidateNested() @Type(() => AddressDto) address: AddressDto;
    @ValidateNested()
    @Type(() => AccommodationBaseDto)
    accommodation: AccommodationBaseDto;
    @ValidateNested() @Type(() => RentTermsDto) rent_terms: RentTermsDto;
    @IsArray()
    @IsNumber({}, { each: true })
    @Type(() => Number)
    facility_ids: number[];
}

export class UpdateAccommodationDto {
    @IsOptional() @IsString() title?: string;
    @IsOptional() @IsString() description?: string;
    @IsOptional() @IsNumber() @Type(() => Number) rooms_num?: number;
    @IsOptional() @IsNumber() @Type(() => Number) living_space?: number;
    @IsOptional() @IsBoolean() @Type(() => Boolean) is_decorated?: boolean;
    @IsOptional() @IsBoolean() @Type(() => Boolean) is_published?: boolean;

    @IsOptional()
    rent_terms?: {
        util_serv_pay?: string;
        price?: number;
        deposit?: number;
        commission?: number;
        with_kids?: boolean;
        with_pets?: boolean;
    };

    @IsOptional()
    @IsArray()
    @IsNumber({}, { each: true })
    @Type(() => Number)
    facility_ids?: number[];
    @IsOptional() @IsString() @IsIn(VALID_ACCOM_TYPES) accom_type?: string;
}

@EntityController({ baseRoute: '/accommodations', entity: Accommodation })
@UseBefore(authMiddleware)
@OpenAPI({ tags: ['Accommodations'], security: [{ bearerAuth: [] }] })
export default class AccommodationController extends BaseController {
    @Get('/me')
    @OpenAPI({ summary: 'Get my accommodations' })
    async myAccommodations(
        @Req() req: RequestWithUser,
        @QueryParam('search') search?: string,
    ) {
        const qb = this.repository
            .createQueryBuilder('accom')
            .leftJoinAndSelect('accom.address', 'address')
            .where('accom.landlord_id = :landlordId', {
                landlordId: req.user.id,
            });

        if (search) {
            qb.andWhere(
                '(accom.title ILIKE :search OR address.city ILIKE :search)',
                { search: `%${search}%` },
            );
        }

        const [items, total] = await qb.getManyAndCount();
        return { items, total };
    }

    @Get('')
    @OpenAPI({ summary: 'Get accommodations list' })
    async list(
        @QueryParam('city') city?: string,
        @QueryParam('district') district?: string,
        @QueryParam('accom_type') accom_type?: string,
        @QueryParam('rooms_num') rooms_num?: number,
        @QueryParam('page') page: number = 1,
        @QueryParam('limit') limit: number = 10,
        @QueryParam('sort') sort?: string,
    ) {
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
            qb.orderBy(
                `accom.${field || 'id'}`,
                (order?.toUpperCase() as any) || 'DESC',
            );
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
            ...(body.address.building && { building: body.address.building }),
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
