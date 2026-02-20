import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendWhatsApp(to, message) {
  try {
    const result = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:+${to.replace(/\D/g, "")}`,
      body: message,
    });
    return { success: true, sid: result.sid };
  } catch (err) {
    console.error("Twilio error:", err);
    return { success: false, error: err.message };
  }
}