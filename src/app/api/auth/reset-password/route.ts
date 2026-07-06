import prisma from "@/libs/prisma";
import { hashPassword } from "@/utils/hash";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { token, password } = await request.json();

  if (!token || !password) {
    return NextResponse.json(
      { error: "El token y la contraseña son obligatorios" },
      { status: 400 }
    );
  }

  if (typeof password !== "string" || password.length < 6) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 6 caracteres" },
      { status: 400 }
    );
  }

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

  if (!resetToken) {
    return NextResponse.json(
      { error: "El enlace es inválido o ya fue utilizado." },
      { status: 400 }
    );
  }

  if (resetToken.used) {
    return NextResponse.json(
      { error: "Este enlace ya fue utilizado." },
      { status: 400 }
    );
  }

  if (new Date() > resetToken.expiresAt) {
    return NextResponse.json(
      { error: "El enlace ha expirado. Solicitá uno nuevo." },
      { status: 400 }
    );
  }

  const hashedPassword = await hashPassword(password);

  await prisma.usuario.update({
    where: { email: resetToken.email },
    data: { password: hashedPassword },
  });

  await prisma.passwordResetToken.update({
    where: { token },
    data: { used: true },
  });

  return NextResponse.json({ message: "Contraseña actualizada correctamente." });
}
