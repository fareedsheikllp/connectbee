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
      include: { workspace: { select: { twilioAccountSid: true, twilioAuthToken: true } } },
    });
    if (!template) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const accountSid = template.workspace?.twilioAccountSid;
    const authToken  = template.workspace?.twilioAuthToken;

    if (!accountSid || !authToken) {
      return NextResponse.json({ error: "No Twilio credentials configured for this workspace." }, { status: 400 });
    }

    const authHeader = "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");

    const namedVars = [...new Set((template.body.match(/{{[^}]+}}/g) || []))];
    const examples = { name: "John Smith", phone: "16471234567", email: "john@example.com", company: "Acme Corp", date: "March 16 2026", amount: "$99.99" };

    let convertedBody = template.body;
    const exampleValues = [];
    namedVars.forEach((v, i) => {
      const key = v.replace(/{{|}}/g, "").trim();
      convertedBody = convertedBody.replace(new RegExp(v.replace(/[{}]/g, "\\$&"), "g"), `{{${i + 1}}}`);
      exampleValues.push(examples[key] || "Sample");
    });

    const twilioRes = await fetch("https://content.twilio.com/v1/Content", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        friendly_name: template.name,
        language: "en",
        types: template.mediaUrl ? {
          "twilio/media": {
            body: convertedBody,
            media: [template.mediaUrl],
            footer: "Reply STOP to unsubscribe",
            ...(exampleValues.length > 0 && { example: { body_text: [exampleValues] } })
          }
        } : {
        "twilio/text": {
          body: convertedBody,
          footer: "Reply STOP to unsubscribe",
          ...(exampleValues.length > 0 && { example: { body_text: [exampleValues] } })
        }
        }
      }),
    });

    const twilioData = await twilioRes.json();
    if (!twilioData.sid) return NextResponse.json({ error: "Twilio error" }, { status: 500 });

    await fetch(`https://content.twilio.com/v1/Content/${twilioData.sid}/ApprovalRequests/whatsapp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
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