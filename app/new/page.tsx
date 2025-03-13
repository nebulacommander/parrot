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
import { Command, Search, Wand2, Code2, Brain, MessageSquareText, Settings, HelpCircle, ChevronDown, MenuIcon, PlusIcon, Pen } from 'lucide-react';
import debounce from 'lodash/debounce';
import { ChatSidebar } from '../components/sidebar/sidebar';
import Link from "next/link";
import { AnimatedLogo } from "@/components/ui/animated-logo";

type MessageRole = "user" | "assistant";

type Message = {
  role: MessageRole;
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


export default function Home() {
  const [input, setInput] = useState("");
  const [showThinking, setShowThinking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const player = usePlayer();
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState<string>("");
  const [suggestionTimer, setSuggestionTimer] = useState<NodeJS.Timeout | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);


  // Added keydown handler for tab completion
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab" && activeSuggestion) {
      e.preventDefault();
      setInput(activeSuggestion);
      setActiveSuggestion("");
    }
  };

  // Modified input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    
    // Clear suggestion on space
    if (e.target.value.endsWith(" ")) {
      setActiveSuggestion("");
      // Reset timer for next suggestion
      if (suggestionTimer) {
        clearTimeout(suggestionTimer);
        setSuggestionTimer(null);
      }
    } else {
      getSuggestions(e.target.value);
    }
  };
 
   // Update renderInput to use new handler
   function renderInput() {
    return (
      <div className="relative w-full">
        <input 
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Message Parrot..."
          className="block w-full resize-none border-0 h-10 px-0 py-2 text-token-text-primary placeholder:text-token-text-tertiary focus:outline-none dark:bg-transparent dark:text-neutral-200 dark:placeholder-neutral-400"
        />
        {activeSuggestion && (
          <div className="absolute left-0 top-0 h-full flex items-center pointer-events-none">
            <span className="opacity-0">{input}</span>
            <span className="flex items-center text-neutral-400">
              {activeSuggestion.slice(input.length)}
              <span className="inline-flex items-center justify-center text-[9px] font-medium ml-1 px-1 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400">
                TAB
              </span>
            </span>
          </div>
        )}
      </div>
    );
  }

   // text-neutral-800 placeholder-neutral-500 bg-transparent border border-neutral-200 rounded-lg focus:outline-none focus:border-primary

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

// Modify suggestion handling with delay
const getSuggestions = useCallback(
  debounce(async (query: string) => {
    if (!query.trim()) {
      setActiveSuggestion("");
      return;
    }

    // Clear any existing timer
    if (suggestionTimer) {
      clearTimeout(suggestionTimer);
    }

    // Set new timer for 2 second delay
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) throw new Error("Failed to fetch suggestions");
        const data = await response.json();
        
        if (data.suggestions?.length > 0) {
          setActiveSuggestion(data.suggestions[0]);
        } else {
          setActiveSuggestion("");
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setActiveSuggestion("");
      }
    }, 1000); // 2 second delay

    setSuggestionTimer(timer);
  }, 200),
  [suggestionTimer]
);

useEffect(() => {
  return () => {
    if (suggestionTimer) {
      clearTimeout(suggestionTimer);
    }
  };
}, [suggestionTimer]);

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

  const [messages, submit, isPending] = useActionState<Message[], string | Blob>(
    async (prevMessages, data) => {
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
          formData.append(
            "message",
            JSON.stringify({
              role: message.role,
              content: message.content,
            })
          );
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

        // Remove the text and thinking checks since we're streaming
        setInput(transcript);
        setIsStreaming(true);
        setStreamingContent("");

        // Add the user message immediately with explicit type
        const newMessages: Message[] = [
          ...prevMessages,
          {
            role: "user" as const,
            content: transcript,
          },
        ];

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let currentThinking = '';
        let isThinking = false;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === 'content') {
                    if (data.content.includes('<think>')) {
                      isThinking = true;
                      continue;
                    }
                    if (data.content.includes('</think>')) {
                      isThinking = false;
                      continue;
                    }

                    if (isThinking) {
                      currentThinking += data.content;
                    } else {
                      fullContent += data.content;
                      setStreamingContent(fullContent);
                    }
                  }
                } catch (e) {
                  console.error('Error parsing SSE data:', e);
                }
              }
            }
          }
        } finally {
          setIsStreaming(false);
          // Add the complete assistant message with explicit type
          if (fullContent.trim()) {
            newMessages.push({
              role: "assistant" as const,
              content: fullContent,
              thinking: currentThinking,
              latency: Date.now() - submittedAt,
            });
          }
        }

        return newMessages;

      } catch (error) {
        console.error("Error processing request:", error);
        toast.error("Something went wrong. Please try again.");
        return prevMessages;
      }
    },
    []
  );

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
    <div className="fixed inset-0 flex bg-background overflow-hidden">
      {sidebarOpen && <ChatSidebar onClose={() => setSidebarOpen(false)} />}

      <div className="flex h-full w-full flex-col">
        <header className="flex items-center justify-between border-b border-border p-3 bg-background">
          {/* Left header content */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="h-10 rounded-lg px-2 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <MenuIcon className="h-5 w-5 text-foreground" />
            </button>

            <button className="flex items-center gap-2 rounded-lg px-4 py-2 text-lg font-medium hover:bg-muted">
              Parrot AI
              <ChevronDown className="h-4 w-4 opacity-50" />
            </button>
          </div>

          {/* Right header content */}
          <div className="flex items-center gap-4">
            <SignedIn>
              <UserButton afterSignOutUrl="/sign-in" />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90">
                  Sign in
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </header>

        <main className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 flex flex-col items-center">
            <div className="w-full max-w-3xl h-full content-scroll">
              {messages.length > 0 ? (
                <div className="w-full max-w-3xl space-y-6 p-4">
                  {/* Thinking section */}
                  {lastAssistantMessage?.thinking && showThinking && (
                    <div className="rounded-lg border border-border bg-muted p-4">
                      <div className="mb-2 flex items-center">
                        <div className="mr-2 h-2 w-2 animate-pulse rounded-full bg-primary"></div>
                        <h3 className="text-sm font-medium text-muted-foreground">Processing</h3>
                        <button
                          onClick={() => setShowThinking(false)}
                          className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                        >
                          Hide
                        </button>
                      </div>
                      <pre className="text-sm font-mono text-muted-foreground whitespace-pre-wrap">
                        {lastAssistantMessage.thinking}
                      </pre>
                    </div>
                  )}

                  {/* Message content */}
                  <div className="rounded-lg border border-border bg-card p-4">
                    <div className="prose dark:prose-invert max-w-none">
                      {lastAssistantMessage?.content}
                    </div>
                    {lastAssistantMessage?.latency && (
                      <span className="mt-2 block text-xs font-mono text-muted-foreground">
                        Response time: {lastAssistantMessage.latency}ms
                      </span>
                    )}
                  </div>

                  {/* Streaming content */}
                  {isStreaming && (
                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="prose dark:prose-invert">
                        <p className="streaming-text">
                          {streamingContent}
                          <span className="typing-cursor"></span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Empty state
                <div className="flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center px-4">
                  <div className="mb-8 text-center">
                    <AnimatedLogo />
                  </div>

                  {/* Template buttons */}
                  <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-4">
                    {templatePrompts.map((template) => (
                      <button
                        key={template.text}
                        onClick={() => handleTemplateClick(template)}
                        className="flex items-center gap-2 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted"
                      >
                        <span className="text-muted-foreground">{template.icon}</span>
                        <span className="truncate text-sm">{template.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input section */}
              <div className="sticky bottom-0 w-full bg-gradient-to-t from-background to-transparent pt-6">
                <form onSubmit={handleFormSubmit} className="mx-auto max-w-3xl px-4">
                  <div className="relative rounded-lg border border-border bg-card shadow-sm">
                    <div className="min-h-[44px] p-2">
                      {renderInput()}
                    </div>
                    <div className="flex items-center justify-between border-t border-border p-2">
                      <button
                        type="button"
                        className="rounded-full p-2 hover:bg-muted"
                      >
                        <PlusIcon className="h-5 w-5 text-muted-foreground" />
                      </button>
                      <button
                        type="submit"
                        disabled={isPending}
                        className="rounded-full bg-primary p-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        {isPending ? <LoadingIcon /> : <EnterIcon />}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>

        <div className="sticky bottom-0 w-full bg-gradient-to-t from-background to-transparent pt-6">
          {/* ...existing input form code... */}
        </div>
      </div>
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