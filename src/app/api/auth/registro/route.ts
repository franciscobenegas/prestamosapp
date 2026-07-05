import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/libs/prisma";
import { hashPassword } from "@/utils/hash";
import { auditar } from "@/utils/auditoria";

export const dynamic = "force-dynamic";

const registroSchema = z
  .object({
    empresaNombre: z.string().min(1, "El nombre de la empresa es obligatorio"),
    nombre: z.string().min(1, "El nombre es obligatorio"),
    email: z.string().email("Email inválido"),
    password: z
      .string()
      .min(7, "La contraseña debe tener más de 6 caracteres")
      .regex(/[A-Z]/, "La contraseña debe tener al menos una letra mayúscula"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = registroSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existente = await prisma.usuario.findUnique({ where: { email: parsed.data.email } });
  if (existente) {
    return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 409 });
  }

  // El registro público crea una empresa nueva. Su primer usuario nace ADMIN
  // y activo: no hay otro administrador dentro de esa empresa que pueda
  // activarlo, a diferencia de los cobradores que se dan de alta desde
  // /usuarios dentro de una empresa ya existente (esos sí nacen inactivos).
  const { empresa, nuevo } = await prisma.$transaction(async (tx) => {
    const empresa = await tx.empresa.create({ data: { nombre: parsed.data.empresaNombre } });
    const nuevo = await tx.usuario.create({
      data: {
        empresaId: empresa.id,
        nombre: parsed.data.nombre,
        email: parsed.data.email,
        password: await hashPassword(parsed.data.password),
        rol: "ADMIN",
        activo: true,
      },
    });
    return { empresa, nuevo };
  });

  await auditar("Usuario", "CREATE", empresa.id, nuevo.id, {
    registroId: nuevo.id,
    newValues: { ...nuevo, password: "***" },
  });
  await auditar("Empresa", "CREATE", empresa.id, nuevo.id, {
    registroId: empresa.id,
    newValues: empresa,
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
