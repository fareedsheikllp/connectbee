import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { workspace: true },
    });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      profile: { name: user.name, email: user.email },
      whatsapp: user.workspace ? {
        phoneNumberId:      user.workspace.waPhoneNumberId,
        accessToken:        user.workspace.waAccessToken ? "••••••••" : "",
        businessAccountId:  user.workspace.waBusinessId,
        webhookVerifyToken: "",
        verified:           user.workspace.waVerified,
      } : null,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
