export type ClipStyle = {
    color: string;
    emissive: string;
    scaleY: number;
    description: string;
};

export const clipStyles: Record<string, ClipStyle> = {
    happy_idle: {
        color: "#6b21a8",     // Purple 800
        emissive: "#3b0764",  // Purple 950
        scaleY: 1.0,
        description: "리듬을 타며 밝게 대기하는 도입부"
    },
    hiphop_dance: {
        color: "#1d4ed8",     // Blue 700
        emissive: "#1e3a8a",  // Blue 900
        scaleY: 1.05,
        description: "비트감이 확실한 벌스(Verse) 구간"
    },
    arms_hiphop: {
        color: "#d946ef",     // Fuchsia 500
        emissive: "#a21caf",  // Fuchsia 700
        scaleY: 1.15,
        description: "상체를 크게 쓰는 파워풀한 브레이크"
    },
    jazz_dance: {
        color: "#f59e0b",     // Amber 500
        emissive: "#92400e",  // Amber 800
        scaleY: 1.1,
        description: "화려하고 선이 고운 포인트 안무"
    }
};

export function getStyleForClip(clipId: string): ClipStyle {
    return clipStyles[clipId] || clipStyles.happy_idle;
}
