import { IsString, IsEmail, IsOptional, IsEnum, IsBoolean, MinLength, MaxLength } from 'class-validator';
import { DealRole } from '../models/User.entity';

export class CreateUserDto {
  @IsString()
  @MaxLength(50)
  first_name: string;

  @IsOptional()
  @IsString()
  middle_name?: string;

  @IsString()
  @MaxLength(50)
  last_name: string;

  @IsOptional()
  @IsEnum(DealRole)
  deal_role?: DealRole;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

export class UpdateUserDto {
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
  @IsEnum(DealRole)
  deal_role?: DealRole;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsBoolean()
  is_verified?: boolean;
}

export class UserResponse {
  id: number;
  first_name: string;
  middle_name?: string;
  last_name: string;
  deal_role?: DealRole;
  email: string;
  is_verified: boolean;
  created_at: Date;
  updated_at?: Date;
}
