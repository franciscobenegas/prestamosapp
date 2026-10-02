-- Agrega el valor RECHAZADO al enum EstadoPrestamo (aditivo, no afecta filas existentes)
ALTER TYPE "EstadoPrestamo" ADD VALUE IF NOT EXISTS 'RECHAZADO';
