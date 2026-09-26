import {
    JsonController,
    Get,
    Patch,
    Param,
    QueryParam,
    Body,
    UseBefore,
    BadRequestError,
    NotFoundError,
} from 'routing-controllers';
import { In } from 'typeorm';

import dataSource from '../config/data-source';
import { User } from '../models/user.entity';

import internalTokenMiddleware from '../middlewares/internal-token.middleware';

import {
    UserShortResponseDto,
    UserInternalResponseDto,
    RoleUpdateDto,
    toUserShortResponseDto,
    toUserInternalResponseDto,
} from '../dto/user-internal.dto';

// Внутренний API auth (docs/openapi-internal.yaml). Пути без /api/v1 —
// регистрируются отдельным вызовом useExpressServer в app.ts, gateway их не публикует.
@JsonController('/internal/users')
@UseBefore(internalTokenMiddleware)
class InternalUserController {
    private get repository() {
        return dataSource.getRepository(User);
    }

    // GET /internal/users?ids=3,4
    @Get()
    async getUsersShort(
        @QueryParam('ids') idsParam: string,
    ): Promise<UserShortResponseDto[]> {
        const ids = this.parseIds(idsParam);

        const users = await this.repository.findBy({ id: In(ids) });

        return users.map(toUserShortResponseDto);
    }

    // GET /internal/users/{userId}
    @Get('/:userId')
    async getUserInternal(
        @Param('userId') userId: number,
    ): Promise<UserInternalResponseDto> {
        const user = await this.repository.findOneBy({ id: userId });

        if (!user) {
            throw new NotFoundError('Пользователь не найден');
        }

        return toUserInternalResponseDto(user);
    }

    // PATCH /internal/users/{userId}/role
    @Patch('/:userId/role')
    async updateUserRole(
        @Param('userId') userId: number,
        @Body({ type: RoleUpdateDto }) roleUpdate: RoleUpdateDto,
    ): Promise<UserInternalResponseDto> {
        const user = await this.repository.findOneBy({ id: userId });

        if (!user) {
            throw new NotFoundError('Пользователь не найден');
        }

        user.role = roleUpdate.role;
        await this.repository.save(user);

        return toUserInternalResponseDto(user);
    }

    // "ids" через запятую, не более 100, каждое — целое положительное число.
    private parseIds(idsParam: string): number[] {
        if (!idsParam) {
            throw new BadRequestError('Неверные параметры запроса');
        }

        const ids = idsParam.split(',').map((part) => Number(part.trim()));

        const isValid =
            ids.length > 0 &&
            ids.length <= 100 &&
            ids.every((id) => Number.isInteger(id) && id >= 1);

        if (!isValid) {
            throw new BadRequestError('Неверные параметры запроса');
        }

        return ids;
    }
}

export default InternalUserController;
