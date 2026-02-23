
async function sendBrevoEmail({ to, subject, html, name }) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: "ConnectBee", email: "fareed.sheik@gliggo.com" },
      to: [{ email: to, name: name || to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Failed to send email");
  }
}

const FROM = `ConnectBee <${process.env.BREVO_SMTP_USER}>`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ─── Send verification email ───────────────────────────────────────
export async function sendVerificationEmail({ to, name, token }) {
  const verifyUrl = `${APP_URL}/api/auth/verify?token=${token}&email=${encodeURIComponent(to)}`;
  await sendBrevoEmail({
    to, name,
    subject: "Verify your ConnectBee account",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#22c55e,#16a34a);padding:32px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:24px;font-weight:800;">ConnectBee</h1>
        </div>
        <div style="padding:40px 32px;">
          <h2 style="color:#0f1f0f;margin:0 0 12px;">Hi ${name}, welcome aboard! 👋</h2>
          <p style="color:#4a6a4a;line-height:1.7;margin:0 0 32px;">Click below to verify your email and activate your account.</p>
          <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#22c55e,#16a34a);color:white;text-decoration:none;padding:14px 36px;border-radius:50px;font-weight:700;">
            Verify Email Address →
          </a>
          <p style="color:#8aa48a;font-size:13px;margin:28px 0 0;">This link expires in 24 hours.</p>
        </div>
      </div>
    `,
  });
}

// ─── Send password reset email ─────────────────────────────────────
export async function sendPasswordResetEmail({ to, name, token }) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(to)}`;
  await sendBrevoEmail({
    to, name,
    subject: "Reset your ConnectBee password",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;">
        <div style="background:#0f1f0f;padding:32px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:24px;">Password Reset</h1>
        </div>
        <div style="padding:40px 32px;">
          <p style="color:#4a6a4a;line-height:1.7;">Hi ${name},<br/><br/>Click below to reset your password.</p>
          <a href="${resetUrl}" style="display:inline-block;background:#0f1f0f;color:white;text-decoration:none;padding:14px 36px;border-radius:50px;font-weight:700;margin-top:16px;">
            Reset Password →
          </a>
          <p style="color:#8aa48a;font-size:13px;margin-top:24px;">This link expires in 1 hour.</p>
        </div>
      </div>
    `,
  });
}
// ─── Send contact form email ───────────────────────────────────────
export async function sendContactEmail({ name, email, company, subject, message }) {
  const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `ConnectBee Support <${process.env.BREVO_SMTP_USER}>`,
    to: process.env.CONTACT_EMAIL,
    replyTo: email,
    subject: `New contact: ${subject || "General Inquiry"} — from ${name}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px;">
        <h2 style="color:#111827;margin-bottom:24px;">New Contact Form Submission</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;width:120px;">Name</td><td style="padding:8px 0;color:#111827;font-weight:600;">${name}</td></tr>
          <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Email</td><td style="padding:8px 0;color:#111827;font-weight:600;">${email}</td></tr>
          ${company ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Company</td><td style="padding:8px 0;color:#111827;font-weight:600;">${company}</td></tr>` : ""}
          <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Subject</td><td style="padding:8px 0;color:#111827;font-weight:600;">${subject || "—"}</td></tr>
        </table>
        <div style="margin-top:24px;padding:20px;background:#fff;border-radius:8px;border:1px solid #e5e7eb;">
          <p style="color:#6b7280;font-size:12px;margin-bottom:8px;">Message</p>
          <p style="color:#111827;font-size:14px;line-height:1.6;white-space:pre-wrap;">${message}</p>
        </div>
      </div>
    `,
  });
}