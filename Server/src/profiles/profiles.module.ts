import { Module } from '@nestjs/common';
import { PersonalProfileController } from './personal-profile.controller.js';
import { PersonalProfileService } from './personal-profile.service.js';
import { DonorProfileController } from './donor-profile.controller.js';
import { DonorProfileService } from './donor-profile.service.js';
import { RecipientProfileController } from './recipient-profile.controller.js';
import { RecipientProfileService } from './recipient-profile.service.js';
import { BloodBankProfileController } from './blood-bank-profile.controller.js';
import { BloodBankProfileService } from './blood-bank-profile.service.js';

@Module({
  controllers: [
    PersonalProfileController,
    DonorProfileController,
    RecipientProfileController,
    BloodBankProfileController,
  ],
  providers: [
    PersonalProfileService,
    DonorProfileService,
    RecipientProfileService,
    BloodBankProfileService,
  ],
})
export class ProfilesModule {}
