import { Body, Get, Patch, UseBefore, Req } from 'routing-controllers';
import { OpenAPI } from 'routing-controllers-openapi';
import { IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ResponseSchema } from 'routing-controllers-openapi';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { User } from '../models/user.entity';

import authMiddleware, {
    RequestWithUser,
} from '../middlewares/auth.middleware';

class UpdateMeDto {
    @IsOptional()
    @IsString()
    @Type(() => String)
    firstName?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    lastName?: string;
}

class UserDto {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    createdAt: Date;
}

class UserResponseDto {
    data: UserDto;
}

@EntityController({
    baseRoute: '/users',
    entity: User,
})
class UserController extends BaseController {
    @Get('/me')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Получение информации о текущем пользователе' })
    @ResponseSchema(UserResponseDto, { statusCode: 200 })
    async me(@Req() request: RequestWithUser): Promise<UserResponseDto> {
        const { user } = request;
        const results = await this.repository.findOneBy({ id: user.id });
        if (!results) return { data: null } as UserResponseDto;
        const { password: _, ...userData } = results;
        return { data: userData as UserDto };
    }

    @Patch('/me')
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Обновление информации о текущем пользователе' })
    @ResponseSchema(UserResponseDto, { statusCode: 200 })
    async update(
        @Req() request: RequestWithUser,
        @Body({ type: UpdateMeDto }) user: UpdateMeDto,
    ): Promise<UserResponseDto> {
        const { user: authUser } = request;
        const userForUpdate = await this.repository.findOneBy({
            id: authUser.id,
        });
        if (!userForUpdate) throw new Error('User not found');
        Object.assign(userForUpdate, user);

        const results = await this.repository.save(userForUpdate);
        const { password: _, ...userData } = results;
        return { data: userData as UserDto };
    }
}

export default UserController;
