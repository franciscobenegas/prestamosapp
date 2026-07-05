import prisma from "@/libs/prisma";
import type { TokenPayload } from "@/utils/getUserFromToken";
import { toCountMap } from "@/lib/facets";

export type AuditoriaFilters = {
  tabla?: string[];
  accion?: string[];
  q?: string;
};

export async function getAuditorias(user: TokenPayload, filters: AuditoriaFilters = {}) {
  return prisma.auditoria.findMany({
    where: {
      empresaId: user.empresaId,
      ...(filters.tabla?.length ? { tabla: { in: filters.tabla } } : {}),
      ...(filters.accion?.length ? { accion: { in: filters.accion } } : {}),
      ...(filters.q
        ? { usuario: { nombre: { contains: filters.q, mode: "insensitive" as const } } }
        : {}),
    },
    include: { usuario: { select: { id: true, nombre: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
}

export async function getAuditoriaFacetCounts(user: TokenPayload) {
  const porTabla = await prisma.auditoria.groupBy({
    by: ["tabla"],
    where: { empresaId: user.empresaId },
    _count: { _all: true },
  });
  const porAccion = await prisma.auditoria.groupBy({
    by: ["accion"],
    where: { empresaId: user.empresaId },
    _count: { _all: true },
  });

  return {
    tabla: toCountMap(porTabla.map((r) => ({ value: r.tabla, count: r._count._all }))),
    accion: toCountMap(porAccion.map((r) => ({ value: r.accion, count: r._count._all }))),
  };
}
