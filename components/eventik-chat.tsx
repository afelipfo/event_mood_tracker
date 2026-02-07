"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef } from "react";
import { Send, Bot, User, ShieldAlert } from "lucide-react";
import type { EmotionCounts } from "@/hooks/use-emotion-tracking";
import type { UIMessage } from "ai";

/**
 * SECURITY (V-04): Apply Laplace noise for epsilon-differential privacy.
 * This ensures exact emotion percentages are never sent to third parties.
 */
function addLaplaceNoise(value: number, epsilon: number = 1.0): number {
  const b = 1.0 / epsilon;
  const u = Math.random() - 0.5;
  const noise = -b * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  return Math.max(0, Math.min(100, Math.round(value + noise)));
}

/**
 * Apply differential privacy to all emotion percentages.
 * Returns noised percentages that protect individual data points.
 */
function applyDifferentialPrivacy(
  percentages: Record<string, number>
): Record<string, number> {
  const noised: Record<string, number> = {};
  for (const [key, value] of Object.entries(percentages)) {
    noised[key] = addLaplaceNoise(value);
  }
  return noised;
}

/** Extract text content from a UIMessage's parts array */
function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");
}

interface EventikChatProps {
  emotionCounts: EmotionCounts;
  totalDetections: number;
  emotionPercentages: Record<string, number>;
  dominantMood: string | null;
  sessionId?: string | null;
}

export function EventikChat({
  totalDetections,
  emotionPercentages,
  dominantMood,
  sessionId,
}: EventikChatProps) {
  const { messages, sendMessage, status } = useChat({
    body: sessionId ? { sessionId } : undefined,
  });

  const hasStartedRef = useRef(false);
  const [inputValue, setInputValue] = useState("");

  // SECURITY (V-04): User must explicitly opt-in to send data to OpenAI
  const [aiOptIn, setAiOptIn] = useState(false);

  const handleOptIn = () => {
    setAiOptIn(true);

    if (!hasStartedRef.current && totalDetections > 0) {
      hasStartedRef.current = true;

      // SECURITY: Apply differential privacy noise before sending
      const noisedPercentages = applyDifferentialPrivacy(emotionPercentages);

      // Build the analysis prompt with noise-protected data
      const analysisPrompt = [
        "Please analyze my event results.",
        "",
        `Total Face Detections: ~${Math.round(totalDetections / 10) * 10}`,
        `Dominant Mood: ${dominantMood ?? "unknown"}`,
        `Emotion Breakdown: ${JSON.stringify(noisedPercentages)}`,
      ].join("\n");

      sendMessage({ text: analysisPrompt });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || status === "streaming" || status === "submitted") return;
    sendMessage({ text: inputValue.trim() });
    setInputValue("");
  };

  // If user hasn't opted in, show the disclosure + opt-in button
  if (!aiOptIn) {
    return (
      <div className="flex w-full flex-col items-center gap-4 rounded-md border border-border bg-card p-8 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <ShieldAlert className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-2 text-center">
          <h3 className="text-sm font-semibold text-foreground">
            AI Analysis (Optional)
          </h3>
          <p className="mx-auto max-w-sm text-xs leading-relaxed text-muted-foreground">
            Get strategic insights from an AI analyst. This will send{" "}
            <strong className="text-foreground">anonymized, noise-added</strong>{" "}
            emotion percentages to OpenAI. No video, images, or identifying data
            will be transmitted.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOptIn}
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_-8px_hsl(38,92%,55%,0.4)]"
        >
          Share &amp; Analyze
        </button>
        <p className="text-[10px] text-muted-foreground/50">
          Data is noise-protected via differential privacy (epsilon=1.0)
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[500px] w-full flex-col rounded-md border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border p-4 bg-muted/30">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">Eventik AI</h3>
          <p className="text-xs text-muted-foreground">
            Strategic Mood Analyst
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            <p>Analyzing event data...</p>
          </div>
        )}

        {messages.slice(1).map((m: UIMessage) => (
          <div
            key={m.id}
            className={`flex items-start gap-3 ${
              m.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
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
        ))}
      </div>

      <form
        onSubmit={handleFormSubmit}
        className="flex items-center gap-2 border-t border-border p-4"
      >
        <input
          className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask Eventik about your audience..."
        />
        <button
          type="submit"
          disabled={status === "streaming" || status === "submitted"}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </button>
      </form>
    </div>
  );
}
