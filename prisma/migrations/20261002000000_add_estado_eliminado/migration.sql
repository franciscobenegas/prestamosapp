-- Agrega el valor ELIMINADO al enum EstadoPrestamo (aditivo, no afecta filas existentes)
ALTER TYPE "EstadoPrestamo" ADD VALUE IF NOT EXISTS 'ELIMINADO';
