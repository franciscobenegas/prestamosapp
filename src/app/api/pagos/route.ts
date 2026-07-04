import { NextRequest, NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { getUserFromToken } from "@/utils/getUserFromToken";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const user = getUserFromToken();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const clienteId = request.nextUrl.searchParams.get("clienteId") ?? undefined;
  const prestamoId = request.nextUrl.searchParams.get("prestamoId") ?? undefined;

  const pagos = await prisma.pago.findMany({
    where: {
      ...(user.rol === "COBRADOR" ? { usuarioId: user.usuarioId } : {}),
      ...(prestamoId ? { prestamoId } : {}),
      ...(clienteId ? { prestamo: { clienteId } } : {}),
    },
    include: {
      prestamo: { include: { cliente: { select: { id: true, nombre: true, apellido: true } } } },
      cuota: { select: { numero: true } },
    },
    orderBy: { fechaPago: "desc" },
  });

  return NextResponse.json(pagos);
}
