import prisma from "@/libs/prisma";
import { hashPassword } from "@/utils/hash";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@prestamos.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "admin123";

  const existing = await prisma.usuario.findUnique({ where: { email } });
  if (existing) {
    console.log(`Ya existe un usuario ADMIN con email ${email}`);
    return;
  }

  await prisma.usuario.create({
    data: {
      nombre: "Administrador",
      email,
      password: await hashPassword(password),
      rol: "ADMIN",
      activo: true,
    },
  });

  console.log(`Usuario ADMIN creado: ${email} / ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
