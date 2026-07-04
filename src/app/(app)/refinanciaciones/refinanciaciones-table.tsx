"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { formatMonto } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
        <Button asChild>
          <Link href="/refinanciaciones/nueva">
            <Plus className="size-4" />
            Nueva refinanciación
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Préstamo anterior</TableHead>
              <TableHead>Saldo refinanciado</TableHead>
              <TableHead>Monto adicional</TableHead>
              <TableHead>Préstamo nuevo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {isPending ? "Buscando..." : "Todavía no se registraron refinanciaciones."}
                </TableCell>
              </TableRow>
            )}
            {initialData.map((refi) => (
              <TableRow key={refi.id}>
                <TableCell>{new Date(refi.createdAt).toLocaleDateString("es-AR")}</TableCell>
                <TableCell>
                  <Link
                    href={`/clientes/${refi.prestamoAnterior.cliente.id}`}
                    className="font-medium hover:underline"
                  >
                    {refi.prestamoAnterior.cliente.nombre} {refi.prestamoAnterior.cliente.apellido}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/prestamos/${refi.prestamoAnteriorId}`} className="hover:underline">
                    Ver anterior
                  </Link>
                </TableCell>
                <TableCell>{formatMonto(refi.saldoAnterior)}</TableCell>
                <TableCell>{formatMonto(refi.montoAdicional)}</TableCell>
                <TableCell>
                  <Link href={`/prestamos/${refi.prestamoNuevoId}`} className="hover:underline">
                    {formatMonto(refi.prestamoNuevo.monto)}
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
