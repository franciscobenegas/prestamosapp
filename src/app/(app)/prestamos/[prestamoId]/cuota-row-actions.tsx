"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RegistrarPagoDialog } from "./registrar-pago-dialog";

export function CuotaRowActions({
  cuotaId,
  numero,
  pendiente,
}: {
  cuotaId: string;
  numero: number;
  pendiente: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        Pagar
      </Button>
      <RegistrarPagoDialog
        cuotaId={cuotaId}
        numero={numero}
        pendiente={pendiente}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
