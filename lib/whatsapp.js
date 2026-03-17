import twilio from "twilio";

export async function sendWhatsApp(to, message, mediaUrl = null, templateSid = null, creds = null) {
  try {
    const accountSid  = creds?.accountSid  || process.env.TWILIO_ACCOUNT_SID;
    const authToken   = creds?.authToken   || process.env.TWILIO_AUTH_TOKEN;
    const from        = creds?.phoneNumber || process.env.TWILIO_WHATSAPP_FROM;

    const client = twilio(accountSid, authToken);

    const cleaned = to.replace(/\D/g, "").replace(/^0+/, "");
    const toNumber = `whatsapp:+${cleaned}`;

    const params = templateSid ? {
      from,
      to: toNumber,
      contentSid: templateSid,
      statusCallback: "https://connectbeez.ca/api/whatsapp/webhook/twilio",
    } : {
      from,
      to: toNumber,
      body: message,
      statusCallback: "https://connectbeez.ca/api/whatsapp/webhook/twilio",
      ...(mediaUrl && { mediaUrl: [mediaUrl] }),
    };

    const result = await client.messages.create(params);

    return { success: true, messageId: result.sid };
  } catch (err) {
    console.error("Twilio WhatsApp send error:", err);
    return { success: false, error: err.message, code: err.code ?? err.status ?? null };
  }
}