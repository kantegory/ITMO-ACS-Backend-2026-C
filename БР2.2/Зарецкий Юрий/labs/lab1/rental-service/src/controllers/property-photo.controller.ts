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
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { PropertyPhoto } from '../models/property-photo.entity';
import {
    CreatePropertyPhotoDto,
    UpdatePropertyPhotoDto,
} from '../dto/property-photo.dto';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';
import { Property } from '../models/property.entity';

@EntityController({
    baseRoute: '/properties',
    entity: PropertyPhoto,
})
class PropertyPhotoController extends BaseController {
    @Get('/:propertyId/photos')
    @OpenAPI({ summary: 'List photos of a property' })
    async getAll(@Param('propertyId') propertyId: number) {
        return await this.repository.find({
            where: { propertyId },
            order: { sortOrder: 'ASC' },
        });
    }

    @Post('/:propertyId/photos')
    @HttpCode(201)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Add photo to property', security: [{ bearerAuth: [] }] })
    async create(
        @Param('propertyId') propertyId: number,
        @Req() request: RequestWithUser,
        @Body({ type: CreatePropertyPhotoDto }) data: CreatePropertyPhotoDto,
    ) {
        const propertyRepo = dataSource.getRepository(Property);
        const property = await propertyRepo.findOneBy({ id: propertyId });
        if (!property) return { message: 'Property not found' };
        if (property.ownerId !== request.user.id) {
            return { message: 'Forbidden: not the owner' };
        }

        const count = await this.repository.countBy({ propertyId });
        if (count >= 20) {
            return { message: 'Maximum 20 photos allowed' };
        }

        const photo = this.repository.create({ ...data, propertyId });
        return await this.repository.save(photo);
    }

    @Patch('/:propertyId/photos/:photoId')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Update photo', security: [{ bearerAuth: [] }] })
    async update(
        @Param('propertyId') propertyId: number,
        @Param('photoId') photoId: number,
        @Req() request: RequestWithUser,
        @Body({ type: UpdatePropertyPhotoDto }) data: UpdatePropertyPhotoDto,
    ) {
        const propertyRepo = dataSource.getRepository(Property);
        const property = await propertyRepo.findOneBy({ id: propertyId });
        if (!property) return { message: 'Property not found' };
        if (property.ownerId !== request.user.id) {
            return { message: 'Forbidden: not the owner' };
        }

        const photo = await this.repository.findOneBy({ id: photoId, propertyId });
        if (!photo) return { message: 'Photo not found' };

        Object.assign(photo, data);
        return await this.repository.save(photo);
    }

    @Delete('/:propertyId/photos/:photoId')
    @HttpCode(204)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Delete photo', security: [{ bearerAuth: [] }] })
    async delete(
        @Param('propertyId') propertyId: number,
        @Param('photoId') photoId: number,
        @Req() request: RequestWithUser,
    ) {
        const propertyRepo = dataSource.getRepository(Property);
        const property = await propertyRepo.findOneBy({ id: propertyId });
        if (!property) return { message: 'Property not found' };
        if (property.ownerId !== request.user.id) {
            return { message: 'Forbidden: not the owner' };
        }

        const photo = await this.repository.findOneBy({ id: photoId, propertyId });
        if (!photo) return { message: 'Photo not found' };

        await this.repository.remove(photo);
        return '';
    }
}

export default PropertyPhotoController;
