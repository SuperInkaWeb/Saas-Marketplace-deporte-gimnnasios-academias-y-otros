import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsIn,
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
/** AUD-28: estados de una reserva de servicio profesional. */
export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type BookingStatus = (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

/** AUD-28: estados a los que el profesional (o un ADMIN) puede mover una reserva. */
export const SETTABLE_BOOKING_STATUSES = [
  BOOKING_STATUS.CONFIRMED,
  BOOKING_STATUS.COMPLETED,
  BOOKING_STATUS.CANCELLED,
] as const;

export class UpdateBookingStatusDto {
  @IsIn(SETTABLE_BOOKING_STATUSES, {
    message: `status debe ser uno de: ${SETTABLE_BOOKING_STATUSES.join(', ')}`,
  })
  status: (typeof SETTABLE_BOOKING_STATUSES)[number];
}

/** AUD-28: cuerpo de POST /professionals/:id/book (reserva gratuita). */
export class RequestBookingDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
