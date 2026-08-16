import prisma from "@/libs/prisma";
import type { TokenPayload } from "@/utils/getUserFromToken";
import { toCountMap } from "@/lib/facets";
import { scopeEmpresa } from "@/lib/scope";

export type PrestamosFilters = {
  estado?: string[];
  tipoInteres?: string[];
  frecuencia?: string[];
  clienteId?: string;
  q?: string;
};

export async function getPrestamosForUser(user: TokenPayload, filters: PrestamosFilters = {}) {
  const prestamos = await prisma.prestamo.findMany({
    where: {
      ...scopeEmpresa(user),
      ...(filters.estado?.length ? { estado: { in: filters.estado as never[] } } : {}),
      ...(filters.tipoInteres?.length ? { tipoInteres: { in: filters.tipoInteres as never[] } } : {}),
      ...(filters.frecuencia?.length ? { frecuencia: { in: filters.frecuencia as never[] } } : {}),
      ...(filters.clienteId ? { clienteId: filters.clienteId } : {}),
      ...(filters.q
        ? {
            cliente: {
              OR: [
                { nombre: { contains: filters.q, mode: "insensitive" as const } },
                { apellido: { contains: filters.q, mode: "insensitive" as const } },
              ],
            },
          }
        : {}),
    },
    include: {
      cliente: { select: { id: true, nombre: true, apellido: true } },
      fuenteIngreso: { select: { id: true, nombre: true } },
      cuotas: { select: { montoTotal: true, montoPagado: true, estado: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // total = capital + interés (suma de montoTotal de las cuotas); saldo = lo que aún
  // resta cobrar (cuotas no PAGADAS). Se strippean las cuotas para no engordar el payload.
  return prestamos.map(({ cuotas, ...prestamo }) => {
    const totalAPagar = cuotas.reduce((sum, c) => sum + Number(c.montoTotal), 0);
    const saldoPendiente = cuotas.reduce(
      (sum, c) => (c.estado !== "PAGADA" ? sum + (Number(c.montoTotal) - Number(c.montoPagado)) : sum),
      0
    );
    const cuotasPagadas = cuotas.filter((c) => c.estado === "PAGADA").length;
    const cuotasPendientes = cuotas.length - cuotasPagadas;
    return { ...prestamo, totalAPagar, saldoPendiente, cuotasPagadas, cuotasPendientes };
  });
}

export async function getPrestamosFacetCounts(user: TokenPayload) {
  const scope = scopeEmpresa(user);

  const porEstado = await prisma.prestamo.groupBy({
    by: ["estado"],
    where: scope,
    _count: { _all: true },
  });
  const porTipo = await prisma.prestamo.groupBy({
    by: ["tipoInteres"],
    where: scope,
    _count: { _all: true },
  });
  const porFrecuencia = await prisma.prestamo.groupBy({
    by: ["frecuencia"],
    where: scope,
    _count: { _all: true },
  });

  return {
    estado: toCountMap(porEstado.map((r) => ({ value: r.estado, count: r._count._all }))),
    tipoInteres: toCountMap(porTipo.map((r) => ({ value: r.tipoInteres ?? "INTERES_FIJO", count: r._count._all }))),
    frecuencia: toCountMap(porFrecuencia.map((r) => ({ value: r.frecuencia, count: r._count._all }))),
  };
}
