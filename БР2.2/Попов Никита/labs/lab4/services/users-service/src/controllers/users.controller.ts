import { Body, Get, JsonController, Param, Patch, Post, Req, Res, UseBefore } from "routing-controllers";
import { OpenAPI, ResponseSchema } from "routing-controllers-openapi";
import { Response } from "express";
import { UsersService } from "../services/users.service";
import { authMiddleware, AuthRequest, internalAuthMiddleware } from "../middlewares/auth.middleware";
import {
  AuthTokensResponseDto,
  LoginDto,
  RegisterDto,
  UpdateProfileDto,
  UpdateRoleDto,
  UserInternalResponseDto,
  UserResponseDto
} from "../dto/users.dto";
import { dataSource } from "../data-source";
import { UserEntity } from "../entities/user.entity";
import { UsersRepository } from "../repositories/users.repository";
import { publish } from "../kafka";

function sendResult(result: { data?: unknown; error?: readonly [number, unknown] }, res: Response) {
  if (result.error) return res.status(result.error[0]).json(result.error[1]);
  return res.json({ data: result.data });
}

@JsonController()
export class UsersController {
  private readonly usersService = new UsersService(
    new UsersRepository(dataSource.getRepository(UserEntity)),
    publish
  );

  @Post("/api/v1/auth/register")
  @OpenAPI({ summary: "Register user", tags: ["Users"] })
  @ResponseSchema(AuthTokensResponseDto, { statusCode: 200 })
  async register(@Body() body: RegisterDto, @Res() res: Response) {
    return sendResult(await this.usersService.register(body), res);
  }

  @Post("/api/v1/auth/login")
  @OpenAPI({ summary: "Login user", tags: ["Users"] })
  @ResponseSchema(AuthTokensResponseDto, { statusCode: 200 })
  async login(@Body() body: LoginDto, @Res() res: Response) {
    return sendResult(await this.usersService.login(body), res);
  }

  @Get("/api/v1/users/me")
  @UseBefore(authMiddleware)
  @OpenAPI({
    summary: "Get current user profile",
    tags: ["Users"],
    security: [{ bearerAuth: [] }]
  })
  @ResponseSchema(UserResponseDto, { statusCode: 200 })
  async me(@Req() req: AuthRequest, @Res() res: Response) {
    return sendResult(await this.usersService.me(req.user!.id), res);
  }

  @Patch("/api/v1/users/me")
  @UseBefore(authMiddleware)
  @OpenAPI({
    summary: "Update current user profile",
    tags: ["Users"],
    security: [{ bearerAuth: [] }]
  })
  @ResponseSchema(UserResponseDto, { statusCode: 200 })
  async updateMe(@Req() req: AuthRequest, @Body() body: UpdateProfileDto, @Res() res: Response) {
    return sendResult(await this.usersService.updateMe(req.user!.id, body), res);
  }

  @Patch("/api/v1/users/:id/role")
  @UseBefore(authMiddleware)
  @OpenAPI({
    summary: "Update user role",
    tags: ["Users"],
    security: [{ bearerAuth: [] }]
  })
  @ResponseSchema(UserResponseDto, { statusCode: 200 })
  async updateRole(@Param("id") id: string, @Body() body: UpdateRoleDto, @Res() res: Response) {
    return sendResult(await this.usersService.updateRole(id, body.role), res);
  }

  @Get("/internal/v1/users/:userId")
  @UseBefore(internalAuthMiddleware)
  @OpenAPI({
    summary: "Get user by id for internal services",
    tags: ["Internal"],
    security: [{ internalApiKey: [] }]
  })
  @ResponseSchema(UserInternalResponseDto, { statusCode: 200 })
  async internalGet(@Param("userId") userId: string, @Res() res: Response) {
    return sendResult(await this.usersService.internalGet(userId), res);
  }
}
