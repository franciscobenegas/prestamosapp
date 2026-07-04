import { redirect } from "next/navigation";
import { getUserFromToken } from "@/utils/getUserFromToken";
import {
  getReporteCartera,
  getReporteCobrosPorCobrador,
  getReporteMorosidad,
  getReporteProximosVencimientos,
} from "@/lib/reportes-queries";
import { ReportesTabs } from "./reportes-tabs";

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: { desde?: string; hasta?: string; tab?: string };
}) {
  const user = getUserFromToken();
  if (!user) redirect("/auth/login");

  const cartera = await getReporteCartera(user);
  const cobrosPorCobrador = await getReporteCobrosPorCobrador(user, searchParams.desde, searchParams.hasta);
  const morosidad = await getReporteMorosidad(user);
  const proximosVencimientos = await getReporteProximosVencimientos(user, 15);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reportes</h1>
        <p className="text-sm text-muted-foreground">
          Cartera, cobros por cobrador, morosidad y próximos vencimientos, con exportación a PDF.
        </p>
      </div>
      <ReportesTabs
        cartera={JSON.parse(JSON.stringify(cartera))}
        cobrosPorCobrador={JSON.parse(JSON.stringify(cobrosPorCobrador))}
        morosidad={JSON.parse(JSON.stringify(morosidad))}
        proximosVencimientos={JSON.parse(JSON.stringify(proximosVencimientos))}
        isAdmin={user.rol === "ADMIN"}
        tabInicial={searchParams.tab ?? "cartera"}
        rangoInicial={{ desde: searchParams.desde ?? "", hasta: searchParams.hasta ?? "" }}
      />
    </div>
  );
}
