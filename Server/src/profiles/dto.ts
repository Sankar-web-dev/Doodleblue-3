import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  BloodGroup,
  ContactDesignation,
  ContactPreference,
  Gender,
  HospitalType,
  MaritalStatus,
  RegistrationFor,
  TravelPreference,
  VerificationStatus,
} from '../generated/prisma/enums.js';
import { PaginationQueryDto, trim } from '../common/dto.js';

// ---------------------------------------------------------------------------
// PersonalProfile — shared address/identity details for donors & recipients.
// ---------------------------------------------------------------------------

export class UpsertPersonalProfileDto {
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine?: string;

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

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;
}

// ---------------------------------------------------------------------------
// DonorProfile — long-term donor details + self-reported health history.
// ---------------------------------------------------------------------------

export class UpsertDonorProfileDto {
  @IsOptional()
  @IsEnum(BloodGroup)
  bloodGroup?: BloodGroup;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(30)
  @Max(300)
  heightCm?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(20)
  @Max(400)
  weightKg?: number;

  @IsOptional()
  @IsBoolean()
  donatedBefore?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  previousDonationCount?: number;

  @IsOptional()
  @IsDateString()
  lastDonationDate?: string;

  @IsOptional()
  @IsBoolean()
  takesMedication?: boolean;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  medicationDetails?: string;

  @IsOptional()
  @IsBoolean()
  hasTattoo?: boolean;

  @IsOptional()
  @IsDateString()
  tattooDate?: string;

  @IsOptional()
  @IsBoolean()
  hasSeriousMedicalCondition?: boolean;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  medicalConditionDetails?: string;

  @IsOptional()
  @IsBoolean()
  hasDiabetes?: boolean;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  diabetesLevel?: string;

  @IsOptional()
  @IsBoolean()
  hasHadSurgery?: boolean;

  @IsOptional()
  @IsDateString()
  lastSurgeryDate?: string;

  @IsOptional()
  @IsBoolean()
  regularAlcoholUse?: boolean;

  @IsOptional()
  @IsBoolean()
  currentlyPregnant?: boolean;

  @IsOptional()
  @IsBoolean()
  recentPregnancyOrDelivery?: boolean;

  @IsOptional()
  @IsDateString()
  lastPregnancyDate?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsEnum(TravelPreference)
  travelPreference?: TravelPreference;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2000)
  maxTravelDistanceKm?: number;

  @IsOptional()
  @IsEnum(ContactPreference)
  contactPreference?: ContactPreference;
}

// ---------------------------------------------------------------------------
// RecipientProfile
// ---------------------------------------------------------------------------

export class UpsertRecipientProfileDto {
  @IsOptional()
  @IsEnum(RegistrationFor)
  registrationFor?: RegistrationFor;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  relationshipToPatient?: string;
}

// ---------------------------------------------------------------------------
// BloodBankProfile — institution details; requires verification.
// ---------------------------------------------------------------------------

export class UpsertBloodBankProfileDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  institutionName?: string;

  @IsOptional()
  @IsEnum(HospitalType)
  hospitalType?: HospitalType;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  hospitalPhone?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  contactPersonName?: string;

  @IsOptional()
  @IsEnum(ContactDesignation)
  contactDesignation?: ContactDesignation;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(20)
  contactPhone?: string;

  @Transform(trim)
  @IsOptional()
  @IsEmail()
  officialEmail?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine?: string;

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

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  registrationNumber?: string;
}

export class VerifyBloodBankDto {
  @IsEnum(VerificationStatus)
  status!: VerificationStatus;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class ListBloodBanksQueryDto extends PaginationQueryDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsEnum(VerificationStatus)
  status?: VerificationStatus;
}
