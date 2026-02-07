import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { createClient } from "@supabase/supabase-js";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Initialize Supabase Admin client to fetch session data securely
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    const { messages, sessionId } = await req.json();

    let systemMessage =
        "You are Eventik, an expert event strategist and audience mood analyst. " +
        "Your goal is to analyze audience emotion data and provide actionable strategic insights to the event organizer. " +
        "Be professional, insightful, and concise. " +
        "Focus on what the data means for the event's success and future improvements.";

    // If sessionId is provided, fetch the specific session data from Supabase
    if (sessionId) {
        const { data: session, error } = await supabaseAdmin
            .from("sessions")
            .select("*")
            .eq("id", sessionId)
            .single();

        if (session && !error) {
            const { total_detections, dominant_mood, emotion_percentages } = session;

            systemMessage += `\n\nHere is the summary data for the event just finished (fetched from database):
      - Total Face Detections: ${total_detections}
      - Dominant Mood: ${dominant_mood}
      - Emotion Breakdown: ${JSON.stringify(emotion_percentages)}
      
      Start by giving a brief executive summary of these results, interpreting the dominant mood. Then offer 3 strategic recommendations based on this specific data.`;
        } else {
            console.error("Error fetching session context:", error);
            systemMessage += "\n\n(Note: Could not retrieve detailed session data from the database. Ask the user for details if needed.)";
        }
    }

    const result = streamText({
        model: openai("gpt-4o"),
        system: systemMessage,
        messages,
    });

    return result.toTextStreamResponse();
}
