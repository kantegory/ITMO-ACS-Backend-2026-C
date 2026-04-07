import {
    Get,
    Patch,
    Delete,
    Param,
    QueryParams,
    Body,
    Req,
    UseBefore,
    NotFoundError,
    UnauthorizedError,
} from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { User as UserEntity } from '../models/user.entity';
import { Rent as RentEntity } from '../models/rent.entity';
import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';

import {
    ApiUser,
    ApiRole,
    ApiUserResponse,
    ApiUpdateProfileRequest,
    UserRentsResponseDto,
    UsersListQueryDto,
} from '../dto/user';

@EntityController({ baseRoute: '/users', entity: UserEntity })
export default class UsersController extends BaseController {
    @Get('/')
    @UseBefore(authMiddleware)
    @OpenAPI({
        summary: 'List users',
        tags: ['User'],
        security: [{ bearerAuth: [] }],
    })
    @ResponseSchema(ApiUser, { statusCode: 200, isArray: true })
    async list(
        @Req() req: RequestWithUser,
        @QueryParams() query: UsersListQueryDto,
    ) {
        if (req.user.role !== 'admin') {
            throw new UnauthorizedError('Admin access required');
        }

        const { page = 1, limit = 10, sort = 'created_at' } = query;

        const [items, total] = await this.repository.findAndCount({
            take: limit,
            skip: (page - 1) * limit,
            order: { [sort]: 'DESC' },
            select: [
                'id',
                'role',
                'first_name',
                'middle_name',
                'last_name',
                'is_verified',
                'email',
            ],
        });

        return {
            items: items.map((user) => ({
                id: user.id,
                role: user.role as ApiRole,
                first_name: user.first_name,
                middle_name: user.middle_name,
                last_name: user.last_name,
                email: user.email,
                is_verified: user.is_verified,
            })),
            total,
            page,
            limit,
        };
    }

    @Get('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({
        summary: 'Get user by ID',
        tags: ['User'],
        security: [{ bearerAuth: [] }],
    })
    @ResponseSchema(ApiUserResponse, { statusCode: 200 })
    async read(@Param('id') id: number) {
        const user = await this.repository.findOne({
            where: { id },
            select: ['first_name', 'middle_name', 'last_name', 'email'],
        });

        if (!user) throw new NotFoundError('User not found');
        return user;
    }

    @Patch('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({
        summary: 'Update user profile',
        tags: ['User'],
        security: [{ bearerAuth: [] }],
    })
    @ResponseSchema(ApiUser, { statusCode: 200 })
    async update(
        @Req() req: RequestWithUser,
        @Param('id') id: number,
        @Body() body: ApiUpdateProfileRequest,
    ) {
        if (req.user.id !== id) {
            throw new UnauthorizedError('Access denied');
        }

        const user = await this.repository.findOneBy({ id });
        if (!user) throw new NotFoundError('User not found');

        Object.assign(user, body);
        return this.repository.save(user);
    }

    @Delete('/:id')
    @UseBefore(authMiddleware)
    @OpenAPI({
        summary: 'Delete user',
        tags: ['User'],
        security: [{ bearerAuth: [] }],
    })
    async delete(@Req() req: RequestWithUser, @Param('id') id: number) {
        if (req.user.id !== id) {
            throw new UnauthorizedError('Access denied');
        }

        const user = await this.repository.findOneBy({ id });
        if (!user) throw new NotFoundError('User not found');

        await this.repository.remove(user);
        return { statusCode: 204 };
    }

    @Get('/:id/rents')
    @UseBefore(authMiddleware)
    @OpenAPI({
        summary: 'Get user rents',
        tags: ['User'],
        security: [{ bearerAuth: [] }],
    })
    @ResponseSchema(UserRentsResponseDto, { statusCode: 200 })
    async getRents(@Req() req: RequestWithUser, @Param('id') id: number) {
        if (req.user.role !== 'admin' && req.user.id !== id) {
            throw new UnauthorizedError('Access denied');
        }

        const rentRepo = dataSource.getRepository(RentEntity);

        const asTenant = await rentRepo.find({
            where: { tenant_id: id },
            relations: ['tenant', 'landlord', 'accommodation'],
            order: { created_at: 'DESC' },
        });

        const asLandlord = await rentRepo
            .createQueryBuilder('rent')
            .leftJoinAndSelect('rent.accommodation', 'accom')
            .leftJoinAndSelect('rent.tenant', 'tenant')
            .where('accom.landlord_id = :landlordId', { landlordId: id })
            .orderBy('rent.created_at', 'DESC')
            .getMany();

        return {
            as_tenant: asTenant,
            as_landlord: asLandlord,
        };
    }

    @Get('/:id/conversations')
    @UseBefore(authMiddleware)
    @OpenAPI({
        summary: 'Get user conversations',
        tags: ['User'],
        security: [{ bearerAuth: [] }],
    })
    async getConversations(
        @Req() req: RequestWithUser,
        @Param('id') id: number,
    ) {
        if (req.user.id !== id) {
            throw new UnauthorizedError('Access denied');
        }
        return [];
    }
}
