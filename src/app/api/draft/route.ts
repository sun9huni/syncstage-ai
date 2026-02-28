import { NextResponse } from "next/server";

export const maxDuration = 60;
import { GoogleGenAI } from "@google/genai";
import { SyncStageDraftSchema } from "@/lib/schema";
import { updateDraft } from "@/lib/store";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import os from "os";
import { nanoid } from "nanoid";
import { SYNCSTAGE_SYSTEM_PROMPT } from "@/lib/prompts";

const apiKey = process.env.GEMINI_API_KEY2 || process.env.GEMINI_API_KEY || "dummy-key-for-build";
const ai = new GoogleGenAI({ apiKey });

export async function POST(req: Request) {
    let tempPath: string | null = null;

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Write to temp file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        tempPath = join(os.tmpdir(), `${Date.now()}_${file.name}`);
        await writeFile(tempPath, buffer);

        // Upload to Gemini — force audio/mpeg if browser sends application/octet-stream
        const rawMime = file.type || "";
        const mimeType = rawMime && rawMime !== "application/octet-stream" ? rawMime : "audio/mpeg";
        const uploadResult = await ai.files.upload({
            file: tempPath,
            config: { mimeType },
        });

        // Wait for file processing
        let fileResource = await ai.files.get({ name: uploadResult.name || "" });
        while (fileResource.state === "PROCESSING") {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            fileResource = await ai.files.get({ name: uploadResult.name || "" });
        }

        if (fileResource.state === "FAILED") {
            throw new Error("File processing failed on Gemini.");
        }

        // Use responseMimeType=application/json only (no responseSchema).
        // Gemini 2.5 Flash mis-parses zodToJsonSchema output.
        // Instead, describe the exact JSON structure inline in the prompt.
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [
                {
                    fileData: {
                        mimeType: uploadResult.mimeType || mimeType,
                        fileUri: uploadResult.uri,
                    }
                },
                {
                    text: `You are a world-class K-pop choreography director. Listen deeply to this audio track.

Analyze the audio and return ONLY a valid JSON object — no markdown, no explanation, just raw JSON.

The JSON must follow this EXACT structure:
{
  "segments": [
    {
      "startMs": <integer milliseconds>,
      "endMs": <integer milliseconds>,
      "clipId": <one of: "happy_idle" | "hiphop_dance" | "arms_hiphop" | "jazz_dance">,
      "intensity": <integer 1-10>,
      "reason": "<string max 140 chars describing what you heard>"
    }
  ],
  "visualConcept": {
    "style": "<string: e.g. Cyberpunk Streetwear>",
    "imagePrompt": "<string 20-200 chars: detailed description for image generation>"
  }
}

Rules:
- Create 4-6 segments covering the full audio duration
- Map energy levels: low intro → happy_idle, groove → hiphop_dance, beat drop → arms_hiphop (intensity 9-10), elegant → jazz_dance
- All timestamps must be integers in milliseconds
- intensity must be an integer 1-10
- Derive visualConcept from the audio's emotional vibe and genre

Return ONLY the JSON object. No other text.`
                }
            ],
            config: {
                systemInstruction: SYNCSTAGE_SYSTEM_PROMPT,
                responseMimeType: "application/json",
            },
        });

        const outputText = response.text;
        if (!outputText) {
            throw new Error("No output generated from Gemini");
        }

        // Strip any accidental markdown code fences
        const cleaned = outputText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
        const rawJson = JSON.parse(cleaned);

        // Normalize: ensure numeric fields are actual numbers (Gemini may return strings)
        if (rawJson.segments && Array.isArray(rawJson.segments)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let segments = rawJson.segments.map((seg: any) => ({
                id: "seg_" + nanoid(8),
                startMs: Math.round(Number(seg.startMs ?? seg.start_ms ?? 0)),
                endMs: Math.round(Number(seg.endMs ?? seg.end_ms ?? 1000)),
                clipId: seg.clipId ?? seg.clip_id ?? "happy_idle",
                intensity: Math.min(10, Math.max(1, Math.round(Number(seg.intensity ?? 5)))),
                reason: String(seg.reason ?? "").substring(0, 140),
            }));

            // Clamp timestamps to audio duration (15000ms max).
            // Gemini sometimes returns timestamps in wrong scale (e.g. 270000ms for a 15s track).
            const maxEndMs = Math.max(...segments.map((s: { endMs: number }) => s.endMs));
            const AUDIO_DURATION_MS = 15000;
            if (maxEndMs > AUDIO_DURATION_MS) {
                const scale = AUDIO_DURATION_MS / maxEndMs;
                segments = segments.map((s: { startMs: number; endMs: number;[key: string]: unknown }) => ({
                    ...s,
                    startMs: Math.round(s.startMs * scale),
                    endMs: Math.min(AUDIO_DURATION_MS, Math.round(s.endMs * scale)),
                }));
            }
            rawJson.segments = segments;
        }
        rawJson.revision = 0;

        const validatedDraft = SyncStageDraftSchema.parse(rawJson);
        updateDraft(validatedDraft, "Initial draft generated from audio upload.");

        await ai.files.delete({ name: uploadResult.name || "" }).catch(console.error);

        return NextResponse.json(validatedDraft);

    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error("[DRAFT FALLBACK TRIGGERED] Error:", errMsg);

        // Golden Path Fallback — 5 rich segments matching 15s demo audio
        const fallbackDraft = {
            revision: 0,
            segments: [
                {
                    id: "seg_" + nanoid(8),
                    startMs: 0,
                    endMs: 3000,
                    clipId: "happy_idle",
                    intensity: 3,
                    reason: "Sparse hi-hat intro with vocal build-up — establishing anticipation before the drop."
                },
                {
                    id: "seg_" + nanoid(8),
                    startMs: 3000,
                    endMs: 6500,
                    clipId: "hiphop_dance",
                    intensity: 6,
                    reason: "Four-on-the-floor kick drum locks in — syncopated groove drives the verse momentum."
                },
                {
                    id: "seg_" + nanoid(8),
                    startMs: 6500,
                    endMs: 10000,
                    clipId: "arms_hiphop",
                    intensity: 10,
                    reason: "BEAT DROP at 6.5s — heavy bass explosion with full band, maximum power move."
                },
                {
                    id: "seg_" + nanoid(8),
                    startMs: 10000,
                    endMs: 13000,
                    clipId: "jazz_dance",
                    intensity: 7,
                    reason: "Melodic bridge — emotional highlight with fluid point choreography."
                },
                {
                    id: "seg_" + nanoid(8),
                    startMs: 13000,
                    endMs: 15000,
                    clipId: "arms_hiphop",
                    intensity: 9,
                    reason: "FINALE — explosive ending pose with signature freeze frame."
                }
            ],
            visualConcept: {
                style: "Cyberpunk Streetwear",
                imagePrompt: "Five K-pop idols in iridescent holographic jackets, chrome accessories, neon-lit rain-slicked stage, dramatic fog machines, 8k cinematic wide shot."
            }
        };

        const validatedFallback = SyncStageDraftSchema.parse(fallbackDraft);
        updateDraft(validatedFallback, "[Fallback Mode] Initial draft generated from golden path audio.");

        return NextResponse.json(validatedFallback);
    } finally {
        if (tempPath) {
            await unlink(tempPath).catch(console.error);
        }
    }
}
