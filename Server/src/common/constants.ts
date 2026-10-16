export const RESOURCES = ['roles', 'users'] as const;
export type Resource = (typeof RESOURCES)[number];

export const ACTIONS = ['create', 'read', 'update', 'delete'] as const;
export type Action = (typeof ACTIONS)[number];

export interface Permission {
  resource: Resource | string;
  actions: Action[] | string[];
}

export const SYSTEM_ROLE = 'SUPER_ADMIN';

export const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME || 'app.sid';
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24; // 24h
