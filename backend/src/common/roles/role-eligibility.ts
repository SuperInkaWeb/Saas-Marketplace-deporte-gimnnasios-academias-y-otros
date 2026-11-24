import { Prisma, UserRole } from '@prisma/client';

/**
 * AUD-18: elegibilidad de roles.
 *
 * `User.role` es la VISTA ACTIVA (el selector "Vista Activa" la cambia con
 * /auth/switch-role), no el permiso. Los roles a los que alguien puede cambiar
 * salen de: su rol actual, una solicitud de rol APROBADA, o hechos del negocio
 * (tener gimnasios → GYM_OWNER; tener perfil de entrenador → TRAINER).
 *
 * Una revocación queda registrada como una solicitud con status REVOKED. La
 * decisión más reciente (APPROVED o REVOKED) de cada rol manda: si es REVOKED,
 * ni la solicitud aprobada antigua ni los gimnasios ni el perfil devuelven el rol.
 * Volver a otorgarlo (aprobar una solicitud nueva o que un admin lo asigne)
 * deja una decisión APPROVED más reciente.
 */

export const ROLE_REQUEST_APPROVED = 'APPROVED';
export const ROLE_REQUEST_REVOKED = 'REVOKED';

/** Roles que se otorgan o revocan; USER lo tiene todo el mundo y ADMIN no se gestiona así. */
export const GRANTABLE_ROLES = [UserRole.GYM_OWNER, UserRole.TRAINER] as const;
export type GrantableRole = (typeof GRANTABLE_ROLES)[number];

export const isGrantableRole = (role: unknown): role is GrantableRole =>
  (GRANTABLE_ROLES as readonly unknown[]).includes(role);

type Db = Pick<
  Prisma.TransactionClient,
  'gym' | 'trainerProfile' | 'roleRequest'
>;

/** Última decisión (APPROVED/REVOKED) por rol, o undefined si nunca hubo una. */
export async function latestRoleDecisions(
  db: Db,
  userId: string,
): Promise<Partial<Record<GrantableRole, string>>> {
  const decisions = await db.roleRequest.findMany({
    where: {
      userId,
      requestedRole: { in: [...GRANTABLE_ROLES] },
      status: { in: [ROLE_REQUEST_APPROVED, ROLE_REQUEST_REVOKED] },
    },
    orderBy: { updatedAt: 'desc' },
    select: { requestedRole: true, status: true },
  });

  const latest: Partial<Record<GrantableRole, string>> = {};
  for (const d of decisions) {
    const role = d.requestedRole as GrantableRole;
    if (latest[role] === undefined) latest[role] = d.status;
  }
  return latest;
}

export async function computeEligibleRoles(
  db: Db,
  user: { id: string; role: string },
): Promise<UserRole[]> {
  const [gymCount, trainerProfile, latest] = await Promise.all([
    db.gym.count({ where: { ownerId: user.id } }),
    db.trainerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    }),
    latestRoleDecisions(db, user.id),
  ]);

  const roles: UserRole[] = [UserRole.USER];
  if (user.role === UserRole.ADMIN) roles.push(UserRole.ADMIN);

  const hasBusinessFact: Record<GrantableRole, boolean> = {
    [UserRole.GYM_OWNER]: gymCount > 0,
    [UserRole.TRAINER]: !!trainerProfile,
  };

  for (const role of GRANTABLE_ROLES) {
    const decision = latest[role];
    const eligible =
      user.role === role ||
      (decision !== ROLE_REQUEST_REVOKED &&
        (decision === ROLE_REQUEST_APPROVED || hasBusinessFact[role]));
    if (eligible) roles.push(role);
  }

  return roles;
}
