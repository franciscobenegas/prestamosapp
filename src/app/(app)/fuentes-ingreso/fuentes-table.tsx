"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
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

function buildColumns(
  onEdit: (fuente: FuenteIngreso) => void,
  onDelete: (fuente: FuenteIngreso) => void
): ColumnDef<FuenteIngreso>[] {
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
        <div className="flex justify-end gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => onEdit(row.original)}
                aria-label="Editar fuente"
              >
                <Pencil className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Editar</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-destructive hover:text-destructive"
                onClick={() => onDelete(row.original)}
                aria-label="Eliminar fuente"
              >
                <Trash2 className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Eliminar</TooltipContent>
          </Tooltip>
        </div>
      ),
      meta: { exportable: false },
    },
  ];
}

export function FuentesTable({ initialData }: { initialData: FuenteIngreso[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<FuenteIngreso | null>(null);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const handleDelete = useCallback(
    async (fuente: FuenteIngreso) => {
      if (deletingId) return;
      if (!confirm(`¿Eliminar la fuente de ingreso "${fuente.nombre}"?`)) return;
      setDeletingId(fuente.id);
      try {
        const res = await fetch(`/api/fuentes-ingreso/${fuente.id}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) {
          toast.error(typeof data.error === "string" ? data.error : "No se pudo eliminar");
          return;
        }
        toast.success("Fuente de ingreso eliminada");
        router.refresh();
      } catch {
        toast.error("Error de conexión con el servidor");
      } finally {
        setDeletingId(null);
      }
    },
    [deletingId, router]
  );

  const columns = useMemo(
    () => buildColumns((fuente) => setEditing(fuente), handleDelete),
    [handleDelete]
  );

  const table = useReactTable({
    data: initialData,
    columns,
    state: { sorting, columnVisibility, pagination, globalFilter },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o descripción..."
            className="pl-8"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <DataTableToolbarActions table={table} filename="fuentes-ingreso" />
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            Nueva fuente
          </Button>
        </div>
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
