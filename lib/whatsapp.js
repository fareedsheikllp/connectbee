export async function sendWhatsApp(to, message, mediaUrl = null) {
  try {
    const phoneNumberId = process.env.META_PHONE_NUMBER_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;

    const body = {
      messaging_product: "whatsapp",
      to: to.replace(/\D/g, "").replace(/^0+/, "").replace(/^([^1])/, "1$1"),
      type: "text",
      text: { body: message },
    };

    // If media URL provided, send as image instead
    if (mediaUrl) {
      body.type = "image";
      body.image = { link: mediaUrl, caption: message };
      delete body.text;
    }

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("Meta API error:", data);
      return { success: false, error: data.error?.message };
    }

    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (err) {
    console.error("WhatsApp send error:", err);
    return { success: false, error: err.message };
  }
}
