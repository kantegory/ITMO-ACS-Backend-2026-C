import 'reflect-metadata';
import { IsString, IsOptional, IsBoolean, IsEnum, IsEmail, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '../models/role.enum';

export class UserDto {
  @IsString()
  id!: string;

  @IsEnum(Role)
  role!: Role;

  @IsString()
  first_name!: string;

  @IsString()
  email!: string;

  @IsOptional()
  @IsString()
  middle_name?: string;

  @IsString()
  last_name!: string;

  @IsString()
  password!: string;

  @Type(() => Boolean)
  @IsBoolean()
  is_verified!: boolean;
}

export class RegisterUserDto {
  @IsEnum(Role)
  role!: Role;

  @IsString()
  first_name!: string;

  @IsString()
  email!: string;

  @IsOptional()
  @IsString()
  middle_name?: string;

  @IsString()
  last_name!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class AuthRequestDto {
  @IsString()
  email!: string;

  @IsString()
  password!: string;
}

export class AuthResponseDto {
  token!: string;
  user!: UserResponseDto;
}

export class BatchUsersDto {
  ids!: string[];
}

export class ApiUpdateProfileRequest {
  @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  middle_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;
}

export class ApiUserResponse {
  @IsString()
  id!: string;

  @IsString()
  first_name!: string;

  @IsOptional()
  @IsString()
  middle_name?: string;

  @IsString()
  last_name!: string;

  @IsString()
  email!: string;

  @IsEnum(Role)
  role!: Role;

}

export class CreateUserDto {
  first_name!: string;
  last_name!: string;
  middle_name?: string;
  email!: string;
  password!: string;
  role!: Role;
}

export class UserResponseDto {
  id!: string;
  first_name!: string;
  last_name!: string;
  middle_name?: string;
  email!: string;
  role!: Role;
}

export class UpdateProfileDto {
   @IsOptional()
  @IsString()
  first_name?: string;

  @IsOptional()
  @IsString()
  middle_name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}

export class UserValDTO {
  id!: string;
  is_verified!: boolean;
}