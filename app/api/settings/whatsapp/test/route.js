import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { phoneNumberId, accessToken } = await req.json();
    if (!phoneNumberId || !accessToken) {
      return NextResponse.json({ error: "Credentials required" }, { status: 400 });
    }

    // Test against Meta API
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = await res.json();

    if (!res.ok || data.error) {
      return NextResponse.json(
        { error: data.error?.message || "Invalid credentials" },
        { status: 400 }
      );
    }

    return NextResponse.json({ phone: data.display_phone_number, verified: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Test failed" }, { status: 500 });
  }
}
