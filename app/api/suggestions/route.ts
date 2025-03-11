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
          content: "You are an autocomplete system. When user types, predict and complete their current thought or sentence. DO NOT answer questions - only complete the partial input naturally. Example: User: 'What is the capital of' -> Completion: 'What is the capital of France' NOT 'Paris'. Return exactly one string containing just the completion."
        },
        {
          role: "user", 
          content: query
        }
      ],
      temperature: 0.1, // Lower temperature for more deterministic completions
      max_tokens: 30,
    });

    let suggestion = completion.choices[0].message.content || '';
    // Remove quotes if present
    suggestion = suggestion.replace(/^["']|["']$/g, '');
    
    return NextResponse.json({ suggestions: [suggestion] });
  } catch (error) {
    console.error('Suggestion generation error:', error);
    return NextResponse.json({ suggestions: [] });
  }
}