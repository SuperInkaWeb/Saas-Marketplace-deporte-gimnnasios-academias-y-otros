import { IsString, IsOptional, MaxLength, IsNumber, Min, IsInt, IsBoolean } from 'class-validator';

export class CreateMembershipPlanDto {
  @IsString()
  @MaxLength(150)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsInt()
  @Min(1)
  durationDays: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxClasses?: number;

  @IsBoolean()
  @IsOptional()
  includesMarketplace?: boolean;
}

export class UpdateMembershipPlanDto {
  @IsString()
  @MaxLength(150)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  durationDays?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxClasses?: number;

  @IsBoolean()
  @IsOptional()
  includesMarketplace?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class SubscribeDto {
  @IsString()
  planId: string;
}
