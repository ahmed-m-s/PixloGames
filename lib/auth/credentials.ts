import { prisma } from '@/lib/db/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { isInternalRole } from '@/lib/auth/permissions';

export async function verifyInternalCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return undefined;
  }

  const user = await prisma.internalUser.findUnique({
    where: {
      email: normalizedEmail
    }
  });

  if (!user || !user.active || !isInternalRole(user.role)) {
    return undefined;
  }

  const passwordMatches = verifyPassword(password, user.passwordHash);

  if (!passwordMatches) {
    return undefined;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };
}
