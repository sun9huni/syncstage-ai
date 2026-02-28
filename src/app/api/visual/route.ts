import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getState } from "@/lib/store";
import { getVisualPrompt } from "@/lib/prompts";

const apiKey = process.env.GEMINI_API_KEY || "dummy-key-for-build";
const ai = new GoogleGenAI({ apiKey });

export async function POST(req: Request) {
    try {
        const currentState = getState();
        if (!currentState.draft) {
            return NextResponse.json({ error: "No draft available" }, { status: 400 });
        }

        const concept = currentState.draft.visualConcept;

        // In a real K-pop production, this might call Imagen on Vertex AI or Nano Banana.
        // For the hackathon demo, we use Gemini to "refine" the prompt and return a high-quality placeholder.
        const prompt = getVisualPrompt(concept.style, concept.imagePrompt);

        let description = `${concept.style} — ${concept.imagePrompt.substring(0, 80)}...`;
        try {
            const response = await ai.models.generateContent({
                model: "gemini-2.0-flash",
                contents: prompt,
            });
            description = response.text || description;
        } catch (aiErr: any) {
            // Graceful degradation: use concept text if Gemini is unavailable
            console.warn("Gemini visual generation skipped:", aiErr.message);
        }

        // Style-based image mapping for demo variety
        const styleImageMap: Record<string, string> = {
            cyberpunk:  "photo-1558618666-fcd25c85cd64",
            cyber:      "photo-1558618666-fcd25c85cd64",
            y2k:        "photo-1571019613454-1cb2f99b2d8b",
            street:     "photo-1571019613454-1cb2f99b2d8b",
            royal:      "photo-1518611012118-696072aa579a",
            elegant:    "photo-1518611012118-696072aa579a",
            futuristic: "photo-1527525443983-6e60c75fff46",
            dark:       "photo-1527525443983-6e60c75fff46",
            neon:       "photo-1549298916-b41d501d3772",
            default:    "photo-1546707012-c51841079176",
        };

        const styleLower = concept.style.toLowerCase();
        const matchedKey = Object.keys(styleImageMap).find(k => styleLower.includes(k)) || "default";
        const photoId = styleImageMap[matchedKey];
        const mockImageUrl = `https://images.unsplash.com/${photoId}?q=80&w=1000&auto=format&fit=crop`;

        return NextResponse.json({
            success: true,
            imageUrl: mockImageUrl,
            description: description
        });

    } catch (error: any) {
        console.error("Visual API Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
