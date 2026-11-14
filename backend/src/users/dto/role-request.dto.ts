import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '@prisma/client';

// Roles que un usuario puede solicitar. ADMIN nunca se solicita; USER es el rol por defecto.
export const REQUESTABLE_ROLES = [
  UserRole.TRAINER,
  UserRole.GYM_OWNER,
] as const;

export class CreateRoleRequestDto {
  @IsIn(REQUESTABLE_ROLES, {
    message:
      'Solo se puede solicitar el rol de Entrenador (TRAINER) o Dueño (GYM_OWNER)',
  })
  requestedRole!: UserRole;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(500)
  reason?: string;
}
