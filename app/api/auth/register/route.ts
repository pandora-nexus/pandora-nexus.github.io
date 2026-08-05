import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json({ error: "Kullanıcı adı ve şifre gerekli" }, { status: 400 });
  }

  if (password.length < 4) {
    return NextResponse.json({ error: "Şifre en az 4 karakter olmalı" }, { status: 400 });
  }

  const result = await registerUser(username, password);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result);
}