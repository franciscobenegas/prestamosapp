-- AlterTable
ALTER TABLE "Prestamo" ADD COLUMN     "interes" DECIMAL(12,2),
ALTER COLUMN "tasaInteres" DROP NOT NULL,
ALTER COLUMN "tipoInteres" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Simulacion" ADD COLUMN     "interes" DECIMAL(12,2),
ALTER COLUMN "tasaInteres" DROP NOT NULL,
ALTER COLUMN "tipoInteres" DROP NOT NULL;

