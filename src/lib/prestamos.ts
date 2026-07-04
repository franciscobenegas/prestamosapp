import { addDays, addWeeks, addMonths } from "date-fns";

export type Frecuencia = "DIARIA" | "SEMANAL" | "QUINCENAL" | "MENSUAL";
export type TipoInteres = "FRANCES" | "ALEMAN" | "SIMPLE";

export type CuotaCalculada = {
  numero: number;
  fechaVencimiento: Date;
  montoCapital: number;
  montoInteres: number;
  montoTotal: number;
};

export type GenerarCuotasInput = {
  monto: number;
  /** Tasa de interés por período de cuota, en porcentaje (ej. 10 = 10% por cuota). */
  tasaInteres: number;
  cantidadCuotas: number;
  tipoInteres: TipoInteres;
  frecuencia: Frecuencia;
  fechaInicio: Date;
};

/** Los importes se manejan en una moneda sin decimales: se redondean a números enteros. */
function round0(value: number) {
  return Math.round(value);
}

function sumarPeriodo(fecha: Date, frecuencia: Frecuencia, cantidad: number): Date {
  switch (frecuencia) {
    case "DIARIA":
      return addDays(fecha, cantidad);
    case "SEMANAL":
      return addWeeks(fecha, cantidad);
    case "QUINCENAL":
      return addDays(fecha, cantidad * 15);
    case "MENSUAL":
      return addMonths(fecha, cantidad);
  }
}

function generarCuotasFrances(
  monto: number,
  tasaPeriodica: number,
  cantidadCuotas: number,
  fechaInicio: Date,
  frecuencia: Frecuencia
): CuotaCalculada[] {
  const i = tasaPeriodica;
  const cuotaFija =
    i === 0 ? monto / cantidadCuotas : (monto * i) / (1 - Math.pow(1 + i, -cantidadCuotas));

  const cuotas: CuotaCalculada[] = [];
  let saldo = monto;

  for (let numero = 1; numero <= cantidadCuotas; numero++) {
    const interes = saldo * i;
    let capital = cuotaFija - interes;
    if (numero === cantidadCuotas) {
      capital = saldo;
    }
    saldo -= capital;

    const montoCapital = round0(capital);
    const montoInteres = round0(interes);

    cuotas.push({
      numero,
      fechaVencimiento: sumarPeriodo(fechaInicio, frecuencia, numero),
      montoCapital,
      montoInteres,
      montoTotal: montoCapital + montoInteres,
    });
  }

  return cuotas;
}

function generarCuotasAleman(
  monto: number,
  tasaPeriodica: number,
  cantidadCuotas: number,
  fechaInicio: Date,
  frecuencia: Frecuencia
): CuotaCalculada[] {
  const capitalPorCuota = monto / cantidadCuotas;

  const cuotas: CuotaCalculada[] = [];
  let saldo = monto;
  let capitalAcumulado = 0;

  for (let numero = 1; numero <= cantidadCuotas; numero++) {
    const interes = saldo * tasaPeriodica;
    const montoCapital =
      numero === cantidadCuotas ? round0(monto - capitalAcumulado) : round0(capitalPorCuota);
    capitalAcumulado += montoCapital;
    saldo -= capitalPorCuota;

    const montoInteres = round0(interes);

    cuotas.push({
      numero,
      fechaVencimiento: sumarPeriodo(fechaInicio, frecuencia, numero),
      montoCapital,
      montoInteres,
      montoTotal: montoCapital + montoInteres,
    });
  }

  return cuotas;
}

function generarCuotasSimple(
  monto: number,
  tasaPeriodica: number,
  cantidadCuotas: number,
  fechaInicio: Date,
  frecuencia: Frecuencia
): CuotaCalculada[] {
  const capitalPorCuota = monto / cantidadCuotas;
  const interesPorCuota = monto * tasaPeriodica;
  const montoInteres = round0(interesPorCuota);

  const cuotas: CuotaCalculada[] = [];
  let capitalAcumulado = 0;

  for (let numero = 1; numero <= cantidadCuotas; numero++) {
    const montoCapital =
      numero === cantidadCuotas ? round0(monto - capitalAcumulado) : round0(capitalPorCuota);
    capitalAcumulado += montoCapital;

    cuotas.push({
      numero,
      fechaVencimiento: sumarPeriodo(fechaInicio, frecuencia, numero),
      montoCapital,
      montoInteres,
      montoTotal: montoCapital + montoInteres,
    });
  }

  return cuotas;
}

export function generarCuotas(input: GenerarCuotasInput): CuotaCalculada[] {
  const { monto, tasaInteres, cantidadCuotas, tipoInteres, frecuencia, fechaInicio } = input;

  if (cantidadCuotas < 1) {
    throw new Error("La cantidad de cuotas debe ser al menos 1");
  }

  const tasaPeriodica = tasaInteres / 100;
  const montoRedondeado = round0(monto);

  switch (tipoInteres) {
    case "FRANCES":
      return generarCuotasFrances(montoRedondeado, tasaPeriodica, cantidadCuotas, fechaInicio, frecuencia);
    case "ALEMAN":
      return generarCuotasAleman(montoRedondeado, tasaPeriodica, cantidadCuotas, fechaInicio, frecuencia);
    case "SIMPLE":
      return generarCuotasSimple(montoRedondeado, tasaPeriodica, cantidadCuotas, fechaInicio, frecuencia);
  }
}
