"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { generarCuotas, descomponerIva } from "@/lib/prestamos";
import { formatMonto, formatMontoInput, soloDigitos } from "@/lib/format";

const simulacionSchema = z.object({
  clienteNombre: z.string().min(1, "El nombre es obligatorio"),
  clienteEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  monto: z.coerce.number().positive("El monto debe ser mayor a 0").transform(Math.round),
  tasaInteres: z.coerce.number().min(0, "La tasa no puede ser negativa"),
  cantidadCuotas: z.coerce.number().int().min(1, "Debe haber al menos 1 cuota"),
  tipoInteres: z.enum(["FRANCES", "ALEMAN", "SIMPLE"]),
  frecuencia: z.enum(["DIARIA", "SEMANAL", "QUINCENAL", "MENSUAL"]),
  fechaInicio: z.string().min(1, "Obligatorio"),
});

type SimulacionValues = z.input<typeof simulacionSchema>;
type SimulacionOutput = z.output<typeof simulacionSchema>;

export function SimulacionForm({
  simulacionId,
  defaultValues,
  onSuccess,
}: {
  simulacionId?: string;
  defaultValues?: Partial<SimulacionValues>;
  onSuccess?: (id: string) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEdit = Boolean(simulacionId);

  const form = useForm<SimulacionValues, unknown, SimulacionOutput>({
    resolver: zodResolver(simulacionSchema),
    defaultValues: {
      clienteNombre: defaultValues?.clienteNombre ?? "",
      clienteEmail: defaultValues?.clienteEmail ?? "",
      monto: defaultValues?.monto ?? 0,
      tasaInteres: defaultValues?.tasaInteres ?? 10,
      cantidadCuotas: defaultValues?.cantidadCuotas ?? 6,
      tipoInteres: defaultValues?.tipoInteres ?? "FRANCES",
      frecuencia: defaultValues?.frecuencia ?? "MENSUAL",
      fechaInicio: defaultValues?.fechaInicio ?? format(new Date(), "yyyy-MM-dd"),
    },
  });

  const values = form.watch();

  const simulacion = useMemo(() => {
    if (!values.monto || !values.cantidadCuotas || !values.fechaInicio) return [];
    try {
      return generarCuotas({
        monto: Number(values.monto),
        tasaInteres: Number(values.tasaInteres) || 0,
        cantidadCuotas: Number(values.cantidadCuotas),
        tipoInteres: values.tipoInteres,
        frecuencia: values.frecuencia,
        fechaInicio: new Date(`${values.fechaInicio}T00:00:00`),
      });
    } catch {
      return [];
    }
  }, [values.monto, values.tasaInteres, values.cantidadCuotas, values.tipoInteres, values.frecuencia, values.fechaInicio]);

  const totalCuotas = simulacion.reduce((s, c) => s + c.montoTotal, 0);

  async function onSubmit(data: SimulacionOutput) {
    setLoading(true);
    try {
      const res = await fetch(isEdit ? `/api/simulaciones/${simulacionId}` : "/api/simulaciones", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (!res.ok) {
        toast.error(typeof result.error === "string" ? result.error : "No se pudo guardar la simulación");
        return;
      }

      toast.success(isEdit ? "Simulación actualizada" : "Simulación creada");
      if (onSuccess) {
        onSuccess(result.id);
      } else {
        router.push(`/simulador/${result.id}`);
      }
      router.refresh();
    } catch {
      toast.error("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="clienteNombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del cliente</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre y apellido" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clienteEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (opcional)</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="cliente@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="monto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto</FormLabel>
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
              name="tasaInteres"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tasa de interés anual - TNA (%)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" {...field} value={field.value as number} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="cantidadCuotas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cantidad de cuotas</FormLabel>
                  <FormControl>
                    <Input type="number" step="1" min="1" {...field} value={field.value as number} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fechaInicio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de inicio</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="tipoInteres"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de interés</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="FRANCES">Francés (cuota fija)</SelectItem>
                      <SelectItem value="ALEMAN">Alemán (capital fijo)</SelectItem>
                      <SelectItem value="SIMPLE">Interés simple</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="frecuencia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frecuencia</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DIARIA">Diaria</SelectItem>
                      <SelectItem value="SEMANAL">Semanal</SelectItem>
                      <SelectItem value="QUINCENAL">Quincenal</SelectItem>
                      <SelectItem value="MENSUAL">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear simulación"}
          </Button>
        </form>
      </Form>

      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Simulación del cronograma
          </h2>
          <div className="max-h-96 overflow-y-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Capital</TableHead>
                  <TableHead>Interés</TableHead>
                  <TableHead>IVA</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {simulacion.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Completá los datos para ver la simulación.
                    </TableCell>
                  </TableRow>
                )}
                {simulacion.map((cuota) => (
                  <TableRow key={cuota.numero}>
                    <TableCell>{cuota.numero}</TableCell>
                    <TableCell>{format(cuota.fechaVencimiento, "dd/MM/yyyy")}</TableCell>
                    <TableCell>{formatMonto(cuota.montoCapital)}</TableCell>
                    <TableCell>{formatMonto(cuota.montoInteres)}</TableCell>
                    <TableCell>{formatMonto(descomponerIva(cuota.montoInteres).iva)}</TableCell>
                    <TableCell>{formatMonto(cuota.montoTotal)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {simulacion.length > 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              Total a pagar: <span className="font-medium text-foreground">{formatMonto(totalCuotas)}</span>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
