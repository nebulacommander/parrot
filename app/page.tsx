"use client";

import clsx from "clsx";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { EnterIcon, LoadingIcon } from "@/lib/icons";
import { usePlayer } from "@/lib/usePlayer";
import { track } from "@vercel/analytics";
import { useMicVAD, utils } from "@ricky0123/vad-react";

type Message = {
	role: "user" | "assistant";
	content: string;
	thinking?: string;
	latency?: number;
};

export default function Home() {
	const [input, setInput] = useState("");
	const [showThinking, setShowThinking] = useState(true);
	const inputRef = useRef<HTMLInputElement>(null);
	const player = usePlayer();

	const vad = useMicVAD({
		startOnLoad: true,
		onSpeechEnd: (audio) => {
			player.stop();
			const wav = utils.encodeWAV(audio);
			const blob = new Blob([wav], { type: "audio/wav" });
			submit(blob);
			const isFirefox = navigator.userAgent.includes("Firefox");
			if (isFirefox) vad.pause();
		},
		workletURL: "/vad.worklet.bundle.min.js",
		modelURL: "/silero_vad.onnx",
		positiveSpeechThreshold: 0.6,
		minSpeechFrames: 4,
		ortConfig(ort) {
			const isSafari = /^((?!chrome|android).)*safari/i.test(
				navigator.userAgent
			);

			ort.env.wasm = {
				wasmPaths: {
					"ort-wasm-simd-threaded.wasm":
						"/ort-wasm-simd-threaded.wasm",
					"ort-wasm-simd.wasm": "/ort-wasm-simd.wasm",
					"ort-wasm.wasm": "/ort-wasm.wasm",
					"ort-wasm-threaded.wasm": "/ort-wasm-threaded.wasm",
				},
				numThreads: isSafari ? 1 : 4,
			};
		},
	});

	useEffect(() => {
		function keyDown(e: KeyboardEvent) {
			if (e.key === "Enter") return inputRef.current?.focus();
			if (e.key === "Escape") return setInput("");
			if (e.key === "z" && e.ctrlKey) {
				e.preventDefault();
				setShowThinking(prev => !prev);
			}
		}

		window.addEventListener("keydown", keyDown);
		return () => window.removeEventListener("keydown", keyDown);
	}, []);

	const [messages, submit, isPending] = useActionState<
		Array<Message>,
		string | Blob
	>(async (prevMessages, data) => {
		try {
			const formData = new FormData();

			if (typeof data === "string") {
				formData.append("input", data);
				track("Text input");
			} else {
				formData.append("input", data, "audio.wav");
				track("Speech input");
			}

			for (const message of prevMessages) {
				formData.append("message", JSON.stringify({
					role: message.role,
					content: message.content
				}));
			}

			const submittedAt = Date.now();

			const response = await fetch("/api", {
				method: "POST",
				body: formData,
			});

			if (!response.ok || !response.body) {
				if (response.status === 429) {
					toast.error("Too many requests. Please try again later.");
				} else {
					toast.error((await response.text()) || "An error occurred.");
				}
				return prevMessages;
			}

			const transcript = decodeURIComponent(
				response.headers.get("X-Transcript") || ""
			);
			const text = decodeURIComponent(
				response.headers.get("X-Response") || ""
			);
			const thinking = response.headers.get("X-Thinking") 
				? decodeURIComponent(response.headers.get("X-Thinking") || "") 
				: undefined;

			if (!transcript || !text) {
				toast.error("Invalid response from server");
				return prevMessages;
			}

			const latency = Date.now() - submittedAt;
			player.play(response.body, () => {
				const isFirefox = navigator.userAgent.includes("Firefox");
				if (isFirefox) vad.start();
			});
			setInput(transcript);

			return [
				...prevMessages,
				{
					role: "user",
					content: transcript,
				},
				{
					role: "assistant",
					content: text,
					thinking,
					latency,
				},
			];
		} catch (error) {
			console.error("Error processing request:", error);
			toast.error("Something went wrong. Please try again.");
			return prevMessages;
		}
	}, []);

	function handleFormSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (input.trim()) {
			submit(input);
		}
	}

	const lastAssistantMessage = messages.filter(m => m.role === "assistant").pop();

	return (
		<>
			<div className="pb-4 min-h-28">
				<h1 className="text-2xl font-bold text-center mb-2">Swift</h1>
				<p className="text-neutral-500 dark:text-neutral-400 text-center">
					Powered by Deepseek AI + Groq
				</p>
			</div>

			<form
				className="rounded-full bg-neutral-200/80 dark:bg-neutral-800/80 flex items-center w-full max-w-3xl border border-transparent hover:border-neutral-300 focus-within:border-neutral-400 hover:focus-within:border-neutral-400 dark:hover:border-neutral-700 dark:focus-within:border-neutral-600 dark:hover:focus-within:border-neutral-600"
				onSubmit={handleFormSubmit}
			>
				<input
					type="text"
					className="bg-transparent focus:outline-none p-4 w-full placeholder:text-neutral-600 dark:placeholder:text-neutral-400"
					required
					placeholder="Ask me anything"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					ref={inputRef}
				/>

				<button
					type="submit"
					className="p-4 text-neutral-700 hover:text-black dark:text-neutral-300 dark:hover:text-white"
					disabled={isPending}
					aria-label="Submit"
				>
					{isPending ? <LoadingIcon /> : <EnterIcon />}
				</button>
			</form>

			<div className="pt-4 w-full max-w-3xl space-y-6">
				{messages.length > 0 ? (
					<div>
						{lastAssistantMessage?.thinking && showThinking && (
							<div className="mb-4 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700">
								<div className="flex items-center mb-2">
									<div className="w-3 h-3 bg-yellow-400 rounded-full mr-2 animate-pulse"></div>
									<h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">Thinking</h3>
									<button 
										onClick={() => setShowThinking(false)}
										className="ml-auto text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
									>
										Hide
									</button>
								</div>
								<p className="text-sm whitespace-pre-line text-neutral-700 dark:text-neutral-300 font-mono">
									{lastAssistantMessage.thinking}
								</p>
							</div>
						)}
						
						<div className="p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
							<p className="text-neutral-800 dark:text-neutral-200 whitespace-pre-line">
								{lastAssistantMessage?.content}
							</p>
							{lastAssistantMessage?.latency && (
								<span className="text-xs font-mono text-neutral-400 dark:text-neutral-600 mt-2 block">
									Response time: {lastAssistantMessage.latency}ms
								</span>
							)}
						</div>
						
						{!showThinking && lastAssistantMessage?.thinking && (
							<button 
								onClick={() => setShowThinking(true)}
								className="text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
							>
								Show thinking
							</button>
						)}
					</div>
				) : (
					<div className="text-center">
						<p className="text-neutral-600 dark:text-neutral-400">
							A fast, open-source voice assistant powered by{" "}
							<A href="https://groq.com">Groq</A>,{" "}
							<A href="https://cartesia.ai">Cartesia</A>,{" "}
							<A href="https://www.vad.ricky0123.com/">VAD</A>,
							and <A href="https://vercel.com">Vercel</A>.{" "}
							<A
								href="https://github.com/WebEssentz/orbe-ai/"
								target="_blank"
							>
								Learn more
							</A>
							.
						</p>

						{vad.loading ? (
							<p className="mt-4 text-neutral-500 dark:text-neutral-500">Loading speech detection...</p>
						) : vad.errored ? (
							<p className="mt-4 text-red-500">Failed to load speech detection.</p>
						) : (
							<p className="mt-4 text-neutral-600 dark:text-neutral-400">Start talking or type a question to chat.</p>
						)}
						
						<p className="mt-4 text-xs text-neutral-500 dark:text-neutral-500">
							Press <kbd className="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-800 rounded border border-neutral-300 dark:border-neutral-700">Ctrl+L</kbd> to toggle thinking display
						</p>
					</div>
				)}
			</div>

			<div
				className={clsx(
					"absolute size-36 blur-3xl rounded-full bg-gradient-to-b from-blue-200 to-blue-400 dark:from-blue-600 dark:to-blue-800 -z-50 transition ease-in-out",
					{
						"opacity-0": vad.loading || vad.errored,
						"opacity-30":
							!vad.loading && !vad.errored && !vad.userSpeaking,
						"opacity-100 scale-110": vad.userSpeaking,
					}
				)}
			/>
		</>
	);
}

function A(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
	return (
		<a
			{...props}
			className="text-neutral-500 dark:text-neutral-500 hover:underline font-medium"
		/>
	);
}