import nodemailer from "nodemailer";

// ─── Transporter ──────────────────────────────────────────────────
// Dev: uses Ethereal (fake SMTP — emails shown in console)
// Production: swap to AWS SES by changing env vars
// ──────────────────────────────────────────────────────────────────

function getTransporter() {
  if (process.env.NODE_ENV === "production") {
    // AWS SES via SMTP
    return nodemailer.createTransport({
      host: process.env.AWS_SES_HOST,         // email-smtp.us-east-1.amazonaws.com
      port: 587,
      secure: false,
      auth: {
        user: process.env.AWS_SES_SMTP_USER,
        pass: process.env.AWS_SES_SMTP_PASS,
      },
    });
  }

  // Dev: log to console, use Ethereal if configured
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ethereal.email",
    port: Number(process.env.SMTP_PORT) || 587,
    auth: {
      user: process.env.SMTP_USER || "dev@zapflow.io",
      pass: process.env.SMTP_PASS || "devpassword",
    },
  });
}

const FROM = `ZapFlow <${process.env.EMAIL_FROM || "noreply@zapflow.io"}>`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ─── Send verification email ───────────────────────────────────────
export async function sendVerificationEmail({ to, name, token }) {
  const verifyUrl = `${APP_URL}/api/auth/verify?token=${token}&email=${encodeURIComponent(to)}`;

  const transporter = getTransporter();

  const info = await transporter.sendMail({
    from: FROM,
    to,
    subject: "Verify your ZapFlow account",
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: sans-serif; background: #f8faf8; padding: 40px 20px;">
          <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
            
            <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 32px; text-align: center;">
              <div style="font-size: 32px; margin-bottom: 8px;">💬</div>
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">ZapFlow</h1>
            </div>

            <div style="padding: 40px 32px;">
              <h2 style="color: #0f1f0f; margin: 0 0 12px; font-size: 20px;">Hi ${name}, welcome aboard! 👋</h2>
              <p style="color: #4a6a4a; line-height: 1.7; margin: 0 0 32px;">
                You're one step away from turning WhatsApp into your revenue engine.
                Click the button below to verify your email and activate your account.
              </p>

              <a href="${verifyUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #22c55e, #16a34a);
                        color: white; text-decoration: none; padding: 14px 36px;
                        border-radius: 50px; font-weight: 700; font-size: 15px;">
                Verify Email Address →
              </a>

              <p style="color: #8aa48a; font-size: 13px; margin: 28px 0 0;">
                This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  });

  if (process.env.NODE_ENV !== "production") {
    console.log(`[EMAIL] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  }
}

// ─── Send password reset email ─────────────────────────────────────
export async function sendPasswordResetEmail({ to, name, token }) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}&email=${encodeURIComponent(to)}`;

  const transporter = getTransporter();

  await transporter.sendMail({
    from: FROM,
    to,
    subject: "Reset your ZapFlow password",
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: sans-serif; background: #f8faf8; padding: 40px 20px;">
          <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden;">
            <div style="background: #0f1f0f; padding: 32px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Password Reset</h1>
            </div>
            <div style="padding: 40px 32px;">
              <p style="color: #4a6a4a; line-height: 1.7;">Hi ${name},<br/><br/>
              We received a request to reset your password. Click below to create a new one.</p>
              <a href="${resetUrl}"
                 style="display: inline-block; background: #0f1f0f; color: white;
                        text-decoration: none; padding: 14px 36px; border-radius: 50px;
                        font-weight: 700; margin-top: 16px;">
                Reset Password →
              </a>
              <p style="color: #8aa48a; font-size: 13px; margin-top: 24px;">
                This link expires in 1 hour. If you didn't request this, ignore this email.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}
