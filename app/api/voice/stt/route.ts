import { NextRequest, NextResponse } from "next/server";

// Groq Whisper Speech-to-Text API
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const audioFile = formData.get("audio") as File;
        const language = formData.get("language") as string || "ur"; // Default to Urdu

        if (!audioFile) {
            return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
        }

        const GROQ_API_KEY = process.env.GROQ_API_KEY;

        if (!GROQ_API_KEY) {
            console.error("Groq API key not configured");
            return NextResponse.json(
                { error: "Speech recognition service not configured" },
                { status: 500 }
            );
        }

        // Prepare form data for Groq API
        const groqFormData = new FormData();
        groqFormData.append("file", audioFile);
        groqFormData.append("model", "whisper-large-v3"); // Best for multilingual
        groqFormData.append("language", language); // ur for Urdu, en for English
        groqFormData.append("response_format", "json");

        const response = await fetch(
            "https://api.groq.com/openai/v1/audio/transcriptions",
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${GROQ_API_KEY}`,
                },
                body: groqFormData,
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Groq API error:", errorText);
            return NextResponse.json(
                { error: "Failed to transcribe audio" },
                { status: response.status }
            );
        }

        const result = await response.json();
        
        return NextResponse.json({
            success: true,
            text: result.text,
            language: language,
        });
    } catch (error) {
        console.error("Error in speech-to-text:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
