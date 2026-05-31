import { auth } from '@clerk/nextjs/server';
import type { AppRole } from '@/types/globals';

// Roles con acceso al panel financiero (docs/05.usuarios.md)
const ADMIN_ROLES: AppRole[] = ['finance_admin', 'system_admin'];

export function isAdminRole(role: AppRole | undefined): boolean {
  return role != null && ADMIN_ROLES.includes(role);
}

// Lee el rol del JWT de Clerk (requiere el claim `metadata` en el session token).
export async function getCurrentRole(): Promise<AppRole | undefined> {
  const { sessionClaims } = await auth();
  return sessionClaims?.metadata?.role;
}
