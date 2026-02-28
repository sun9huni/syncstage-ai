import { SyncStageDraft } from "./schema";

export type StateDiff = {
    timestamp: string;
    description: string;
    patchDetails?: any;
};

export type AppState = {
    draft: SyncStageDraft | null;
    diffHistory: StateDiff[];
};

const initialDraft: SyncStageDraft = {
    revision: 0,
    segments: [
        {
            id: "seg_01",
            startMs: 0.0,
            endMs: 5000.0,
            clipId: "idle_bounce",
            intensity: 3,
            reason: "Intro sequence with light rhythm."
        },
        {
            id: "seg_02",
            startMs: 5000.0,
            endMs: 15000.0,
            clipId: "poppin_heavy",
            intensity: 9,
            reason: "Main hook with high energy beats."
        }
    ],
    visualConcept: {
        style: "Y2K Streetwear",
        imagePrompt: "A group of K-pop idols wearing baggy cargo pants and neon crop tops on a futuristic urban street stage, 8k resolution."
    }
};

// Extremely simple in-memory store for Hackathon purpose
let globalState: AppState = {
    draft: initialDraft,
    diffHistory: [{ timestamp: new Date().toISOString(), description: "Loaded initial mock data." }],
};

export function getState() {
    return globalState;
}

export function setState(newState: AppState) {
    globalState = newState;
}

export function updateDraft(draft: SyncStageDraft, diffMessage: string, details?: any) {
    globalState.draft = draft;
    globalState.diffHistory.push({
        timestamp: new Date().toISOString(),
        description: diffMessage,
        patchDetails: details,
    });
}
