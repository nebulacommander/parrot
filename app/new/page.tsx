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

// function parseResponse(content: string): Array<{ type: string, content: string, language?: string }> {
//   const parts = [];
//   let currentText = '';
//   const lines = content.split('\n');

//   for (let i = 0; i < lines.length; i++) {
//     const line = lines[i];
//     const codeMatch = line.match(/^```(\w+)?$/);

//     if (codeMatch) {
//       // If we have accumulated text, add it
//       if (currentText) {
//         parts.push({ type: 'text', content: currentText.trim() });
//         currentText = '';
//       }

//       // Collect the code block
//       const language = codeMatch[1];
//       let code = '';
//       i++;
//       while (i < lines.length && !lines[i].startsWith('```')) {
//         code += lines[i] + '\n';
//         i++;
//       }

//       parts.push({
//         type: 'code',
//         language: language || 'text',
//         content: code.trim()
//       });
//     } else {
//       currentText += line + '\n';
//     }
//   }

//   // Add any remaining text
//   if (currentText) {
//     parts.push({ type: 'text', content: currentText.trim() });
//   }

//   return parts;
// }

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
    <div className="flex h-screen w-full overflow-hidden bg-neutral-100 dark:bg-black">
      {sidebarOpen && <ChatSidebar onClose={() => setSidebarOpen(false)} />}

      <div className="flex h-full w-full flex-col">
        <header className="flex items-center justify-between p-3 bg-neutral-100 dark:bg-black">
          <div className="flex items-center gap-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="h-10 rounded-lg px-2 hover:bg-neutral-200 dark:hover:bg-neutral-800"
            >
              <MenuIcon className="h-6 w-6" />
            </button>

            <Link href="/new">
              <button className="h-10 rounded-lg px-2 hover:bg-neutral-200 dark:hover:bg-neutral-800">
                <Pen className="h-6 w-6" />
              </button>
            </Link>

            {/* Model switcher button */}
            <button className="group flex items-center gap-1 rounded-lg py-1.5 px-3 text-lg hover:bg-neutral-200 dark:hover:bg-neutral-800">
              <span>Parrot AI</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </button>
          </div>

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

        <main className="relative flex-1 overflow-hidden">
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

                {isStreaming && (
                  <div className="p-4 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-700">
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
              <div className="w-full max-w-3xl px-4 flex flex-col items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-2 mb-8">
                  <AnimatedLogo />
                </div>

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

            <div className="sticky bottom-0 w-full bg-gradient-to-t from-background to-transparent pt-6">
              <div className="w-full">
                <div className="flex justify-center empty:hidden"></div>
                <form
                  onSubmit={handleFormSubmit}
                  className="w-full"
                >
                  <div className="relative z-[1] flex h-full max-w-full flex-1 flex-col">
                    <div className="group relative z-[1] flex w-full items-center">
                      <div className="w-full">
                        <div className="flex w-full cursor-text flex-col rounded-3xl border border-token-border-light px-3 py-1 duration-150 ease-in-out bg-token-main-surface-primary dark:bg-[#303030] dark:border-none shadow-[0_9px_9px_0px_rgba(0,0,0,0.01),_0_2px_5px_0px_rgba(0,0,0,0.06)] has-[:focus]:shadow-[0_2px_12px_0px_rgba(0,0,0,0.04),_0_9px_9px_0px_rgba(0,0,0,0.01),_0_2px_5px_0px_rgba(0,0,0,0.06)]">
                          <div className="flex flex-col justify-start min-h-0">
                            <div className="flex min-h-[44px] items-start pl-1">
                              <div className="min-w-0 max-w-full flex-1">
                                <div className="max-h-[25dvh] max-h-52 overflow-auto">
                                 {renderInput()}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mb-2 mt-1 flex items-center justify-between sm:mt-5">
                            <div className="flex gap-x-1.5">
                              <button
                                type="button"
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-token-border-light text-token-text-secondary hover:bg-token-main-surface-secondary dark:hover:bg-gray-700"
                              >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]">
                                  <path fillRule="evenodd" clipRule="evenodd" d="M12 3C12.5523 3 13 3.44772 13 4L13 11H20C20.5523 11 21 11.4477 21 12C21 12.5523 20.5523 13 20 13L13 13L13 20C13 20.5523 12.5523 21 12 21C11.4477 21 11 20.5523 11 20L11 13L4 13C3.44772 13 3 12.5523 3 12C3 11.4477 3.44772 11 4 11L11 11L11 4C11 3.44772 11.4477 3 12 3Z" fill="currentColor" />
                                </svg>
                              </button>
                            </div>

                            <div className="flex gap-x-1.5">
                              <button
                                type="submit"
                                disabled={isPending}
                                className="relative flex h-9 w-9 items-center justify-center rounded-full bg-black text-white transition-colors hover:opacity-70 disabled:opacity-30 dark:bg-white dark:text-black"
                              >
                                {isPending ? <LoadingIcon /> : <EnterIcon />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
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