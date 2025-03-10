"use client";

import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useActionState, useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { EnterIcon, LoadingIcon } from "@/lib/icons";
import { usePlayer } from "@/lib/usePlayer";
import { track } from "@vercel/analytics";
import { useMicVAD, utils } from "@ricky0123/vad-react";
import { CodeBlock } from "../components/ui";
import { HelpMenu } from '../components/ui/help-menu';
import { Command, Search, Wand2, Code2, Brain, MessageSquareText, Settings, HelpCircle, ChevronDown, MenuIcon, PlusIcon } from 'lucide-react';
import debounce from 'lodash/debounce';

type Message = {
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  latency?: number;
};

type TemplatePrompt = {
  text: string;
  icon: React.ReactNode;
};

const templatePrompts: TemplatePrompt[] = [
  { text: "Write code", icon: <Code2 size={16} /> },
  { text: "Explain concept", icon: <Brain size={16} /> },
  { text: "Search docs", icon: <Search size={16} /> },
  { text: "Generate text", icon: <MessageSquareText size={16} /> }
];

function parseResponse(content: string): Array<{type: string, content: string, language?: string}> {
  const parts = [];
  let currentText = '';
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const codeMatch = line.match(/^```(\w+)?$/);
    
    if (codeMatch) {
      // If we have accumulated text, add it
      if (currentText) {
        parts.push({ type: 'text', content: currentText.trim() });
        currentText = '';
      }
      
      // Collect the code block
      const language = codeMatch[1];
      let code = '';
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        code += lines[i] + '\n';
        i++;
      }
      
      parts.push({
        type: 'code',
        language: language || 'text',
        content: code.trim()
      });
    } else {
      currentText += line + '\n';
    }
  }
  
  // Add any remaining text
  if (currentText) {
    parts.push({ type: 'text', content: currentText.trim() });
  }
  
  return parts;
}

export default function Home() {
  const [input, setInput] = useState("");
  const [showThinking, setShowThinking] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const player = usePlayer();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

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

  const getSuggestions = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch("/api/suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) throw new Error("Failed to fetch suggestions");
        const data = await response.json();
        setSuggestions(data.suggestions);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (input.trim()) {
      getSuggestions(input);
    } else {
      setSuggestions([]);
    }
  }, [input, getSuggestions]);

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

  function handleTemplateClick(template: TemplatePrompt): void {
    const prompts = {
      "Write code": "Write code to ",
      "Explain concept": "Explain the concept of ",
      "Search docs": "Find documentation about ",
      "Generate text": "Generate text for "
    };
    
    const defaultPrompt = prompts[template.text as keyof typeof prompts] || "";
    setInput(defaultPrompt);
    inputRef.current?.focus();
  }

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 p-3 mb-1.5 flex items-center justify-between font-semibold bg-token-main-surface-primary border-b">
        <div className="flex items-center gap-0 overflow-hidden">
          <div className="flex items-center">
            {/* Sidebar Toggle */}
            <span className="flex" data-state="closed">
              <button 
                aria-label="Open sidebar" 
                className="h-10 rounded-lg px-2 text-token-text-secondary hover:bg-token-surface-hover focus-visible:outline-none"
              >
                <MenuIcon className="h-6 w-6" />
              </button>
            </span>
            
            {/* New Chat Button */}
            <span className="flex" data-state="closed">
              <button 
                aria-label="New chat"
                className="h-10 rounded-lg px-2 text-token-text-secondary hover:bg-token-surface-hover focus-visible:outline-none"
              >
                <PlusIcon className="h-6 w-6" />
              </button>
            </span>
          </div>

          {/* Model Switcher */}
          <button 
            className="group flex cursor-pointer items-center gap-1 rounded-lg py-1.5 px-3 text-lg hover:bg-token-surface-hover font-semibold text-token-text-secondary overflow-hidden whitespace-nowrap"
          >
            <span>Parrot AI</span>
            <ChevronDown className="h-4 w-4 text-token-text-tertiary" />
          </button>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2 pr-1">
          <SignedIn>
            <UserButton afterSignOutUrl="/sign-in" />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                Sign in
              </button>
            </SignInButton>
          </SignedOut>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex-1 overflow-auto">
        <div className="relative h-full w-full flex flex-col items-center pt-0">
          {messages.length > 0 ? (
            <div className="w-full max-w-3xl px-4 py-4 space-y-6">
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
                <div className="prose dark:prose-invert">
                  {lastAssistantMessage?.content}
                </div>
                {lastAssistantMessage?.latency && (
                  <span className="text-xs font-mono text-neutral-400 dark:text-neutral-600 mt-2 block">
                    Response time: {lastAssistantMessage?.latency}ms
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
            <div className="w-full max-w-3xl px-4 flex flex-col items-center justify-center min-h-[60vh]">
              {/* Title Section */}
              <div className="text-center space-y-2 mb-8">
                <h1 className="text-2xl font-bold">Parrot</h1>
                <p className="text-neutral-500 dark:text-neutral-400">
                  Powered by Deepseek AI + Groq
                </p>
              </div>

              {/* Template Prompts Grid */}
              <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {templatePrompts.map((template) => (
                  <button
                    key={template.text}
                    onClick={() => handleTemplateClick(template)}
                    className="flex items-center gap-2 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors text-left"
                  >
                    <span className="text-neutral-500 dark:text-neutral-400">
                      {template.icon}
                    </span>
                    <span className="text-sm truncate">{template.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fixed Input Form at Bottom */}
          <div className="sticky bottom-0 w-full bg-gradient-to-t from-background to-transparent pt-6">
            <div className="mx-auto max-w-3xl px-4 pb-4">
              <form 
                onSubmit={handleFormSubmit}
                className="relative flex items-center w-full rounded-lg border bg-background shadow-sm focus-within:ring-2 ring-primary/20"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message Parrot..."
                  className="flex-1 px-4 py-3 bg-transparent focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-3 text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {isPending ? <LoadingIcon /> : <EnterIcon />}
                </button>

                {/* Suggestions Dropdown */}
                {suggestions.length > 0 && input && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 py-2 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-lg">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setInput(input + " " + suggestion);
                          setSuggestions([]);
                          inputRef.current?.focus();
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 text-sm"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </main>

      <HelpMenu />
    </div>
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