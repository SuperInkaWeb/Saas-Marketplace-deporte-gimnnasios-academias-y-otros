import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTrainerProfileDto {
  @ApiProperty({
    example: 'Experienced fitness coach specialized in HIIT.',
    required: false,
  })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ example: ['HIIT', 'Yoga', 'Strength'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  specialties?: string[];

  @ApiProperty({ example: ['NASM-CPT', 'CrossFit L1'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  certifications?: string[];

  @ApiProperty({ example: 5, required: false })
  @IsNumber()
  @IsOptional()
  experienceYears?: number;

  @ApiProperty({ example: 50.0, required: false })
  @IsNumber()
  @IsOptional()
  hourlyRate?: number;
}

export class AssignTrainerDto {
  @ApiProperty({ example: 'uuid-of-trainer' })
  @IsString()
  trainerId: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  canCreateClasses?: boolean;
}

/** AUD-26: respuesta del dueño a una postulación; "approve" debe ser booleano real. */
export class RespondLinkRequestDto {
  @ApiProperty({
    example: true,
    description: 'true = aprobar, false = rechazar',
  })
  @IsBoolean({ message: 'approve debe ser true o false' })
  approve: boolean;
}
