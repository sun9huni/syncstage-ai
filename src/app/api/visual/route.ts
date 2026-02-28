import { NextResponse } from "next/server";
import { GoogleGenAI, PersonGeneration } from "@google/genai";
import { getState } from "@/lib/store";

export const maxDuration = 60;

const apiKey = process.env.GEMINI_API_KEY || "dummy-key-for-build";
const ai = new GoogleGenAI({ apiKey });

// Curated high-quality stage/fashion Unsplash photos per style
// Multiple options per category for variety on Regen clicks
const styleFallbackPool: Record<string, string[]> = {
    cyberpunk: [
        "photo-1614680376593-902f74cf0d41", // neon-lit urban night
        "photo-1550745165-9bc0b252726f", // cyberpunk cityscape
        "photo-1633356122102-3fe601e05bd2", // neon reflections
    ],
    street: [
        "photo-1547153760-18fc86324498", // street fashion
        "photo-1509631179647-0177331693ae", // urban dance
        "photo-1574680096145-d05b474e2155", // street style
    ],
    y2k: [
        "photo-1598387993441-a364f854c3e1", // colorful pop
        "photo-1558171813-4c088753af8f", // bright stage
        "photo-1516450360452-9312f5e86fc7", // concert lights
    ],
    dark: [
        "photo-1493225457124-a1a2a5f5f4a6", // dark stage
        "photo-1504609773096-104ff2c73ba4", // dramatic lighting
        "photo-1470229722913-7c0e2dbbafd3", // concert atmosphere
    ],
    royal: [
        "photo-1514525253161-7a46d19cd819", // elegant theater
        "photo-1507003211169-0a1dd7228f2d", // dramatic portrait
        "photo-1492684223066-81342ee5ff30", // grand stage
    ],
    neon: [
        "photo-1549298916-b41d501d3772", // neon shoes
        "photo-1557672172-298e090bd0f1", // neon abstract
        "photo-1618005182384-a83a8bd57fbe", // neon art
    ],
    default: [
        "photo-1459749411175-04bf5292ceea", // concert crowd
        "photo-1501386761578-eac5c94b800a", // stage lights
        "photo-1540039155733-5bb30b53aa14", // K-pop concert stage
    ],
};

function getFallbackImageUrl(style: string): string {
    const styleLower = style.toLowerCase();
    const matchedKey = Object.keys(styleFallbackPool).find(k =>
        k !== "default" && styleLower.includes(k)
    ) || "default";
    const pool = styleFallbackPool[matchedKey];
    // Random pick from pool for variety on Regen
    const photoId = pool[Math.floor(Math.random() * pool.length)];
    return `https://images.unsplash.com/${photoId}?q=80&w=800&auto=format&fit=crop`;
}

export async function POST() {
    const currentState = getState();
    if (!currentState.draft) {
        return NextResponse.json({ error: "No draft available" }, { status: 400 });
    }

    const concept = currentState.draft.visualConcept;

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

    // --- Fallback: Unsplash (random from pool) + Gemini text description ---
    const fallbackUrl = getFallbackImageUrl(concept.style);
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
