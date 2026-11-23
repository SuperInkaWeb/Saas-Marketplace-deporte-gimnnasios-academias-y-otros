import {
  IsString,
  IsOptional,
  IsEmail,
  MaxLength,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { GymStatus } from '@prisma/client';
import { IsIn } from 'class-validator';

// Los límites de largo coinciden con las columnas VarChar de la tabla gyms
// (schema.prisma). Si un texto los supera, la base de datos responde con error 500;
// con estos límites el API responde 400 con un mensaje claro.
// logoUrl y description son columnas Text (el logo llega en base64), por eso no tienen límite aquí.

export class UpdateGymStatusDto {
  @IsIn([GymStatus.ACTIVE, GymStatus.INACTIVE])
  status: GymStatus;
}

export class CreateGymDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  longitude?: number;

  @IsString()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @MaxLength(300)
  @IsOptional()
  address?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  city?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  district?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  province?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  country?: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  phone?: string;

  @IsEmail()
  @MaxLength(255)
  @IsOptional()
  email?: string;

  @IsString()
  @MaxLength(300)
  @IsOptional()
  website?: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  openTime?: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  closeTime?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  openDays?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;
}

export class UpdateGymDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  longitude?: number;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @MaxLength(300)
  @IsOptional()
  address?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  city?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  district?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  province?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  country?: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  phone?: string;

  @IsEmail()
  @MaxLength(255)
  @IsOptional()
  email?: string;

  @IsString()
  @MaxLength(300)
  @IsOptional()
  website?: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  openTime?: string;

  @IsString()
  @MaxLength(20)
  @IsOptional()
  closeTime?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  openDays?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;
}
