import { NextRequest, NextResponse } from "next/server";
import prisma from "@/libs/prisma";
import { getUserFromToken } from "@/utils/getUserFromToken";
import { renderSimulacionPdf } from "@/lib/pdf/simulacion-pdf";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { simulacionId: string } }
) {
  const user = getUserFromToken();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const simulacion = await prisma.simulacion.findUnique({ where: { id: params.simulacionId } });
  if (!simulacion || simulacion.empresaId !== user.empresaId) {
    return NextResponse.json({ error: "Simulación no encontrada" }, { status: 404 });
  }
  if (user.rol === "COBRADOR" && simulacion.usuarioId !== user.usuarioId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const buffer = await renderSimulacionPdf({
    clienteNombre: simulacion.clienteNombre,
    clienteEmail: simulacion.clienteEmail,
    monto: Number(simulacion.monto),
    tasaInteres: Number(simulacion.tasaInteres),
    cantidadCuotas: simulacion.cantidadCuotas,
    tipoInteres: simulacion.tipoInteres,
    frecuencia: simulacion.frecuencia,
    fechaInicio: simulacion.fechaInicio,
  });

  const nombreArchivo = `simulacion-${simulacion.clienteNombre.replace(/\s+/g, "-").toLowerCase()}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
    },
  });
}
