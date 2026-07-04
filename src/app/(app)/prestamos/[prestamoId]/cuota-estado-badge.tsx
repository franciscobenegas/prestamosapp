import { Badge } from "@/components/ui/badge";
import { estadoCuotaVariant, getEstadoEfectivoCuota } from "@/lib/cuotas";

export function CuotaEstadoBadge({
  estado,
  fechaVencimiento,
  hoy,
}: {
  estado: string;
  fechaVencimiento: Date;
  hoy: Date;
}) {
  const efectivo = getEstadoEfectivoCuota(estado, fechaVencimiento, hoy);

  return <Badge variant={estadoCuotaVariant[efectivo]}>{efectivo}</Badge>;
}
