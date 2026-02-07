import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages, sessionData } = await req.json();

    let systemMessage =
        "You are Eventik, an expert event strategist and audience mood analyst. " +
        "Your goal is to analyze audience emotion data and provide actionable strategic insights to the event organizer. " +
        "Be professional, insightful, and concise. " +
        "Focus on what the data means for the event's success and future improvements.";

    // If sessionData is provided directly from the client
    if (sessionData) {
        console.log("Using session data provided in request");
        const { totalDetections, dominantMood, emotionPercentages } = sessionData;

        systemMessage += `\n\nHere is the summary data for the event just finished (provided by client):
      - Total Face Detections: ${totalDetections}
      - Dominant Mood: ${dominantMood}
      - Emotion Breakdown: ${JSON.stringify(emotionPercentages)}
      
      Start by giving a brief executive summary of these results, interpreting the dominant mood. Then offer 3 strategic recommendations based on this specific data.`;

    } else {
        console.log("No sessionData provided to chat endpoint");
        systemMessage += "\n\n(Note: No specific session data was provided. Ask the user for details if needed.)";
    }

    const result = streamText({
        model: openai("gpt-4o"),
        system: systemMessage,
        messages,
    });

    return result.toTextStreamResponse();
}
