import { SyncStageDraft } from "./schema";

export type StateDiff = {
    timestamp: string;
    description: string;
    patchDetails?: unknown;
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
            endMs: 3000,
            clipId: "happy_idle",
            intensity: 3,
            reason: "Intro — sparse hi-hat builds anticipation before the first drop."
        },
        {
            id: "seg_02",
            startMs: 3000,
            endMs: 6500,
            clipId: "hiphop_dance",
            intensity: 6,
            reason: "Verse groove — syncopated kick + snare pattern locks the rhythm in."
        },
        {
            id: "seg_03",
            startMs: 6500,
            endMs: 10000,
            clipId: "arms_hiphop",
            intensity: 10,
            reason: "BEAT DROP — full bass explosion, maximum power arms, crowd ignition."
        },
        {
            id: "seg_04",
            startMs: 10000,
            endMs: 13000,
            clipId: "jazz_dance",
            intensity: 7,
            reason: "Point choreo — melodic highlight with precise, elegant signature move."
        },
        {
            id: "seg_05",
            startMs: 13000,
            endMs: 15000,
            clipId: "arms_hiphop",
            intensity: 9,
            reason: "FINALE — explosive ending pose, freeze frame, curtain call."
        }
    ],
    visualConcept: {
        style: "Cyberpunk Streetwear",
        imagePrompt: "Five K-pop idols in iridescent holographic jackets and chrome accessories on a neon-lit rain-slicked stage, dramatic fog, 8k cinematic."
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

export function updateDraft(draft: SyncStageDraft, diffMessage: string, details?: unknown) {
    globalState.draft = draft;
    globalState.diffHistory.push({
        timestamp: new Date().toISOString(),
        description: diffMessage,
        patchDetails: details,
    });
}
