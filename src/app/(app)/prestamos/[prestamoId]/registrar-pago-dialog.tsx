"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatMonto, formatMontoInput, soloDigitos } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const pagoSchema = z.object({
  monto: z.coerce.number().positive("El monto debe ser mayor a 0").transform(Math.round),
  metodoPago: z.enum(["EFECTIVO", "TRANSFERENCIA", "OTRO"]),
  observacion: z.string().optional(),
});

type PagoValues = z.input<typeof pagoSchema>;
type PagoOutput = z.output<typeof pagoSchema>;

export function RegistrarPagoDialog({
  cuotaId,
  numero,
  pendiente,
  open,
  onOpenChange,
}: {
  cuotaId: string;
  numero: number;
  pendiente: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<PagoValues, unknown, PagoOutput>({
    resolver: zodResolver(pagoSchema),
    values: {
      monto: pendiente,
      metodoPago: "EFECTIVO",
      observacion: "",
    },
  });

  async function onSubmit(data: PagoOutput) {
    setLoading(true);
    try {
      const res = await fetch(`/api/cuotas/${cuotaId}/pagos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!res.ok) {
        toast.error(typeof result.error === "string" ? result.error : "No se pudo registrar el pago");
        return;
      }

      toast.success("Pago registrado");
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
          <DialogTitle>Registrar pago — Cuota #{numero}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="monto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto (saldo pendiente: {formatMonto(pendiente)})</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={formatMontoInput(field.value)}
                      onChange={(e) => field.onChange(soloDigitos(e.target.value))}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="metodoPago"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de pago</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                      <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
                      <SelectItem value="OTRO">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="observacion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observación (opcional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registrando..." : "Registrar pago"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
