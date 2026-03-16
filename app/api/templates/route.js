import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const templates = await db.template.findMany({
      where: { workspace: { userId: session.user.id } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(templates);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const workspace = await db.workspace.findFirst({ where: { userId: session.user.id } });
    if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });
    const { name, body, category, tags, mediaUrl } = await req.json();
    if (!name || !body) return NextResponse.json({ error: "Name and body required" }, { status: 400 });
    const template = await db.template.create({
      data: { workspaceId: workspace.id, name, body, category: category || "General", tags: tags || [], mediaUrl: mediaUrl || null },
    });

    // Submit to Twilio Content API
        try {
    const vars = [...new Set((body.match(/{{[^}]+}}/g) || []))];
    const exampleBody = vars.reduce((b, v) => {
      const key = v.replace(/{{|}}/g, "").trim();
      const examples = { name: "John Smith", phone: "16471234567", email: "john@example.com", company: "Acme Corp", date: "March 16 2026", amount: "$99.99" };
      return b.replace(new RegExp(v.replace(/[{}]/g, "\\$&"), "g"), examples[key] || "Sample");
    }, body);

    const twilioRes = await fetch("https://content.twilio.com/v1/Content", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64"),
      },
      body: JSON.stringify({
        friendly_name: name,
        language: "en",
        types: mediaUrl ? {
          "twilio/media": { body, media: [mediaUrl], example: { body_text: [[exampleBody]] } }
        } : {
          "twilio/text": { body, example: { body_text: [[exampleBody]] } }
        }
      }),
    });
      const twilioData = await twilioRes.json();

      if (twilioData.sid) {
        // Submit for WhatsApp approval
        await fetch(`https://content.twilio.com/v1/Content/${twilioData.sid}/ApprovalRequests/whatsapp`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Basic " + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64"),
          },
          body: JSON.stringify({
            name: name.toLowerCase().replace(/\s+/g, "_"),
            category: category || "UTILITY",
          }),
        });

        await db.template.update({
          where: { id: template.id },
          data: { metaTemplateId: twilioData.sid, metaStatus: "PENDING" },
        });

        return NextResponse.json({ ...template, metaTemplateId: twilioData.sid, metaStatus: "PENDING" });
      }
    } catch (err) {
      console.error("Twilio template submission failed:", err.message);
    }

    return NextResponse.json(template);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}