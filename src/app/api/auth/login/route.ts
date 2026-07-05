import prisma from "@/libs/prisma";
import { comparePassword } from "@/utils/hash";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  const user = await prisma.usuario.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 401 }
    );
  }

  if (!user.activo) {
    return NextResponse.json(
      { error: "Usuario inactivo. Comuníquese con el administrador." },
      { status: 403 }
    );
  }

  const isValid = await comparePassword(password, user.password);

  if (!isValid) {
    return NextResponse.json(
      { error: "Contraseña incorrecta" },
      { status: 401 }
    );
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET no está definido en las variables de entorno.");
  }

  const token = jwt.sign(
    {
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30,
      usuarioId: user.id,
      empresaId: user.empresaId,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
    },
    process.env.JWT_SECRET
  );

  const cookieStore = await cookies();
  cookieStore.set("tokenPrestamos", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return NextResponse.json({
    success: true,
    token,
    user: {
      usuarioId: user.id,
      empresaId: user.empresaId,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
    },
  });
}
