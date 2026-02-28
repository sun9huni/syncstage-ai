import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { getState, updateDraft } from "@/lib/store";
import { moveTags, SyncStageDraft } from "@/lib/schema";
import { getPatchPrompt } from "@/lib/prompts";

const apiKey = process.env.GEMINI_API_KEY || "dummy-key-for-build";
const ai = new GoogleGenAI({ apiKey });

const tools = [{
    functionDeclarations: [
        {
            name: "update_segment",
            description: "Updates properties (move, intensity, reason) of a choreo segment with a specific ID.",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "Unique ID of the segment to update" },
                    clipId: { type: Type.STRING, enum: [...moveTags], description: "New animation ID" },
                    intensity: { type: Type.INTEGER, description: "Intensity level between 1-10" },
                    reason: { type: Type.STRING, description: "Short justification for the change" }
                },
                required: ["id"],
            },
        },
        {
            name: "update_style",
            description: "Updates the overall stage wardrobe concept and image generation prompt.",
            parameters: {
                type: Type.OBJECT,
                properties: {
                    style: { type: Type.STRING, description: "New style name (e.g. Cyberpunk, Royal, Street)" },
                    imagePrompt: { type: Type.STRING, description: "Detailed description for Nano Banana image generation" },
                },
                required: ["style", "imagePrompt"],
            },
        },
    ],
}];

export async function POST(req: Request) {
    // Parse body OUTSIDE try so fallback can access instruction
    const body = await req.json().catch(() => ({}));
    const { instruction, revision } = body;

    if (!instruction) {
        return NextResponse.json({ error: "No instruction provided" }, { status: 400 });
    }

    const currentState = getState();
    if (!currentState.draft) {
        return NextResponse.json({ error: "No draft available to patch" }, { status: 400 });
    }

    // Idempotency / Conflict checking
    if (typeof revision === "number" && revision !== currentState.draft.revision) {
        return NextResponse.json({
            error: "Revision Conflict: The timeline has been updated by another action.",
            currentRevision: currentState.draft.revision
        }, { status: 409 });
    }

    try {

        const chatArgs: any = {
            model: "gemini-2.0-flash",
            config: {
                tools: tools as any,
                systemInstruction: `You are the AI A&R Director for SyncStage. 
                Your job is to refine the K-pop choreography and visual concept based on user feedback.
                
                CRITICAL RULES:
                1. You can call MULTIPLE tools in one turn to fulfill a complex request.
                2. If the user wants a general change (e.g., "Make it more intense"), update ALL relevant segments.
                3. Always keep the 'clipId' within the allowed enum: ${moveTags.join(', ')}.
                4. Be decisive and creative. Do not just repeat the user's words.`
            },
        };

        const chat = ai.chats.create(chatArgs);

        const message = `
User Instruction: "${instruction}"
Current Revision: ${currentState.draft.revision}
Current Timeline: ${JSON.stringify(currentState.draft.segments)}
Current Visual Concept: ${JSON.stringify(currentState.draft.visualConcept)}

Apply the necessary changes using the tools provided.
`;

        const response = await chat.sendMessage({ message });

        let updatedDraft: SyncStageDraft = JSON.parse(JSON.stringify(currentState.draft));
        let patchCount = 0;
        let changeSummary = [];

        // Handle MULTIPLE function calls (Parallel Tool Use)
        if (response.functionCalls && response.functionCalls.length > 0) {
            for (const call of response.functionCalls) {
                if (call.name === "update_segment") {
                    const args = call.args as any;
                    updatedDraft.segments = updatedDraft.segments.map(seg => {
                        if (seg.id === args.id) {
                            patchCount++;
                            return {
                                ...seg,
                                clipId: args.clipId || seg.clipId,
                                intensity: args.intensity || seg.intensity,
                                reason: args.reason || seg.reason,
                            };
                        }
                        return seg;
                    });
                    changeSummary.push(`Segment ${args.id} refined`);
                } else if (call.name === "update_style") {
                    const args = call.args as any;
                    updatedDraft.visualConcept = { ...updatedDraft.visualConcept, ...args };
                    patchCount++;
                    changeSummary.push(`Style updated to ${args.style}`);
                }
            }

            if (patchCount > 0) {
                updatedDraft.revision += 1;
                updatedDraft.lastAction = instruction;
                const finalActionStr = changeSummary.join(", ");
                updateDraft(updatedDraft, instruction, { toolsUsed: changeSummary });
            }
        }

        return NextResponse.json({
            success: true,
            draft: updatedDraft,
            message: response.text || (patchCount > 0 ? `Applied ${patchCount} changes.` : "No changes needed."),
        });

    } catch (error: any) {
        console.error("Patch API Error:", error);

        // Graceful degradation: keyword-based fallback when Gemini is unavailable
        const fallbackDraft: SyncStageDraft = JSON.parse(JSON.stringify(currentState.draft));
        const instLower = instruction.toLowerCase();

        if (instLower.includes("intense") || instLower.includes("powerful") || instLower.includes("강하") || instLower.includes("강렬") || instLower.includes("파워")) {
            fallbackDraft.segments = fallbackDraft.segments.map(s => ({ ...s, intensity: Math.min(10, s.intensity + 2) }));
        } else if (instLower.includes("calm") || instLower.includes("soft") || instLower.includes("부드") || instLower.includes("잔잔")) {
            fallbackDraft.segments = fallbackDraft.segments.map(s => ({ ...s, intensity: Math.max(1, s.intensity - 2) }));
        } else if (instLower.includes("hip") || instLower.includes("groove") || instLower.includes("힙합")) {
            fallbackDraft.segments = fallbackDraft.segments.map(s => ({ ...s, clipId: "hiphop_dance" as any }));
        } else if (instLower.includes("pop") || instLower.includes("팝핀") || instLower.includes("브레이크")) {
            fallbackDraft.segments = fallbackDraft.segments.map(s => ({ ...s, clipId: "arms_hiphop" as any }));
        } else if (instLower.includes("cyber") || instLower.includes("dark") || instLower.includes("어둡") || instLower.includes("사이버")) {
            fallbackDraft.visualConcept = { style: "Cyberpunk Dark", imagePrompt: "K-pop performers in black leather and chrome neon accents on a dark futuristic stage with laser beams, 8k cinematic." };
        } else if (instLower.includes("y2k") || instLower.includes("포인트") || instLower.includes("재즈")) {
            fallbackDraft.segments = fallbackDraft.segments.map((s, i) => i === fallbackDraft.segments.length - 1 ? { ...s, clipId: "jazz_dance" as any, intensity: 9 } : s);
        } else {
            fallbackDraft.segments[0] = { ...fallbackDraft.segments[0], clipId: "arms_hiphop" as any, intensity: Math.min(10, fallbackDraft.segments[0].intensity + 1) };
        }

        fallbackDraft.revision += 1;
        fallbackDraft.lastAction = instruction;
        updateDraft(fallbackDraft, `[Fallback] ${instruction}`, { fallback: true });

        return NextResponse.json({
            success: true,
            draft: fallbackDraft,
            message: `Applied pattern-based patch (AI offline fallback).`,
        });
    }
}
