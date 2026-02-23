import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { email, token, password } = await req.json();
    if (!email || !token || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const record = await db.verificationToken.findFirst({
      where: { identifier: email, token },
    });

    if (!record) return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 });
    if (record.expires < new Date()) {
      await db.verificationToken.delete({ where: { identifier_token: { identifier: email, token } } });
      return NextResponse.json({ error: "Link expired" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);
    await db.user.update({ where: { email }, data: { password: hashed } });
    await db.verificationToken.delete({ where: { identifier_token: { identifier: email, token } } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}