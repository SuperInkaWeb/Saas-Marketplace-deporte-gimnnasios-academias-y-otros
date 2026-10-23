import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsNotEmpty,
  IsPositive,
  Min,
  MaxLength,
} from 'class-validator';

export class UpdateGoalDto {
  @IsInt()
  @Min(0)
  targetCalories: number;

  @IsInt()
  @Min(0)
  targetSteps: number;

  @IsInt()
  @Min(0)
  targetWater: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  targetWeight?: number;
}

export class UpsertMetDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsNumber()
  @IsPositive()
  metValue: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  intensity: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  defaultDuration?: number;
}

export class CreateRecommendationDto {
  @IsString()
  @IsNotEmpty()
  athleteId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  observation: string;
}
