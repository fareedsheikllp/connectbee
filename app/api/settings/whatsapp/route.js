import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { phoneNumberId, accessToken, businessAccountId } = await req.json();
    if (!phoneNumberId || !accessToken) {
      return NextResponse.json({ error: "Phone Number ID and Access Token required" }, { status: 400 });
    }

    await db.workspace.update({
      where: { userId: session.user.id },
      data: {
        waPhoneNumberId:  phoneNumberId,
        waAccessToken:    accessToken,
        waBusinessId:     businessAccountId || null,
      },
    });

    return NextResponse.json({ message: "Saved successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
