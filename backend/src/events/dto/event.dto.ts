import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsEnum, IsDateString } from 'class-validator';
import { EventType } from '@prisma/client';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(EventType)
  eventType: EventType;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsNotEmpty()
  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  capacity?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateEventDto extends CreateEventDto {}
