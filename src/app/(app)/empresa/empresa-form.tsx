"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EmpresaValues = {
  nombre: string;
  ruc: string;
  telefono: string;
  direccion: string;
};

export function EmpresaForm({ empresa }: { empresa: EmpresaValues }) {
  const router = useRouter();
  const [values, setValues] = useState<EmpresaValues>(empresa);
  const [loading, setLoading] = useState(false);

  function setField(field: keyof EmpresaValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/empresa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "No se pudo guardar");
        return;
      }
      toast.success("Empresa actualizada");
      router.refresh();
    } catch {
      toast.error("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-4 rounded-md border p-4">
      <div className="grid gap-2">
        <Label htmlFor="nombre">Nombre de la empresa</Label>
        <Input
          id="nombre"
          value={values.nombre}
          onChange={(e) => setField("nombre", e.target.value)}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="ruc">RUC</Label>
        <Input id="ruc" value={values.ruc} onChange={(e) => setField("ruc", e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="telefono">Teléfono</Label>
        <Input
          id="telefono"
          value={values.telefono}
          onChange={(e) => setField("telefono", e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="direccion">Dirección</Label>
        <Input
          id="direccion"
          value={values.direccion}
          onChange={(e) => setField("direccion", e.target.value)}
        />
      </div>
      <Button type="submit" disabled={loading || !values.nombre.trim()}>
        {loading ? "Guardando..." : "Guardar"}
      </Button>
    </form>
  );
}
