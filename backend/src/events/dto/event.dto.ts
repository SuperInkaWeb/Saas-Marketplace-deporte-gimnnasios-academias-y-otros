import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsEnum, IsDateString, MaxLength, Min } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { EventType } from '@prisma/client';

export class CreateEventDto {
  @IsString()
  @MaxLength(200)
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(EventType)
  eventType: EventType;

  @IsOptional()
  @Min(0)
  @IsNumber()
  price?: number;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsOptional()
  @MaxLength(300)
  @IsString()
  location?: string;

  @IsOptional()
  @Min(0)
  @IsNumber()
  capacity?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// Al editar se envía solo lo que cambia (antes exigía todos los campos, H-22).
export class UpdateEventDto extends PartialType(CreateEventDto) {}
