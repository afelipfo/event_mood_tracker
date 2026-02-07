import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages } from "ai";
import { z } from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// SECURITY (V-13): Strict input validation schema
const RequestSchema = z.object({
  id: z.string().max(100).optional(),
  messages: z
    .array(
      z.object({
        id: z.string().max(100),
        role: z.enum(["user", "assistant", "system"]),
        parts: z.array(z.record(z.unknown())).max(20),
      })
    )
    .max(20),
  trigger: z.string().max(50).optional(),
  sessionData: z
    .object({
      totalDetections: z.number(),
      dominantMood: z.string().nullable(),
      emotionPercentages: z.record(z.number()),
      timelineData: z.array(z.unknown()).optional(),
    })
    .nullish(),
});

/**
 * Sanitize user-provided strings before injecting into system prompt.
 * Strips control characters and potential prompt injection patterns.
 */
function sanitizeForPrompt(value: string): string {
  return value
    .replace(/[\x00-\x1f\x7f]/g, "") // strip control characters
    .replace(/\n{3,}/g, "\n\n") // collapse excessive newlines
    .slice(0, 500); // hard limit on length
}

export async function POST(req: Request) {
  let parsed;
  try {
    const body = await req.json();
    parsed = RequestSchema.safeParse(body);
  } catch {
    return new Response("Malformed JSON", { status: 400 });
  }

  if (!parsed.success) {
    return new Response("Invalid input", { status: 400 });
  }

  const { messages, sessionData } = parsed.data;

  let systemMessage =
    "You are Eventik, an expert event strategist and audience mood analyst. " +
    "Your goal is to analyze audience emotion data and provide actionable strategic insights to the event organizer. " +
    "Be professional, insightful, and concise. " +
    "Focus on what the data means for the event's success and future improvements.";

  if (sessionData) {
    const { totalDetections, dominantMood, emotionPercentages } = sessionData;

    systemMessage += `\n\nHere is the summary data for the event just finished:
      - Total Face Detections: ${totalDetections}
      - Dominant Mood: ${sanitizeForPrompt(String(dominantMood ?? "unknown"))}
      - Emotion Breakdown: ${sanitizeForPrompt(JSON.stringify(emotionPercentages))}
      
      Start by giving a brief executive summary of these results, interpreting the dominant mood. Then offer 3 strategic recommendations based on this specific data.`;
  } else {
    // Fallback: Check if the first user message contains event data inline
    const firstUserMessage = messages.find((m) => m.role === "user");
    if (firstUserMessage) {
      const textParts = firstUserMessage.parts
        .filter(
          (p): p is { type: string; text: string } =>
            (p as { type?: string }).type === "text" &&
            typeof (p as { text?: string }).text === "string"
        )
        .map((p) => String(p.text ?? ""))
        .join("\n");

      if (textParts.includes("Emotion Breakdown:")) {
        const sanitized = sanitizeForPrompt(textParts);
        systemMessage += `\n\nHere is the summary data for the event just finished:\n${sanitized}\n\nStart by giving a brief executive summary of these results, interpreting the dominant mood and any notable anomalies (e.g., high boredom or anger). Then offer 3 strategic recommendations.`;
      }
    }

    if (!systemMessage.includes("summary data")) {
      systemMessage +=
        "\n\n(Note: No specific session data was provided. Ask the user for details if needed.)";
    }
  }

  // Convert UIMessages to ModelMessages for streamText
  const modelMessages = await convertToModelMessages(
    messages as unknown as Parameters<typeof convertToModelMessages>[0]
  );

  const result = streamText({
    model: openai("gpt-4o"),
    system: systemMessage,
    messages: modelMessages,
  });

  return result.toUIMessageStreamResponse();
}
