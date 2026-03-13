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
    const { name, body, category, tags } = await req.json();
    if (!name || !body) return NextResponse.json({ error: "Name and body required" }, { status: 400 });
    const template = await db.template.create({
      data: { workspaceId: workspace.id, name, body, category: category || "General", tags: tags || [] },
    });

    // Submit to Twilio Content API
    try {
      const twilioRes = await fetch("https://content.twilio.com/v1/Content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Basic " + Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64"),
        },
        body: JSON.stringify({
          friendly_name: name,
          language: "en",
          types: {
            "twilio/text": { body }
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
            category: "UTILITY",
          }),
        });

        await db.template.update({
          where: { id: template.id },
          data: { twilioSid: twilioData.sid, metaStatus: "PENDING" },
        });

        return NextResponse.json({ ...template, twilioSid: twilioData.sid, metaStatus: "PENDING" });
      }
    } catch (err) {
      console.error("Twilio template submission failed:", err.message);
    }

    return NextResponse.json(template);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}