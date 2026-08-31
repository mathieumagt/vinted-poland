import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function upsertUser(email: string | undefined, password: string | undefined, role: "ADMIN" | "EMPLOYEE") {
  if (!email || !password) {
    console.warn(`Skipping ${role} seed: missing env vars.`);
    return;
  }
  const normalizedEmail = email.toLowerCase();
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: { passwordHash, role },
    create: { email: normalizedEmail, passwordHash, role },
  });
  console.log(`Seeded ${role} user: ${email}`);
}

async function main() {
  await upsertUser(process.env.ADMIN_SEED_EMAIL, process.env.ADMIN_SEED_PASSWORD, "ADMIN");
  await upsertUser(process.env.EMPLOYEE_SEED_EMAIL, process.env.EMPLOYEE_SEED_PASSWORD, "EMPLOYEE");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
