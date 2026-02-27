import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req, context) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    // Accept optional contactIds array from body — if provided, only retarget those
    const body = await req.json().catch(() => ({}));
    const selectedContactIds = body.contactIds || null; //retarget failed for null

    console.log("RETARGET broadcast:", id, "selectedContactIds:", selectedContactIds);

    const broadcast = await db.broadcast.findFirst({
      where: { id, workspace: { userId: session.user.id } },
      include: {
        recipients: {
          where: {
            status: "FAILED", // MessageStatus enum value
          },
          include: { contact: true },
        },
      },
    });

    if (!broadcast) return NextResponse.json({ error: "Not found" }, { status: 404 });

    console.log("Failed recipients found:", broadcast.recipients.length);

    let failedRecipients = broadcast.recipients;

    // Filter to selected contacts if provided
    if (selectedContactIds && selectedContactIds.length > 0) {
      failedRecipients = failedRecipients.filter(r =>
        selectedContactIds.includes(r.contactId)
      );
    }

    if (failedRecipients.length === 0) {
      return NextResponse.json({ error: "No failed recipients to retarget" }, { status: 400 });
    }

    const newBroadcast = await db.broadcast.create({
      data: {
        name: `${broadcast.name} — Retarget`,
        message: broadcast.message,
        status: "DRAFT",
        workspaceId: broadcast.workspaceId,
        chatbotIds: broadcast.chatbotIds,
        recipients: {
          create: failedRecipients.map((r) => ({
            contactId: r.contactId,
            status: "SENDING",
          })),
        },
      },
    });

    console.log("New retarget broadcast created:", newBroadcast.id);

    return NextResponse.json({ id: newBroadcast.id });
  } catch (err) {
    console.error("RETARGET ERROR:", err.message);
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}