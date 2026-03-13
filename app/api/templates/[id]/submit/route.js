import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req, context) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const template = await db.template.findFirst({
      where: { id, workspace: { userId: session.user.id } },
    });
    if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const twilioRes = await fetch("https://content.twilio.com/v1/Content", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64"),
      },
      body: JSON.stringify({
        friendly_name: template.name,
        language: "en",
        types: { "twilio/text": { body: template.body } }
      }),
    });

    const twilioData = await twilioRes.json();
    if (!twilioData.sid) return NextResponse.json({ error: "Twilio error" }, { status: 500 });

    await fetch(`https://content.twilio.com/v1/Content/${twilioData.sid}/ApprovalRequests/whatsapp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64"),
      },
      body: JSON.stringify({
        name: template.name.toLowerCase().replace(/\s+/g, "_"),
        category: template.category || "UTILITY",
        }),
    });
const updated = await db.template.update({
  where: { id },
  data: { metaTemplateId: twilioData.sid, metaStatus: "PENDING" },
});

    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}