"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import { UsuarioFormDialog } from "./usuario-form-dialog";

type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: "ADMIN" | "COBRADOR";
  activo: boolean;
};

function buildColumns(onEdit: (usuario: Usuario) => void): ColumnDef<Usuario>[] {
  return [
    {
      id: "nombre",
      accessorFn: (row) => row.nombre,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nombre" />,
      cell: ({ row }) => <span className="font-medium">{row.original.nombre}</span>,
      meta: { label: "Nombre" },
    },
    {
      id: "email",
      accessorFn: (row) => row.email,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
      meta: { label: "Email" },
    },
    {
      id: "rol",
      accessorFn: (row) => row.rol,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Rol" />,
      cell: ({ row }) => (
        <Badge variant={row.original.rol === "ADMIN" ? "default" : "secondary"}>
          {row.original.rol}
        </Badge>
      ),
      meta: { label: "Rol" },
    },
    {
      id: "estado",
      accessorFn: (row) => row.activo,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Estado" />,
      cell: ({ row }) => (
        <Badge variant={row.original.activo ? "default" : "outline"}>
          {row.original.activo ? "Activo" : "Inactivo"}
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

export function UsuariosTable({
  initialData,
  currentUserId,
}: {
  initialData: Usuario[];
  currentUserId: string;
}) {
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

  const columns = useMemo(() => buildColumns((usuario) => setEditing(usuario)), []);

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
        <DataTableToolbarActions table={table} filename="usuarios" />
        <Button asChild>
          <Link href="/usuarios/nuevo">
            <Plus className="size-4" />
            Nuevo usuario
          </Link>
        </Button>
      </div>

      <DataTable table={table} emptyMessage="No hay usuarios cargados." />
      <DataTablePagination table={table} />

      <UsuarioFormDialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        usuario={editing ?? undefined}
        isSelf={editing?.id === currentUserId}
      />
    </div>
  );
}
