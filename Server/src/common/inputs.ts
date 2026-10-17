import { ApiException } from './api-error.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { hasPermission } from '../auth/permissions.guard.js';
import type { RoleModel, UserModel } from '../generated/prisma/models.js';

/** Ensures the target user exists before admin profile operations. */
export async function assertUserExists(
  prisma: PrismaService,
  userId: string,
): Promise<void> {
  const exists = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!exists) {
    throw new ApiException(404, 'USER_NOT_FOUND', 'User not found');
  }
}

/**
 * Converts an optional ISO date string to a Date for Prisma writes.
 * undefined → leave unchanged, null → clear the column.
 */
export function toDateInput(
  value: string | null | undefined,
): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '' || (typeof value === 'string' && value.trim() === '')) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d;
}

/**
 * Loads the caller's donor profile or throws — donor-gated actions
 * (respond, donate, book) all require one.
 */
export async function requireDonorProfile(
  prisma: PrismaService,
  userId: string,
) {
  const donor = await prisma.donorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!donor) {
    throw new ApiException(
      400,
      'DONOR_PROFILE_REQUIRED',
      'Complete your donor profile first',
    );
  }
  return donor;
}

/** Owner or a role holding users:update can manage the record. */
export function assertOwnerOrUsersUpdate(
  user: UserModel,
  role: RoleModel | null | undefined,
  ownerUserId: string | null | undefined,
): void {
  if (user.id === ownerUserId) return;
  if (hasPermission(user, role, 'users', 'update')) return;
  throw new ApiException(
    403,
    'FORBIDDEN',
    'You do not have permission to manage this record',
  );
}
