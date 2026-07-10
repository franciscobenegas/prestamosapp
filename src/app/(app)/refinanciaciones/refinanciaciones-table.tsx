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
import { Plus, Search } from "lucide-react";
import { formatMonto } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbarActions } from "@/components/data-table/data-table-toolbar-actions";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";

type Refinanciacion = {
  id: string;
  createdAt: string;
  saldoAnterior: string;
  montoAdicional: string;
  observacion: string | null;
  prestamoAnteriorId: string;
  prestamoNuevoId: string;
  prestamoAnterior: {
    cliente: { id: string; nombre: string; apellido: string };
  };
  prestamoNuevo: { monto: string };
};

const columns: ColumnDef<Refinanciacion>[] = [
  {
    id: "fecha",
    accessorFn: (row) => new Date(row.createdAt),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString("es-AR"),
    meta: { label: "Fecha" },
  },
  {
    id: "cliente",
    accessorFn: (row) => `${row.prestamoAnterior.cliente.nombre} ${row.prestamoAnterior.cliente.apellido}`,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cliente" />,
    cell: ({ row }) => (
      <Link
        href={`/clientes/${row.original.prestamoAnterior.cliente.id}`}
        className="font-medium hover:underline"
      >
        {row.original.prestamoAnterior.cliente.nombre} {row.original.prestamoAnterior.cliente.apellido}
      </Link>
    ),
    meta: { label: "Cliente" },
  },
  {
    id: "prestamoAnterior",
    header: "Préstamo anterior",
    enableSorting: false,
    cell: ({ row }) => (
      <Link href={`/prestamos/${row.original.prestamoAnteriorId}`} className="hover:underline">
        Ver anterior
      </Link>
    ),
    meta: { label: "Préstamo anterior", exportable: false },
  },
  {
    id: "saldoAnterior",
    accessorFn: (row) => Number(row.saldoAnterior),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Saldo refinanciado" />,
    cell: ({ row }) => formatMonto(row.original.saldoAnterior),
    meta: { label: "Saldo refinanciado" },
  },
  {
    id: "montoAdicional",
    accessorFn: (row) => Number(row.montoAdicional),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Monto adicional" />,
    cell: ({ row }) => formatMonto(row.original.montoAdicional),
    meta: { label: "Monto adicional" },
  },
  {
    id: "prestamoNuevo",
    accessorFn: (row) => Number(row.prestamoNuevo.monto),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Préstamo nuevo" />,
    cell: ({ row }) => (
      <Link href={`/prestamos/${row.original.prestamoNuevoId}`} className="hover:underline">
        {formatMonto(row.original.prestamoNuevo.monto)}
      </Link>
    ),
    meta: { label: "Préstamo nuevo" },
  },
];

export function RefinanciacionesTable({
  initialData,
  initialQuery,
}: {
  initialData: Refinanciacion[];
  initialQuery: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (query) params.set("q", query);
      else params.delete("q");
      startTransition(() => {
        router.push(`/refinanciaciones?${params.toString()}`);
      });
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

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
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente..."
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <DataTableToolbarActions table={table} filename="refinanciaciones" />
          <Button asChild>
            <Link href="/refinanciaciones/nueva">
              <Plus className="size-4" />
              Nueva refinanciación
            </Link>
          </Button>
        </div>
      </div>

      <DataTable
        table={table}
        emptyMessage={isPending ? "Buscando..." : "Todavía no se registraron refinanciaciones."}
      />
      <DataTablePagination table={table} />
    </div>
  );
}
