import { Body, Get, Patch, Req, UseBefore } from 'routing-controllers';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { User } from '../models/user.entity';

import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';

import { UserResponseDto, UserUpdateDto, toUserResponseDto } from '../dto/user.dto';

// Личный кабинет пользователя (без /users/me/bookings — это операция bookings-service).
@EntityController({
    baseRoute: '/users',
    entity: User,
})
class UserController extends BaseController {
    // GET /users/me
    @Get('/me')
    @UseBefore(authMiddleware)
    async getMe(@Req() request: RequestWithUser): Promise<UserResponseDto> {
        const user = await this.repository.findOneBy({ id: request.user.id });

        return toUserResponseDto(user as User);
    }

    // PATCH /users/me
    @Patch('/me')
    @UseBefore(authMiddleware)
    async updateMe(
        @Req() request: RequestWithUser,
        @Body({ type: UserUpdateDto }) updateData: UserUpdateDto,
    ): Promise<UserResponseDto> {
        const user = await this.repository.findOneBy({ id: request.user.id });

        Object.assign(user as User, updateData);
        await this.repository.save(user as User);

        return toUserResponseDto(user as User);
    }
}

export default UserController;
