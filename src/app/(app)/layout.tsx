import { redirect } from "next/navigation";
import { getUserFromToken } from "@/utils/getUserFromToken";
import { AppShell } from "@/components/app-shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const user = getUserFromToken();
  if (!user) redirect("/auth/login");

  return <AppShell user={user}>{children}</AppShell>;
}
