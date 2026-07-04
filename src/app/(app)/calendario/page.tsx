import { redirect } from "next/navigation";
import { getUserFromToken } from "@/utils/getUserFromToken";
import { getCuotasDelMes } from "@/lib/calendario-queries";
import { CalendarioCuotas } from "./calendario-cuotas";

function parseMes(value?: string) {
  if (value && /^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-").map(Number);
    return new Date(year, month - 1, 1);
  }
  const hoy = new Date();
  return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: { mes?: string };
}) {
  const user = getUserFromToken();
  if (!user) redirect("/auth/login");

  const mesDeReferencia = parseMes(searchParams.mes);
  const cuotas = await getCuotasDelMes(user, mesDeReferencia);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Calendario de cuotas</h1>
        <p className="text-sm text-muted-foreground">
          Vencimientos de cuotas organizados por día.
        </p>
      </div>
      <CalendarioCuotas
        mesDeReferencia={mesDeReferencia.toISOString()}
        cuotas={JSON.parse(JSON.stringify(cuotas))}
      />
    </div>
  );
}
