import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/libs/prisma";
import { hashPassword } from "@/utils/hash";
import { auditar } from "@/utils/auditoria";

export const dynamic = "force-dynamic";

const registroSchema = z
  .object({
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

  // Las cuentas creadas desde el registro público quedan inactivas y sin
  // permisos de administrador hasta que un ADMIN las active desde /usuarios.
  const nuevo = await prisma.usuario.create({
    data: {
      nombre: parsed.data.nombre,
      email: parsed.data.email,
      password: await hashPassword(parsed.data.password),
      rol: "COBRADOR",
      activo: false,
    },
  });

  await auditar("Usuario", "CREATE", nuevo.id, {
    registroId: nuevo.id,
    newValues: { ...nuevo, password: "***" },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
