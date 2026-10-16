import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
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
import {
  ClinicalScreeningStatus,
  DonationStatus,
} from '../generated/prisma/enums.js';
import { PaginationQueryDto, trim } from '../common/dto.js';

export class RegisterDonationDto {
  @IsUUID()
  requestId!: string;

  /** Admin only — register a donation on behalf of another donor. */
  @IsOptional()
  @IsUUID()
  donorProfileId?: string;

  @IsOptional()
  @IsDateString()
  donationDate?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  collectionLocation?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  unitsDonated?: number;
}

export class UpdateDonationDto {
  @IsOptional()
  @IsEnum(DonationStatus)
  status?: DonationStatus;

  @IsOptional()
  @IsDateString()
  donationDate?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  collectionLocation?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  unitsDonated?: number;
}

export class UpsertScreeningDto {
  @IsOptional()
  @IsBoolean()
  recentFever?: boolean;

  @IsOptional()
  @IsBoolean()
  alcoholWithin24Hours?: boolean;

  @IsOptional()
  @IsBoolean()
  currentlyUnwell?: boolean;

  @IsOptional()
  @IsBoolean()
  recentInfection?: boolean;

  @IsOptional()
  @IsBoolean()
  medicationChanges?: boolean;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  additionalNotes?: string;
}

export class ReviewScreeningDto {
  @IsEnum(ClinicalScreeningStatus)
  clinicalStatus!: ClinicalScreeningStatus;

  @IsOptional()
  @IsEnum(ClinicalScreeningStatus)
  hivScreeningStatus?: ClinicalScreeningStatus;

  @IsOptional()
  @IsDateString()
  deferUntil?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reviewerNotes?: string;
}

export class ListDonationsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(DonationStatus)
  status?: DonationStatus;
}
