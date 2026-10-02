"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrestamoActions({
  prestamoId,
  estado,
  tienePagos,
}: {
  prestamoId: string;
  estado: string;
  tienePagos: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (estado === "CANCELADO" || estado === "PAGADO" || estado === "REFINANCIADO") return null;

  async function handleCancelar() {
    if (!confirm("¿Cancelar este préstamo? Esta acción no se puede deshacer.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/prestamos/${prestamoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "CANCELADO" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "No se pudo cancelar");
        return;
      }
      toast.success("Préstamo cancelado");
      router.refresh();
    } catch {
      toast.error("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCancelar}
      disabled={loading || tienePagos}
      title={tienePagos ? "No se puede cancelar: ya tiene pagos registrados" : undefined}
    >
      <Ban className="size-4" />
      Cancelar
    </Button>
  );
}
