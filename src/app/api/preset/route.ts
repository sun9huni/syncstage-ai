import { NextResponse } from "next/server";
import { updateDraft } from "@/lib/store";
import { SyncStageDraft } from "@/lib/schema";

// A rich, hand-crafted demo preset — no API call needed.
// Used as a guaranteed fallback for live demo reliability.
const DEMO_PRESET: SyncStageDraft = {
    revision: 0,
    segments: [
        {
            id: "preset_01",
            startMs: 0,
            endMs: 7500,
            clipId: "happy_idle",
            intensity: 3,
            reason: "Ethereal intro — sparse synth pads, establishing stage tension.",
        },
        {
            id: "preset_02",
            startMs: 7500,
            endMs: 18000,
            clipId: "hiphop_dance",
            intensity: 6,
            reason: "Pre-chorus build — kick pattern locks in, syncopated groove drives momentum.",
        },
        {
            id: "preset_03",
            startMs: 18000,
            endMs: 32000,
            clipId: "arms_hiphop",
            intensity: 10,
            reason: "MAIN HOOK — full bass drop, maximum crowd energy, signature group move.",
        },
        {
            id: "preset_04",
            startMs: 32000,
            endMs: 44000,
            clipId: "jazz_dance",
            intensity: 5,
            reason: "Melodic bridge — emotional peak, fluid wave passes through the line.",
        },
        {
            id: "preset_05",
            startMs: 44000,
            endMs: 60000,
            clipId: "jazz_dance",
            intensity: 9,
            reason: "FINALE — iconic point move, camera freeze, curtain call pose.",
        },
    ],
    visualConcept: {
        style: "Cyberpunk Streetwear",
        imagePrompt:
            "Five K-pop idols in iridescent holographic jackets, chrome accessories, neon-lit rain-slicked stage, dramatic fog machines, stadium crowd, 8k cinematic wide shot.",
    },
    lastAction: "Demo preset loaded",
};

export async function POST() {
    try {
        updateDraft(DEMO_PRESET, "Demo preset loaded — ready for live presentation.");
        return NextResponse.json({ success: true, draft: DEMO_PRESET });
    } catch (error: unknown) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
