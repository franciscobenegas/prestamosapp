import { redirect } from "next/navigation";
import { getUserFromToken } from "@/utils/getUserFromToken";
import { getClientesForUser } from "@/lib/clientes";
import { PrestamoForm } from "./prestamo-form";

export default async function NuevoPrestamoPage({
  searchParams,
}: {
  searchParams: { clienteId?: string };
}) {
  const user = getUserFromToken();
  if (!user) redirect("/auth/login");

  const clientes = await getClientesForUser(user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Nuevo préstamo</h1>
        <p className="text-sm text-muted-foreground">
          Definí las condiciones del préstamo y revisá el cronograma antes de confirmar.
        </p>
      </div>
      <PrestamoForm
        clientes={clientes.map((c) => ({
          id: c.id,
          nombre: `${c.nombre} ${c.apellido}`,
        }))}
        defaultClienteId={searchParams.clienteId}
      />
    </div>
  );
}
