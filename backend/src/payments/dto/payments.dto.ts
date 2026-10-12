import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

// Los ids se validan como string (no UUID) porque Prisma puede usar cuid().
// Si tus ids son UUID, cambia @IsString() por @IsUUID().

export class MembershipCheckoutDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  planId: string;
}

export class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  productId: string;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity: number;
}

export class OrderCheckoutDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}

export class ClassCheckoutDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  classId: string;
}

export class ServiceCheckoutDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  serviceId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

// paymentId = id del pago de Mercado Pago (payment_id o collection_id en la URL de retorno)
export class ConfirmPaymentDto {
  @Transform(({ value }) =>
    value === undefined || value === null ? value : String(value),
  )
  @IsNumberString({ no_symbols: true })
  @Length(1, 20)
  paymentId: string;
}