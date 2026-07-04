import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/libs/prisma";
import { getUserFromToken } from "@/utils/getUserFromToken";
import { auditCreate } from "@/utils/auditoria";

export const dynamic = "force-dynamic";

const clienteSchema = z.object({
  nombre: z.string().min(1, "El nombre es obligatorio"),
  apellido: z.string().min(1, "El apellido es obligatorio"),
  documento: z.string().min(1, "El documento es obligatorio"),
  telefono: z.string().min(1, "El teléfono es obligatorio"),
  direccion: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  usuarioId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const user = getUserFromToken();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim();

  const clientes = await prisma.cliente.findMany({
    where: {
      ...(user.rol === "COBRADOR" ? { usuarioId: user.usuarioId } : {}),
      ...(q
        ? {
            OR: [
              { nombre: { contains: q, mode: "insensitive" } },
              { apellido: { contains: q, mode: "insensitive" } },
              { documento: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { usuario: { select: { id: true, nombre: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(clientes);
}

export async function POST(request: NextRequest) {
  const user = getUserFromToken();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const parsed = clienteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { email, usuarioId, ...rest } = parsed.data;

  const existente = await prisma.cliente.findUnique({
    where: { documento: rest.documento },
  });
  if (existente) {
    return NextResponse.json(
      { error: "Ya existe un cliente con ese documento" },
      { status: 409 }
    );
  }

  const asignadoA = user.rol === "ADMIN" ? usuarioId ?? user.usuarioId : user.usuarioId;

  const nuevo = await auditCreate("Cliente", user.usuarioId, () =>
    prisma.cliente.create({
      data: { ...rest, email: email || undefined, usuarioId: asignadoA },
    })
  );

  return NextResponse.json(nuevo, { status: 201 });
}
