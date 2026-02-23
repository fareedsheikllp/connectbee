import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { name, email, company, subject, message } = await req.json();
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: "ConnectBee", email: "jayakarthiga@fareedsheikllp.com" },
        to: [{ email: "jayakarthiga@fareedsheikllp.com" }],
        replyTo: { email, name },
        subject: `New contact: ${subject || "General Inquiry"} — from ${name}`,
        htmlContent: `<p><b>Name:</b> ${name}</p><p><b>Email:</b> ${email}</p>${company ? `<p><b>Company:</b> ${company}</p>` : ""}<p><b>Subject:</b> ${subject || "—"}</p><p><b>Message:</b><br/>${message}</p>`,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Contact email error:", JSON.stringify(err));
      return NextResponse.json({ error: "Failed to send" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact email error:", err.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}