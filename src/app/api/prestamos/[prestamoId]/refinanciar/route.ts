import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/libs/prisma";
import { getUserFromToken } from "@/utils/getUserFromToken";
import { auditar } from "@/utils/auditoria";
import { generarCuotas } from "@/lib/prestamos";
import { getSaldoPendiente } from "@/lib/refinanciaciones-queries";

export const dynamic = "force-dynamic";

const refinanciarSchema = z.object({
  tasaInteres: z.coerce.number().min(0, "La tasa no puede ser negativa"),
  cantidadCuotas: z.coerce.number().int().min(1, "Debe haber al menos 1 cuota"),
  tipoInteres: z.enum(["FRANCES", "ALEMAN", "SIMPLE"]),
  frecuencia: z.enum(["DIARIA", "SEMANAL", "QUINCENAL", "MENSUAL"]),
  fechaInicio: z.coerce.date(),
  montoAdicional: z.coerce.number().min(0, "No puede ser negativo").transform(Math.round).default(0),
  observacion: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { prestamoId: string } }
) {
  const user = getUserFromToken();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const prestamoAnterior = await prisma.prestamo.findUnique({ where: { id: params.prestamoId } });
  if (!prestamoAnterior || prestamoAnterior.empresaId !== user.empresaId) {
    return NextResponse.json({ error: "Préstamo no encontrado" }, { status: 404 });
  }
  if (user.rol === "COBRADOR" && prestamoAnterior.usuarioId !== user.usuarioId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (prestamoAnterior.estado !== "ACTIVO") {
    return NextResponse.json(
      { error: "Solo se puede refinanciar un préstamo activo" },
      { status: 409 }
    );
  }

  const body = await request.json();
  const parsed = refinanciarSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const saldoPendiente = await getSaldoPendiente(prestamoAnterior.id);
  if (saldoPendiente <= 0) {
    return NextResponse.json(
      { error: "Este préstamo no tiene saldo pendiente para refinanciar" },
      { status: 409 }
    );
  }

  const data = parsed.data;
  const montoNuevo = Math.round(saldoPendiente) + data.montoAdicional;

  const cuotasCalculadas = generarCuotas({
    monto: montoNuevo,
    tasaInteres: data.tasaInteres,
    cantidadCuotas: data.cantidadCuotas,
    tipoInteres: data.tipoInteres,
    frecuencia: data.frecuencia,
    fechaInicio: data.fechaInicio,
  });

  const resultado = await prisma.$transaction(async (tx) => {
    const prestamoNuevo = await tx.prestamo.create({
      data: {
        empresaId: user.empresaId,
        clienteId: prestamoAnterior.clienteId,
        usuarioId: prestamoAnterior.usuarioId,
        monto: montoNuevo,
        tasaInteres: data.tasaInteres,
        cantidadCuotas: data.cantidadCuotas,
        tipoInteres: data.tipoInteres,
        frecuencia: data.frecuencia,
        fechaInicio: data.fechaInicio,
      },
    });

    await tx.cuota.createMany({
      data: cuotasCalculadas.map((cuota) => ({
        prestamoId: prestamoNuevo.id,
        numero: cuota.numero,
        fechaVencimiento: cuota.fechaVencimiento,
        montoCapital: cuota.montoCapital,
        montoInteres: cuota.montoInteres,
        montoTotal: cuota.montoTotal,
      })),
    });

    await tx.prestamo.update({
      where: { id: prestamoAnterior.id },
      data: { estado: "REFINANCIADO" },
    });

    const refinanciacion = await tx.refinanciacion.create({
      data: {
        empresaId: user.empresaId,
        prestamoAnteriorId: prestamoAnterior.id,
        prestamoNuevoId: prestamoNuevo.id,
        usuarioId: user.usuarioId,
        saldoAnterior: saldoPendiente,
        montoAdicional: data.montoAdicional,
        observacion: data.observacion,
      },
    });

    return { prestamoNuevo, refinanciacion };
  });

  await auditar("Refinanciacion", "CREATE", user.empresaId, user.usuarioId, {
    registroId: resultado.refinanciacion.id,
    newValues: {
      ...resultado.refinanciacion,
      prestamoAnteriorId: prestamoAnterior.id,
      prestamoNuevoId: resultado.prestamoNuevo.id,
    },
  });

  return NextResponse.json(resultado.prestamoNuevo, { status: 201 });
}
