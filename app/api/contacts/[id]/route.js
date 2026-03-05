import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { compareAsc } from "date-fns";

export async function PATCH(req, context) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;
    const data = await req.json();

    const contact = await db.contact.findFirst({
      where: { id, workspace: { userId: session.user.id } },
    });
    if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await db.contact.update({
      where: { id },
      data: {
        name: data.name ?? contact.name,
        phone: data.phone ?? contact.phone,
        email: data.email ?? contact.email,
        company: data.company ?? contact.company,
        notes: data.notes ?? contact.notes,
        subscribed: data.subscribed ?? contact.subscribed,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, context) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await context.params;

    const contact = await db.contact.findFirst({
      where: { id, workspace: { userId: session.user.id } },
    });
    if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.contact.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
