import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export type TokenPayload = {
  usuarioId: string;
  email: string;
  nombre: string;
  rol: "ADMIN" | "COBRADOR";
};

export function getUserFromToken(): TokenPayload | null {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET no está definido");
  }

  const cookieStore = cookies();
  const rawToken = cookieStore.get("tokenPrestamos")?.value;

  if (!rawToken) return null;

  try {
    return jwt.verify(rawToken, process.env.JWT_SECRET) as TokenPayload;
  } catch (error) {
    console.error("Error al verificar el token:", error);
    return null;
  }
}
