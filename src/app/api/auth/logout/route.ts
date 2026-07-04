import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete("tokenPrestamos");
  return NextResponse.json({ success: true });
}
