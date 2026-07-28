"use client";

import { useMemo, useState } from "react";
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
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbarActions } from "@/components/data-table/data-table-toolbar-actions";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { FuenteFormDialog } from "./fuente-form-dialog";

type FuenteIngreso = {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
};

function buildColumns(onEdit: (fuente: FuenteIngreso) => void): ColumnDef<FuenteIngreso>[] {
  return [
    {
      id: "nombre",
      accessorFn: (row) => row.nombre,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
      cell: ({ row }) => <span className="font-medium">{row.original.nombre}</span>,
      meta: { label: "Nombre" },
    },
    {
      id: "descripcion",
      accessorFn: (row) => row.descripcion ?? "",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Descripción" />,
      cell: ({ row }) => row.original.descripcion || "—",
      meta: { label: "Descripción" },
    },
    {
      id: "estado",
      accessorFn: (row) => row.activo,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
      cell: ({ row }) => (
        <Badge variant={row.original.activo ? "default" : "outline"}>
          {row.original.activo ? "Activa" : "Inactiva"}
        </Badge>
      ),
      meta: { label: "Estado" },
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="text-right">
          <Button variant="ghost" size="sm" onClick={() => onEdit(row.original)}>
            Editar
          </Button>
        </div>
      ),
      meta: { exportable: false },
    },
  ];
}

export function FuentesTable({ initialData }: { initialData: FuenteIngreso[] }) {
  const [editing, setEditing] = useState<FuenteIngreso | null>(null);
  const [creating, setCreating] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const columns = useMemo(() => buildColumns((fuente) => setEditing(fuente)), []);

  const table = useReactTable({
    data: initialData,
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
      <div className="flex items-center justify-end gap-2">
        <DataTableToolbarActions table={table} filename="fuentes-ingreso" />
        <Button onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          Nueva fuente
        </Button>
      </div>

      <DataTable table={table} emptyMessage="No hay fuentes de ingreso cargadas." />
      <DataTablePagination table={table} />

      <FuenteFormDialog open={creating} onOpenChange={setCreating} />
      <FuenteFormDialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        fuente={editing}
      />
    </div>
  );
}
