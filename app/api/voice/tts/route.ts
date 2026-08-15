import { NextRequest, NextResponse } from "next/server";

// TTS Fallback Chain: ElevenLabs → Uplift AI → Groq Orpheus → Browser TTS
// Each provider is tried in sequence until one succeeds

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const UPLIFT_API_KEY = process.env.UPLIFT_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Try ElevenLabs TTS (Primary)
async function tryElevenLabs(text: string, voiceId?: string): Promise<ArrayBuffer | null> {
    if (!ELEVENLABS_API_KEY) {
        console.log("ElevenLabs API key not configured, skipping...");
        return null;
    }

    try {
        // Liam voice ID: TX3LPaxmHKxFdv7VOQHJ - energetic multilingual voice
        const selectedVoiceId = voiceId || "TX3LPaxmHKxFdv7VOQHJ";
        
        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "xi-api-key": ELEVENLABS_API_KEY,
                },
                body: JSON.stringify({
                    text,
                    model_id: "eleven_multilingual_v2",
                    language_code: "ar", // Arabic mode works well for Urdu/English
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.8,
                        style: 0.6,
                        use_speaker_boost: true,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("ElevenLabs API error:", errorText);
            return null;
        }

        console.log("✅ ElevenLabs TTS succeeded");
        return await response.arrayBuffer();
    } catch (error) {
        console.error("ElevenLabs TTS failed:", error);
        return null;
    }
}

// Try Uplift AI TTS (Secondary - specialized for Urdu/Pakistani languages)
async function tryUpliftAI(text: string, language: string = "ur"): Promise<ArrayBuffer | null> {
    if (!UPLIFT_API_KEY) {
        console.log("Uplift AI API key not configured, skipping...");
        return null;
    }

    try {
        // Uplift AI Orator voices:
        // Urdu: v_meklc281 (Info V2), v_8eelc901 (Info/Education), v_30s70t3a (News), v_yypgzenx (Dada Jee)
        const isUrdu = language === "ur" || language === "urdu";
        const voiceId = isUrdu ? "v_meklc281" : "v_8eelc901"; // V2 voice for better quality

        // Use async TTS endpoint for better reliability
        const response = await fetch("https://api.upliftai.org/v1/synthesis/text-to-speech-async", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${UPLIFT_API_KEY}`,
            },
            body: JSON.stringify({
                voiceId: voiceId,
                text: text,
                outputFormat: "MP3_22050_128",
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Uplift AI async API error:", errorText);
            return null;
        }

        const { mediaId, token } = await response.json();
        
        if (!mediaId || !token) {
            console.error("Uplift AI: No mediaId or token returned");
            return null;
        }

        // Fetch the audio stream
        const audioUrl = `https://api.upliftai.org/v1/synthesis/stream-audio/${mediaId}?token=${token}`;
        const audioResponse = await fetch(audioUrl);

        if (!audioResponse.ok) {
            const errorText = await audioResponse.text();
            console.error("Uplift AI stream error:", errorText);
            return null;
        }

        console.log("✅ Uplift AI TTS succeeded");
        return await audioResponse.arrayBuffer();
    } catch (error) {
        console.error("Uplift AI TTS failed:", error);
        return null;
    }
}

// Try Groq Orpheus TTS (Tertiary - supports English and Arabic)
async function tryGroqOrpheus(text: string, language: string = "ur"): Promise<ArrayBuffer | null> {
    if (!GROQ_API_KEY) {
        console.log("Groq API key not configured, skipping...");
        return null;
    }

    try {
        // Groq Orpheus TTS models:
        // - canopylabs/orpheus-v1-english (English) - voices: troy, nova, sky, ember
        // - canopylabs/orpheus-arabic-saudi (Arabic/Saudi) - voices: fahad, sultan, noura, lulwa, aisha
        const isUrdu = language === "ur" || language === "urdu";
        const model = isUrdu 
            ? "canopylabs/orpheus-arabic-saudi" 
            : "canopylabs/orpheus-v1-english";
        
        // Use appropriate voice for each model
        const voice = isUrdu ? "sultan" : "troy";

        const response = await fetch("https://api.groq.com/openai/v1/audio/speech", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: model,
                input: text,
                voice: voice,
                response_format: "wav",
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Groq Orpheus TTS API error:", errorText);
            return null;
        }

        console.log(`✅ Groq Orpheus TTS succeeded (model: ${model})`);
        return await response.arrayBuffer();
    } catch (error) {
        console.error("Groq Orpheus TTS failed:", error);
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        const { text, voiceId, language } = await request.json();

        if (!text) {
            return NextResponse.json({ error: "Text is required" }, { status: 400 });
        }

        console.log(`🔊 TTS Request - Language: ${language || "auto"}, Text length: ${text.length}`);

        // Fallback chain: ElevenLabs → Uplift AI → Groq Orpheus
        let audioBuffer: ArrayBuffer | null = null;
        let provider = "";
        let contentType = "audio/mpeg";

        // 1. Try ElevenLabs (Primary)
        audioBuffer = await tryElevenLabs(text, voiceId);
        if (audioBuffer) {
            provider = "elevenlabs";
            contentType = "audio/mpeg";
        }

        // 2. Try Uplift AI (Secondary - best for Urdu)
        if (!audioBuffer) {
            console.log("⚠️ ElevenLabs failed, trying Uplift AI...");
            audioBuffer = await tryUpliftAI(text, language || "ur");
            if (audioBuffer) {
                provider = "uplift-ai";
                contentType = "audio/mpeg";
            }
        }

        // 3. Try Groq Orpheus (Tertiary)
        if (!audioBuffer) {
            console.log("⚠️ Uplift AI failed, trying Groq Orpheus...");
            audioBuffer = await tryGroqOrpheus(text, language || "ur");
            if (audioBuffer) {
                provider = "groq-orpheus";
                contentType = "audio/wav";
            }
        }

        // All providers failed
        if (!audioBuffer) {
            console.error("❌ All TTS providers failed");
            return NextResponse.json(
                { error: "All TTS services unavailable", fallbackToBrowser: true },
                { status: 503 }
            );
        }

        console.log(`✅ TTS completed using ${provider}`);
        
        return new NextResponse(audioBuffer, {
            headers: {
                "Content-Type": contentType,
                "Content-Length": audioBuffer.byteLength.toString(),
                "X-TTS-Provider": provider,
            },
        });
    } catch (error) {
        console.error("Error in text-to-speech:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
