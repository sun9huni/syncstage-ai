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
            startMs: 0,
            endMs: 8000,
            clipId: "idle_bounce",
            intensity: 3,
            reason: "Soft intro — minimal percussion, establishing stage presence."
        },
        {
            id: "seg_02",
            startMs: 8000,
            endMs: 20000,
            clipId: "hiphop_groove",
            intensity: 6,
            reason: "Pre-chorus builds momentum with syncopated groove."
        },
        {
            id: "seg_03",
            startMs: 20000,
            endMs: 34000,
            clipId: "poppin_heavy",
            intensity: 9,
            reason: "Main hook — full bass drop, maximum energy, crowd moment."
        },
        {
            id: "seg_04",
            startMs: 34000,
            endMs: 46000,
            clipId: "wave_fluid",
            intensity: 5,
            reason: "Bridge — melodic interlude with smooth fluid transitions."
        },
        {
            id: "seg_05",
            startMs: 46000,
            endMs: 60000,
            clipId: "y2k_point",
            intensity: 8,
            reason: "Final chorus — Y2K signature point move, iconic ending pose."
        }
    ],
    visualConcept: {
        style: "Cyberpunk Streetwear",
        imagePrompt: "Five K-pop performers in iridescent holographic jackets and chrome accessories on a neon-lit rain-slicked stage, dramatic fog, 8k cinematic."
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
