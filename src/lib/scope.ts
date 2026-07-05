import type { TokenPayload } from "@/utils/getUserFromToken";

/**
 * Todo dato queda acotado a la empresa del usuario logueado; si además es
 * COBRADOR, se acota también a lo que le pertenece a él dentro de esa empresa.
 */
export function scopeEmpresa(user: TokenPayload) {
  return {
    empresaId: user.empresaId,
    ...(user.rol === "COBRADOR" ? { usuarioId: user.usuarioId } : {}),
  };
}
