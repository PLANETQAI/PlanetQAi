import { NextResponse } from "next/server";

export async function POST() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api.openai.com/v1/realtime/client_secrets",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session: {
            type: "realtime",
            model: "gpt-realtime",
          },
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to generate token" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Generated token:", data.value);
    return NextResponse.json({ token: data.value });
  } catch (error) {
    console.error("Token error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
