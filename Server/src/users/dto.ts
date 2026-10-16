import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class CreateUserDto {
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @Transform(normalizeEmail)
  @IsEmail()
  email!: string;

  /** Omit to have the server generate a temporary password and email it. */
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  password?: string;

  /** Must reference an active Role row. */
  @IsUUID()
  roleId!: string;

  /** Optional profile image URL or relative path. */
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  image?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @Transform(normalizeEmail)
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  password?: string;

  @IsOptional()
  @IsUUID()
  roleId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  image?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ListUsersQueryDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
