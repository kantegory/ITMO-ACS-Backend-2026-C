import { Body, Post, HttpCode } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import { IsEmail, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { Type } from 'class-transformer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

import SETTINGS from '../config/settings';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { User, UserType } from '../models/user.entity';

import checkPassword from '../utils/check-password';

class RegisterDto {
    @IsString()
    @Type(() => String)
    @Length(1, 255)
    name: string;

    @IsEmail()
    @Type(() => String)
    email: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    @Length(0, 32)
    phone?: string;

    @IsString()
    @Type(() => String)
    @Length(6, 150)
    password: string;

    @IsEnum(UserType)
    @Type(() => String)
    type: UserType;
}

class LoginDto {
    @IsEmail()
    @Type(() => String)
    email: string;

    @IsString()
    @Type(() => String)
    password: string;
}

class AuthResponseDto {
    @IsString()
    @Type(() => String)
    accessToken: string;
}

class ErrorResponseDto {
    @IsString()
    @Type(() => String)
    message: string;
}

@EntityController({
    baseRoute: '/auth',
    entity: User,
})
class AuthController extends BaseController {
    @Post('/register')
    @HttpCode(201)
    @OpenAPI({ summary: 'Регистрация нового пользователя' })
    @ResponseSchema(AuthResponseDto, { statusCode: 201 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 400 })
    async register(
        @Body({ type: RegisterDto }) registerData: RegisterDto,
    ): Promise<AuthResponseDto | ErrorResponseDto> {
        const { name, email, phone, password, type } = registerData;

        const existingUser = await this.repository.findOneBy({ email });

        if (existingUser) {
            return { message: 'User with this email already exists' };
        }

        const hashedPw = await bcrypt.hash(password, 10);

        const user = this.repository.create({
            name,
            email,
            phone: phone ?? null,
            hashedPw,
            type,
        });

        await this.repository.save(user);

        const accessToken = jwt.sign(
            { user: { id: user.id } },
            SETTINGS.JWT_SECRET_KEY,
            {
                expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME,
            },
        );

        return { accessToken };
    }

    @Post('/login')
    @OpenAPI({ summary: 'Login' })
    @ResponseSchema(AuthResponseDto, { statusCode: 200 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 400 })
    async login(
        @Body({ type: LoginDto }) loginData: LoginDto,
    ): Promise<AuthResponseDto | ErrorResponseDto> {
        const { email, password } = loginData;
        const user = await this.repository.findOneBy({ email });

        if (!user) {
            return { message: 'User is not found' };
        }

        const userPassword = user.hashedPw;
        const isPasswordCorrect = checkPassword(userPassword, password);

        if (!isPasswordCorrect) {
            return { message: 'Password or email is incorrect' };
        }

        const accessToken = jwt.sign(
            { user: { id: user.id } },
            SETTINGS.JWT_SECRET_KEY,
            {
                expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME,
            },
        );

        return { accessToken };
    }
}

export default AuthController;
