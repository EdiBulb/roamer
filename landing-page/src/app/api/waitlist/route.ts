import { Client } from "@notionhq/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const notion = new Client({ auth: process.env.NOTION_TOKEN });

    await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID! },
      properties: {
        Name: {
          title: [{ text: { content: name?.trim() || "Anonymous" } }],
        },
        Email: {
          email: email.trim().toLowerCase(),
        },
        Date: {
          date: { start: new Date().toISOString() },
        },
      },
    });

    const webhookUrl = process.env.SLACK_WAITLIST_WEBHOOK;
    console.log("[Slack] webhookUrl exists:", !!webhookUrl);
    if (webhookUrl) {
      const slackRes = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `🎉 New Waitlist Signup\n*Name:* ${name?.trim() || "Anonymous"}\n*Email:* ${email.trim().toLowerCase()}`,
        }),
      });
      console.log("[Slack] response status:", slackRes.status);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Notion API error:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
