import { Body, Post, HttpCode, UseBefore, Req } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { IsString } from 'class-validator';
import { Type } from 'class-transformer';
import jwt from 'jsonwebtoken';

import SETTINGS from '../config/settings';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { User } from '../models/user.entity';
import { RegisterDto, LoginDto, RefreshTokenDto } from '../dto/auth.dto';

import checkPassword from '../utils/check-password';
import authMiddleware, { RequestWithUser } from '../middlewares/auth.middleware';

class AuthResponseDto {
    @IsString()
    @Type(() => String)
    accessToken: string;

    @IsString()
    @Type(() => String)
    refreshToken: string;

    @IsString()
    @Type(() => String)
    tokenType: string;
}

class ErrorResponseDto {
    @IsString()
    @Type(() => String)
    message: string;
}

function generateTokens(userId: number) {
    const accessToken = jwt.sign(
        { user: { id: userId } },
        SETTINGS.JWT_SECRET_KEY,
        { expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME },
    );
    const refreshToken = jwt.sign(
        { user: { id: userId }, type: 'refresh' },
        SETTINGS.JWT_SECRET_KEY,
        { expiresIn: '7d' },
    );
    return { accessToken, refreshToken, tokenType: 'Bearer' };
}

@EntityController({
    baseRoute: '/auth',
    entity: User,
})
class AuthController extends BaseController {
    @Post('/register')
    @HttpCode(201)
    @OpenAPI({ summary: 'Register a new user' })
    @ResponseSchema(AuthResponseDto, { statusCode: 201 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 400 })
    async register(
        @Body({ type: RegisterDto }) data: RegisterDto,
    ) {
        const existing = await this.repository.findOneBy({ email: data.email });
        if (existing) {
            return { message: 'User with this email already exists' };
        }

        const user = this.repository.create(data);
        const saved = await this.repository.save(user);

        const tokens = generateTokens(saved.id);
        const userResponse = await this.repository.findOneBy({ id: saved.id });

        return { ...tokens, user: userResponse };
    }

    @Post('/login')
    @OpenAPI({ summary: 'Login' })
    @ResponseSchema(AuthResponseDto, { statusCode: 200 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 400 })
    async login(
        @Body({ type: LoginDto }) loginData: LoginDto,
    ) {
        const { email, password } = loginData;
        const user = await this.repository
            .createQueryBuilder('user')
            .addSelect('user.password')
            .where('user.email = :email', { email })
            .getOne() as User;

        if (!user) {
            return { message: 'User is not found' };
        }

        const isPasswordCorrect = checkPassword(user.password, password);
        if (!isPasswordCorrect) {
            return { message: 'Password or email is incorrect' };
        }

        const tokens = generateTokens(user.id);
        const userResponse = await this.repository.findOneBy({ id: user.id });

        return { ...tokens, user: userResponse };
    }

    @Post('/refresh')
    @OpenAPI({ summary: 'Refresh tokens' })
    @ResponseSchema(AuthResponseDto, { statusCode: 200 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 400 })
    async refresh(
        @Body({ type: RefreshTokenDto }) data: RefreshTokenDto,
    ) {
        try {
            const decoded: any = jwt.verify(
                data.refreshToken,
                SETTINGS.JWT_SECRET_KEY,
            );
            if (!decoded.user || decoded.type !== 'refresh') {
                return { message: 'Invalid refresh token' };
            }
            return generateTokens(decoded.user.id);
        } catch {
            return { message: 'Invalid or expired refresh token' };
        }
    }

    @Post('/logout')
    @HttpCode(204)
    @UseBefore(authMiddleware)
    @OpenAPI({ summary: 'Logout', security: [{ bearerAuth: [] }] })
    async logout(@Req() request: RequestWithUser) {
        return '';
    }
}

export default AuthController;
