import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import type { UserModel, RoleModel } from '../generated/prisma/models.js';
import {
  Permission,
  SESSION_TTL_MS,
  SYSTEM_ROLE,
} from '../common/constants.js';

export type UserWithRole = UserModel & { roleRef?: RoleModel | null };

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  /** Build the safe user payload including the role's permission matrix. */
  async safeUser(user: UserWithRole) {
    let permissions: Permission[] = [];

    if (user.role !== SYSTEM_ROLE && user.roleId) {
      const role =
        user.roleRef ??
        (await this.prisma.role.findUnique({ where: { id: user.roleId } }));
      permissions = (role?.permissions as Permission[] | null) ?? [];
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      roleId: user.roleId ?? undefined,
      image: user.image ?? undefined,
      mustChangePassword: user.mustChangePassword,
      isActive: user.isActive,
      permissions,
    };
  }

  async createSession(userId: string) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    const session = await this.prisma.session.create({
      data: { token, userId, expiresAt },
    });

    return session;
  }

  /**
   * Loads a session (with user + role) by cookie token.
   * Expired sessions are deleted and return null.
   */
  async findSessionWithUser(token: string) {
    const session = await this.prisma.session.findUnique({
      where: { token },
      include: { user: { include: { roleRef: true } } },
    });

    if (!session) return null;

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.prisma.session
        .delete({ where: { id: session.id } })
        .catch(() => {});
      return null;
    }

    return session;
  }

  async deleteSession(token: string): Promise<void> {
    await this.prisma.session
      .delete({ where: { token } })
      .catch(() => {});
  }

  /** Session rotation — equivalent to express-session's regenerate(). */
  async rotateSession(oldToken: string | undefined, userId: string) {
    if (oldToken) {
      await this.deleteSession(oldToken);
    }
    return this.createSession(userId);
  }
}
