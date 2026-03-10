import { Body, Post } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { IsString, IsEmail, MinLength, ValidateNested } from 'class-validator';
import { Type, Expose } from 'class-transformer';
import jwt from 'jsonwebtoken';

import SETTINGS from '../config/settings';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { User } from '../models/user.entity';

import checkPassword from '../utils/check-password';
import hashPassword from '../utils/hash-password';

class LoginDto {
    @Expose()
    @IsEmail()
    email: string;

    @Expose()
    @IsString()
    password: string;
}

class LoginResponseDto {
    @IsString()
    @Type(() => String)
    accessToken: string;

    @IsString()
    @Type(() => String)
    refreshToken: string;
}

class AuthTokensResponseDto {
    @ValidateNested()
    @Type(() => LoginResponseDto)
    data: LoginResponseDto;
}

class RegisterDto {
    @Expose()
    @IsEmail()
    email: string;

    @Expose()
    @IsString()
    @MinLength(6)
    password: string;

    @Expose()
    @IsString()
    firstName: string;

    @Expose()
    @IsString()
    lastName: string;
}

@EntityController({
    baseRoute: '/auth',
    entity: User,
})
class AuthController extends BaseController {
    private generateTokens(user: User): LoginResponseDto {
        const accessToken = jwt.sign(
            { user: { id: user.id, role: user.role } },
            SETTINGS.JWT_SECRET_KEY,
            {
                expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME,
            },
        );

        const refreshToken = jwt.sign(
            { user: { id: user.id, role: user.role }, type: 'refresh' },
            SETTINGS.JWT_SECRET_KEY,
            {
                expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME * 12,
            },
        );

        return { accessToken, refreshToken };
    }

    @Post('/login')
    @OpenAPI({ summary: 'Авторизация пользователя' })
    @ResponseSchema(AuthTokensResponseDto, { statusCode: 200 })
    async login(
        @Body({ type: LoginDto }) loginData: LoginDto,
    ): Promise<AuthTokensResponseDto | { code: string; message: string }> {
        const { email, password } = loginData;
        const user = await this.repository.findOneBy({ email });

        if (!user) {
            return { code: 'USER_NOT_FOUND', message: 'Пользователь не найден' };
        }

        const userPassword = user.password;
        const isPasswordCorrect = checkPassword(userPassword, password);

        if (!isPasswordCorrect) {
            return {
                code: 'INVALID_CREDENTIALS',
                message: 'Пароль или email некорректны',
            };
        }

        const tokens = this.generateTokens(user as User);

        return { data: tokens };
    }

    @Post('/register')
    @OpenAPI({ summary: 'Регистрация нового пользователя' })
    @ResponseSchema(AuthTokensResponseDto, { statusCode: 200 })
    async register(
        @Body({ type: RegisterDto }) registerData: RegisterDto,
    ): Promise<AuthTokensResponseDto | { code: string; message: string }> {
        const { email, password, firstName, lastName } = registerData;

        const existing = await this.repository.findOneBy({ email });
        if (existing) {
            return {
                code: 'EMAIL_EXISTS',
                message: 'Пользователь с этим email уже существует',
            };
        }

        const user = this.repository.create({
            email,
            password: hashPassword(password),
            firstName,
            lastName,
        } as Partial<User>);

        const savedUser = await this.repository.save(user);
        const tokens = this.generateTokens(savedUser as User);

        return { data: tokens };
    }
}

export default AuthController;
