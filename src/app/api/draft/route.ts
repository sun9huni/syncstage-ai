import { NextResponse } from "next/server";

export const maxDuration = 60; // Allow up to 60s for Gemini Files API + multimodal inference
import { GoogleGenAI } from "@google/genai";
import { SyncStageDraftSchema, SyncStageDraft } from "@/lib/schema";
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

        // Upload to Gemini
        const uploadResult = await ai.files.upload({
            file: tempPath,
            config: { mimeType: file.type || "audio/mp3" },
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

        const schema = zodToJsonSchema(SyncStageDraftSchema as any);

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: [
                {
                    fileData: {
                        mimeType: uploadResult.mimeType || "audio/mp3",
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
                responseSchema: schema as any,
            },
        });

        const outputText = response.text;
        if (!outputText) {
            throw new Error("No output generated from Gemini");
        }

        // Parse and validate the response
        const rawJson = JSON.parse(outputText);

        // Add nanoid to segments
        if (rawJson.segments && Array.isArray(rawJson.segments)) {
            rawJson.segments.forEach((seg: any) => {
                seg.id = "seg_" + nanoid(8);
            });
        }
        rawJson.revision = 0;

        const validatedDraft = SyncStageDraftSchema.parse(rawJson);

        // Update in-memory state
        updateDraft(validatedDraft, "Initial draft generated from audio upload.");

        // Cleanup the remote file (optional)
        await ai.files.delete({ name: uploadResult.name || "" }).catch(console.error);

        return NextResponse.json(validatedDraft);
    } catch (error: any) {
        console.error("Draft API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        // Cleanup local temp file
        if (tempPath) {
            await unlink(tempPath).catch(console.error);
        }
    }
}
