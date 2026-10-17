-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'OTHER');

-- CreateEnum
CREATE TYPE "BloodGroup" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "TravelPreference" AS ENUM ('NEARBY', 'ANYWHERE');

-- CreateEnum
CREATE TYPE "ContactPreference" AS ENUM ('EMAIL', 'PHONE', 'BOTH');

-- CreateEnum
CREATE TYPE "RegistrationFor" AS ENUM ('SELF', 'SOMEONE_ELSE');

-- CreateEnum
CREATE TYPE "HospitalType" AS ENUM ('GOVERNMENT', 'PRIVATE', 'TRUST', 'OTHER');

-- CreateEnum
CREATE TYPE "ContactDesignation" AS ENUM ('ADMIN', 'DOCTOR', 'BLOOD_BANK_OFFICER', 'OTHER');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('RECIPIENT', 'BLOOD_BANK');

-- CreateEnum
CREATE TYPE "BloodComponent" AS ENUM ('WHOLE_BLOOD', 'PACKED_RED_CELLS', 'PLATELETS', 'PLASMA', 'CRYOPRECIPITATE', 'OTHER');

-- CreateEnum
CREATE TYPE "BloodUrgency" AS ENUM ('EMERGENCY', 'WITHIN_24_HOURS', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "BloodRequestStatus" AS ENUM ('OPEN', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DonorResponseStatus" AS ENUM ('INTERESTED', 'CONTACTED', 'APPOINTMENT_SCHEDULED', 'COMPLETED', 'DECLINED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('REGISTERED', 'SCREENING', 'APPROVED', 'COMPLETED', 'DEFERRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'MISSED');

-- CreateEnum
CREATE TYPE "ClinicalScreeningStatus" AS ENUM ('NOT_RECORDED', 'PENDING', 'CLEARED', 'DEFERRED', 'REFERRED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('BLOOD_REQUEST', 'DONOR_RESPONSE', 'APPOINTMENT', 'REQUEST_UPDATE', 'VERIFICATION', 'SYSTEM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "roleId" TEXT,
    "image" TEXT,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "phoneNumber" TEXT,
    "maritalStatus" "MaritalStatus",
    "addressLine" TEXT,
    "city" TEXT,
    "district" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonorProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bloodGroup" "BloodGroup",
    "heightCm" DOUBLE PRECISION,
    "weightKg" DOUBLE PRECISION,
    "donatedBefore" BOOLEAN NOT NULL DEFAULT false,
    "previousDonationCount" INTEGER NOT NULL DEFAULT 0,
    "lastDonationDate" TIMESTAMP(3),
    "takesMedication" BOOLEAN,
    "medicationDetails" TEXT,
    "hasTattoo" BOOLEAN,
    "tattooDate" TIMESTAMP(3),
    "hasSeriousMedicalCondition" BOOLEAN,
    "medicalConditionDetails" TEXT,
    "hasDiabetes" BOOLEAN,
    "diabetesLevel" TEXT,
    "hasHadSurgery" BOOLEAN,
    "lastSurgeryDate" TIMESTAMP(3),
    "regularAlcoholUse" BOOLEAN,
    "currentlyPregnant" BOOLEAN,
    "recentPregnancyOrDelivery" BOOLEAN,
    "lastPregnancyDate" TIMESTAMP(3),
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "travelPreference" "TravelPreference" NOT NULL DEFAULT 'NEARBY',
    "maxTravelDistanceKm" INTEGER,
    "contactPreference" "ContactPreference" NOT NULL DEFAULT 'BOTH',
    "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipientProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "registrationFor" "RegistrationFor" NOT NULL DEFAULT 'SELF',
    "relationshipToPatient" TEXT,
    "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipientProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloodBankProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "institutionName" TEXT NOT NULL,
    "hospitalType" "HospitalType" NOT NULL DEFAULT 'OTHER',
    "hospitalPhone" TEXT NOT NULL,
    "website" TEXT,
    "contactPersonName" TEXT NOT NULL,
    "contactDesignation" "ContactDesignation" NOT NULL DEFAULT 'OTHER',
    "contactPhone" TEXT NOT NULL,
    "officialEmail" TEXT,
    "addressLine" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verificationNotes" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BloodBankProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloodRequest" (
    "id" TEXT NOT NULL,
    "requestType" "RequestType" NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "recipientProfileId" TEXT,
    "bloodBankProfileId" TEXT,
    "bloodGroup" "BloodGroup" NOT NULL,
    "component" "BloodComponent" NOT NULL DEFAULT 'WHOLE_BLOOD',
    "unitsRequired" INTEGER NOT NULL,
    "unitsFulfilled" INTEGER NOT NULL DEFAULT 0,
    "urgency" "BloodUrgency" NOT NULL,
    "status" "BloodRequestStatus" NOT NULL DEFAULT 'OPEN',
    "requiredBy" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "patientName" TEXT,
    "patientAge" INTEGER,
    "relationshipToPatient" TEXT,
    "hospitalName" TEXT,
    "hospitalAddress" TEXT,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "state" TEXT NOT NULL,
    "pincode" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BloodRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonorResponse" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "donorProfileId" TEXT NOT NULL,
    "status" "DonorResponseStatus" NOT NULL DEFAULT 'INTERESTED',
    "unitsOffered" INTEGER NOT NULL DEFAULT 1,
    "message" TEXT,
    "contactedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonorResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "donorProfileId" TEXT NOT NULL,
    "status" "DonationStatus" NOT NULL DEFAULT 'REGISTERED',
    "unitsDonated" INTEGER NOT NULL DEFAULT 1,
    "donationDate" TIMESTAMP(3),
    "collectionLocation" TEXT,
    "notes" TEXT,
    "verifiedByUserId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonationScreening" (
    "id" TEXT NOT NULL,
    "donationId" TEXT NOT NULL,
    "recentFever" BOOLEAN,
    "alcoholWithin24Hours" BOOLEAN,
    "currentlyUnwell" BOOLEAN,
    "recentInfection" BOOLEAN,
    "medicationChanges" BOOLEAN,
    "additionalNotes" TEXT,
    "clinicalStatus" "ClinicalScreeningStatus" NOT NULL DEFAULT 'NOT_RECORDED',
    "hivScreeningStatus" "ClinicalScreeningStatus" NOT NULL DEFAULT 'NOT_RECORDED',
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "deferUntil" TIMESTAMP(3),
    "reviewerNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonationScreening_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "donorProfileId" TEXT NOT NULL,
    "donationId" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalProfile_userId_key" ON "PersonalProfile"("userId");

-- CreateIndex
CREATE INDEX "PersonalProfile_city_idx" ON "PersonalProfile"("city");

-- CreateIndex
CREATE INDEX "PersonalProfile_district_state_idx" ON "PersonalProfile"("district", "state");

-- CreateIndex
CREATE INDEX "PersonalProfile_pincode_idx" ON "PersonalProfile"("pincode");

-- CreateIndex
CREATE UNIQUE INDEX "DonorProfile_userId_key" ON "DonorProfile"("userId");

-- CreateIndex
CREATE INDEX "DonorProfile_bloodGroup_isAvailable_idx" ON "DonorProfile"("bloodGroup", "isAvailable");

-- CreateIndex
CREATE INDEX "DonorProfile_isAvailable_travelPreference_idx" ON "DonorProfile"("isAvailable", "travelPreference");

-- CreateIndex
CREATE INDEX "DonorProfile_lastDonationDate_idx" ON "DonorProfile"("lastDonationDate");

-- CreateIndex
CREATE UNIQUE INDEX "RecipientProfile_userId_key" ON "RecipientProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BloodBankProfile_userId_key" ON "BloodBankProfile"("userId");

-- CreateIndex
CREATE INDEX "BloodBankProfile_verificationStatus_idx" ON "BloodBankProfile"("verificationStatus");

-- CreateIndex
CREATE INDEX "BloodBankProfile_city_district_state_idx" ON "BloodBankProfile"("city", "district", "state");

-- CreateIndex
CREATE INDEX "BloodBankProfile_institutionName_idx" ON "BloodBankProfile"("institutionName");

-- CreateIndex
CREATE INDEX "BloodRequest_requestType_status_idx" ON "BloodRequest"("requestType", "status");

-- CreateIndex
CREATE INDEX "BloodRequest_bloodGroup_city_status_idx" ON "BloodRequest"("bloodGroup", "city", "status");

-- CreateIndex
CREATE INDEX "BloodRequest_urgency_status_idx" ON "BloodRequest"("urgency", "status");

-- CreateIndex
CREATE INDEX "BloodRequest_requiredBy_idx" ON "BloodRequest"("requiredBy");

-- CreateIndex
CREATE INDEX "BloodRequest_createdByUserId_idx" ON "BloodRequest"("createdByUserId");

-- CreateIndex
CREATE INDEX "BloodRequest_recipientProfileId_idx" ON "BloodRequest"("recipientProfileId");

-- CreateIndex
CREATE INDEX "BloodRequest_bloodBankProfileId_idx" ON "BloodRequest"("bloodBankProfileId");

-- CreateIndex
CREATE INDEX "DonorResponse_donorProfileId_status_idx" ON "DonorResponse"("donorProfileId", "status");

-- CreateIndex
CREATE INDEX "DonorResponse_requestId_status_idx" ON "DonorResponse"("requestId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DonorResponse_requestId_donorProfileId_key" ON "DonorResponse"("requestId", "donorProfileId");

-- CreateIndex
CREATE INDEX "Donation_donorProfileId_status_idx" ON "Donation"("donorProfileId", "status");

-- CreateIndex
CREATE INDEX "Donation_donationDate_idx" ON "Donation"("donationDate");

-- CreateIndex
CREATE INDEX "Donation_requestId_status_idx" ON "Donation"("requestId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DonationScreening_donationId_key" ON "DonationScreening"("donationId");

-- CreateIndex
CREATE INDEX "DonationScreening_clinicalStatus_idx" ON "DonationScreening"("clinicalStatus");

-- CreateIndex
CREATE INDEX "DonationScreening_reviewedByUserId_idx" ON "DonationScreening"("reviewedByUserId");

-- CreateIndex
CREATE INDEX "Appointment_donorProfileId_scheduledAt_idx" ON "Appointment"("donorProfileId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Appointment_requestId_status_idx" ON "Appointment"("requestId", "status");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalProfile" ADD CONSTRAINT "PersonalProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorProfile" ADD CONSTRAINT "DonorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipientProfile" ADD CONSTRAINT "RecipientProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodBankProfile" ADD CONSTRAINT "BloodBankProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodBankProfile" ADD CONSTRAINT "BloodBankProfile_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodRequest" ADD CONSTRAINT "BloodRequest_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodRequest" ADD CONSTRAINT "BloodRequest_recipientProfileId_fkey" FOREIGN KEY ("recipientProfileId") REFERENCES "RecipientProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloodRequest" ADD CONSTRAINT "BloodRequest_bloodBankProfileId_fkey" FOREIGN KEY ("bloodBankProfileId") REFERENCES "BloodBankProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorResponse" ADD CONSTRAINT "DonorResponse_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BloodRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorResponse" ADD CONSTRAINT "DonorResponse_donorProfileId_fkey" FOREIGN KEY ("donorProfileId") REFERENCES "DonorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BloodRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_donorProfileId_fkey" FOREIGN KEY ("donorProfileId") REFERENCES "DonorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationScreening" ADD CONSTRAINT "DonationScreening_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonationScreening" ADD CONSTRAINT "DonationScreening_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "BloodRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_donorProfileId_fkey" FOREIGN KEY ("donorProfileId") REFERENCES "DonorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "Donation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
