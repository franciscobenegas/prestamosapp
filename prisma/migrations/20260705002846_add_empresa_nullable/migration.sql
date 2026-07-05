-- DropIndex
DROP INDEX "Cliente_documento_key";

-- AlterTable
ALTER TABLE "Auditoria" ADD COLUMN     "empresaId" TEXT;

-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "empresaId" TEXT;

-- AlterTable
ALTER TABLE "Pago" ADD COLUMN     "empresaId" TEXT;

-- AlterTable
ALTER TABLE "Prestamo" ADD COLUMN     "empresaId" TEXT;

-- AlterTable
ALTER TABLE "Refinanciacion" ADD COLUMN     "empresaId" TEXT;

-- AlterTable
ALTER TABLE "Simulacion" ADD COLUMN     "empresaId" TEXT;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "empresaId" TEXT;

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Auditoria_empresaId_idx" ON "Auditoria"("empresaId");

-- CreateIndex
CREATE INDEX "Cliente_empresaId_idx" ON "Cliente"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_empresaId_documento_key" ON "Cliente"("empresaId", "documento");

-- CreateIndex
CREATE INDEX "Pago_empresaId_idx" ON "Pago"("empresaId");

-- CreateIndex
CREATE INDEX "Prestamo_empresaId_idx" ON "Prestamo"("empresaId");

-- CreateIndex
CREATE INDEX "Refinanciacion_empresaId_idx" ON "Refinanciacion"("empresaId");

-- CreateIndex
CREATE INDEX "Simulacion_empresaId_idx" ON "Simulacion"("empresaId");

-- CreateIndex
CREATE INDEX "Usuario_empresaId_idx" ON "Usuario"("empresaId");

