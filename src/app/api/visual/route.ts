import { NextResponse } from "next/server";
import { GoogleGenAI, PersonGeneration } from "@google/genai";
import { getState } from "@/lib/store";

export const maxDuration = 60;

const apiKey = process.env.GEMINI_API_KEY || "dummy-key-for-build";
const ai = new GoogleGenAI({ apiKey });

// Curated Unsplash fallback images per style keyword
const styleImageMap: Record<string, string> = {
    cyberpunk: "photo-1558618666-fcd25c85cd64",
    cyber: "photo-1558618666-fcd25c85cd64",
    y2k: "photo-1571019613454-1cb2f99b2d8b",
    street: "photo-1571019613454-1cb2f99b2d8b",
    royal: "photo-1518611012118-696072aa579a",
    elegant: "photo-1518611012118-696072aa579a",
    futuristic: "photo-1527525443983-6e60c75fff46",
    dark: "photo-1527525443983-6e60c75fff46",
    neon: "photo-1549298916-b41d501d3772",
    default: "photo-1546707012-c51841079176",
};

function getFallbackImageUrl(style: string): string {
    const styleLower = style.toLowerCase();
    const key = Object.keys(styleImageMap).find(k => styleLower.includes(k)) || "default";
    return `https://images.unsplash.com/${styleImageMap[key]}?q=80&w=800&auto=format&fit=crop&ar=3:4`;
}

export async function POST() {
    const currentState = getState();
    if (!currentState.draft) {
        return NextResponse.json({ error: "No draft available" }, { status: 400 });
    }

    const concept = currentState.draft.visualConcept;
    const fallbackUrl = getFallbackImageUrl(concept.style);

    // --- Attempt Imagen 3 image generation ---
    const imagePromptFull = `K-pop idol fashion editorial photo, ${concept.imagePrompt} Professional studio lighting, 8k, magazine quality, full body shot, 3:4 portrait.`;

    try {
        const response = await ai.models.generateImages({
            model: "imagen-3.0-generate-002",
            prompt: imagePromptFull,
            config: {
                numberOfImages: 1,
                aspectRatio: "3:4",
                personGeneration: PersonGeneration.ALLOW_ADULT,
            },
        });

        const base64 = response.generatedImages?.[0]?.image?.imageBytes;
        if (base64) {
            const dataUrl = `data:image/png;base64,${base64}`;
            return NextResponse.json({
                success: true,
                imageUrl: dataUrl,
                description: `${concept.style} — ${concept.imagePrompt.substring(0, 100)}`,
                source: "imagen-3",
                style: concept.style,
            });
        }
    } catch (imgErr: unknown) {
        console.warn("Imagen 3 generation failed, using fallback:", (imgErr as Error).message);
    }

    // --- Fallback: Unsplash + Gemini text description ---
    let description = `${concept.style} — ${concept.imagePrompt.substring(0, 80)}...`;
    try {
        const textResp = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: `Write one vivid sentence describing this K-pop stage concept for a wardrobe mood board: "${concept.style}, ${concept.imagePrompt.substring(0, 120)}"`,
        });
        description = textResp.text || description;
    } catch {
        // silent fallback
    }

    return NextResponse.json({
        success: true,
        imageUrl: fallbackUrl,
        description,
        source: "fallback",
        style: concept.style,
    });
}
