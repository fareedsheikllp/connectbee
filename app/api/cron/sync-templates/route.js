import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templates = await db.template.findMany({
    where: { metaTemplateId: { not: null }, metaStatus: "PENDING" },
  });

  for (const template of templates) {
    const res = await fetch(
      `https://content.twilio.com/v1/Content/${template.metaTemplateId}/ApprovalRequests`,
      {
        headers: {
          Authorization: "Basic " + Buffer.from(
            `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
          ).toString("base64"),
        },
      }
    );
    const data = await res.json();
    const status = data.whatsapp?.status?.toLowerCase();
    if (status && status !== template.metaStatus) {
      await db.template.update({
        where: { id: template.id },
        data: { metaStatus: status },
      });
    }
  }

  return NextResponse.json({ synced: templates.length });
}