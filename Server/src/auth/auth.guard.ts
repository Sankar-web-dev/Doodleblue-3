import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import type { UserModel, RoleModel } from '../generated/prisma/models.js';
import { ApiException } from '../common/api-error.js';
import { SESSION_COOKIE_NAME } from '../common/constants.js';
import { AuthService } from './auth.service.js';

export interface AuthenticatedRequest extends Request {
  user: UserModel;
  currentRole: RoleModel | null;
  sessionToken: string;
}

/**
 * Session-cookie authentication. Reads the `app.sid` cookie, resolves the
 * session row and attaches `req.user` + `req.currentRole` for downstream
 * guards and handlers.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();

    const token = request.cookies?.[SESSION_COOKIE_NAME] as
      | string
      | undefined;

    if (!token) {
      throw new ApiException(
        401,
        'UNAUTHENTICATED',
        'Please log in to continue',
      );
    }

    const session = await this.auth.findSessionWithUser(token);

    if (!session || !session.user.isActive) {
      await this.auth.deleteSession(token);

      throw new ApiException(
        401,
        'SESSION_INVALID',
        'Your session is invalid. Please log in again',
      );
    }

    request.user = session.user;
    request.currentRole = session.user.roleRef ?? null;
    request.sessionToken = token;

    return true;
  }
}
