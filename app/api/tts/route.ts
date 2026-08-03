import { NextResponse } from "next/server";

// Bella: Doğal, akıcı ve sıcak bir kadın sesi. Türkçe'yi çok iyi konuşur.
const VOICE_ID = "EXAVITQu4vr4xnSDxMaL";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ElevenLabs API key not configured" }, { status: 500 });
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_turbo_v2_5",
                    voice_settings: {
            stability: 0.25,        // Daha düşük = daha canlı ve doğal
            similarity_boost: 0.9,  // Daha yüksek = orijinal sese daha sadık
            style: 0.4,             // Daha fazla ifade ve vurgu
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error: "ElevenLabs API error", details: error }, { status: response.status });
    }

    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "TTS failed", details: String(error) },
      { status: 500 }
    );
  }
}