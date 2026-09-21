import { Body, Post, HttpCode, UnauthorizedError } from 'routing-controllers';
import { OpenAPI, ResponseSchema } from 'routing-controllers-openapi';
import jwt from 'jsonwebtoken';

import SETTINGS from '../config/settings';

import EntityController from '../common/entity-controller';
import BaseController from '../common/base-controller';

import { User } from '../models/user.entity';

import { ConflictError } from '../errors/http-errors';
import { ErrorDto } from '../dto/error.dto';
import { RegisterDto, LoginDto, AuthResponseDto } from '../dto/auth.dto';
import { toUserResponseDto } from '../dto/user.dto';

import checkPassword from '../utils/check-password';

// Контроллер = класс, который обрабатывает HTTP-запросы. routing-controllers сам
// связывает методы класса с маршрутами через декораторы (@Post, @Get и т.д.).
// Этот контроллер отвечает за регистрацию и вход — единственное место в проекте,
// где выдаётся JWT-токен.
@EntityController({
    baseRoute: '/auth',
    entity: User,
})
class AuthController extends BaseController {
    // Общая для register и login часть: собрать токен + профиль в один ответ.
    // private-метод — используется только внутри этого класса, не маршрут.
    private issueTokenResponse(user: User): AuthResponseDto {
        const accessToken = jwt.sign(
            { user: { id: user.id, role: user.role } }, // именно это попадёт внутрь токена и будет доступно как request.user в auth.middleware.ts
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

    // POST /auth/register — создать нового пользователя с ролью USER
    @Post('/register')
    @HttpCode(201) // по умолчанию POST вернул бы 200, а спецификация требует 201 Created
    @OpenAPI({ summary: 'Регистрация' })
    @ResponseSchema(AuthResponseDto, { statusCode: 201 })
    @ResponseSchema(ErrorDto, { statusCode: 409 })
    async register(
        @Body({ type: RegisterDto }) registerData: RegisterDto, // routing-controllers сам проверит тело запроса по декораторам в RegisterDto
    ): Promise<AuthResponseDto> {
        const existingUser = await this.repository.findOneBy({
            email: registerData.email,
        });

        if (existingUser) {
            throw new ConflictError('Email is already taken'); // 409 — email должен быть уникальным
        }

        // repository.create() только собирает объект в памяти, ничего не пишет в базу
        const user = this.repository.create(registerData);
        // а save() уже реально сохраняет строку. Пароль автоматически захэшируется
        // подписчиком UserSubscriber (см. models/user.subscriber.ts) — здесь про это думать не нужно
        await this.repository.save(user);

        return this.issueTokenResponse(user as User);
    }

    // POST /auth/login — проверить email+пароль и выдать токен
    @Post('/login')
    @OpenAPI({ summary: 'Вход' })
    @ResponseSchema(AuthResponseDto, { statusCode: 200 })
    @ResponseSchema(ErrorDto, { statusCode: 401 })
    async login(
        @Body({ type: LoginDto }) loginData: LoginDto,
    ): Promise<AuthResponseDto> {
        const { email, password } = loginData;
        const user = await this.repository.findOneBy({ email });

        // намеренно одинаковое сообщение и для "нет такого email", и для "неверный пароль" —
        // чтобы нельзя было по ответу узнать, зарегистрирован ли вообще такой email
        if (!user || !checkPassword(user.password, password)) {
            throw new UnauthorizedError('Email or password is incorrect');
        }

        return this.issueTokenResponse(user as User);
    }
}

export default AuthController;
