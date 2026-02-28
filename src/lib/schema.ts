import { z } from "zod";

export const moveTags = [
  "idle_bounce",
  "hiphop_groove",
  "poppin_heavy",
  "wave_fluid",
  "y2k_point"
] as const;

export const SegmentSchema = z.object({
  id: z.string().optional(), // assigned by backend using nanoid
  startMs: z.number().min(0),
  endMs: z.number().min(1),
  clipId: z.enum(moveTags),
  intensity: z.number().min(1).max(10),
  reason: z.string().min(3).max(140),
});

export type Segment = z.infer<typeof SegmentSchema>;

export const VisualConceptSchema = z.object({
  style: z.string().min(3),
  imagePrompt: z.string().min(10).max(600),
});

export type VisualConcept = z.infer<typeof VisualConceptSchema>;

export const SyncStageDraftSchema = z.object({
  revision: z.number().default(0),
  segments: z.array(SegmentSchema).min(1).max(10),
  visualConcept: VisualConceptSchema,
  lastAction: z.string().optional(),
});

export type SyncStageDraft = z.infer<typeof SyncStageDraftSchema>;
