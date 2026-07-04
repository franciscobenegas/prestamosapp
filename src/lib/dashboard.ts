import { startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, addDays, format } from "date-fns";
import prisma from "@/libs/prisma";
import type { TokenPayload } from "@/utils/getUserFromToken";

export async function getDashboardStats(user: TokenPayload) {
  const scopePrestamo = user.rol === "COBRADOR" ? { usuarioId: user.usuarioId } : {};
  const scopePago = user.rol === "COBRADOR" ? { usuarioId: user.usuarioId } : {};

  const hoy = new Date();
  const inicioHoy = startOfDay(hoy);
  const finHoy = endOfDay(hoy);
  const inicioMes = startOfMonth(hoy);
  const finMes = endOfMonth(hoy);

  const prestamosActivos = await prisma.prestamo.count({
    where: { ...scopePrestamo, estado: "ACTIVO" },
  });
  const cuotasPendientesActivos = await prisma.cuota.findMany({
    where: {
      estado: { not: "PAGADA" },
      prestamo: { ...scopePrestamo, estado: "ACTIVO" },
    },
    select: { montoTotal: true, montoPagado: true },
  });
  const pagosHoy = await prisma.pago.aggregate({
    where: { ...scopePago, fechaPago: { gte: inicioHoy, lte: finHoy } },
    _sum: { monto: true },
  });
  const pagosMes = await prisma.pago.aggregate({
    where: { ...scopePago, fechaPago: { gte: inicioMes, lte: finMes } },
    _sum: { monto: true },
  });
  const cuotasAtrasadas = await prisma.cuota.count({
    where: {
      estado: { not: "PAGADA" },
      fechaVencimiento: { lt: inicioHoy },
      prestamo: { ...scopePrestamo, estado: "ACTIVO" },
    },
  });
  const proximasCuotas = await prisma.cuota.findMany({
    where: {
      estado: { not: "PAGADA" },
      fechaVencimiento: { gte: inicioHoy, lte: addDays(inicioHoy, 7) },
      prestamo: { ...scopePrestamo, estado: "ACTIVO" },
    },
    include: {
      prestamo: { include: { cliente: { select: { id: true, nombre: true, apellido: true } } } },
    },
    orderBy: { fechaVencimiento: "asc" },
    take: 20,
  });
  const pagosUltimos14Dias = await prisma.pago.findMany({
    where: { ...scopePago, fechaPago: { gte: subDays(inicioHoy, 13), lte: finHoy } },
    select: { monto: true, fechaPago: true },
  });

  const carteraActiva = cuotasPendientesActivos.reduce(
    (sum, c) => sum + (Number(c.montoTotal) - Number(c.montoPagado)),
    0
  );

  const cobrosPorDiaMap = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    cobrosPorDiaMap.set(format(subDays(inicioHoy, i), "dd/MM"), 0);
  }
  for (const pago of pagosUltimos14Dias) {
    const key = format(pago.fechaPago, "dd/MM");
    cobrosPorDiaMap.set(key, (cobrosPorDiaMap.get(key) ?? 0) + Number(pago.monto));
  }

  return {
    prestamosActivos,
    carteraActiva,
    cobradoHoy: Number(pagosHoy._sum.monto ?? 0),
    cobradoMes: Number(pagosMes._sum.monto ?? 0),
    cuotasAtrasadas,
    proximasCuotas: proximasCuotas.map((c) => ({
      id: c.id,
      numero: c.numero,
      fechaVencimiento: c.fechaVencimiento,
      pendiente: Number(c.montoTotal) - Number(c.montoPagado),
      prestamoId: c.prestamoId,
      cliente: c.prestamo.cliente,
    })),
    cobrosPorDia: Array.from(cobrosPorDiaMap.entries()).map(([fecha, total]) => ({ fecha, total })),
  };
}
