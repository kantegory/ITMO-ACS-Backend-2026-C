import { BadRequestError, Body, Post } from 'routing-controllers';
import jwt from 'jsonwebtoken';

import SETTINGS from '../config/settings';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { User } from '../models/user.entity';
import { RegisterDto, LoginDto } from '../dto/auth.dto';

import checkPassword from '../utils/check-password';

@EntityController({
    baseRoute: '/auth',
    entity: User,
})
class AuthController extends BaseController {
    @Post('/register')
    async register(@Body({ type: RegisterDto }) dto: RegisterDto) {
        const exists = (await this.repository.findOneBy({
            email: dto.email,
        })) as User | null;

        if (exists) {
            throw new BadRequestError('Email already exists');
        }

        const user = this.repository.create({
            name: dto.name,
            email: dto.email,
            phone: dto.phone || null,
            password: dto.password,
            type: dto.type,
        }) as User;

        const createdUser = (await this.repository.save(user)) as User;
        const accessToken = this.generateToken(createdUser);

        return {
            token: accessToken,
            user: this.toPublicUser(createdUser),
        };
    }

    @Post('/login')
    async login(@Body({ type: LoginDto }) loginData: LoginDto) {
        const { email, password } = loginData;
        const user = (await this.repository.findOneBy({ email })) as User | null;

        if (!user) {
            throw new BadRequestError('Password or email is incorrect');
        }

        const isPasswordCorrect = checkPassword(user.password, password);

        if (!isPasswordCorrect) {
            throw new BadRequestError('Password or email is incorrect');
        }

        return {
            token: this.generateToken(user),
            user: this.toPublicUser(user),
        };
    }

    private generateToken(user: User): string {
        return jwt.sign(
            { user: { id: user.id, type: user.type } },
            SETTINGS.JWT_SECRET_KEY,
            {
                expiresIn: SETTINGS.JWT_ACCESS_TOKEN_LIFETIME,
            },
        );
    }

    private toPublicUser(user: User) {
        return {
            id: user.id,
            createdAt: user.createdAt,
            name: user.name,
            email: user.email,
            phone: user.phone,
            type: user.type,
        };
    }
}

export default AuthController;
