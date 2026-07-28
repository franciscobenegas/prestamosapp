import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/libs/prisma";
import { getUserFromToken } from "@/utils/getUserFromToken";
import { auditUpdate } from "@/utils/auditoria";

export const dynamic = "force-dynamic";

const fuenteIngresoUpdateSchema = z.object({
  nombre: z.string().min(1).optional(),
  descripcion: z.string().optional(),
  activo: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { fuenteIngresoId: string } }
) {
  const user = getUserFromToken();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (user.rol !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const existente = await prisma.fuenteIngreso.findUnique({ where: { id: params.fuenteIngresoId } });
  if (!existente || existente.empresaId !== user.empresaId) {
    return NextResponse.json({ error: "Fuente de ingreso no encontrada" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = fuenteIngresoUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const actualizada = await auditUpdate(
    "FuenteIngreso",
    user.empresaId,
    user.usuarioId,
    existente.id,
    async () => existente,
    () => prisma.fuenteIngreso.update({ where: { id: existente.id }, data: parsed.data })
  );

  return NextResponse.json(actualizada);
}
