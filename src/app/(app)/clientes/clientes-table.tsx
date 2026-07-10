"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Eye, Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbarActions } from "@/components/data-table/data-table-toolbar-actions";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { ClienteFormDialog } from "./cliente-form-dialog";

type Cliente = {
  id: string;
  nombre: string;
  apellido: string;
  documento: string;
  telefono: string;
  email: string | null;
  usuario: { id: string; nombre: string };
};

const columns: ColumnDef<Cliente>[] = [
  {
    id: "nombre",
    accessorFn: (row) => `${row.nombre} ${row.apellido}`,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
    cell: ({ row }) => (
      <Link href={`/clientes/${row.original.id}`} className="font-medium hover:underline">
        {row.original.nombre} {row.original.apellido}
      </Link>
    ),
    meta: { label: "Nombre" },
  },
  {
    id: "documento",
    accessorFn: (row) => row.documento,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Documento" />,
    meta: { label: "Documento" },
  },
  {
    id: "telefono",
    accessorFn: (row) => row.telefono,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Teléfono" />,
    meta: { label: "Teléfono" },
  },
  {
    id: "cobrador",
    accessorFn: (row) => row.usuario.nombre,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cobrador" />,
    meta: { label: "Cobrador" },
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
              <Link href={`/clientes/${row.original.id}`} aria-label="Ver cliente">
                <Eye className="size-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Ver cliente</TooltipContent>
        </Tooltip>
      </div>
    ),
    meta: { exportable: false },
  },
];

export function ClientesTable({
  initialData,
  initialQuery,
}: {
  initialData: Cliente[];
  initialQuery: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (query) params.set("q", query);
      else params.delete("q");
      startTransition(() => {
        router.push(`/clientes?${params.toString()}`);
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
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, apellido o documento..."
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <DataTableToolbarActions table={table} filename="clientes" />
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            Nuevo cliente
          </Button>
        </div>
      </div>

      <DataTable
        table={table}
        emptyMessage={isPending ? "Buscando..." : "No hay clientes cargados."}
      />
      <DataTablePagination table={table} />

      <ClienteFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          setDialogOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}
