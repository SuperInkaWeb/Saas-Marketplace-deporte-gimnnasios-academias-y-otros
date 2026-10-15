/*import { IsString, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CancelEventDto {
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(10, { message: 'El comunicado debe tener al menos 10 caracteres' })
  @MaxLength(1000, { message: 'El comunicado no puede superar los 1000 caracteres' })
  message: string;
}*/