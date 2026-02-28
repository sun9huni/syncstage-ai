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

        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
        });
        const description = response.text || "A stunning K-pop stage visual.";

        // Mocking the image result for the demo. 
        // We'll use a high-quality Unsplash image that matches a "Cyberpunk K-pop" or "Stage" vibe.
        const mockImageUrl = `https://images.unsplash.com/photo-1546707012-c51841079176?q=80&w=1000&auto=format&fit=crop`;

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
