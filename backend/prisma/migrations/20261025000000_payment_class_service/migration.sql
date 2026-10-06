-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "booking_notes" TEXT,
ADD COLUMN     "class_id" TEXT,
ADD COLUMN     "service_id" TEXT;

-- CreateIndex
CREATE INDEX "payments_class_id_idx" ON "payments"("class_id");

-- CreateIndex
CREATE INDEX "payments_service_id_idx" ON "payments"("service_id");