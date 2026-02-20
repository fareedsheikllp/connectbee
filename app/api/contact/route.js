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
        sender: { name: "ConnectBee Contact Form", email: "jayakarthiga@fareedsheikllp.com" },
        to: [{ email: process.env.CONTACT_EMAIL, name: "ConnectBee Team" }],
        replyTo: { email, name },
        subject: `New contact: ${subject || "General Inquiry"} — from ${name}`,
        htmlContent: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px;">
            <h2 style="color:#111827;margin-bottom:24px;">New Contact Form Submission</h2>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;width:120px;">Name</td><td style="padding:8px 0;color:#111827;font-weight:600;">${name}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Email</td><td style="padding:8px 0;color:#111827;font-weight:600;">${email}</td></tr>
              ${company ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Company</td><td style="padding:8px 0;color:#111827;font-weight:600;">${company}</td></tr>` : ""}
              <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Subject</td><td style="padding:8px 0;color:#111827;font-weight:600;">${subject || "—"}</td></tr>
            </table>
            <div style="margin-top:24px;padding:20px;background:#fff;border-radius:8px;border:1px solid #e5e7eb;">
              <p style="color:#6b7280;font-size:12px;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.05em;">Message</p>
              <p style="color:#111827;font-size:14px;line-height:1.6;white-space:pre-wrap;">${message}</p>
            </div>
            <p style="margin-top:24px;color:#9ca3af;font-size:12px;">Reply directly to this email to respond to ${name}.</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Brevo error:", err);
      return NextResponse.json({ error: "Failed to send" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}