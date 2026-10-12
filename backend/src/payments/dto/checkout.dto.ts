import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MembershipCheckoutDto {
  @IsUUID()
  planId!: string;
}

export class ClassCheckoutDto {
  @IsUUID()
  classId!: string;
}

export class ServiceCheckoutDto {
  @IsUUID()
  serviceId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class OrderItemDto {
  @IsUUID()
  productId!: string;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;
}

export class OrderCheckoutDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];
}

export class ConfirmPaymentDto {
  // El id de pago de Mercado Pago es numérico, pero llega como texto desde la URL
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{1,20}$/, { message: 'paymentId debe ser numérico' })
  paymentId!: string;
}