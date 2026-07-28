-- AlterTable
ALTER TABLE "Prestamo" ADD COLUMN     "fuenteIngresoId" TEXT;

-- CreateTable
CREATE TABLE "FuenteIngreso" (
    "id" TEXT NOT NULL,
    "empresaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FuenteIngreso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FuenteIngreso_empresaId_idx" ON "FuenteIngreso"("empresaId");

-- CreateIndex
CREATE INDEX "Prestamo_fuenteIngresoId_idx" ON "Prestamo"("fuenteIngresoId");

