"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, X } from "lucide-react";
import { formatMonto } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FacetedFilter } from "@/components/faceted-filter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Prestamo = {
  id: string;
  monto: string;
  cantidadCuotas: number;
  tipoInteres: string;
  frecuencia: string;
  estado: string;
  cliente: { id: string; nombre: string; apellido: string };
};

type FacetCounts = {
  estado: Record<string, number>;
  tipoInteres: Record<string, number>;
  frecuencia: Record<string, number>;
};

const estadoVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ACTIVO: "default",
  PAGADO: "secondary",
  ATRASADO: "destructive",
  CANCELADO: "outline",
  REFINANCIADO: "outline",
};

const estadoOptions = [
  { label: "Activo", value: "ACTIVO" },
  { label: "Pagado", value: "PAGADO" },
  { label: "Atrasado", value: "ATRASADO" },
  { label: "Cancelado", value: "CANCELADO" },
  { label: "Refinanciado", value: "REFINANCIADO" },
];

const tipoOptions = [
  { label: "Francés", value: "FRANCES" },
  { label: "Alemán", value: "ALEMAN" },
  { label: "Simple", value: "SIMPLE" },
];

const frecuenciaOptions = [
  { label: "Diaria", value: "DIARIA" },
  { label: "Semanal", value: "SEMANAL" },
  { label: "Quincenal", value: "QUINCENAL" },
  { label: "Mensual", value: "MENSUAL" },
];

function withCounts(options: { label: string; value: string }[], counts: Record<string, number>) {
  return options.map((option) => ({ ...option, count: counts[option.value] ?? 0 }));
}

export function PrestamosTable({
  initialData,
  facetCounts,
  initialFilters,
}: {
  initialData: Prestamo[];
  facetCounts: FacetCounts;
  initialFilters: { estado: string[]; tipo: string[]; frecuencia: string[]; q: string };
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialFilters.q);
  const [isPending, startTransition] = useTransition();

  // Lee la URL real al momento de ejecutarse (no un valor de searchParams capturado
  // por closure), para que un debounce de búsqueda que dispara tarde no pise un
  // cambio de filtro más reciente (p. ej. "Limpiar" hecho mientras se tipeaba).
  function updateParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(window.location.search);
    mutate(params);
    startTransition(() => {
      router.push(`/prestamos?${params.toString()}`);
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

  function setFacet(key: "estado" | "tipo" | "frecuencia", values: string[]) {
    updateParams((params) => {
      if (values.length) params.set(key, values.join(","));
      else params.delete(key);
    });
  }

  const hasFilters =
    initialFilters.estado.length > 0 ||
    initialFilters.tipo.length > 0 ||
    initialFilters.frecuencia.length > 0 ||
    Boolean(initialFilters.q);

  function clearFilters() {
    setQuery("");
    router.push("/prestamos");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
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
          <FacetedFilter
            title="Estado"
            options={withCounts(estadoOptions, facetCounts.estado)}
            selected={initialFilters.estado}
            onChange={(values) => setFacet("estado", values)}
          />
          <FacetedFilter
            title="Tipo de interés"
            options={withCounts(tipoOptions, facetCounts.tipoInteres)}
            selected={initialFilters.tipo}
            onChange={(values) => setFacet("tipo", values)}
          />
          <FacetedFilter
            title="Frecuencia"
            options={withCounts(frecuenciaOptions, facetCounts.frecuencia)}
            selected={initialFilters.frecuencia}
            onChange={(values) => setFacet("frecuencia", values)}
          />
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Limpiar
              <X className="size-4" />
            </Button>
          )}
        </div>
        <Button asChild>
          <Link href="/prestamos/nuevo">
            <Plus className="size-4" />
            Nuevo préstamo
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Cuotas</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Frecuencia</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  {isPending ? "Buscando..." : "No hay préstamos que coincidan con los filtros."}
                </TableCell>
              </TableRow>
            )}
            {initialData.map((prestamo) => (
              <TableRow key={prestamo.id}>
                <TableCell>
                  <Link
                    href={`/clientes/${prestamo.cliente.id}`}
                    className="font-medium hover:underline"
                  >
                    {prestamo.cliente.nombre} {prestamo.cliente.apellido}
                  </Link>
                </TableCell>
                <TableCell>{formatMonto(prestamo.monto)}</TableCell>
                <TableCell>{prestamo.cantidadCuotas}</TableCell>
                <TableCell>{prestamo.tipoInteres}</TableCell>
                <TableCell>{prestamo.frecuencia}</TableCell>
                <TableCell>
                  <Badge variant={estadoVariant[prestamo.estado]}>{prestamo.estado}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/prestamos/${prestamo.id}`}>Ver</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
