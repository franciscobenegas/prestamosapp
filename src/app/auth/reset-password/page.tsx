import { Suspense } from "react";
import Image from "next/image";
import { LogoRws } from "@/components/logo-rws";
import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <span className="flex items-center gap-2 text-lg font-medium">
            <Image unoptimized src="/icon-square.svg" alt="" width={40} height={40} className="rounded-md" />
            RWS
          </span>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <Suspense>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:flex lg:items-center lg:justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <LogoRws />
          <p className="text-sm">Clientes, préstamos, cuotas y cobros en un solo lugar.</p>
        </div>
      </div>
    </div>
  );
}
