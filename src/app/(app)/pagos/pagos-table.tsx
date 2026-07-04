"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Search, X } from "lucide-react";
import { formatMonto } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FacetedFilter } from "@/components/faceted-filter";
import { DateRangeFilter, type DateRange } from "@/components/date-range-filter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Pago = {
  id: string;
  prestamoId: string;
  fechaPago: string;
  monto: string;
  metodoPago: string;
  observacion: string | null;
  prestamo: { cliente: { id: string; nombre: string; apellido: string } };
  cuota: { numero: number };
};

type FacetCounts = {
  metodoPago: Record<string, number>;
  cobradores: { label: string; value: string; count: number }[];
};

const metodoOptions = [
  { label: "Efectivo", value: "EFECTIVO" },
  { label: "Transferencia", value: "TRANSFERENCIA" },
  { label: "Otro", value: "OTRO" },
];

function withCounts(options: { label: string; value: string }[], counts: Record<string, number>) {
  return options.map((option) => ({ ...option, count: counts[option.value] ?? 0 }));
}

export function PagosTable({
  initialData,
  facetCounts,
  isAdmin,
  initialFilters,
}: {
  initialData: Pago[];
  facetCounts: FacetCounts;
  isAdmin: boolean;
  initialFilters: { metodo: string[]; cobrador: string[]; desde: string; hasta: string; q: string };
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialFilters.q);
  const [isPending, startTransition] = useTransition();

  const dateRange: DateRange | undefined = initialFilters.desde
    ? {
        from: new Date(`${initialFilters.desde}T00:00:00`),
        to: initialFilters.hasta ? new Date(`${initialFilters.hasta}T00:00:00`) : undefined,
      }
    : undefined;

  function updateParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(window.location.search);
    mutate(params);
    startTransition(() => {
      router.push(`/pagos?${params.toString()}`);
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

  function setFacet(key: "metodo" | "cobrador", values: string[]) {
    updateParams((params) => {
      if (values.length) params.set(key, values.join(","));
      else params.delete(key);
    });
  }

  function setDateRange(range: DateRange | undefined) {
    updateParams((params) => {
      if (range?.from) params.set("desde", format(range.from, "yyyy-MM-dd"));
      else params.delete("desde");
      if (range?.to) params.set("hasta", format(range.to, "yyyy-MM-dd"));
      else params.delete("hasta");
    });
  }

  const hasFilters =
    initialFilters.metodo.length > 0 ||
    initialFilters.cobrador.length > 0 ||
    Boolean(initialFilters.desde) ||
    Boolean(initialFilters.q);

  function clearFilters() {
    setQuery("");
    router.push("/pagos");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-56">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
        <FacetedFilter
          title="Método de pago"
          options={withCounts(metodoOptions, facetCounts.metodoPago)}
          selected={initialFilters.metodo}
          onChange={(values) => setFacet("metodo", values)}
        />
        {isAdmin && facetCounts.cobradores.length > 0 && (
          <FacetedFilter
            title="Cobrador"
            options={facetCounts.cobradores}
            selected={initialFilters.cobrador}
            onChange={(values) => setFacet("cobrador", values)}
          />
        )}
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
              <TableHead>Cliente</TableHead>
              <TableHead>Cuota</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Observación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {isPending ? "Buscando..." : "No hay pagos que coincidan con los filtros."}
                </TableCell>
              </TableRow>
            )}
            {initialData.map((pago) => (
              <TableRow key={pago.id}>
                <TableCell>{new Date(pago.fechaPago).toLocaleString("es-AR")}</TableCell>
                <TableCell>
                  <Link
                    href={`/clientes/${pago.prestamo.cliente.id}`}
                    className="hover:underline"
                  >
                    {pago.prestamo.cliente.nombre} {pago.prestamo.cliente.apellido}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/prestamos/${pago.prestamoId}`} className="hover:underline">
                    #{pago.cuota.numero}
                  </Link>
                </TableCell>
                <TableCell>{formatMonto(pago.monto)}</TableCell>
                <TableCell>{pago.metodoPago}</TableCell>
                <TableCell className="max-w-64 truncate">{pago.observacion || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
