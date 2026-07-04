"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FacetedFilter } from "@/components/faceted-filter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { calcularCambios } from "@/lib/auditoria-diff";

type Auditoria = {
  id: string;
  tabla: string;
  accion: string;
  registroId: string;
  oldValues: string | null;
  newValues: string | null;
  createdAt: string;
  usuario: { id: string; nombre: string; email: string };
};

type FacetCounts = {
  tabla: Record<string, number>;
  accion: Record<string, number>;
};

const tablaLabel: Record<string, string> = {
  Cliente: "Cliente",
  Prestamo: "Préstamo",
  Pago: "Pago",
  Simulacion: "Simulación",
  Usuario: "Usuario",
  Refinanciacion: "Refinanciación",
};

const accionLabel: Record<string, string> = {
  CREATE: "Creación",
  UPDATE: "Actualización",
  DELETE: "Eliminación",
};

const accionVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  CREATE: "default",
  UPDATE: "secondary",
  DELETE: "destructive",
};

const tablaOptions = Object.entries(tablaLabel).map(([value, label]) => ({ value, label }));
const accionOptions = Object.entries(accionLabel).map(([value, label]) => ({ value, label }));

function withCounts(options: { label: string; value: string }[], counts: Record<string, number>) {
  return options.map((option) => ({ ...option, count: counts[option.value] ?? 0 }));
}

export function AuditoriaTable({
  initialData,
  facetCounts,
  initialFilters,
}: {
  initialData: Auditoria[];
  facetCounts: FacetCounts;
  initialFilters: { tabla: string[]; accion: string[]; q: string };
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialFilters.q);
  const [isPending, startTransition] = useTransition();
  const [seleccionada, setSeleccionada] = useState<Auditoria | null>(null);

  function updateParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(window.location.search);
    mutate(params);
    startTransition(() => {
      router.push(`/auditoria?${params.toString()}`);
    });
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      updateParams((params) => {
        if (query) params.set("q", query);
        else params.delete("q");
      });
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function setFacet(key: "tabla" | "accion", values: string[]) {
    updateParams((params) => {
      if (values.length) params.set(key, values.join(","));
      else params.delete(key);
    });
  }

  const hasFilters =
    initialFilters.tabla.length > 0 || initialFilters.accion.length > 0 || Boolean(initialFilters.q);

  function clearFilters() {
    setQuery("");
    router.push("/auditoria");
  }

  const cambiosSeleccionados = seleccionada
    ? calcularCambios(seleccionada.oldValues, seleccionada.newValues)
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-56">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuario..."
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <FacetedFilter
          title="Entidad"
          options={withCounts(tablaOptions, facetCounts.tabla)}
          selected={initialFilters.tabla}
          onChange={(values) => setFacet("tabla", values)}
        />
        <FacetedFilter
          title="Acción"
          options={withCounts(accionOptions, facetCounts.accion)}
          selected={initialFilters.accion}
          onChange={(values) => setFacet("accion", values)}
        />
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Limpiar
            <X className="size-4" />
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Entidad</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  {isPending ? "Buscando..." : "No hay registros que coincidan con los filtros."}
                </TableCell>
              </TableRow>
            )}
            {initialData.map((registro) => (
              <TableRow key={registro.id}>
                <TableCell>{new Date(registro.createdAt).toLocaleString("es-AR")}</TableCell>
                <TableCell>
                  <div className="font-medium">{registro.usuario.nombre}</div>
                  <div className="text-xs text-muted-foreground">{registro.usuario.email}</div>
                </TableCell>
                <TableCell>{tablaLabel[registro.tabla] ?? registro.tabla}</TableCell>
                <TableCell>
                  <Badge variant={accionVariant[registro.accion]}>
                    {accionLabel[registro.accion] ?? registro.accion}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setSeleccionada(registro)}>
                    Ver cambios
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={Boolean(seleccionada)} onOpenChange={(open) => !open && setSeleccionada(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {seleccionada && (accionLabel[seleccionada.accion] ?? seleccionada.accion)} de{" "}
              {seleccionada && (tablaLabel[seleccionada.tabla] ?? seleccionada.tabla)}
            </DialogTitle>
          </DialogHeader>
          {seleccionada && (
            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                {seleccionada.usuario.nombre} · {new Date(seleccionada.createdAt).toLocaleString("es-AR")}
              </p>
              <div className="max-h-96 overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campo</TableHead>
                      <TableHead>Valor anterior</TableHead>
                      <TableHead>Valor actual</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cambiosSeleccionados.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          No se registraron cambios de campos para este evento.
                        </TableCell>
                      </TableRow>
                    )}
                    {cambiosSeleccionados.map((cambio) => (
                      <TableRow key={cambio.campo}>
                        <TableCell className="font-medium">{cambio.campo}</TableCell>
                        <TableCell className="max-w-48 truncate text-muted-foreground">
                          {cambio.anterior ?? "—"}
                        </TableCell>
                        <TableCell className="max-w-48 truncate">{cambio.actual ?? "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
