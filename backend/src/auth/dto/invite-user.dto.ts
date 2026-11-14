import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '@prisma/client';

// Roles que se pueden otorgar por invitación. ADMIN se asigna solo desde la gestión de usuarios.
export const INVITABLE_ROLES = [UserRole.GYM_OWNER, UserRole.TRAINER] as const;

export class InviteUserDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'El correo no es válido' })
  @MaxLength(255)
  email!: string;

  @IsIn(INVITABLE_ROLES, {
    message: 'Solo se puede invitar como GYM_OWNER o TRAINER',
  })
  role!: UserRole;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  gymId?: string;
}
