import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

// Datos de una sincronización manual (BLE / webhook).
// Los máximos evitan valores absurdos y el desbordamiento de las columnas Int de wearable_metrics.
export class SyncWearableDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  steps?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(300)
  heartRateAvg?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100_000)
  calories?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  deviceType?: string;
}

// Código de autorización que devuelve Google Health al volver al frontend.
export class FitbitCallbackDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  redirect_uri!: string;
}
