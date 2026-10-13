import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsInt,
  IsArray,
  Min,
  Max,
  MaxLength,
  Matches,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceType } from '@prisma/client';

export class CreateProfessionalDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;

  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(480)
  durationMin?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProfessionalDto extends CreateProfessionalDto {}

export class ScheduleDayDto {
  @IsInt() @Min(0) @Max(6) dayOfWeek: number;
  @IsBoolean() isActive: boolean;
  @IsInt() @Min(0) @Max(1439) openMinute: number;
  @IsInt() @Min(1) @Max(1440) closeMinute: number;
  @IsInt() @Min(1) @Max(50) capacity: number;
}

export class SaveScheduleDto {
  @IsArray()
  @ArrayMaxSize(7)
  @ValidateNested({ each: true })
  @Type(() => ScheduleDayDto)
  days: ScheduleDayDto[];
}

export class BookServiceDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;

  @IsInt() @Min(0) @Max(1439)
  startMinute: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}