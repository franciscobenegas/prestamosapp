-- CreateTable
CREATE TABLE "Simulacion" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "clienteNombre" TEXT NOT NULL,
    "clienteEmail" TEXT,
    "monto" DECIMAL(12,2) NOT NULL,
    "tasaInteres" DECIMAL(6,3) NOT NULL,
    "cantidadCuotas" INTEGER NOT NULL,
    "tipoInteres" "TipoInteres" NOT NULL,
    "frecuencia" "Frecuencia" NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Simulacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Simulacion_usuarioId_idx" ON "Simulacion"("usuarioId");
