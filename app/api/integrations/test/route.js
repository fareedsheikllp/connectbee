import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { provider, config } = await req.json();

    if (provider === "openai") {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${config.apiKey}` },
      });
      if (!res.ok) throw new Error("Invalid OpenAI API key");
      return NextResponse.json({ success: true, message: "OpenAI connected!" });
    }

    if (provider === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": config.apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 10, messages: [{ role: "user", content: "hi" }] }),
      });
      if (!res.ok) throw new Error("Invalid Anthropic API key");
      return NextResponse.json({ success: true, message: "Anthropic connected!" });
    }

    if (provider === "zapier") {
      if (!config.webhookUrl?.startsWith("https://hooks.zapier.com")) throw new Error("Invalid Zapier webhook URL");
      return NextResponse.json({ success: true, message: "Zapier webhook saved!" });
    }

    return NextResponse.json({ success: true, message: "Integration saved!" });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}