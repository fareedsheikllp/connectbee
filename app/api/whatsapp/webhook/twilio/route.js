import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req) {
  try {
    const text = await req.text();
        console.log("Twilio status webhook hit:", text); 
    const params = new URLSearchParams(text);

    const messageSid = params.get("MessageSid");
    const status = params.get("MessageStatus"); // "delivered", "failed", "undelivered"
    const errorCode = params.get("ErrorCode");
    const errorMessage = params.get("ErrorMessage");

    if (!messageSid) return NextResponse.json({ status: "no sid" });

    if (status === "delivered") {
      await db.message.updateMany({
        where: { waMessageId: messageSid },
        data: { status: "DELIVERED" },
      });
      await db.broadcastRecipient.updateMany({
        where: { waMessageId: messageSid },
        data: { status: "SENT" },
      });
    }

    if (status === "failed" || status === "undelivered") {
      await db.message.updateMany({
        where: { waMessageId: messageSid },
        data: { status: "FAILED" },
      });
      await db.broadcastRecipient.updateMany({
        where: { waMessageId: messageSid },
        data: {
          status: "FAILED",
          failureReason: errorMessage || "Delivery failed",
          errorCode: errorCode || null,
        },
      });
      // Delete conversation if no inbound messages
      const msg = await db.message.findFirst({ where: { waMessageId: messageSid } });
      if (msg) {
        const hasInbound = await db.message.findFirst({
          where: { conversationId: msg.conversationId, direction: "INBOUND" },
        });
        if (!hasInbound) {
          await db.conversation.delete({ where: { id: msg.conversationId } });
        }
      }
    }

    if (status === "failed" || status === "undelivered") {
      await db.message.updateMany({
        where: { waMessageId: messageSid },
        data: { status: "FAILED" },
      });
      await db.broadcastRecipient.updateMany({
        where: { waMessageId: messageSid },
        data: {
          status: "FAILED",
          failureReason: errorMessage || "Delivery failed",
          errorCode: errorCode || null,
        },
      });
    }

    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("Twilio webhook error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
