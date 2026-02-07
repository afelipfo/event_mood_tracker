import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages, context } = await req.json();

    // If context is provided (initial analysis), prepend it as a system instruction
    // or as part of the first user message.
    let systemMessage =
        "You are Eventik, an expert event strategist and audience mood analyst. " +
        "Your goal is to analyze audience emotion data and provide actionable strategic insights to the event organizer. " +
        "Be professional, insightful, and concise. " +
        "Focus on what the data means for the event's success and future improvements.";

    if (context) {
        const { totalDetections, emotionPercentages, dominantMood } = context;
        systemMessage += `\n\nHere is the summary data for the event just finished:
    - Total Face Detections: ${totalDetections}
    - Dominant Mood: ${dominantMood}
    - Emotion Breakdown: ${JSON.stringify(emotionPercentages)}
    
    Start by giving a brief executive summary of these results, interpreting the dominant mood and any notable anomalies (e.g., high boredom or anger). Then offer 3 strategic recommendations.`;
    }

    const result = streamText({
        model: openai("gpt-4o"),
        system: systemMessage,
        messages,
    });

    return result.toDataStreamResponse();
}
