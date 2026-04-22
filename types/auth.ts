export const internalRoles = ['admin', 'editor', 'reviewer'] as const;

export type InternalRole = (typeof internalRoles)[number];

export type InternalPermission =
  | 'view_internal'
  | 'manage_games'
  | 'manage_collections'
  | 'review_submissions'
  | 'publish_games';

export type InternalSessionUser = {
  id: string;
  email: string;
  name: string;
  role: InternalRole;
};

export type InternalSession = {
  id: string;
  expiresAt: Date;
  user: InternalSessionUser;
};
