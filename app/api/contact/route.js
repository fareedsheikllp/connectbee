import { NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/email";

export async function POST(req) {
  try {
    const { name, email, company, subject, message } = await req.json();
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    await sendContactEmail({ name, email, company, subject, message });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact email error:", err.message);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}