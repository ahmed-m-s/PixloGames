import type { InternalPermission, InternalRole } from '@/types/auth';

const rolePermissions: Record<InternalRole, InternalPermission[]> = {
  admin: [
    'view_internal',
    'manage_games',
    'manage_collections',
    'review_submissions',
    'publish_games'
  ],
  editor: ['view_internal', 'manage_games', 'manage_collections', 'publish_games'],
  reviewer: ['view_internal', 'review_submissions']
};

export function isInternalRole(value: string): value is InternalRole {
  return value === 'admin' || value === 'editor' || value === 'reviewer';
}

export function getRolePermissions(role: InternalRole) {
  return rolePermissions[role];
}

export function hasInternalPermission(role: InternalRole, permission: InternalPermission) {
  return rolePermissions[role].includes(permission);
}
