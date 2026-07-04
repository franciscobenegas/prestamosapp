"use client";

import { useState } from "react";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, subDays, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

export type { DateRange };

const presets: { label: string; range: () => DateRange }[] = [
  { label: "Hoy", range: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
  {
    label: "Últimos 7 días",
    range: () => ({ from: startOfDay(subDays(new Date(), 6)), to: endOfDay(new Date()) }),
  },
  {
    label: "Últimos 30 días",
    range: () => ({ from: startOfDay(subDays(new Date(), 29)), to: endOfDay(new Date()) }),
  },
  { label: "Este mes", range: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  {
    label: "Mes pasado",
    range: () => {
      const mesPasado = subMonths(new Date(), 1);
      return { from: startOfMonth(mesPasado), to: endOfMonth(mesPasado) };
    },
  },
];

export function DateRangeFilter({
  title = "Fecha",
  value,
  onChange,
}: {
  title?: string;
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
}) {
  const [open, setOpen] = useState(false);

  const label =
    value?.from &&
    (value.to && value.to.getTime() !== value.from.getTime()
      ? `${format(value.from, "dd/MM/yy")} - ${format(value.to, "dd/MM/yy")}`
      : format(value.from, "dd/MM/yy"));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn("border-dashed", value?.from && "border-solid")}>
          <CalendarIcon className="size-4" />
          {label ?? title}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <div className="flex flex-col gap-1 border-r p-2">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="justify-start font-normal"
                onClick={() => {
                  onChange(preset.range());
                  setOpen(false);
                }}
              >
                {preset.label}
              </Button>
            ))}
            {value?.from && (
              <>
                <Separator className="my-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start font-normal text-muted-foreground"
                  onClick={() => {
                    onChange(undefined);
                    setOpen(false);
                  }}
                >
                  <X className="size-4" />
                  Limpiar
                </Button>
              </>
            )}
          </div>
          <Calendar
            mode="range"
            selected={value}
            onSelect={(range) => {
              onChange(range);
              if (range?.from && range?.to) setOpen(false);
            }}
            numberOfMonths={2}
            defaultMonth={value?.from}
            locale={es}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
