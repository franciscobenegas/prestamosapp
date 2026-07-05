"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, FileDown, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SimulacionForm } from "../simulacion-form";

type Simulacion = {
  id: string;
  clienteNombre: string;
  clienteEmail: string;
  monto: number;
  tasaInteres: number;
  iva: number;
  cantidadCuotas: number;
  tipoInteres: "FRANCES" | "ALEMAN" | "SIMPLE";
  frecuencia: "DIARIA" | "SEMANAL" | "QUINCENAL" | "MENSUAL";
  fechaInicio: string;
};

export function SimulacionDetailActions({ simulacion }: { simulacion: Simulacion }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`¿Eliminar la simulación de ${simulacion.clienteNombre}?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/simulaciones/${simulacion.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "No se pudo eliminar");
        return;
      }
      toast.success("Simulación eliminada");
      router.push("/simulador");
      router.refresh();
    } catch {
      toast.error("Error de conexión con el servidor");
    } finally {
      setDeleting(false);
    }
  }

  function handleDescargarPdf() {
    window.open(`/api/simulaciones/${simulacion.id}/pdf`, "_blank");
  }

  function handleEnviarPorMail() {
    if (!simulacion.clienteEmail) {
      toast.error("Esta simulación no tiene un email de cliente cargado");
      return;
    }
    handleDescargarPdf();
    const asunto = encodeURIComponent("Simulación de préstamo");
    const cuerpo = encodeURIComponent(
      `Hola ${simulacion.clienteNombre},\n\nTe comparto la simulación del préstamo conversado. Adjunto el PDF con el detalle de las cuotas.\n\nSaludos.`
    );
    toast.info("Se descargó el PDF. Adjuntalo en el mail que se va a abrir.");
    window.location.href = `mailto:${simulacion.clienteEmail}?subject=${asunto}&body=${cuerpo}`;
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleDescargarPdf}>
        <FileDown className="size-4" />
        Descargar PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleEnviarPorMail}
        disabled={!simulacion.clienteEmail}
        title={!simulacion.clienteEmail ? "Cargá un email de cliente para poder enviarlo" : undefined}
      >
        <Mail className="size-4" />
        Enviar por mail
      </Button>
      <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
        <Pencil className="size-4" />
        Editar
      </Button>
      <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
        <Trash2 className="size-4" />
        Eliminar
      </Button>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Editar simulación</DialogTitle>
          </DialogHeader>
          <SimulacionForm
            simulacionId={simulacion.id}
            defaultValues={simulacion}
            onSuccess={() => {
              setEditOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
