import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { ClassType } from '@prisma/client';

export class CreateClassDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ClassType)
  @IsOptional()
  classType?: ClassType;

  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  durationMin?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsDateString()
  scheduledAt: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  meetingUrl?: string;

  @IsString()
  @IsOptional()
  trainerId?: string;
}

export class UpdateClassDto {
  @IsString()
  @MaxLength(200)
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ClassType)
  @IsOptional()
  classType?: ClassType;

  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  durationMin?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  meetingUrl?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
