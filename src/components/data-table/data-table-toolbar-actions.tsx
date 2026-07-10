"use client";

import type { Table } from "@tanstack/react-table";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { DataTableExportButton } from "@/components/data-table/data-table-export-button";

export function DataTableToolbarActions<TData>({
  table,
  filename,
}: {
  table: Table<TData>;
  filename: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <DataTableViewOptions table={table} />
      <DataTableExportButton table={table} filename={filename} />
    </div>
  );
}
