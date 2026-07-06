import crypto from "crypto";
import prisma from "@/libs/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SUCCESS_MESSAGE = "Te enviamos un enlace para restablecer tu contraseña.";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "El email es obligatorio" }, { status: 400 });
  }

  if (!process.env.BREVO_API_KEY) {
    console.error("BREVO_API_KEY no está definido en las variables de entorno.");
    return NextResponse.json({ error: "No se pudo enviar el correo" }, { status: 500 });
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (!usuario) {
    return NextResponse.json(
      { error: "No existe un usuario registrado con ese correo electrónico." },
      { status: 404 }
    );
  }

  await prisma.passwordResetToken.updateMany({
    where: { email, used: false },
    data: { used: true },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { token, email, expiresAt },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || "noreply@prestosistema.com";

  try {
    const resp = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "PRESTO", email: senderEmail },
        to: [{ email }],
        subject: "Restablecer contraseña — PRESTO",
        htmlContent: `
<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
  <h2 style="color: #1a1a1a;">Restablecer contraseña</h2>
  <p style="color: #555;">Hola <strong>${usuario.nombre}</strong>,</p>
  <p style="color: #555;">
    Recibimos una solicitud para restablecer la contraseña de tu cuenta en PRESTO.
    Hacé clic en el botón para continuar:
  </p>
  <a href="${resetUrl}"
     style="display: inline-block; margin: 24px 0; padding: 12px 24px;
            background-color: #16332a; color: white; text-decoration: none;
            border-radius: 8px; font-weight: bold;">
    Restablecer contraseña
  </a>
  <p style="color: #999; font-size: 13px;">
    Este enlace vence en <strong>1 hora</strong>. Si no solicitaste este cambio,
    podés ignorar este correo.
  </p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
  <p style="color: #bbb; font-size: 12px;">PRESTO — Gestión de Préstamos</p>
</div>`,
      }),
    });

    if (!resp.ok) {
      console.error("Error al enviar el correo con Brevo:", await resp.text());
    }
  } catch (err) {
    console.error("Error al enviar el correo con Brevo:", err);
  }

  return NextResponse.json({ message: SUCCESS_MESSAGE });
}
