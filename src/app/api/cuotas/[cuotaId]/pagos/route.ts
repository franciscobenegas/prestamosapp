import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/libs/prisma";
import { getUserFromToken } from "@/utils/getUserFromToken";
import { auditCreate } from "@/utils/auditoria";
import { formatMonto } from "@/lib/format";

export const dynamic = "force-dynamic";

const pagoSchema = z.object({
  monto: z.coerce.number().positive("El monto debe ser mayor a 0").transform(Math.round),
  metodoPago: z.enum(["EFECTIVO", "TRANSFERENCIA", "OTRO"]).default("EFECTIVO"),
  observacion: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { cuotaId: string } }
) {
  const user = getUserFromToken();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const cuota = await prisma.cuota.findUnique({ where: { id: params.cuotaId } });
  if (!cuota) return NextResponse.json({ error: "Cuota no encontrada" }, { status: 404 });

  const prestamo = await prisma.prestamo.findUnique({ where: { id: cuota.prestamoId } });
  if (!prestamo || prestamo.empresaId !== user.empresaId) {
    return NextResponse.json({ error: "Préstamo no encontrado" }, { status: 404 });
  }
  if (user.rol === "COBRADOR" && prestamo.usuarioId !== user.usuarioId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  if (prestamo.estado === "CANCELADO" || prestamo.estado === "REFINANCIADO") {
    return NextResponse.json(
      { error: "No se pueden registrar pagos en un préstamo cancelado o refinanciado" },
      { status: 409 }
    );
  }

  const body = await request.json();
  const parsed = pagoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.idempotencyKey) {
    const existente = await prisma.pago.findUnique({
      where: { empresaId_idempotencyKey: { empresaId: user.empresaId, idempotencyKey: parsed.data.idempotencyKey } },
    });
    if (existente) return NextResponse.json(existente, { status: 200 });
  }

  const pendiente = Number(cuota.montoTotal) - Number(cuota.montoPagado);
  if (parsed.data.monto > pendiente) {
    return NextResponse.json(
      {
        error: `El monto supera el saldo pendiente de la cuota (${formatMonto(pendiente)})`,
        code: "MONTO_EXCEDE_PENDIENTE",
        pendiente,
      },
      { status: 400 }
    );
  }

  const pago = await auditCreate("Pago", user.empresaId, user.usuarioId, () =>
    prisma.$transaction(async (tx) => {
      const nuevoPago = await tx.pago.create({
        data: {
          empresaId: user.empresaId,
          cuotaId: cuota.id,
          prestamoId: prestamo.id,
          usuarioId: user.usuarioId,
          monto: parsed.data.monto,
          metodoPago: parsed.data.metodoPago,
          observacion: parsed.data.observacion,
          idempotencyKey: parsed.data.idempotencyKey,
        },
      });

      const nuevoMontoPagado = Number(cuota.montoPagado) + parsed.data.monto;
      const nuevoEstadoCuota =
        nuevoMontoPagado >= Number(cuota.montoTotal)
          ? "PAGADA"
          : nuevoMontoPagado > 0
            ? "PARCIAL"
            : "PENDIENTE";

      await tx.cuota.update({
        where: { id: cuota.id },
        data: { montoPagado: nuevoMontoPagado, estado: nuevoEstadoCuota },
      });

      const cuotasDelPrestamo = await tx.cuota.findMany({
        where: { prestamoId: prestamo.id },
        select: { id: true, estado: true },
      });
      const todasPagadas = cuotasDelPrestamo.every((c) =>
        c.id === cuota.id ? nuevoEstadoCuota === "PAGADA" : c.estado === "PAGADA"
      );
      if (todasPagadas) {
        await tx.prestamo.update({
          where: { id: prestamo.id },
          data: { estado: "PAGADO" },
        });
      }

      return nuevoPago;
    })
  );

  return NextResponse.json(pago, { status: 201 });
}
