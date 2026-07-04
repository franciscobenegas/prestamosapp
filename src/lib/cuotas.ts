export type EstadoCuotaEfectivo = "PENDIENTE" | "PARCIAL" | "PAGADA" | "ATRASADA";

export const estadoCuotaVariant: Record<
  EstadoCuotaEfectivo,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDIENTE: "outline",
  PARCIAL: "secondary",
  PAGADA: "default",
  ATRASADA: "destructive",
};

/** Una cuota no marcada como PAGADA cuya fecha de vencimiento ya pasó se muestra como ATRASADA. */
export function getEstadoEfectivoCuota(
  estado: string,
  fechaVencimiento: Date,
  hoy: Date = new Date()
): EstadoCuotaEfectivo {
  const vencida = fechaVencimiento < hoy;
  return estado !== "PAGADA" && vencida ? "ATRASADA" : (estado as EstadoCuotaEfectivo);
}
