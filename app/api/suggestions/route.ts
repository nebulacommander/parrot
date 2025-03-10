import { NextResponse } from 'next/server';
import Groq from "groq-sdk";

const groq = new Groq();

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    const completion = await groq.chat.completions.create({
      model: "gemma2-9b-it",
      messages: [
        {
          role: "system",
          content: "You are an enterprise AI assistant. Generate 3-5 relevant, professional query suggestions based on the user's input. Return only an array of strings."
        },
        {
          role: "user",
          content: query
        }
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    const suggestions = JSON.parse(completion.choices[0].message.content || '[]');

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Suggestion generation error:', error);
    return NextResponse.json({ suggestions: [] });
  }
}
