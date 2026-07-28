"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type FuenteIngreso = {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
};

const formSchema = z.object({
  nombre: z.string().min(1, "Obligatorio"),
  descripcion: z.string().optional(),
  activo: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export function FuenteFormDialog({
  open,
  onOpenChange,
  fuente,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fuente?: FuenteIngreso | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEditing = Boolean(fuente);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: {
      nombre: fuente?.nombre ?? "",
      descripcion: fuente?.descripcion ?? "",
      activo: fuente?.activo ?? true,
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const res = await fetch(
        isEditing ? `/api/fuentes-ingreso/${fuente!.id}` : "/api/fuentes-ingreso",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        toast.error(typeof data.error === "string" ? data.error : "No se pudo guardar la fuente de ingreso");
        return;
      }

      toast.success(isEditing ? "Fuente de ingreso actualizada" : "Fuente de ingreso creada");
      form.reset();
      onOpenChange(false);
      router.refresh();
    } catch {
      toast.error("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar fuente de ingreso" : "Nueva fuente de ingreso"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Venta de ganado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isEditing && (
              <FormField
                control={form.control}
                name="activo"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <FormLabel className="!m-0">Fuente activa</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
