import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const items = await db.catalogItem.findMany({
      where: { workspace: { userId: session.user.id } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(items);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const workspace = await db.workspace.findFirst({
      where: { userId: session.user.id },
    });
    if (!workspace) return NextResponse.json({ error: "No workspace" }, { status: 404 });

    const body = await req.json();
    const { name, description, price, currency, imageUrl, linkUrl, category, inStock } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ error: "Name and price are required" }, { status: 400 });
    }

    const item = await db.catalogItem.create({
      data: {
        name,
        description: description || "",
        price: parseFloat(price),
        currency: currency || "CAD",
        imageUrl: imageUrl || "",
        linkUrl: linkUrl || "",
        category: category || "General",
        inStock: inStock !== false,
        workspaceId: workspace.id,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
