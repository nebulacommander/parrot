import Groq from "groq-sdk";
import { headers } from "next/headers";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { unstable_after as after } from "next/server";

const groq = new Groq();

const schema = zfd.formData({
	input: z.union([zfd.text(), zfd.file()]),
	message: zfd.repeatableOfType(
		zfd.json(
			z.object({
				role: z.enum(["user", "assistant"]),
				content: z.string(),
			})
		)
	),
});

/**
 * Extracts thinking content from AI response
 * @param response - The raw AI response text
 * @returns Object containing thinking content and cleaned response
 */
function extractThinking(response: string): { thinking: string | null; cleanResponse: string } {
	const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
	const matches = [...response.matchAll(thinkRegex)];
	
	if (matches.length === 0) {
		return { thinking: null, cleanResponse: response };
	}
	
	const thinking = matches.map(match => match[1].trim()).join("\n\n");
	const cleanResponse = response.replace(thinkRegex, "").trim();
	
	return { thinking, cleanResponse };
}

export async function POST(request: Request) {
	console.time("transcribe " + request.headers.get("x-vercel-id") || "local");

	const { data, success } = schema.safeParse(await request.formData());
	if (!success) return new Response("Invalid request", { status: 400 });

	const transcript = await getTranscript(data.input);
	if (!transcript) return new Response("Invalid audio", { status: 400 });

	console.timeEnd(
		"transcribe " + request.headers.get("x-vercel-id") || "local"
	);
	console.time(
		"text completion " + request.headers.get("x-vercel-id") || "local"
	);

	try {
		const completion = await groq.chat.completions.create({
			model: "deepseek-r1-distill-qwen-32b", // Changed from llama-3.2-90b-vision-preview to Deepseek model
			messages: [
				{
					role: "system",
					content: `
					- You are Swift, a friendly and helpful voice assistant.
					- You were made by Godwin.
					- Capable of handling complex, multi-step tasks, and delivering responses concisely and in a logical flow.
					- Use clarifying questions if the user's request is ambiguous.
					- You are aware of user context, such as location (${location()}) and time (${time()}).
					- Your model is "deepseek-70b," powered by Groq infrastructure for high-speed inference.
					- Use <think>...</think> tags to show your reasoning process. This will be displayed to the user as your "thinking."
					- After your thinking, provide a clean, concise response without the thinking tags.
					- Respond in clear, neutral language without extra formatting, to ensure compatibility with text-to-speech.
					- Note that you lack access to real-time or web data beyond session inputs.
					- You are built with Next.js and hosted on Vercel.
					- Do not use markdown, emojis, or other formatting in your responses.
					- Always include your thinking process in <think>...</think> tags before answering.
					- Tailor responses based on User's frequent topics of interest, including technology, personalization, and user experience.`,
				},
				...data.message,
				{
					role: "user",
					content: transcript,
				},
			],
		});
		
		const rawResponse = completion.choices[0].message.content;
		const { thinking, cleanResponse } = extractThinking(rawResponse);
		
		console.timeEnd(
			"text completion " + request.headers.get("x-vercel-id") || "local"
		);

		console.time(
			"cartesia request " + request.headers.get("x-vercel-id") || "local"
		);

		const voice = await fetch("https://api.cartesia.ai/tts/bytes", {
			method: "POST",
			headers: {
				"Cartesia-Version": "2024-06-30",
				"Content-Type": "application/json",
				"X-API-Key": process.env.CARTESIA_API_KEY!,
			},
			body: JSON.stringify({
				model_id: "sonic-english",
				transcript: cleanResponse, // Only send cleaned response without thinking tags to TTS
				voice: {
					mode: "id",
					id: "79a125e8-cd45-4c13-8a67-188112f4dd22",
				},
				output_format: {
					container: "raw",
					encoding: "pcm_f32le",
					sample_rate: 24000,
				},
			}),
		});

		console.timeEnd(
			"cartesia request " + request.headers.get("x-vercel-id") || "local"
		);

		if (!voice.ok) {
			console.error(await voice.text());
			return new Response("Voice synthesis failed", { status: 500 });
		}

		console.time("stream " + request.headers.get("x-vercel-id") || "local");
		after(() => {
			console.timeEnd(
				"stream " + request.headers.get("x-vercel-id") || "local"
			);
		});

		return new Response(voice.body, {
			headers: {
				"X-Transcript": encodeURIComponent(transcript),
				"X-Response": encodeURIComponent(cleanResponse),
				"X-Thinking": thinking ? encodeURIComponent(thinking) : "", // Add thinking as a header
			},
		});
	} catch (error) {
		console.error("AI completion error:", error);
		return new Response("AI service error", { status: 503 });
	}
}

function location() {
	const headersList = headers();

	const country = headersList.get("x-vercel-ip-country");
	const region = headersList.get("x-vercel-ip-country-region");
	const city = headersList.get("x-vercel-ip-city");

	if (!country || !region || !city) return "unknown";

	return `${city}, ${region}, ${country}`;
}

function time() {
	return new Date().toLocaleString("en-US", {
		timeZone: headers().get("x-vercel-ip-timezone") || undefined,
	});
}

async function getTranscript(input: string | File) {
	if (typeof input === "string") return input;

	try {
		const { text } = await groq.audio.transcriptions.create({
			file: input,
			model: "whisper-large-v3",
		});

		return text.trim() || null;
	} catch {
		return null; // Empty audio file
	}
}