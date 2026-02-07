import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Initialize Supabase with the Service Role Key for admin privileges
// This bypasses RLS, allowing us to insert data without user authentication
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { totalDetections, dominantMood, emotionPercentages, timelineData } = body;

        // Validate required fields
        if (typeof totalDetections !== "number" || !emotionPercentages) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Insert data into the 'sessions' table
        const { data, error } = await supabaseAdmin
            .from("sessions")
            .insert([
                {
                    total_detections: totalDetections,
                    dominant_mood: dominantMood,
                    emotion_percentages: emotionPercentages,
                    timeline_data: timelineData,
                },
            ])
            .select()
            .single();

        if (error) {
            console.error("Supabase insert error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, session: data });
    } catch (err) {
        console.error("API error:", err);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
