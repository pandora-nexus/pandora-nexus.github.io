import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function registerUser(username: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) return { error: "Bu kullanıcı adı zaten alınmış." };

  const passwordHash = crypto.createHash("sha256").update(password).digest("hex");

  const user = await prisma.user.create({
    data: { username, passwordHash, role: username === "patron" ? "founder" : "user" },
  });

  return { user: { id: user.id, username: user.username, role: user.role } };
}

export async function loginUser(username: string, password: string) {
  const passwordHash = crypto.createHash("sha256").update(password).digest("hex");
  const user = await prisma.user.findFirst({
    where: { username, passwordHash },
  });

  if (!user) return { error: "Kullanıcı adı veya şifre hatalı." };
  return { user: { id: user.id, username: user.username, role: user.role } };
}