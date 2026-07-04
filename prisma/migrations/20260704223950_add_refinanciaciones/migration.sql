-- AlterEnum
ALTER TYPE "EstadoPrestamo" ADD VALUE 'REFINANCIADO';

-- CreateTable
CREATE TABLE "Refinanciacion" (
    "id" TEXT NOT NULL,
    "prestamoAnteriorId" TEXT NOT NULL,
    "prestamoNuevoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "saldoAnterior" DECIMAL(12,2) NOT NULL,
    "montoAdicional" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Refinanciacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Refinanciacion_prestamoAnteriorId_key" ON "Refinanciacion"("prestamoAnteriorId");

-- CreateIndex
CREATE UNIQUE INDEX "Refinanciacion_prestamoNuevoId_key" ON "Refinanciacion"("prestamoNuevoId");

-- CreateIndex
CREATE INDEX "Refinanciacion_usuarioId_idx" ON "Refinanciacion"("usuarioId");
