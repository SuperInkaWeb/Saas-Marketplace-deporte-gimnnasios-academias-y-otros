// Datos de salud de un atleta (modelos HealthMetric y CoachRecommendation de
// backend/prisma/schema.prisma). Los usan las vistas de salud del coach y del admin.

// GET /health/metrics/:athleteId
export interface HealthMetric {
  id: string;
  type: string; // WEIGHT | STEPS | WATER | CALORIES_BURNED | CALORIES_INTAKE | SLEEP_HOURS | DISTANCE
  value: number;
  unit: string;
  date: string;
}

// GET /health/goals/:athleteId
export interface HealthGoal {
  targetCalories: number;
  targetSteps: number;
  targetWater: number;
  targetWeight?: number | null;
}

// GET /health/recommendations/:athleteId (observaciones del coach).
// id no está en las que la pantalla agrega al momento, antes de recargar.
export interface CoachRecommendation {
  id?: string;
  observation: string;
  createdAt: string;
  coach: { name: string };
}
