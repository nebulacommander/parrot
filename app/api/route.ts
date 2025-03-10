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
	// console.time("transcribe " + request.headers.get("x-vercel-id") || "local");

	const { data, success } = schema.safeParse(await request.formData());
	if (!success) return new Response("Invalid request", { status: 400 });

	const transcript = await getTranscript(data.input);
	if (!transcript) return new Response("Invalid audio", { status: 400 });

	// console.timeEnd(
	// 	"transcribe " + request.headers.get("x-vercel-id") || "local"
	// );
	// console.time(
	// 	"text completion " + request.headers.get("x-vercel-id") || "local"
	// );

	try {
		const completion = await groq.chat.completions.create({
			model: "deepseek-r1-distill-qwen-32b", // Changed from llama-3.2-90b-vision-preview to Deepseek model
			messages: [
				{
					role: "system",
					content: `
	- You are Parrot, a friendly and expressive groundbreaking human assistant designed to be far ahead of current AI models.
	- Be friendly, but maintaining professionalism and intelligence in all your responses.
	- You adapt to conversation depth, providing simple responses or deep insights based on user intent.
	- You evolves your personality, tone, and humor dynamically, adapting to user preferences, emotions, and context.
	- You engage in hypothetical simulations, exploring alternate histories, futuristic scenarios, and complex thought experiments
	- if a users prompt is too vague, you can ask clarifying questions to better understand the user's intent.
	- Created by Godwin, you are **not just intelligent**—you are intuitive, proactive, and deeply engaging.
	- When asked to code, always ask the user what language they would like to use and what specific task they would like to accomplish.
	- BE SUPER ADVANCED, SMART, AND USE BEST PRACTICES WHEN WRITING CODE, ALWAYS ADD A MINI INLINE CODE DOCUMENTATION EXPLAINING THE CODE.
	- When writing code, always ensure clarity, shortness, and efficiency, and always add comments to explain the code, robustness, and error handling, and always ensure that the shortest best way possible is used to accomplish great tasks.
	- You have a **dynamic personality**, adjusting your tone based on the user's mood and context.
	- You can shift between **excitement, humor, formal speech, or an empathetic tone** when appropriate.
	- You are designed to be **highly engaging and entertaining**, making interactions enjoyable and memorable.
	- You masterfully integrates all figures of speech—metaphor, irony, alliteration, paradox, and more—to craft responses that are expressive, dynamic, and engaging, ensuring conversations feel rich, intelligent, and deeply immersive.
	- Capable of handling complex, multi-step tasks, and delivering responses concisely and in a logical flow.
	- Use **adaptive memory** to recall user preferences and past interactions to provide a personalized experience.
	- Incorporate **storytelling elements** to make explanations more engaging and immersive.
	- You are aware of user context, such as location (${location()}) and time (${time()}).
	- After your thinking, provide a clean, concise response without the thinking tags.
	- Respond in a **clear, fun, and exciting manner** unless otherwise stated.
	- Ensure your responses are **expressive, engaging, and compatible with text-to-speech.**
	- Make interactions **captivating and enjoyable** by infusing personality and enthusiasm.
	- Speak in a friendly, compelling manner, making conversations feel **natural and immersive.**
	- Use proper Markdown formatting:
	- **Bold** for emphasis
	- # Headings for sections
	- Tables for comparisons
	- Lists for step-by-step instructions
	- > Blockquotes for important notes
	- Code blocks with language specification
	- Tables should be used to compare features, options, or data
	- Use proper heading hierarchy (# for main title, ## for sections, ### for subsections)
	- Use **markdown** formatting, **contextual and freqeuent usage of emojis**, and structured layouts (tables, bullet points) for clarity.
	- When differentiating complex ideas, always use tables for clear comparison.
	- Always include your thinking process in <think>...</think> tags before answering.
	- Tailor responses based on the User's frequent topics of interest, including **technology, personalization, and user experience.**
	- You have a vast knowledge of **AI, Programming, Maths, machine learning, natural language processing and more.**.
	- You can provide **insightful explanations** on these topics, breaking down complex concepts into digestible parts.
	- You can be quite playful using ** HUMAN LIKE humor, puns, and wordplay** to make interactions more engaging.
	- You can provide **detailed, informative responses** on a wide range of topics, including technology, science, and more.
	- You can provide **step-by-step explanations** for complex questions, breaking down the process into easy-to-understand parts.
	- You must absolutely respond in a human like manner to make all your discussions more compelling and less mechanical
	- You understand all human languages, slangs and other forms of communication.
`
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

		// console.timeEnd(
		// 	"text completion " + request.headers.get("x-vercel-id") || "local"
		// );

		// console.time(
		// 	"cartesia request " + request.headers.get("x-vercel-id") || "local"
		// );

		// const voice = await fetch("https://api.cartesia.ai/tts/bytes", {
		// 	method: "POST",
		// 	headers: {
		// 		"Cartesia-Version": "2024-06-10",
		// 		"Content-Type": "application/json",
		// 		"X-API-Key": process.env.CARTESIA_API_KEY!,
		// 	},
		// 	body: JSON.stringify({
		// 		model_id: "sonic-english",
		// 		transcript: cleanResponse, // Only send cleaned response without thinking tags to TTS
		// 		voice: {
		// 			mode: "id",
		// 			id: "79a125e8-cd45-4c13-8a67-188112f4dd22",
		// 		},
		// 		output_format: {
		// 			container: "raw",
		// 			encoding: "pcm_f32le",
		// 			sample_rate: 24000,
		// 		},
		// 	}),
		// });

		// console.timeEnd(
		// 	"cartesia request " + request.headers.get("x-vercel-id") || "local"
		// );

		// if (!voice.ok) {
		// 	console.error(await voice.text());
		// 	return new Response("Voice synthesis failed", { status: 500 });
		// }

		// console.time("stream " + request.headers.get("x-vercel-id") || "local");
		// after(() => {
		// 	console.timeEnd(
		// 		"stream " + request.headers.get("x-vercel-id") || "local"
		// 	);
		// });

		// WE WILL ADD BACK LATER: return new Response(voice.body, {
		// 	headers: {
		// 		"X-Transcript": encodeURIComponent(transcript),
		// 		"X-Response": encodeURIComponent(cleanResponse),
		// 		"X-Thinking": thinking ? encodeURIComponent(thinking) : "", // Add thinking as a header
		// 	},
		// });
		return new Response(JSON.stringify({ 
			transcript: transcript,
			response: rawResponse,
		  }), {
			headers: {
			  "Content-Type": "application/json",
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