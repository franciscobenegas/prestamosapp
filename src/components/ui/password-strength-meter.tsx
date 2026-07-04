"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

const criterios = [
  { key: "longitud", label: "Más de 6 caracteres", test: (p: string) => p.length > 6 },
  { key: "mayuscula", label: "Una letra mayúscula", test: (p: string) => /[A-Z]/.test(p) },
  { key: "minuscula", label: "Una letra minúscula", test: (p: string) => /[a-z]/.test(p) },
  { key: "numero", label: "Un número", test: (p: string) => /[0-9]/.test(p) },
];

const niveles = [
  { label: "Muy débil", color: "bg-destructive" },
  { label: "Débil", color: "bg-destructive" },
  { label: "Media", color: "bg-yellow-500" },
  { label: "Buena", color: "bg-yellow-500" },
  { label: "Fuerte", color: "bg-green-600" },
];

export function PasswordStrengthMeter({ password }: { password: string }) {
  const cumplidos = criterios.filter((c) => c.test(password));
  const score = password.length === 0 ? 0 : cumplidos.length;
  const nivel = niveles[score];
  const progreso = (score / criterios.length) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Progress value={progreso} className="h-1.5" indicatorClassName={nivel.color} />
        <span className="w-16 shrink-0 text-right text-xs text-muted-foreground">
          {password.length > 0 ? nivel.label : ""}
        </span>
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
        {criterios.map((criterio) => {
          const ok = criterio.test(password);
          return (
            <li
              key={criterio.key}
              className={cn(
                "flex items-center gap-1 text-xs",
                ok ? "text-green-600" : "text-muted-foreground"
              )}
            >
              {ok ? <Check className="size-3" /> : <X className="size-3" />}
              {criterio.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
