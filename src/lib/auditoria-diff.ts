const CAMPOS_OCULTOS = new Set(["id", "createdAt", "updatedAt", "password"]);

export type CambioCampo = {
  campo: string;
  anterior: string | null;
  actual: string | null;
};

function formatValor(valor: unknown): string | null {
  if (valor === null || valor === undefined || valor === "") return null;
  if (typeof valor === "object") return JSON.stringify(valor);
  return String(valor);
}

function parseValores(json: string | null): Record<string, unknown> | null {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Compara el snapshot anterior y el actual de un registro y devuelve solo los campos que cambiaron. */
export function calcularCambios(oldValues: string | null, newValues: string | null): CambioCampo[] {
  const anterior = parseValores(oldValues);
  const actual = parseValores(newValues);

  const campos = Array.from(new Set([
    ...Object.keys(anterior ?? {}),
    ...Object.keys(actual ?? {}),
  ]));

  const cambios: CambioCampo[] = [];
  for (const campo of campos) {
    if (CAMPOS_OCULTOS.has(campo)) continue;
    const valorAnterior = anterior ? formatValor(anterior[campo]) : null;
    const valorActual = actual ? formatValor(actual[campo]) : null;
    if (valorAnterior === valorActual) continue;
    cambios.push({ campo, anterior: valorAnterior, actual: valorActual });
  }

  return cambios.sort((a, b) => a.campo.localeCompare(b.campo));
}
