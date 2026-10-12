import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser, GymAccessScope } from '../gym-access/gym-access.service';

export interface AuditEntry {
  action: string;               // CLASS_CREATE, CLASS_UPDATE, CLASS_SET_ACTIVE, CLASS_DELETE, RESERVATION_*
  entity: string;               // 'Class', 'Reservation', 'Gym'...
  entityId?: string;
  gymId: string;                // gimnasio OBJETIVO de la acción
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra la acción solo cuando el ADMIN global actúa sobre un gimnasio.
   * Si la escritura falla (por ejemplo, la tabla audit_logs aún no existe),
   * se deja en el log del servidor y NO se interrumpe la acción principal.
   */
  async logGlobalAction(scope: GymAccessScope, actor: AuthUser, entry: AuditEntry) {
    if (scope !== 'GLOBAL') return;

    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: actor.id,
          actorRole: String(actor.role),
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId,
          gymId: entry.gymId,
          metadata: entry.metadata,
        },
      });
    } catch (err: any) {
      this.logger.error(
        `No se pudo registrar auditoría (${entry.action} en gym ${entry.gymId}): ${err.message}`,
      );
    }
  }
}