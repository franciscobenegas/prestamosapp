import { NextResponse, NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("tokenPrestamos")?.value;
  const { pathname } = request.nextUrl;

  if (!token) {
    if (pathname === "/auth/login") return NextResponse.next();
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);

    if (pathname === "/auth/login") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (
      (pathname.startsWith("/usuarios") ||
        pathname.startsWith("/auditoria") ||
        pathname.startsWith("/empresa")) &&
      payload.rol !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("JWT verification failed:", error);
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clientes/:path*",
    "/prestamos/:path*",
    "/refinanciaciones/:path*",
    "/calendario/:path*",
    "/simulador/:path*",
    "/pagos/:path*",
    "/reportes/:path*",
    "/usuarios/:path*",
    "/auditoria/:path*",
    "/empresa/:path*",
    "/auth/login",
  ],
};
