"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import type { Message } from "ai";

/** Extract text content from a UIMessage's parts array */
/** Extract text content from a UIMessage's parts array */
function getMessageText(message: UIMessage): string {
  return message.content;
}

interface SessionData {
  totalDetections: number;
  dominantMood: string | null;
  emotionPercentages: Record<string, number>;
  timelineData: any[];
}

interface EventikChatProps {
  sessionData: SessionData | null;
}

export function EventikChat({ sessionData }: EventikChatProps) {
  const { messages, input, handleInputChange, handleSubmit, append, error } = useChat({
    api: "/api/chat",
    onError: (err) => {
      console.error("Chat error:", err);
    }
  });

  const hasStartedRef = useRef(false);

  // Auto-start the conversation when sessionData is available
  useEffect(() => {
    // console.log("EventikChat mounted. SessionData available:", !!sessionData);
    if (!hasStartedRef.current && sessionData) {
      hasStartedRef.current = true;
      console.log("Starting chat with session data");
      // Send a hidden system-like message to trigger the initial analysis
      // We pass the full sessionData in the 'body' so the server can build context directly
      append(
        {
          role: "user",
          content: "Please analyze the event results for this session.",
        },
        {
          body: { sessionData },
        }
      );
    }
  }, [sessionData, append]);

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
          // Start hidden filtering: Only hide if it's the specific auto-start message
          if (m.role === 'user' && m.content === "Please analyze the event results for this session.") {
            return null;
          }

          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
              >
                {m.role === "user" ? (
                  <User className="h-5 w-5" />
                ) : (
                  <Bot className="h-5 w-5" />
                )}
              </div>
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${m.role === "user"
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
          // console.log("Submitting chat message.");
          if (sessionData) {
            handleSubmit(e, { body: { sessionData } });
          } else {
            // Fallback if no session data yet
            handleSubmit(e);
          }
        }}
        className="flex items-center gap-2 border-t border-border p-4"
      >
        <input
          className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          value={input}
          onChange={handleInputChange}
          placeholder="Ask Eventik about your audience..."
        />
        <button
          type="submit"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </button>
      </form>
    </div>
  );
}
