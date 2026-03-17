import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.user.updateMany({
    where: { email: { not: process.env.ADMIN_EMAIL } },
    data: { conversationsUsed: 0 },
  });

  return NextResponse.json({ success: true });
}