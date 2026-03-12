import {
    BadRequestError,
    ForbiddenError,
    NotFoundError,
    Param,
    Body,
    Get,
    Post,
    Put,
    Patch,
    UseBefore,
    Req,
    QueryParams,
} from 'routing-controllers';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { User } from '../models/user.entity';
import { Review } from '../models/review.entity';
import {
    CreateUserDto,
    ListUsersQueryDto,
    PatchUserDto,
    UpdateUserDto,
} from '../dto/user.dto';

import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';
import dataSource from '../config/data-source';

@EntityController({
    baseRoute: '/users',
    entity: User,
})
class UserController extends BaseController {
    @Get('')
    async getAll(@QueryParams() query: ListUsersQueryDto) {
        const limit = query.limit || 20;
        const offset = query.offset || 0;

        const where = query.type ? { type: query.type } : {};
        const [data, total] = await this.repository.findAndCount({
            where,
            take: limit,
            skip: offset,
            order: { id: 'ASC' },
        });

        return { data: data.map(this.toPublicUser), total };
    }

    @Post('')
    async create(@Body({ type: CreateUserDto }) payload: CreateUserDto) {
        const exists = await this.repository.findOneBy({ email: payload.email });
        if (exists) {
            throw new BadRequestError('Email already exists');
        }

        const createdUser = this.repository.create({
            name: payload.name,
            email: payload.email,
            phone: payload.phone || null,
            password: payload.password,
            type: payload.type,
        }) as User;

        const result = (await this.repository.save(createdUser)) as User;
        return this.toPublicUser(result);
    }

    @Get('/:id')
    async getById(@Param('id') id: number) {
        const results = await this.repository.findOneBy({ id });
        if (!results) {
            throw new NotFoundError('User is not found');
        }

        return this.toPublicUser(results as User);
    }

    @Put('/:id')
    @UseBefore(authMiddleware)
    async replace(
        @Param('id') id: number,
        @Body({ type: UpdateUserDto }) payload: UpdateUserDto,
        @Req() request: RequestWithUser,
    ) {
        this.assertUserCanEdit(request.user.id, id);

        const entity = (await this.repository.findOneBy({ id })) as User | null;
        if (!entity) {
            throw new NotFoundError('User is not found');
        }

        entity.name = payload.name;
        entity.email = payload.email;
        entity.phone = payload.phone || null;
        entity.type = payload.type;

        const result = (await this.repository.save(entity)) as User;
        return this.toPublicUser(result);
    }

    @Patch('/:id')
    @UseBefore(authMiddleware)
    async update(
        @Param('id') id: number,
        @Body({ type: PatchUserDto }) user: PatchUserDto,
        @Req() request: RequestWithUser,
    ) {
        this.assertUserCanEdit(request.user.id, id);

        if (Object.keys(user).length === 0) {
            throw new BadRequestError('Patch payload should not be empty');
        }

        const userForUpdate = (await this.repository.findOneBy({
            id,
        })) as User | null;
        if (!userForUpdate) {
            throw new NotFoundError('User is not found');
        }

        Object.assign(userForUpdate, user);

        const results = (await this.repository.save(userForUpdate)) as User;

        return this.toPublicUser(results);
    }

    @Get('/:id/reviews')
    async getUserReviews(@Param('id') id: number) {
        const target = await this.repository.findOneBy({ id });
        if (!target) {
            throw new NotFoundError('User is not found');
        }

        const reviewRepository = dataSource.getRepository(Review);
        const data = await reviewRepository.find({
            where: { targetId: id },
            order: { createdAt: 'DESC' },
        });

        return { data };
    }

    private assertUserCanEdit(currentUserId: number, targetUserId: number): void {
        if (currentUserId !== targetUserId) {
            throw new ForbiddenError('You can edit only your profile');
        }
    }

    private toPublicUser(user: User) {
        return {
            id: user.id,
            createdAt: user.createdAt,
            name: user.name,
            email: user.email,
            phone: user.phone,
            type: user.type,
        };
    }
}

export default UserController;
