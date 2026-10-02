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

  // No se muestra el botón si el préstamo ya está finalizado...
  if (
    estado === "RECHAZADO" ||
    estado === "CANCELADO" ||
    estado === "PAGADO" ||
    estado === "REFINANCIADO"
  ) {
    return null;
  }
  // ...ni si alguna cuota ya tiene un pago registrado.
  if (tienePagos) return null;

  async function handleRechazar() {
    if (!confirm("¿Rechazar este préstamo? Esta acción no se puede deshacer.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/prestamos/${prestamoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "RECHAZADO" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "No se pudo rechazar");
        return;
      }
      toast.success("Préstamo rechazado");
      router.refresh();
    } catch {
      toast.error("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleRechazar} disabled={loading}>
      <Ban className="size-4" />
      Rechazar
    </Button>
  );
}
