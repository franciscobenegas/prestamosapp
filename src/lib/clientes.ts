import prisma from "@/libs/prisma";
import type { TokenPayload } from "@/utils/getUserFromToken";

export async function getClientesForUser(user: TokenPayload, q?: string) {
  return prisma.cliente.findMany({
    where: {
      ...(user.rol === "COBRADOR" ? { usuarioId: user.usuarioId } : {}),
      ...(q
        ? {
            OR: [
              { nombre: { contains: q, mode: "insensitive" as const } },
              { apellido: { contains: q, mode: "insensitive" as const } },
              { documento: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    include: { usuario: { select: { id: true, nombre: true } } },
    orderBy: { createdAt: "desc" },
  });
}
