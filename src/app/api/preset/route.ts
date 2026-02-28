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
            endMs: 3000,
            clipId: "happy_idle",
            intensity: 3,
            reason: "Intro — sparse hi-hat builds anticipation before the first drop.",
        },
        {
            id: "preset_02",
            startMs: 3000,
            endMs: 6500,
            clipId: "hiphop_dance",
            intensity: 6,
            reason: "Verse groove — syncopated kick + snare pattern locks the rhythm in.",
        },
        {
            id: "preset_03",
            startMs: 6500,
            endMs: 10000,
            clipId: "arms_hiphop",
            intensity: 10,
            reason: "BEAT DROP — full bass explosion, maximum power arms, crowd ignition.",
        },
        {
            id: "preset_04",
            startMs: 10000,
            endMs: 13000,
            clipId: "jazz_dance",
            intensity: 7,
            reason: "Point choreo — melodic highlight with precise, elegant signature move.",
        },
        {
            id: "preset_05",
            startMs: 13000,
            endMs: 15000,
            clipId: "arms_hiphop",
            intensity: 9,
            reason: "FINALE — explosive ending pose, freeze frame, curtain call.",
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
