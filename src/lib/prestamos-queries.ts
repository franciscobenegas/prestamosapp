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
  return prisma.prestamo.findMany({
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
    include: { cliente: { select: { id: true, nombre: true, apellido: true } } },
    orderBy: { createdAt: "desc" },
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
    tipoInteres: toCountMap(porTipo.map((r) => ({ value: r.tipoInteres, count: r._count._all }))),
    frecuencia: toCountMap(porFrecuencia.map((r) => ({ value: r.frecuencia, count: r._count._all }))),
  };
}
