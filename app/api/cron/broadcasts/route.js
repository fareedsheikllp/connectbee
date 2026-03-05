import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendWhatsApp } from "@/lib/whatsapp";

export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const due = await db.broadcast.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { lte: now },
    },
    include: {
      recipients: { include: { contact: true } },
      workspace: true,
    },
  });

  for (const broadcast of due) {
    const contacts = broadcast.recipients
      .map(r => r.contact)
      .filter(c => c && c.subscribed !== false);

    await Promise.all(contacts.map(async (contact) => {
      const result = await sendWhatsApp(contact.phone, broadcast.message, broadcast.mediaUrl || null);
      await db.broadcastRecipient.updateMany({
        where: { broadcastId: broadcast.id, contactId: contact.id },
        data: {
          status: result.success ? "SENT" : "FAILED",
          sentAt: result.success ? new Date() : null,
          failureReason: result.success ? null : result.error ?? "Unknown error",
        },
      });
    }));

    await db.broadcast.update({
      where: { id: broadcast.id },
      data: { status: "SENT" },
    });
  }

  return NextResponse.json({ processed: due.length });
}