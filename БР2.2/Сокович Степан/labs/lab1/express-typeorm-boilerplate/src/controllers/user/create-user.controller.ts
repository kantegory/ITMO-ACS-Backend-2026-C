import { IsEmail, IsEnum, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Body, Get, Post, Put, Patch, QueryParams, HttpCode, HttpError, Param } from 'routing-controllers';import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import bcrypt from 'bcrypt';

import EntityController from '../../common/entity-controller';
import BaseController from '../../common/base-controller';
import { User, UserType } from '../../models/user.entity';

export class GetUsersQueryDto {
    @IsOptional()
    @IsEnum(UserType)
    type?: UserType;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    limit: number = 20;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    offset: number = 0;
}

export class CreateUserDto {
    @IsString()
    @Type(() => String)
    name: string;

    @IsEmail()
    @Type(() => String)
    email: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    phone?: string;

    @IsString()
    @Type(() => String)
    @Length(6, 100)
    password: string;

    @IsEnum(UserType)
    @Type(() => String)
    type: UserType;
}

export class UpdateUserDto {
    @IsString()
    @Type(() => String)
    name: string;

    @IsEmail()
    @Type(() => String)
    email: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    phone?: string;

    @IsEnum(UserType)
    @Type(() => String)
    type: UserType;
}

export class PatchUserDto {
    @IsOptional()
    @IsString()
    @Type(() => String)
    name?: string;

    @IsOptional()
    @IsEmail()
    @Type(() => String)
    email?: string;

    @IsOptional()
    @IsString()
    @Type(() => String)
    phone?: string;

    @IsOptional()
    @IsEnum(UserType)
    @Type(() => String)
    type?: UserType;
}

export class UserResponseDto {
    id: string;
    createdAt: Date;
    name: string;
    email: string;
    phone?: string | null;
    type: UserType;
}

export class UsersListResponseDto {
    data: UserResponseDto[];
    total: number;
}

export class ErrorResponseDto {
    message: string;
    code: string;
}

@EntityController({
    baseRoute: '/users',
    entity: User,
})
class UsersController extends BaseController {
    @Get('/')
    @OpenAPI({ summary: 'Получить список пользователей' })
    @ResponseSchema(UsersListResponseDto)
    async getUsers(
        @QueryParams() query: GetUsersQueryDto,
    ): Promise<UsersListResponseDto> {
        const { type, limit, offset } = query;

        const qb = this.repository.createQueryBuilder('user');

        if (type) {
            qb.andWhere('user.type = :type', { type });
        }

        qb.take(limit);
        qb.skip(offset);

        const [users, total] = await qb.getManyAndCount();

        return {
            data: (users as User[]).map((user) => ({
                id: user.id,
                createdAt: user.createdAt,
                name: user.name,
                email: user.email,
                phone: user.phone,
                type: user.type,
            })),
            total,
        };
    }

    @Post('/')
    @HttpCode(201)
    @OpenAPI({ summary: 'Создать пользователя' })
    @ResponseSchema(UserResponseDto, { statusCode: 201 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 400 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 409 })
    async createUser(
        @Body() body: CreateUserDto,
    ): Promise<UserResponseDto> {
        const { name, email, phone, password, type } = body;

        const existingUser = await this.repository.findOneBy({ email });

        if (existingUser) {
            throw new HttpError(409, 'User with this email already exists');
        }
        const hashedPw = await bcrypt.hash(password, 10);

        const user = this.repository.create({
            name,
            email,
            phone: phone ?? null,
            hashedPw,
            type,
        });

        const savedUser = await this.repository.save(user) as User;

        return {
            id: savedUser.id,
            createdAt: savedUser.createdAt,
            name: savedUser.name,
            email: savedUser.email,
            phone: savedUser.phone,
            type: savedUser.type,
        };
    };

    @Get('/:id')
    @OpenAPI({ summary: 'Получить пользователя по ID' })
    @ResponseSchema(UserResponseDto, { statusCode: 200 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 404 })
    async getUserById(
        @Param('id') id: number,
    ): Promise<UserResponseDto> {

        const user = await this.repository.findOneBy({ id: String(id) });

        if (!user) {
            throw new HttpError(404, 'User not found');
        }

        return {
            id: user.id,
            createdAt: user.createdAt,
            name: user.name,
            email: user.email,
            phone: user.phone,
            type: user.type,
        };
    };

    @Put('/:id')
    @OpenAPI({ summary: 'Полная замена данных пользователя' })
    @ResponseSchema(UserResponseDto, { statusCode: 200 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 400 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 404 })
    async updateUser(
        @Param('id') id: number,
        @Body() body: UpdateUserDto,
    ): Promise<UserResponseDto> {
        const user = await this.repository.findOneBy({ id: String(id) });

        if (!user) {
            throw new HttpError(404, 'User not found');
        }

        const { name, email, phone, type } = body;

        user.name = name;
        user.email = email;
        user.phone = phone ?? null;
        user.type = type;

        const updatedUser = await this.repository.save(user) as User;

        return {
            id: updatedUser.id,
            createdAt: updatedUser.createdAt,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            type: updatedUser.type,
        };
    };

    @Patch('/:id')
    @OpenAPI({ summary: 'Частичное обновление данных пользователя' })
    @ResponseSchema(UserResponseDto, { statusCode: 200 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 400 })
    @ResponseSchema(ErrorResponseDto, { statusCode: 404 })
    async patchUser(
        @Param('id') id: number,
        @Body() body: PatchUserDto,
    ): Promise<UserResponseDto> {
        const user = await this.repository.findOneBy({ id: String(id) });

        if (!user) {
            throw new HttpError(404, 'User not found');
        }

        if (body.name !== undefined) {
            user.name = body.name;
        }

        if (body.email !== undefined) {
            user.email = body.email;
        }

        if (body.phone !== undefined) {
            user.phone = body.phone;
        }

        if (body.type !== undefined) {
            user.type = body.type;
        }

        const updatedUser = await this.repository.save(user) as User;

        return {
            id: updatedUser.id,
            createdAt: updatedUser.createdAt,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            type: updatedUser.type,
        };
    }

}

export default UsersController;
