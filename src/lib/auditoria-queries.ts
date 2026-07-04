import prisma from "@/libs/prisma";
import { toCountMap } from "@/lib/facets";

export type AuditoriaFilters = {
  tabla?: string[];
  accion?: string[];
  q?: string;
};

export async function getAuditorias(filters: AuditoriaFilters = {}) {
  return prisma.auditoria.findMany({
    where: {
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

export async function getAuditoriaFacetCounts() {
  const porTabla = await prisma.auditoria.groupBy({
    by: ["tabla"],
    _count: { _all: true },
  });
  const porAccion = await prisma.auditoria.groupBy({
    by: ["accion"],
    _count: { _all: true },
  });

  return {
    tabla: toCountMap(porTabla.map((r) => ({ value: r.tabla, count: r._count._all }))),
    accion: toCountMap(porAccion.map((r) => ({ value: r.accion, count: r._count._all }))),
  };
}
