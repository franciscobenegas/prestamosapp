"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClienteFormDialog } from "../cliente-form-dialog";

type Cliente = {
  id: string;
  nombre: string;
  apellido: string;
  documento: string;
  telefono: string;
  direccion: string;
  email: string;
};

export function ClienteDetailActions({
  cliente,
  hasPrestamos,
}: {
  cliente: Cliente;
  hasPrestamos: boolean;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`¿Eliminar a ${cliente.nombre} ${cliente.apellido}?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/clientes/${cliente.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "No se pudo eliminar");
        return;
      }
      toast.success("Cliente eliminado");
      router.push("/clientes");
      router.refresh();
    } catch {
      toast.error("Error de conexión con el servidor");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
        <Pencil className="size-4" />
        Editar
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={hasPrestamos || deleting}
        title={hasPrestamos ? "No se puede eliminar: tiene préstamos asociados" : undefined}
      >
        <Trash2 className="size-4" />
        Eliminar
      </Button>
      <ClienteFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        clienteId={cliente.id}
        defaultValues={cliente}
        onSuccess={() => {
          setEditOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}
