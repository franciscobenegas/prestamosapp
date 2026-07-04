"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UsuarioFormDialog } from "./usuario-form-dialog";

type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: "ADMIN" | "COBRADOR";
  activo: boolean;
};

export function UsuariosTable({
  initialData,
  currentUserId,
}: {
  initialData: Usuario[];
  currentUserId: string;
}) {
  const [editing, setEditing] = useState<Usuario | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/usuarios/nuevo">
            <Plus className="size-4" />
            Nuevo usuario
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialData.map((usuario) => (
              <TableRow key={usuario.id}>
                <TableCell className="font-medium">{usuario.nombre}</TableCell>
                <TableCell>{usuario.email}</TableCell>
                <TableCell>
                  <Badge variant={usuario.rol === "ADMIN" ? "default" : "secondary"}>
                    {usuario.rol}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={usuario.activo ? "default" : "outline"}>
                    {usuario.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(usuario)}>
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <UsuarioFormDialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        usuario={editing ?? undefined}
        isSelf={editing?.id === currentUserId}
      />
    </div>
  );
}
