"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { Eye, Plus, Search, X } from "lucide-react";
import { formatMonto } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FacetedFilter } from "@/components/faceted-filter";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbarActions } from "@/components/data-table/data-table-toolbar-actions";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";

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

const columns: ColumnDef<Simulacion>[] = [
  {
    id: "cliente",
    accessorFn: (row) => row.clienteNombre,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cliente" />,
    cell: ({ row }) => (
      <div>
        <Link href={`/simulador/${row.original.id}`} className="font-medium hover:underline">
          {row.original.clienteNombre}
        </Link>
        {row.original.clienteEmail && (
          <div className="text-xs text-muted-foreground">{row.original.clienteEmail}</div>
        )}
      </div>
    ),
    meta: { label: "Cliente" },
  },
  {
    id: "monto",
    accessorFn: (row) => Number(row.monto),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Monto" />,
    cell: ({ row }) => formatMonto(row.original.monto),
    meta: { label: "Monto" },
  },
  {
    id: "cuotas",
    accessorFn: (row) => row.cantidadCuotas,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cuotas" />,
    meta: { label: "Cuotas" },
  },
  {
    id: "tipo",
    accessorFn: (row) => row.tipoInteres,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tipo" />,
    cell: ({ row }) => (
      <Badge variant={row.original.tipoInteres === "FRANCES" ? "default" : "secondary"}>
        {row.original.tipoInteres}
      </Badge>
    ),
    meta: { label: "Tipo" },
  },
  {
    id: "frecuencia",
    accessorFn: (row) => row.frecuencia,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Frecuencia" />,
    meta: { label: "Frecuencia" },
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => (
      <div className="text-right">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" asChild>
              <Link href={`/simulador/${row.original.id}`} aria-label="Ver simulación">
                <Eye className="size-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Ver simulación</TooltipContent>
        </Tooltip>
      </div>
    ),
    meta: { exportable: false },
  },
];

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
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

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

  const data = useMemo(() => initialData, [initialData]);

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [data]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility, pagination },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

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
        <div className="flex items-center gap-2">
          <DataTableToolbarActions table={table} filename="simulaciones" />
          <Button asChild>
            <Link href="/simulador/nuevo">
              <Plus className="size-4" />
              Nueva simulación
            </Link>
          </Button>
        </div>
      </div>

      <DataTable
        table={table}
        emptyMessage={isPending ? "Buscando..." : "No hay simulaciones que coincidan con los filtros."}
      />
      <DataTablePagination table={table} />
    </div>
  );
}
