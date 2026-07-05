-- AlterTable
ALTER TABLE "Pago" ADD COLUMN     "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Pago_empresaId_idempotencyKey_key" ON "Pago"("empresaId", "idempotencyKey");

