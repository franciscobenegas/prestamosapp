"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
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
import { DataTable } from "@/components/data-table/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { DataTableToolbarActions } from "@/components/data-table/data-table-toolbar-actions";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
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

function buildColumns(onVerCambios: (registro: Auditoria) => void): ColumnDef<Auditoria>[] {
  return [
    {
      id: "fecha",
      accessorFn: (row) => new Date(row.createdAt),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Fecha" />,
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString("es-AR"),
      meta: { label: "Fecha" },
    },
    {
      id: "usuario",
      accessorFn: (row) => row.usuario.nombre,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Usuario" />,
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.usuario.nombre}</div>
          <div className="text-xs text-muted-foreground">{row.original.usuario.email}</div>
        </div>
      ),
      meta: { label: "Usuario" },
    },
    {
      id: "entidad",
      accessorFn: (row) => tablaLabel[row.tabla] ?? row.tabla,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Entidad" />,
      meta: { label: "Entidad" },
    },
    {
      id: "accion",
      accessorFn: (row) => accionLabel[row.accion] ?? row.accion,
      header: ({ column }) => <DataTableColumnHeader column={column} title="Acción" />,
      cell: ({ row }) => (
        <Badge variant={accionVariant[row.original.accion]}>
          {accionLabel[row.original.accion] ?? row.original.accion}
        </Badge>
      ),
      meta: { label: "Acción" },
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <div className="text-right">
          <Button variant="ghost" size="sm" onClick={() => onVerCambios(row.original)}>
            Ver cambios
          </Button>
        </div>
      ),
      meta: { exportable: false },
    },
  ];
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
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });

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

  const data = useMemo(() => initialData, [initialData]);
  const columns = useMemo(() => buildColumns((registro) => setSeleccionada(registro)), []);

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
      <div className="flex flex-wrap items-center justify-between gap-2">
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
        <DataTableToolbarActions table={table} filename="auditoria" />
      </div>

      <DataTable
        table={table}
        emptyMessage={isPending ? "Buscando..." : "No hay registros que coincidan con los filtros."}
      />
      <DataTablePagination table={table} />

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
