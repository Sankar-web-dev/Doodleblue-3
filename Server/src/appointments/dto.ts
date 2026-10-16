import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AppointmentStatus } from '../generated/prisma/enums.js';
import { PaginationQueryDto, trim } from '../common/dto.js';

export class CreateAppointmentDto {
  @IsUUID()
  requestId!: string;

  @IsDateString()
  scheduledAt!: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  /** Optional — link this appointment to an existing donation record. */
  @IsOptional()
  @IsUUID()
  donationId?: string;
}

export class UpdateAppointmentDto {
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class ListAppointmentsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsUUID()
  requestId?: string;
}
