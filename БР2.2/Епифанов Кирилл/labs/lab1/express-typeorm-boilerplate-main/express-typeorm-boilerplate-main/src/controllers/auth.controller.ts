import { Type } from 'class-transformer';
import { IsEmail, IsString } from 'class-validator';
import jwt from 'jsonwebtoken';
import { Body, Post } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';

import SETTINGS from '../config/settings';

import BaseController from '../common/base-controller';
import EntityController from '../common/entity-controller';

import { User } from '../models/user.entity';

import checkPassword from '../utils/check-password';

class LoginDto {
    @IsEmail()
    @Type(() => String)
    email!: string;

    @IsString()
    @Type(() => String)
    password!: string;
}

class RegisterDto {
    @IsString()
    fullName!: string;

    @IsEmail()
    email!: string;

    @IsString()
    password!: string;
}

class LoginResponseDto {
    @IsString()
    @Type(() => String)
    accessToken!: string;
}

class ErrorResponseDto {
    @IsString()
    @Type(() => String)
    message!: string;
}

@EntityController({
    baseRoute: '/auth',
    entity: User,
})
class AuthController extends BaseController {
    @Post('/register')
    async register(@Body() data: RegisterDto) {
        const existingUser = await this.repository.findOneBy({ email: data.email });

        if (existingUser) {
            return { message: 'User already exists' };
        }

        const user = this.repository.create(data);
        await this.repository.save(user);
        return user;
    }

    @Post('/login')
    @OpenAPI({ summary: 'Login' })
    @ResponseSchema(LoginResponseDto, { statusCode: 200 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 400 })
    async login(
        @Body({ type: LoginDto }) loginData: LoginDto,
    ): Promise<LoginResponseDto | ErrorResponseDto> {
        const { email, password } = loginData;
        const user = await this.repository.findOneBy({ email });

        if (!user) {
            return { message: 'User is not found' };
        }

        const userPassword = user.password;
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
