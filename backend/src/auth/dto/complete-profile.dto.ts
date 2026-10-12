import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizeName } from '../../common/utils/normalize-name';

export class CompleteProfileDto {
  @Transform(({ value }) => (typeof value === 'string' ? normalizeName(value) : value))
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(100)
  @Matches(/^[^@]+$/, { message: 'El nombre no puede ser un correo electrónico' })
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  dni?: string;

  // El modal envía el tipo de cuenta elegido
  @IsOptional()
  @IsIn(['USER', 'TRAINER', 'GYM_OWNER'])
  role?: string;
}