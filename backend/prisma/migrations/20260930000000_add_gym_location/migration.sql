-- Crea el tipo de dato para el origen de la ubicación (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'GymLocationSource') THEN
    CREATE TYPE "GymLocationSource" AS ENUM ('MANUAL', 'EXACT', 'APPROXIMATE');
  END IF;
END$$;

-- Agrega las columnas de ubicación (solo si faltan)
ALTER TABLE "gyms" ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION;
ALTER TABLE "gyms" ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;
ALTER TABLE "gyms" ADD COLUMN IF NOT EXISTS "location_source" "GymLocationSource";