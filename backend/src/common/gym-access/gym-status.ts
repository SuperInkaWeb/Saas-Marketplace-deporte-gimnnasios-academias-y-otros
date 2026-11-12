import { ConflictException } from '@nestjs/common';
import { GymStatus, Prisma, UserRole } from '@prisma/client';

/**
 * AUD-17: un gimnasio inactivo o suspendido no vende ni acepta reservas, y lo que
 * ofrece (clases, planes, productos) solo lo ven su dueño y el ADMIN, igual que la
 * ficha del gimnasio (GymsService.findOneForViewer).
 */
export const GYM_INACTIVE_MESSAGE =
  'Este gimnasio está inactivo temporalmente.';

export function assertGymStatusActive(
  gym: { status: GymStatus } | null | undefined,
): void {
  if (gym && gym.status !== GymStatus.ACTIVE) {
    throw new ConflictException(GYM_INACTIVE_MESSAGE);
  }
}

/** Filtro de relación `gym` para listados: undefined = sin filtro (ADMIN). */
export function visibleGymWhere(
  viewer?: { id: string; role?: string } | null,
): Prisma.GymWhereInput | undefined {
  if (viewer?.role === UserRole.ADMIN) return undefined;
  if (viewer?.id) {
    return { OR: [{ status: GymStatus.ACTIVE }, { ownerId: viewer.id }] };
  }
  return { status: GymStatus.ACTIVE };
}
