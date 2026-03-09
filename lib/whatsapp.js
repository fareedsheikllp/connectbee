import twilio from "twilio";

export async function sendWhatsApp(to, message, mediaUrl = null) {
  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const cleaned = to.replace(/\D/g, "").replace(/^0+/, "");
    const toNumber = `whatsapp:+${cleaned}`;
    const from = process.env.TWILIO_WHATSAPP_FROM;

    const params = {
      from,
      to: toNumber,
      body: message,
      statusCallback: "https://connectbeez.ca/api/webhooks/twilio",
    };

    if (mediaUrl) {
      params.mediaUrl = [mediaUrl];
    }

    const result = await client.messages.create(params);

    return { success: true, messageId: result.sid };
  } catch (err) {
    console.error("Twilio WhatsApp send error:", err);
    return { success: false, error: err.message };
  }
}