import Image from "next/image";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <span className="flex items-center gap-2 font-medium">
            <Image src="/icon-square.png" alt="" width={24} height={24} className="rounded-md" />
            PRESTO
          </span>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:flex lg:items-center lg:justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Image src="/logo.png" alt="Gestión de Préstamos" width={360} height={123} priority />
          <p className="text-sm">Clientes, préstamos, cuotas y cobros en un solo lugar.</p>
        </div>
      </div>
    </div>
  );
}
