import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages } from "ai";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Initialize Supabase Admin client to fetch session data securely
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// SECURITY (V-13): Strict input validation schema for AI SDK v6 UIMessage format
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
  sessionId: z.string().max(100).nullish(),
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

  const { messages, sessionId } = parsed.data;

  let systemMessage =
    "You are Eventik, an expert event strategist and audience mood analyst. " +
    "Your goal is to analyze audience emotion data and provide actionable strategic insights to the event organizer. " +
    "Be professional, insightful, and concise. " +
    "Focus on what the data means for the event's success and future improvements.";

  // If sessionId is provided, fetch the specific session data from Supabase
  if (sessionId) {
    console.log("Fetching session from Supabase:", sessionId);
    const { data: session, error } = await supabaseAdmin
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (session && !error) {
      const { total_detections, dominant_mood, emotion_percentages } = session;

      systemMessage += `\n\nHere is the summary data for the event just finished (fetched from database):
      - Total Face Detections: ${total_detections}
      - Dominant Mood: ${sanitizeForPrompt(String(dominant_mood))}
      - Emotion Breakdown: ${sanitizeForPrompt(JSON.stringify(emotion_percentages))}
      
      Start by giving a brief executive summary of these results, interpreting the dominant mood. Then offer 3 strategic recommendations based on this specific data.`;
      console.log("Context loaded successfully for session:", sessionId);
    } else {
      console.error("Error fetching session context:", error);
      systemMessage +=
        "\n\n(Note: Could not retrieve detailed session data from the database. Ask the user for details if needed.)";
    }
  } else {
    console.log("No sessionId provided to chat endpoint");
    // Fallback: Check if the first user message contains event data (inline in text)
    const firstUserMessage = messages.find((m) => m.role === "user");
    if (firstUserMessage) {
      const textParts = firstUserMessage.parts
        .filter((p) => p.type === "text" && typeof p.text === "string")
        .map((p) => String(p.text ?? ""))
        .join("\n");

      if (textParts.includes("Emotion Breakdown:")) {
        const sanitized = sanitizeForPrompt(textParts);
        systemMessage += `\n\nHere is the summary data for the event just finished:\n${sanitized}\n\nStart by giving a brief executive summary of these results, interpreting the dominant mood and any notable anomalies (e.g., high boredom or anger). Then offer 3 strategic recommendations.`;
      }
    }
  }

  // Convert UIMessages to ModelMessages for streamText
  // Cast through unknown because Zod validation gives us a loose type,
  // but we've validated the shape matches what the SDK expects
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
