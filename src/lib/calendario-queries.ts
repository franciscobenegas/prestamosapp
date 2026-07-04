import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import prisma from "@/libs/prisma";
import type { TokenPayload } from "@/utils/getUserFromToken";

export async function getCuotasDelMes(user: TokenPayload, mesDeReferencia: Date) {
  const inicioMes = startOfMonth(mesDeReferencia);
  const finMes = endOfMonth(mesDeReferencia);
  const inicioGrilla = startOfWeek(inicioMes, { weekStartsOn: 1 });
  const finGrilla = endOfWeek(finMes, { weekStartsOn: 1 });

  return prisma.cuota.findMany({
    where: {
      fechaVencimiento: { gte: inicioGrilla, lte: finGrilla },
      prestamo: user.rol === "COBRADOR" ? { usuarioId: user.usuarioId } : {},
    },
    include: {
      prestamo: {
        include: { cliente: { select: { id: true, nombre: true, apellido: true } } },
      },
    },
    orderBy: { fechaVencimiento: "asc" },
  });
}
