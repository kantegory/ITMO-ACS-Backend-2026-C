import { IsEmail, IsEnum, IsOptional, IsString, MinLength, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { UserRole } from "../entities/user.entity";

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;
}

export class UpdateRoleDto {
  @IsEnum(UserRole)
  role!: UserRole;
}

export class AuthTokensDto {
  @IsString()
  accessToken!: string;

  @IsString()
  refreshToken!: string;
}

export class UserPublicDto {
  @IsString()
  id!: string;

  @IsEmail()
  email!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsEnum(UserRole)
  role!: UserRole;
}

export class UserInternalDto extends UserPublicDto {}

export class AuthTokensResponseDto {
  @ValidateNested()
  @Type(() => AuthTokensDto)
  data!: AuthTokensDto;
}

export class UserResponseDto {
  @ValidateNested()
  @Type(() => UserPublicDto)
  data!: UserPublicDto;
}

export class UserInternalResponseDto {
  @ValidateNested()
  @Type(() => UserInternalDto)
  data!: UserInternalDto;
}
