import type { DonorOnboardingFormValues } from "./donor-onboarding.schema";

export interface DeferralReason {
  type: "CRITICAL" | "TEMPORARY" | "PRECAUTION";
  title: string;
  description: string;
  eligibleAfter?: string;
  stepToEdit: number;
}

export interface EligibilityEvaluation {
  isEligible: boolean;
  reasons: DeferralReason[];
  age: number;
  bmi: number;
}

export function calculateAge(dobString: string): number {
  if (!dobString) return 0;
  const dob = new Date(dobString);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

function daysDiff(dateString: string): number {
  if (!dateString) return Infinity;
  const d = new Date(dateString);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function addMonthsToDate(dateString: string, months: number): string {
  const d = new Date(dateString);
  d.setMonth(d.getMonth() + months);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function addDaysToDate(dateString: string, days: number): string {
  const d = new Date(dateString);
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function evaluateEligibility(
  data: DonorOnboardingFormValues
): EligibilityEvaluation {
  const reasons: DeferralReason[] = [];
  const age = calculateAge(data.dateOfBirth);

  // 1. Age Verification (18 - 65)
  if (age < 18) {
    reasons.push({
      type: "CRITICAL",
      title: "Minimum Age Requirement (18+ Years)",
      description: `Donors must be at least 18 years of age. Your calculated age is ${age} years.`,
      stepToEdit: 1,
    });
  } else if (age > 65) {
    reasons.push({
      type: "CRITICAL",
      title: "Maximum Age Ceiling Exceeded (65 Years)",
      description: `First-time or routine donations after age 65 require in-person geriatric physician certification. Your age is ${age} years.`,
      stepToEdit: 1,
    });
  }

  // 2. Minimum Weight (50 kg)
  if (data.weightKg < 50) {
    reasons.push({
      type: "CRITICAL",
      title: "Weight Below Mandatory 50 kg Threshold",
      description: `To prevent adverse vasovagal reactions and hypovolemia, Indian and WHO safety norms mandate a minimum weight of 50 kg (110 lbs). Your recorded weight is ${data.weightKg} kg.`,
      stepToEdit: 2,
    });
  }

  // Calculate BMI
  const heightInMeters = (data.heightCm || 170) / 100;
  const bmi = Number((data.weightKg / (heightInMeters * heightInMeters)).toFixed(1));

  // 3. Donation Interval (Minimum 90 days)
  if (data.donatedBefore && data.lastDonationDate) {
    const elapsedDays = daysDiff(data.lastDonationDate);
    if (elapsedDays < 90) {
      reasons.push({
        type: "TEMPORARY",
        title: "Recent Donation (90-Day Safe Interval)",
        description: `A minimum 90-day recovery window is required between whole blood donations to allow bone marrow erythropoiesis and ferritin restoration. (${elapsedDays} days passed).`,
        eligibleAfter: addDaysToDate(data.lastDonationDate, 90),
        stepToEdit: 2,
      });
    }
  }

  // 4. Tattoo or Body Piercing (6-Month Deferral)
  if (data.hasTattoo && data.tattooDate) {
    const elapsedDays = daysDiff(data.tattooDate);
    if (elapsedDays < 180) {
      reasons.push({
        type: "TEMPORARY",
        title: "Recent Tattoo or Body Piercing (6-Month Window)",
        description: `National blood transfusion safety guidelines impose a mandatory 6-month deferral window following tattoo or body piercing procedures to eliminate window-period infection risks.`,
        eligibleAfter: addMonthsToDate(data.tattooDate, 6),
        stepToEdit: 3,
      });
    }
  }

  // 5. Recent Surgery (6-Month Deferral)
  if (data.hasHadSurgery && data.lastSurgeryDate) {
    const elapsedDays = daysDiff(data.lastSurgeryDate);
    if (elapsedDays < 180) {
      reasons.push({
        type: "TEMPORARY",
        title: "Recent Surgery Recovery Period (6 Months)",
        description: `A 6-month recovery period is required post-surgery to ensure full wound healing, normalization of blood counts, and zero post-op complications.`,
        eligibleAfter: addMonthsToDate(data.lastSurgeryDate, 6),
        stepToEdit: 3,
      });
    }
  }

  // 6. Serious Medical Conditions
  if (data.hasSeriousMedicalCondition) {
    reasons.push({
      type: "CRITICAL",
      title: "Chronic Medical Condition Reported",
      description: `Active cardiovascular diseases, epilepsy, bleeding disorders, hepatitis, or history of malignancy disqualify candidates for donor safety.`,
      stepToEdit: 3,
    });
  }

  // 7. Diabetes Status
  if (data.hasDiabetes && data.diabetesLevel === "INSULIN") {
    reasons.push({
      type: "CRITICAL",
      title: "Insulin-Dependent Diabetes",
      description: `Individuals requiring insulin therapy cannot donate blood due to cardiovascular fragility and sudden glycemic fluctuation risks.`,
      stepToEdit: 3,
    });
  }

  // 8. Gender Specific: Pregnancy & Delivery
  if (data.gender === "FEMALE") {
    if (data.currentlyPregnant) {
      reasons.push({
        type: "TEMPORARY",
        title: "Pregnancy Deferral",
        description: `Blood donation is deferred throughout pregnancy and active lactation to conserve maternal hemoglobin and ensure optimal fetal nourishment.`,
        stepToEdit: 4,
      });
    }

    if (data.recentPregnancyOrDelivery && data.lastPregnancyDate) {
      const elapsedDays = daysDiff(data.lastPregnancyDate);
      if (elapsedDays < 180) {
        reasons.push({
          type: "TEMPORARY",
          title: "Postpartum Recovery (6-Month Deferral)",
          description: `A minimum 6-month postpartum interval is mandatory to restore maternal iron stores.`,
          eligibleAfter: addMonthsToDate(data.lastPregnancyDate, 6),
          stepToEdit: 4,
        });
      }
    }
  }

  return {
    isEligible: reasons.length === 0,
    reasons,
    age,
    bmi,
  };
}
