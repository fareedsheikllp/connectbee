import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  company: z.string().min(1, "Company name is required"),
});

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, password, company } = schema.parse(body);

    // Check if user already exists
    const existing = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    // Create user + workspace in one transaction
    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          password: hashed,
        },
      });

      // Create workspace with company name as slug
      const slug = company
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 40);

      const uniqueSlug = `${slug}-${Date.now().toString(36)}`;

      await tx.workspace.create({
        data: {
          name: company,
          slug: uniqueSlug,
          userId: newUser.id,
          plan: "TRIAL",
          planExpires: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 day trial
        },
      });

      return newUser;
    });

    return NextResponse.json(
      { message: "Account created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0].message },
        { status: 400 }
      );
    }
    console.error("[SIGNUP ERROR]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
