-- AlterTable
ALTER TABLE "Auditoria" ALTER COLUMN "empresaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Cliente" ALTER COLUMN "empresaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Pago" ALTER COLUMN "empresaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Prestamo" ALTER COLUMN "empresaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Refinanciacion" ALTER COLUMN "empresaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Simulacion" ALTER COLUMN "empresaId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Usuario" ALTER COLUMN "empresaId" SET NOT NULL;

