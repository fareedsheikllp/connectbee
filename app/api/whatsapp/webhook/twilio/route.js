import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req) {
  try {
    const text = await req.text();
    const params = new URLSearchParams(text);

    const messageSid = params.get("MessageSid");
    const status = params.get("MessageStatus"); // "delivered", "failed", "undelivered"
    const errorCode = params.get("ErrorCode");
    const errorMessage = params.get("ErrorMessage");

    if (!messageSid) return NextResponse.json({ status: "no sid" });

    if (status === "failed" || status === "undelivered") {
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
