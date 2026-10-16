import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  BloodComponent,
  BloodGroup,
  BloodRequestStatus,
  BloodUrgency,
  RequestType,
} from '../generated/prisma/enums.js';
import { PaginationQueryDto, toBool, trim } from '../common/dto.js';

export class CreateBloodRequestDto {
  @IsEnum(RequestType)
  requestType!: RequestType;

  @IsEnum(BloodGroup)
  bloodGroup!: BloodGroup;

  @IsOptional()
  @IsEnum(BloodComponent)
  component?: BloodComponent;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  unitsRequired!: number;

  @IsEnum(BloodUrgency)
  urgency!: BloodUrgency;

  @IsOptional()
  @IsDateString()
  requiredBy?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  // Recipient/patient context — only for RECIPIENT requests.
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  patientName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  patientAge?: number;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  relationshipToPatient?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  hospitalName?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(300)
  hospitalAddress?: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  city!: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  state!: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(10)
  pincode?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactName?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactPhone?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateBloodRequestDto {
  @IsOptional()
  @IsEnum(BloodGroup)
  bloodGroup?: BloodGroup;

  @IsOptional()
  @IsEnum(BloodComponent)
  component?: BloodComponent;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  unitsRequired?: number;

  @IsOptional()
  @IsEnum(BloodUrgency)
  urgency?: BloodUrgency;

  @IsOptional()
  @IsDateString()
  requiredBy?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  patientName?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  patientAge?: number;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  relationshipToPatient?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  hospitalName?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(300)
  hospitalAddress?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  district?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  state?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(10)
  pincode?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactName?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactPhone?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateRequestStatusDto {
  @IsEnum(BloodRequestStatus)
  status!: BloodRequestStatus;
}

export class ListBloodRequestsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(RequestType)
  requestType?: RequestType;

  @IsOptional()
  @IsEnum(BloodGroup)
  bloodGroup?: BloodGroup;

  @IsOptional()
  @IsEnum(BloodRequestStatus)
  status?: BloodRequestStatus;

  @IsOptional()
  @IsEnum(BloodUrgency)
  urgency?: BloodUrgency;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  /** When true, only the caller's own requests are returned. */
  @IsOptional()
  @Transform(toBool)
  @IsBoolean()
  mine?: boolean;
}
