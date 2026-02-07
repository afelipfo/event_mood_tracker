"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import type { UIMessage } from "ai";

/** Extract text content from a UIMessage's parts array */
function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

interface SessionData {
  totalDetections: number;
  dominantMood: string | null;
  emotionPercentages: Record<string, number>;
  timelineData: unknown[];
}

interface EventikChatProps {
  sessionData: SessionData | null;
}

export function EventikChat({ sessionData }: EventikChatProps) {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error } = useChat({
    onError: (err) => {
      console.error("Chat error:", err);
    },
  });

  const hasStartedRef = useRef(false);

  // Auto-start the conversation when sessionData is available
  useEffect(() => {
    if (!hasStartedRef.current && sessionData) {
      hasStartedRef.current = true;
      console.log("Starting chat with session data");
      sendMessage(
        { text: "Please analyze the event results for this session." },
        { body: { sessionData } }
      );
    }
  }, [sessionData, sendMessage]);

  const isLoading = status === "streaming" || status === "submitted";

  return (
    <div className="flex h-[500px] w-full flex-col rounded-md border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border p-4 bg-muted/30">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Eventik AI</h3>
          <p className="text-xs text-muted-foreground">Strategic Mood Analyst</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !error && (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            <p>{sessionData ? "Analyzing event data..." : "Ready to chat about your event."}</p>
          </div>
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-500">
            Error: {error.message}
          </div>
        )}

        {messages.map((m) => {
          // Hide the auto-start message from the user
          if (m.role === "user" && getMessageText(m) === "Please analyze the event results for this session.") {
            return null;
          }

          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${
                m.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {m.role === "user" ? (
                  <User className="h-5 w-5" />
                ) : (
                  <Bot className="h-5 w-5" />
                )}
              </div>
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <div className="whitespace-pre-wrap">{getMessageText(m)}</div>
              </div>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim() || isLoading) return;
          const text = input;
          setInput("");
          if (sessionData) {
            sendMessage({ text }, { body: { sessionData } });
          } else {
            sendMessage({ text });
          }
        }}
        className="flex items-center gap-2 border-t border-border p-4"
      >
        <input
          className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Eventik about your audience..."
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </button>
      </form>
    </div>
  );
}
