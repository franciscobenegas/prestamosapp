export function formatMonto(value: number | string) {
  return Number(value).toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

/** Para inputs de monto: separador de miles en vivo mientras se escribe (ej. "1500000" -> "1.500.000"). */
export function formatMontoInput(value: unknown) {
  if (value === undefined || value === null || value === "") return "";
  const digits = soloDigitos(String(value));
  if (!digits) return "";
  return new Intl.NumberFormat("es-AR").format(Number(digits));
}

/** Descarta todo lo que no sea dígito (para limpiar lo que el usuario tipeó antes de guardarlo en el form). */
export function soloDigitos(value: string) {
  return value.replace(/\D/g, "");
}
