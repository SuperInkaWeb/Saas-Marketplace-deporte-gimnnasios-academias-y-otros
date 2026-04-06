import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean, IsEnum } from 'class-validator';
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
  price: number;

  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @IsOptional()
  @IsNumber()
  durationMin?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateProfessionalDto extends CreateProfessionalDto {}
