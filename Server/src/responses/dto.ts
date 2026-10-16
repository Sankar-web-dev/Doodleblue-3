import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { DonorResponseStatus } from '../generated/prisma/enums.js';
import { PaginationQueryDto, trim } from '../common/dto.js';

export class CreateDonorResponseDto {
  @IsUUID()
  requestId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  unitsOffered?: number;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}

export class UpdateDonorResponseDto {
  @IsOptional()
  @IsEnum(DonorResponseStatus)
  status?: DonorResponseStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  unitsOffered?: number;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @IsOptional()
  @IsDateString()
  contactedAt?: string;
}

export class ListResponsesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(DonorResponseStatus)
  status?: DonorResponseStatus;
}
