import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req, context) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const body = await req.json();

    const automation = await db.automation.findFirst({
      where: { id, workspace: { userId: session.user.id } },
    });
    if (!automation) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await db.automation.update({
      where: { id },
      data: {
        name: body.name ?? automation.name,
        enabled: body.enabled ?? automation.enabled,
        trigger: body.trigger ?? automation.trigger,
        delayHours: body.delayHours !== undefined ? body.delayHours : automation.delayHours,
        keyword: body.keyword !== undefined ? body.keyword : automation.keyword,
        channelId: body.channelId !== undefined ? body.channelId : automation.channelId,
        conditions: body.conditions ?? automation.conditions,
        actions: body.actions ?? automation.actions,
      },
    });
    return NextResponse.json({ automation: updated });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    const automation = await db.automation.findFirst({
      where: { id, workspace: { userId: session.user.id } },
    });
    if (!automation) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.automation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}