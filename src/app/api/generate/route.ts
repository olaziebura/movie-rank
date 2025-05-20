import openai from "@/lib/openai/openai";
import { NextResponse } from "next/server";

interface GenerateRequest {
  prompt: string;
}

export async function POST(request: Request) {
  const body: GenerateRequest = await request.json();

  if (!body.prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Using a more recent model than text-davinci-003
      messages: [
        {
          role: "system",
          content:
            "You are a helpful movie recommendation assistant. Provide detailed, thoughtful movie recommendations based on user descriptions.",
        },
        {
          role: "user",
          content: body.prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return NextResponse.json({
      result: response.choices[0].message.content,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to generate movie recommendations" },
      { status: 500 }
    );
  }
}
