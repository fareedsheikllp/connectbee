import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req, context) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    const workspace = await db.workspace.findUnique({ where: { userId: session.user.id } });
    if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

    const { status } = await req.json();

    const conversation = await db.conversation.findFirst({
      where: { id, workspaceId: workspace.id },
    });
    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await db.conversation.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ conversation: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}