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

type Simulacion = {
  id: string;
  clienteNombre: string;
  clienteEmail: string | null;
  monto: string;
  cantidadCuotas: number;
  tipoInteres: string;
  frecuencia: string;
};

type FacetCounts = {
  tipoInteres: Record<string, number>;
  frecuencia: Record<string, number>;
};

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

export function SimulacionesTable({
  initialData,
  facetCounts,
  initialFilters,
}: {
  initialData: Simulacion[];
  facetCounts: FacetCounts;
  initialFilters: { tipo: string[]; frecuencia: string[]; q: string };
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialFilters.q);
  const [isPending, startTransition] = useTransition();

  function updateParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(window.location.search);
    mutate(params);
    startTransition(() => {
      router.push(`/simulador?${params.toString()}`);
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

  function setFacet(key: "tipo" | "frecuencia", values: string[]) {
    updateParams((params) => {
      if (values.length) params.set(key, values.join(","));
      else params.delete(key);
    });
  }

  const hasFilters =
    initialFilters.tipo.length > 0 || initialFilters.frecuencia.length > 0 || Boolean(initialFilters.q);

  function clearFilters() {
    setQuery("");
    router.push("/simulador");
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
          <Link href="/simulador/nuevo">
            <Plus className="size-4" />
            Nueva simulación
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
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {isPending ? "Buscando..." : "No hay simulaciones que coincidan con los filtros."}
                </TableCell>
              </TableRow>
            )}
            {initialData.map((simulacion) => (
              <TableRow key={simulacion.id}>
                <TableCell>
                  <Link href={`/simulador/${simulacion.id}`} className="font-medium hover:underline">
                    {simulacion.clienteNombre}
                  </Link>
                  {simulacion.clienteEmail && (
                    <div className="text-xs text-muted-foreground">{simulacion.clienteEmail}</div>
                  )}
                </TableCell>
                <TableCell>{formatMonto(simulacion.monto)}</TableCell>
                <TableCell>{simulacion.cantidadCuotas}</TableCell>
                <TableCell>
                  <Badge variant={simulacion.tipoInteres === "FRANCES" ? "default" : "secondary"}>
                    {simulacion.tipoInteres}
                  </Badge>
                </TableCell>
                <TableCell>{simulacion.frecuencia}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/simulador/${simulacion.id}`}>Ver</Link>
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
