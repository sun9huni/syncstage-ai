export function getUnsplashImageForStyle(style: string): string {
    const s = style ? style.toLowerCase() : "";

    // Y2K / Cyberpunk / Streetwear / Futuristic / Royal / Dark / etc.
    if (s.includes("cyberpunk") || s.includes("futuristic") || s.includes("neon") || s.includes("sci-fi")) {
        // Futuristic/cyberpunk neon lighting
        return "https://images.unsplash.com/photo-1546707012-c51841079176?q=80&w=1000&auto=format&fit=crop";
    }
    if (s.includes("y2k") || s.includes("street") || s.includes("hiphop") || s.includes("urban")) {
        // Street/urban dance vibe
        return "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1000&auto=format&fit=crop";
    }
    if (s.includes("dark") || s.includes("glam") || s.includes("goth") || s.includes("heavy")) {
        // Dark/glam stage
        return "https://images.unsplash.com/photo-1493225457124-a1a2a5f5f4a6?q=80&w=1000&auto=format&fit=crop";
    }
    if (s.includes("royal") || s.includes("elegant") || s.includes("preppy") || s.includes("classic")) {
        // Royal/elegant theater
        return "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1000&auto=format&fit=crop";
    }

    // Default High-quality Stage/Concert Vibe
    return "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=1000&auto=format&fit=crop";
}
