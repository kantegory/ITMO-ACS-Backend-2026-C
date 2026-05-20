import {
    Post,
    Body,
    HeaderParam,
    UnauthorizedError,
} from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import jwt from 'jsonwebtoken';

import SETTINGS from '../config/settings';
import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';
import { User as UserEntity } from '../models/user.entity';
import checkPassword from '../utils/check-password';
import hashPassword from '../utils/hash-password';
// import { ApiUser, ApiRole } from './user.controller';
import { ApiRole } from '../dto/user';

import {
    ApiLoginRequest,
    ApiRegisterRequest,
    ApiLoginResponse,
    ApiUnauthorized,
    ApiConflict,
    ApiValidation,
    ApiServerError,
    ApiError,
} from '../dto/auth';

@EntityController({
    baseRoute: '/auth',
    entity: UserEntity,
})
export default class AuthController extends BaseController {
    @Post('/login')
    @OpenAPI({
        summary: 'User login',
        tags: ['Auth'],
    })
    @ResponseSchema(ApiLoginResponse, { statusCode: 200 })
    @ResponseSchema(ApiUnauthorized, { statusCode: 401 })
    @ResponseSchema(ApiValidation, { statusCode: 422 })
    @ResponseSchema(ApiServerError, { statusCode: 500 })
    async login(
        @Body() body: ApiLoginRequest,
    ): Promise<ApiLoginResponse | ApiUnauthorized> {
        const { email, password } = body;

        const user = await this.repository.findOne({
            where: { email },
            select: [
                'id',
                'password',
                'role',
                'first_name',
                'middle_name',
                'last_name',
                'email',
                'is_verified',
            ],
        });

        if (!user) {
            return {
                code: 401,
                message: 'Password or email is incorrect',
            };
        }

        const isPasswordCorrect = checkPassword(user.password, password);

        if (!isPasswordCorrect) {
            return {
                code: 401,
                message: 'Password or email is incorrect',
            };
        }

        const token = jwt.sign(
            { user: { id: user.id } },
            SETTINGS.JWT_SECRET_KEY,
            { expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME },
        );

        return {
            token,
            user: {
                id: Number(user.id),
                role: user.role as ApiRole,
                first_name: user.first_name,
                middle_name: user.middle_name || undefined,
                last_name: user.last_name,
                email: user.email,
                is_verified: Boolean(user.is_verified),
            },
        };
    }

    @Post('/register')
    @OpenAPI({
        summary: 'User registration',
        tags: ['Auth'],
    })
    @ResponseSchema(ApiLoginResponse, { statusCode: 201 })
    @ResponseSchema(ApiConflict, { statusCode: 409 })
    @ResponseSchema(ApiValidation, { statusCode: 422 })
    @ResponseSchema(ApiServerError, { statusCode: 500 })
    async register(
        @Body() body: ApiRegisterRequest,
    ): Promise<ApiLoginResponse | ApiConflict> {
        const existingUser = await this.repository.findOneBy({
            email: body.email,
        });

        if (existingUser) {
            return {
                code: 409,
                message: 'Conflict: Duplicate resource or constraint violation',
            };
        }

        const hashedPassword = hashPassword(body.password);

        const user = this.repository.create({
            email: body.email,
            password: hashedPassword,
            first_name: body.first_name,
            last_name: body.last_name,
            middle_name: body.middle_name,
            role: ApiRole.User,
            is_verified: false,
        });

        await this.repository.save(user);

        const token = jwt.sign(
            { user: { id: user.id } },
            SETTINGS.JWT_SECRET_KEY,
            { expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME },
        );

        return {
            token,
            user: {
                id: Number(user.id),
                role: user.role as ApiRole,
                first_name: user.first_name,
                middle_name: user.middle_name || undefined,
                last_name: user.last_name,
                email: user.email,
                is_verified: Boolean(user.is_verified),
            },
        };
    }

    @Post('/logout')
    @OpenAPI({ summary: 'User logout', tags: ['Auth'] })
    @ResponseSchema(ApiError, { statusCode: 401 })
    @ResponseSchema(ApiError, { statusCode: 500 })
    logout(@HeaderParam('authorization') authorization?: string): null {
        if (!authorization?.startsWith('Bearer ')) {
            throw new UnauthorizedError('Unauthorized');
        }
        return null;
    }
}
