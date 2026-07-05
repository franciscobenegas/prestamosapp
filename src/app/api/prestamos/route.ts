import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/libs/prisma";
import { getUserFromToken } from "@/utils/getUserFromToken";
import { auditCreate } from "@/utils/auditoria";
import { generarCuotas } from "@/lib/prestamos";
import { scopeEmpresa } from "@/lib/scope";

export const dynamic = "force-dynamic";

const prestamoSchema = z.object({
  clienteId: z.string().min(1, "Seleccioná un cliente"),
  monto: z.coerce.number().positive("El monto debe ser mayor a 0").transform(Math.round),
  tasaInteres: z.coerce.number().min(0, "La tasa no puede ser negativa"),
  cantidadCuotas: z.coerce.number().int().min(1, "Debe haber al menos 1 cuota"),
  tipoInteres: z.enum(["FRANCES", "ALEMAN", "SIMPLE"]),
  frecuencia: z.enum(["DIARIA", "SEMANAL", "QUINCENAL", "MENSUAL"]),
  fechaInicio: z.coerce.date(),
});

export async function GET(request: NextRequest) {
  const user = getUserFromToken();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const clienteId = request.nextUrl.searchParams.get("clienteId") ?? undefined;
  const estado = request.nextUrl.searchParams.get("estado") ?? undefined;

  const prestamos = await prisma.prestamo.findMany({
    where: {
      ...scopeEmpresa(user),
      ...(clienteId ? { clienteId } : {}),
      ...(estado ? { estado: estado as never } : {}),
    },
    include: { cliente: { select: { id: true, nombre: true, apellido: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(prestamos);
}

export async function POST(request: NextRequest) {
  const user = getUserFromToken();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const parsed = prestamoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  const cliente = await prisma.cliente.findUnique({ where: { id: data.clienteId } });
  if (!cliente || cliente.empresaId !== user.empresaId) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }
  if (user.rol === "COBRADOR" && cliente.usuarioId !== user.usuarioId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const cuotasCalculadas = generarCuotas({
    monto: data.monto,
    tasaInteres: data.tasaInteres,
    cantidadCuotas: data.cantidadCuotas,
    tipoInteres: data.tipoInteres,
    frecuencia: data.frecuencia,
    fechaInicio: data.fechaInicio,
  });

  const prestamo = await auditCreate("Prestamo", user.empresaId, user.usuarioId, () =>
    prisma.$transaction(async (tx) => {
      const nuevo = await tx.prestamo.create({
        data: {
          empresaId: user.empresaId,
          clienteId: data.clienteId,
          usuarioId: cliente.usuarioId,
          monto: data.monto,
          tasaInteres: data.tasaInteres,
          cantidadCuotas: data.cantidadCuotas,
          tipoInteres: data.tipoInteres,
          frecuencia: data.frecuencia,
          fechaInicio: data.fechaInicio,
        },
      });

      await tx.cuota.createMany({
        data: cuotasCalculadas.map((cuota) => ({
          prestamoId: nuevo.id,
          numero: cuota.numero,
          fechaVencimiento: cuota.fechaVencimiento,
          montoCapital: cuota.montoCapital,
          montoInteres: cuota.montoInteres,
          montoTotal: cuota.montoTotal,
        })),
      });

      return nuevo;
    })
  );

  return NextResponse.json(prestamo, { status: 201 });
}
