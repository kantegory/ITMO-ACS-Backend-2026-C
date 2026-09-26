import { Body, Post, HttpCode, UnauthorizedError } from 'routing-controllers';
import jwt from 'jsonwebtoken';

import SETTINGS from '../config/settings';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { User } from '../models/user.entity';

import { ConflictError } from '../errors/http-errors';
import { RegisterDto, LoginDto, AuthResponseDto } from '../dto/auth.dto';
import { toUserResponseDto } from '../dto/user.dto';

import checkPassword from '../utils/check-password';

// Копия лр1/src/controllers/auth.controller.ts — единственное место, где выдаётся JWT-токен.
@EntityController({
    baseRoute: '/auth',
    entity: User,
})
class AuthController extends BaseController {
    private issueTokenResponse(user: User): AuthResponseDto {
        const accessToken = jwt.sign(
            { user: { id: user.id, role: user.role } },
            SETTINGS.JWT_SECRET_KEY,
            { expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME },
        );

        return {
            access_token: accessToken,
            token_type: SETTINGS.JWT_TOKEN_TYPE,
            expires_in: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME,
            user: toUserResponseDto(user),
        };
    }

    // POST /auth/register
    @Post('/register')
    @HttpCode(201)
    async register(
        @Body({ type: RegisterDto }) registerData: RegisterDto,
    ): Promise<AuthResponseDto> {
        const existingUser = await this.repository.findOneBy({
            email: registerData.email,
        });

        if (existingUser) {
            throw new ConflictError('Email is already taken');
        }

        const user = this.repository.create(registerData);
        await this.repository.save(user);

        return this.issueTokenResponse(user as User);
    }

    // POST /auth/login
    @Post('/login')
    async login(
        @Body({ type: LoginDto }) loginData: LoginDto,
    ): Promise<AuthResponseDto> {
        const { email, password } = loginData;
        const user = await this.repository.findOneBy({ email });

        if (!user || !checkPassword(user.password, password)) {
            throw new UnauthorizedError('Email or password is incorrect');
        }

        return this.issueTokenResponse(user as User);
    }
}

export default AuthController;
