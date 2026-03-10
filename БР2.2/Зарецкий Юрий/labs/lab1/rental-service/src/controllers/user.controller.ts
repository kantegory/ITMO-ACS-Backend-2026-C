import {
    Param,
    Body,
    Get,
    Patch,
    Put,
    UseBefore,
    Req,
    QueryParam,
} from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { User } from '../models/user.entity';
import { UpdateUserDto, ChangePasswordDto } from '../dto/user.dto';

import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';
import checkPassword from '../utils/check-password';
import hashPassword from '../utils/hash-password';
import dataSource from '../config/data-source';
import { RentDeal } from '../models/rent-deal.entity';

@EntityController({
    baseRoute: '/users',
    entity: User,
})
class UserController extends BaseController {
    @Get('/me')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Get current user profile', security: [{ bearerAuth: [] }] })
    async me(@Req() request: RequestWithUser) {
        const { user } = request;
        const result = await this.repository.findOne({
            where: { id: user.id },
            select: ['id', 'email', 'fullName', 'phone', 'avatarUrl', 'createdAt', 'updatedAt'],
        });
        return result;
    }

    @Patch('/me')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Update current user profile', security: [{ bearerAuth: [] }] })
    async updateMe(
        @Req() request: RequestWithUser,
        @Body({ type: UpdateUserDto }) data: UpdateUserDto,
    ) {
        const { user } = request;
        await this.repository.update(user.id, data);
        const updated = await this.repository.findOne({
            where: { id: user.id },
            select: ['id', 'email', 'fullName', 'phone', 'avatarUrl', 'createdAt', 'updatedAt'],
        });
        return updated;
    }

    @Put('/me/password')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Change password', security: [{ bearerAuth: [] }] })
    async changePassword(
        @Req() request: RequestWithUser,
        @Body({ type: ChangePasswordDto }) data: ChangePasswordDto,
    ) {
        const { user } = request;
        const currentUser = await this.repository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.id = :id', { id: user.id })
            .getOne() as User;

        if (!checkPassword(currentUser.password, data.currentPassword)) {
            return { message: 'Current password is incorrect' };
        }

        currentUser.password = data.newPassword;
        await this.repository.save(currentUser);

        return { success: true, message: 'Password changed successfully' };
    }

    @Get('/me/rentals')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'My rentals as tenant', security: [{ bearerAuth: [] }] })
    async myRentals(
        @Req() request: RequestWithUser,
        @QueryParam('status') status?: string,
        @QueryParam('page') page: number = 1,
        @QueryParam('limit') limit: number = 20,
    ) {
        const dealRepo = dataSource.getRepository(RentDeal);
        const where: any = { tenantId: request.user.id };
        if (status) where.status = status;

        const [data, total] = await dealRepo.findAndCount({
            where,
            relations: ['property', 'owner'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    @Get('/me/bookings')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Bookings on my properties as owner', security: [{ bearerAuth: [] }] })
    async myBookings(
        @Req() request: RequestWithUser,
        @QueryParam('status') status?: string,
        @QueryParam('page') page: number = 1,
        @QueryParam('limit') limit: number = 20,
    ) {
        const dealRepo = dataSource.getRepository(RentDeal);
        const where: any = { ownerId: request.user.id };
        if (status) where.status = status;

        const [data, total] = await dealRepo.findAndCount({
            where,
            relations: ['property', 'tenant'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    @Get('/:id')
    @OpenAPI({ summary: 'Get public user profile' })
    async getById(@Param('id') id: number) {
        const user = await this.repository.findOne({
            where: { id },
            select: ['id', 'email', 'fullName', 'phone', 'avatarUrl', 'createdAt'],
        });
        if (!user) {
            return { message: 'User not found' };
        }
        return user;
    }
}

export default UserController;
