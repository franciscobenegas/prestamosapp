import prisma from "@/libs/prisma";
import { hashPassword } from "@/utils/hash";
import { generarCuotas, type Frecuencia, type TipoInteres } from "@/lib/prestamos";

const ADMIN_EMAIL = "admin@prestamos.local";
const ADMIN_PASSWORD = "admin123";

type MetodoPago = "EFECTIVO" | "TRANSFERENCIA" | "OTRO";
type EstadoPrestamoFinal = "ACTIVO" | "PAGADO" | "CANCELADO" | "REFINANCIADO";

function d(anio: number, mes: number, dia: number) {
  return new Date(anio, mes - 1, dia);
}

function offsetDias(fecha: Date, dias: number) {
  const copia = new Date(fecha);
  copia.setDate(copia.getDate() + dias);
  return copia;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function metodoAleatorio(): MetodoPago {
  const opciones: MetodoPago[] = ["EFECTIVO", "EFECTIVO", "TRANSFERENCIA", "OTRO"];
  return opciones[randInt(0, opciones.length - 1)];
}

async function getOrCreateAdmin() {
  const existente = await prisma.usuario.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existente) {
    await prisma.empresa.update({
      where: { id: existente.empresaId },
      data: {
        ruc: "80012345-6",
        telefono: "021-234567",
        direccion: "Asunción, Paraguay",
      },
    });
    return existente;
  }

  const empresa = await prisma.empresa.create({
    data: {
      nombre: "Empresa Demo",
      ruc: "80012345-6",
      telefono: "021-234567",
      direccion: "Asunción, Paraguay",
    },
  });

  return prisma.usuario.create({
    data: {
      empresaId: empresa.id,
      nombre: "Administrador",
      email: ADMIN_EMAIL,
      password: await hashPassword(ADMIN_PASSWORD),
      rol: "ADMIN",
      activo: true,
    },
  });
}

async function limpiarDatosDemo(empresaId: string) {
  await prisma.pago.deleteMany({ where: { empresaId } });
  await prisma.auditoria.deleteMany({ where: { empresaId } });
  await prisma.refinanciacion.deleteMany({ where: { empresaId } });
  await prisma.cuota.deleteMany({ where: { prestamo: { empresaId } } });
  await prisma.prestamo.deleteMany({ where: { empresaId } });
  await prisma.simulacion.deleteMany({ where: { empresaId } });
  await prisma.cliente.deleteMany({ where: { empresaId } });
}

async function crearCliente(params: {
  empresaId: string;
  usuarioId: string;
  nombre: string;
  apellido: string;
  documento: string;
  telefono: string;
  direccion?: string;
  email?: string;
}) {
  return prisma.cliente.create({
    data: {
      empresaId: params.empresaId,
      usuarioId: params.usuarioId,
      nombre: params.nombre,
      apellido: params.apellido,
      documento: params.documento,
      telefono: params.telefono,
      direccion: params.direccion,
      email: params.email,
    },
  });
}

async function crearPrestamo(params: {
  empresaId: string;
  usuarioId: string;
  clienteId: string;
  monto: number;
  tasaInteres: number;
  iva?: number;
  cantidadCuotas: number;
  tipoInteres: TipoInteres;
  frecuencia: Frecuencia;
  fechaInicio: Date;
}) {
  const cuotasCalculadas = generarCuotas({
    monto: params.monto,
    tasaInteres: params.tasaInteres,
    iva: params.iva ?? 0,
    cantidadCuotas: params.cantidadCuotas,
    tipoInteres: params.tipoInteres,
    frecuencia: params.frecuencia,
    fechaInicio: params.fechaInicio,
  });

  const prestamo = await prisma.prestamo.create({
    data: {
      empresaId: params.empresaId,
      clienteId: params.clienteId,
      usuarioId: params.usuarioId,
      monto: params.monto,
      tasaInteres: params.tasaInteres,
      iva: params.iva ?? 0,
      cantidadCuotas: params.cantidadCuotas,
      tipoInteres: params.tipoInteres,
      frecuencia: params.frecuencia,
      fechaInicio: params.fechaInicio,
    },
  });

  await prisma.cuota.createMany({
    data: cuotasCalculadas.map((c) => ({
      prestamoId: prestamo.id,
      numero: c.numero,
      fechaVencimiento: c.fechaVencimiento,
      montoCapital: c.montoCapital,
      montoInteres: c.montoInteres,
      montoTotal: c.montoTotal,
    })),
  });

  const cuotas = await prisma.cuota.findMany({
    where: { prestamoId: prestamo.id },
    orderBy: { numero: "asc" },
  });

  return { prestamo, cuotas };
}

async function registrarPago(params: {
  empresaId: string;
  usuarioId: string;
  prestamoId: string;
  cuotaId: string;
  montoTotal: number;
  montoPagadoActual: number;
  monto: number;
  fechaPago: Date;
  metodoPago?: MetodoPago;
  observacion?: string;
}) {
  await prisma.pago.create({
    data: {
      empresaId: params.empresaId,
      cuotaId: params.cuotaId,
      prestamoId: params.prestamoId,
      usuarioId: params.usuarioId,
      monto: params.monto,
      fechaPago: params.fechaPago,
      metodoPago: params.metodoPago ?? metodoAleatorio(),
      observacion: params.observacion,
    },
  });

  const nuevoMontoPagado = params.montoPagadoActual + params.monto;
  const nuevoEstado =
    nuevoMontoPagado >= params.montoTotal ? "PAGADA" : nuevoMontoPagado > 0 ? "PARCIAL" : "PENDIENTE";

  await prisma.cuota.update({
    where: { id: params.cuotaId },
    data: { montoPagado: nuevoMontoPagado, estado: nuevoEstado },
  });
}

/** Paga de forma completa las primeras `cantidad` cuotas (con algo de atraso realista en la fecha de pago). */
async function pagarPrimeras(
  cuotas: { id: string; montoTotal: unknown; fechaVencimiento: Date }[],
  cantidad: number,
  ctx: { empresaId: string; usuarioId: string; prestamoId: string }
) {
  for (let i = 0; i < cantidad && i < cuotas.length; i++) {
    const cuota = cuotas[i];
    const montoTotal = Number(cuota.montoTotal);
    await registrarPago({
      ...ctx,
      cuotaId: cuota.id,
      montoTotal,
      montoPagadoActual: 0,
      monto: montoTotal,
      fechaPago: offsetDias(cuota.fechaVencimiento, randInt(-2, 5)),
    });
  }
}

/** Paga parcialmente (un porcentaje) la cuota en el índice dado. */
async function pagarParcial(
  cuotas: { id: string; montoTotal: unknown; fechaVencimiento: Date }[],
  indice: number,
  porcentaje: number,
  ctx: { empresaId: string; usuarioId: string; prestamoId: string }
) {
  const cuota = cuotas[indice];
  if (!cuota) return;
  const montoTotal = Number(cuota.montoTotal);
  const monto = Math.round(montoTotal * porcentaje);
  await registrarPago({
    ...ctx,
    cuotaId: cuota.id,
    montoTotal,
    montoPagadoActual: 0,
    monto,
    fechaPago: offsetDias(cuota.fechaVencimiento, randInt(-1, 4)),
    observacion: "Pago parcial acordado con el cliente",
  });
}

async function fijarEstadoPrestamo(prestamoId: string, estado: EstadoPrestamoFinal) {
  await prisma.prestamo.update({ where: { id: prestamoId }, data: { estado } });
}

async function saldoPendiente(prestamoId: string) {
  const cuotas = await prisma.cuota.findMany({
    where: { prestamoId, estado: { not: "PAGADA" } },
    select: { montoTotal: true, montoPagado: true },
  });
  return cuotas.reduce((sum, c) => sum + (Number(c.montoTotal) - Number(c.montoPagado)), 0);
}

async function refinanciar(params: {
  empresaId: string;
  usuarioId: string;
  clienteId: string;
  prestamoAnteriorId: string;
  montoAdicional: number;
  tasaInteres: number;
  iva?: number;
  cantidadCuotas: number;
  tipoInteres: TipoInteres;
  frecuencia: Frecuencia;
  fechaInicio: Date;
  observacion?: string;
}) {
  const saldo = await saldoPendiente(params.prestamoAnteriorId);
  const montoNuevo = Math.round(saldo) + params.montoAdicional;

  const { prestamo, cuotas } = await crearPrestamo({
    empresaId: params.empresaId,
    usuarioId: params.usuarioId,
    clienteId: params.clienteId,
    monto: montoNuevo,
    tasaInteres: params.tasaInteres,
    iva: params.iva,
    cantidadCuotas: params.cantidadCuotas,
    tipoInteres: params.tipoInteres,
    frecuencia: params.frecuencia,
    fechaInicio: params.fechaInicio,
  });

  await fijarEstadoPrestamo(params.prestamoAnteriorId, "REFINANCIADO");

  await prisma.refinanciacion.create({
    data: {
      empresaId: params.empresaId,
      prestamoAnteriorId: params.prestamoAnteriorId,
      prestamoNuevoId: prestamo.id,
      usuarioId: params.usuarioId,
      saldoAnterior: saldo,
      montoAdicional: params.montoAdicional,
      observacion: params.observacion,
    },
  });

  return { prestamo, cuotas };
}

async function main() {
  const admin = await getOrCreateAdmin();
  const empresaId = admin.empresaId;
  const usuarioId = admin.id;

  console.log(`Usando empresa ${empresaId} / admin ${admin.email}`);
  console.log("Limpiando datos de demo previos...");
  await limpiarDatosDemo(empresaId);

  const ctxBase = { empresaId, usuarioId };

  console.log("Creando clientes...");
  const clientes = {
    carlos: await crearCliente({
      ...ctxBase,
      nombre: "Carlos",
      apellido: "Gómez",
      documento: "3456789",
      telefono: "0981234567",
      direccion: "Asunción",
      email: "carlos.gomez@example.com",
    }),
    maria: await crearCliente({
      ...ctxBase,
      nombre: "María",
      apellido: "López",
      documento: "4123456",
      telefono: "0982345678",
      direccion: "San Lorenzo",
    }),
    juan: await crearCliente({
      ...ctxBase,
      nombre: "Juan",
      apellido: "Benítez",
      documento: "2987654",
      telefono: "0983456789",
      direccion: "Luque",
    }),
    ana: await crearCliente({
      ...ctxBase,
      nombre: "Ana",
      apellido: "Cáceres",
      documento: "3654321",
      telefono: "0984567890",
      direccion: "Fernando de la Mora",
      email: "ana.caceres@example.com",
    }),
    pedro: await crearCliente({
      ...ctxBase,
      nombre: "Pedro",
      apellido: "Rojas",
      documento: "4321987",
      telefono: "0985678901",
      direccion: "Capiatá",
    }),
    lucia: await crearCliente({
      ...ctxBase,
      nombre: "Lucía",
      apellido: "Fernández",
      documento: "3789456",
      telefono: "0986789012",
      direccion: "Lambaré",
    }),
    diego: await crearCliente({
      ...ctxBase,
      nombre: "Diego",
      apellido: "Martínez",
      documento: "4567123",
      telefono: "0987890123",
      direccion: "Ñemby",
    }),
    rosa: await crearCliente({
      ...ctxBase,
      nombre: "Rosa",
      apellido: "Villalba",
      documento: "2876543",
      telefono: "0988901234",
      direccion: "Mariano Roque Alonso",
      email: "rosa.villalba@example.com",
    }),
    elena: await crearCliente({
      ...ctxBase,
      nombre: "Elena",
      apellido: "Duarte",
      documento: "3123789",
      telefono: "0989012345",
      direccion: "San Lorenzo",
    }),
    ramon: await crearCliente({
      ...ctxBase,
      nombre: "Ramón",
      apellido: "Ortiz",
      documento: "4789123",
      telefono: "0990123456",
      direccion: "Asunción",
    }),
  };

  console.log("Creando préstamos y su historial de cobros...");

  // 1) Activo, al día: se pagaron todas las cuotas vencidas hasta hoy.
  {
    const { prestamo, cuotas } = await crearPrestamo({
      ...ctxBase,
      clienteId: clientes.carlos.id,
      monto: 3_000_000,
      tasaInteres: 36,
      iva: 10,
      cantidadCuotas: 6,
      tipoInteres: "FRANCES",
      frecuencia: "MENSUAL",
      fechaInicio: d(2026, 1, 15),
    });
    await pagarPrimeras(cuotas, 5, { ...ctxBase, prestamoId: prestamo.id });
  }

  // 2) Activo con atraso moderado: una cuota parcial y dos cuotas vencidas sin pagar.
  {
    const { prestamo, cuotas } = await crearPrestamo({
      ...ctxBase,
      clienteId: clientes.maria.id,
      monto: 2_000_000,
      tasaInteres: 30,
      cantidadCuotas: 8,
      tipoInteres: "SIMPLE",
      frecuencia: "MENSUAL",
      fechaInicio: d(2026, 1, 5),
    });
    await pagarPrimeras(cuotas, 3, { ...ctxBase, prestamoId: prestamo.id });
    await pagarParcial(cuotas, 3, 0.6, { ...ctxBase, prestamoId: prestamo.id });
    // cuotas índice 4 y 5 (jun/jul) quedan vencidas sin pagar → ATRASADA
  }

  // 3) Activo con atraso severo: casi nada pagado, la mayoría de las cuotas está vencida.
  {
    const { prestamo, cuotas } = await crearPrestamo({
      ...ctxBase,
      clienteId: clientes.juan.id,
      monto: 1_500_000,
      tasaInteres: 40,
      cantidadCuotas: 10,
      tipoInteres: "ALEMAN",
      frecuencia: "QUINCENAL",
      fechaInicio: d(2026, 1, 10),
    });
    await pagarPrimeras(cuotas, 1, { ...ctxBase, prestamoId: prestamo.id });
    await pagarParcial(cuotas, 1, 0.4, { ...ctxBase, prestamoId: prestamo.id });
    // el resto queda vencido y sin pagar
  }

  // 4) Pagado por completo.
  {
    const { prestamo, cuotas } = await crearPrestamo({
      ...ctxBase,
      clienteId: clientes.ana.id,
      monto: 1_000_000,
      tasaInteres: 24,
      iva: 10,
      cantidadCuotas: 4,
      tipoInteres: "FRANCES",
      frecuencia: "MENSUAL",
      fechaInicio: d(2026, 1, 1),
    });
    await pagarPrimeras(cuotas, cuotas.length, { ...ctxBase, prestamoId: prestamo.id });
    await fijarEstadoPrestamo(prestamo.id, "PAGADO");
  }

  // 5) Pagado por completo (frecuencia semanal).
  {
    const { prestamo, cuotas } = await crearPrestamo({
      ...ctxBase,
      clienteId: clientes.pedro.id,
      monto: 1_800_000,
      tasaInteres: 20,
      cantidadCuotas: 6,
      tipoInteres: "SIMPLE",
      frecuencia: "SEMANAL",
      fechaInicio: d(2026, 2, 1),
    });
    await pagarPrimeras(cuotas, cuotas.length, { ...ctxBase, prestamoId: prestamo.id });
    await fijarEstadoPrestamo(prestamo.id, "PAGADO");
  }

  // 6) Cancelado tras algunos pagos (préstamo dado de baja / condonado).
  {
    const { prestamo, cuotas } = await crearPrestamo({
      ...ctxBase,
      clienteId: clientes.lucia.id,
      monto: 2_500_000,
      tasaInteres: 35,
      cantidadCuotas: 12,
      tipoInteres: "FRANCES",
      frecuencia: "MENSUAL",
      fechaInicio: d(2026, 1, 20),
    });
    await pagarPrimeras(cuotas, 3, { ...ctxBase, prestamoId: prestamo.id });
    await fijarEstadoPrestamo(prestamo.id, "CANCELADO");
  }

  // 7) Cancelado casi sin pagos.
  {
    const { prestamo, cuotas } = await crearPrestamo({
      ...ctxBase,
      clienteId: clientes.diego.id,
      monto: 800_000,
      tasaInteres: 30,
      cantidadCuotas: 6,
      tipoInteres: "ALEMAN",
      frecuencia: "MENSUAL",
      fechaInicio: d(2026, 3, 1),
    });
    await pagarPrimeras(cuotas, 1, { ...ctxBase, prestamoId: prestamo.id });
    await fijarEstadoPrestamo(prestamo.id, "CANCELADO");
  }

  // 8) Refinanciación: préstamo original con atraso, se refinancia con monto adicional.
  {
    const { prestamo: original, cuotas } = await crearPrestamo({
      ...ctxBase,
      clienteId: clientes.rosa.id,
      monto: 4_000_000,
      tasaInteres: 38,
      iva: 10,
      cantidadCuotas: 10,
      tipoInteres: "SIMPLE",
      frecuencia: "MENSUAL",
      fechaInicio: d(2026, 1, 12),
    });
    await pagarPrimeras(cuotas, 4, { ...ctxBase, prestamoId: original.id });
    // cuotas 5 y 6 quedan vencidas sin pagar antes de refinanciar

    const { prestamo: nuevo, cuotas: cuotasNuevo } = await refinanciar({
      ...ctxBase,
      clienteId: clientes.rosa.id,
      prestamoAnteriorId: original.id,
      montoAdicional: 500_000,
      tasaInteres: 32,
      iva: 10,
      cantidadCuotas: 8,
      tipoInteres: "FRANCES",
      frecuencia: "MENSUAL",
      fechaInicio: d(2026, 6, 15),
      observacion: "Refinanciación por atraso, se otorga monto adicional solicitado por el cliente",
    });
    await pagarPrimeras(cuotasNuevo, 1, { ...ctxBase, prestamoId: nuevo.id });
  }

  // 9) Refinanciación #2.
  {
    const { prestamo: original, cuotas } = await crearPrestamo({
      ...ctxBase,
      clienteId: clientes.elena.id,
      monto: 1_200_000,
      tasaInteres: 33,
      cantidadCuotas: 8,
      tipoInteres: "FRANCES",
      frecuencia: "QUINCENAL",
      fechaInicio: d(2026, 1, 8),
    });
    await pagarPrimeras(cuotas, 3, { ...ctxBase, prestamoId: original.id });

    const { prestamo: nuevo, cuotas: cuotasNuevo } = await refinanciar({
      ...ctxBase,
      clienteId: clientes.elena.id,
      prestamoAnteriorId: original.id,
      montoAdicional: 200_000,
      tasaInteres: 30,
      cantidadCuotas: 6,
      tipoInteres: "ALEMAN",
      frecuencia: "MENSUAL",
      fechaInicio: d(2026, 5, 20),
      observacion: "Refinanciación de saldo pendiente",
    });
    await pagarPrimeras(cuotasNuevo, 2, { ...ctxBase, prestamoId: nuevo.id });
  }

  // 10) Préstamo recién iniciado, sin cuotas vencidas todavía.
  {
    await crearPrestamo({
      ...ctxBase,
      clienteId: clientes.ramon.id,
      monto: 1_500_000,
      tasaInteres: 28,
      cantidadCuotas: 6,
      tipoInteres: "FRANCES",
      frecuencia: "MENSUAL",
      fechaInicio: d(2026, 7, 1),
    });
  }

  const totales = {
    clientes: await prisma.cliente.count({ where: { empresaId } }),
    prestamos: await prisma.prestamo.count({ where: { empresaId } }),
    pagos: await prisma.pago.count({ where: { empresaId } }),
    refinanciaciones: await prisma.refinanciacion.count({ where: { empresaId } }),
  };
  const porEstado = await prisma.prestamo.groupBy({
    by: ["estado"],
    where: { empresaId },
    _count: { _all: true },
  });

  console.log("\nDatos de demo cargados:");
  console.log(totales);
  console.log("Préstamos por estado:", Object.fromEntries(porEstado.map((r) => [r.estado, r._count._all])));
  console.log(`\nIngresá con: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
