import twilio from "twilio";

export async function sendWhatsApp(to, message, mediaUrl = null, templateSid = null, creds = null) {
  try {
    const accountSid  = creds?.accountSid;
    const authToken   = creds?.authToken;
    const from        = creds?.phoneNumber;

    if (!accountSid || !authToken || !from) {
      return { success: false, error: "No Twilio credentials configured for this workspace." };
    }

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