export function formatMonto(value: number | string) {
  return Number(value).toLocaleString("es-AR", { maximumFractionDigits: 0 });
}
