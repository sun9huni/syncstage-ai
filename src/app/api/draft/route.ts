import { NextResponse } from "next/server";

export const maxDuration = 60; // Allow up to 60s for Gemini Files API + multimodal inference
import { GoogleGenAI } from "@google/genai";
import { SyncStageDraftSchema, SegmentSchema } from "@/lib/schema";
import { z } from "zod";
import { updateDraft } from "@/lib/store";
import { zodToJsonSchema } from "zod-to-json-schema";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import os from "os";
import { nanoid } from "nanoid";
import { SYNCSTAGE_SYSTEM_PROMPT } from "@/lib/prompts";

// Ensure we have a valid API Key
const apiKey = process.env.GEMINI_API_KEY || "dummy-key-for-build";
const ai = new GoogleGenAI({ apiKey });

export async function POST(req: Request) {
    let tempPath: string | null = null;

    try {
        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Write file to a temporary location for Gemini Files API upload
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

        // We need to wait for the file to be processed if it's audio/video
        let fileResource = await ai.files.get({ name: uploadResult.name || "" });
        while (fileResource.state === "PROCESSING") {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            fileResource = await ai.files.get({ name: uploadResult.name || "" });
        }

        if (fileResource.state === "FAILED") {
            throw new Error("File processing failed on Gemini.");
        }

        const systemInstruction = SYNCSTAGE_SYSTEM_PROMPT;

        // Schema WITHOUT id — Gemini 2.5 Flash mis-handles optional string fields.
        // We add id server-side after receiving the response.
        const GeminiResponseSchema = z.object({
            segments: z.array(SegmentSchema.omit({ id: true })).min(1).max(10),
            visualConcept: SyncStageDraftSchema.shape.visualConcept,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const schema = zodToJsonSchema(GeminiResponseSchema as any);

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    fileData: {
                        mimeType: uploadResult.mimeType || mimeType,
                        fileUri: uploadResult.uri,
                    }
                },
                {
                    text: `Listen deeply to this audio track using your native multimodal audio understanding.

1. FEEL the drum beats, bass lines, and energy arcs from start to finish.
2. FIND the exact millisecond timestamps where the energy shifts — especially the Beat Drop moment(s).
3. BUILD a choreography timeline (segments) that maps each section's energy to the correct dance move:
   - Calm intro → happy_idle
   - Groove verse → hiphop_dance  
   - Beat drop / maximum energy → arms_hiphop (intensity 9–10)
   - Point choreography / elegant section → jazz_dance
4. DERIVE the stage wardrobe concept from the audio's character and vibe.
5. WRITE specific reasons that describe exactly what you heard in each segment.

Return the SyncStageDraft JSON. Make it feel like a real K-pop production director made it.`
                }
            ],
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                responseSchema: schema as any,
            },
        });

        const outputText = response.text;
        if (!outputText) {
            throw new Error("No output generated from Gemini");
        }

        // Parse and validate the response
        const rawJson = JSON.parse(outputText);
        console.log("[DRAFT] Gemini raw response (first 300 chars):", JSON.stringify(rawJson).substring(0, 300));

        // Add id + coerce numeric fields — Gemini 2.5 Flash may return numbers as strings
        if (rawJson.segments && Array.isArray(rawJson.segments)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            rawJson.segments = rawJson.segments.map((seg: any) => ({
                ...(typeof seg === "object" && seg !== null ? seg : {}),
                id: "seg_" + nanoid(8),
                startMs: Number(seg.startMs),
                endMs: Number(seg.endMs),
                intensity: Math.round(Number(seg.intensity)),
            }));
        }
        rawJson.revision = 0;

        const validatedDraft = SyncStageDraftSchema.parse(rawJson);

        // Update in-memory state
        updateDraft(validatedDraft, "Initial draft generated from audio upload.");

        // Cleanup the remote file (optional)
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

        return NextResponse.json({ ...validatedFallback, _fallback: true, _error: errMsg });
    } finally {
        // Cleanup local temp file
        if (tempPath) {
            await unlink(tempPath).catch(console.error);
        }
    }
}
