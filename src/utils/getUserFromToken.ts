import jwt from "jsonwebtoken";
import { cookies, headers } from "next/headers";

export type TokenPayload = {
  usuarioId: string;
  empresaId: string;
  email: string;
  nombre: string;
  rol: "ADMIN" | "COBRADOR";
};

export function getUserFromToken(): TokenPayload | null {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET no está definido");
  }

  // 1. Cookie (web)
  const cookieStore = cookies();
  let rawToken = cookieStore.get("tokenPrestamos")?.value;

  // 2. Authorization: Bearer (mobile)
  if (!rawToken) {
    const headerStore = headers();
    const auth = headerStore.get("authorization") ?? headerStore.get("Authorization");
    if (auth?.startsWith("Bearer ")) {
      rawToken = auth.slice(7);
    }
  }

  if (!rawToken) return null;

  try {
    return jwt.verify(rawToken, process.env.JWT_SECRET) as TokenPayload;
  } catch (error) {
    console.error("Error al verificar el token:", error);
    return null;
  }
}
