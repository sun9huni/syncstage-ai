export type ClipStyle = {
    color: string;
    emissive: string;
    scaleY: number;
    description: string;
};

export const clipStyles: Record<string, ClipStyle> = {
    idle_bounce: {
        color: "#6b21a8",     // Purple 800
        emissive: "#3b0764",  // Purple 950
        scaleY: 1.0,
        description: "기본적인 리듬을 타는 가벼운 바운스 모션"
    },
    hiphop_groove: {
        color: "#1d4ed8",     // Blue 700
        emissive: "#1e3a8a",  // Blue 900
        scaleY: 1.05,
        description: "무게감 있는 힙합 그루브, 중심이 약간 낮아짐"
    },
    poppin_heavy: {
        color: "#d946ef",     // Fuchsia 500
        emissive: "#a21caf",  // Fuchsia 700
        scaleY: 1.15,
        description: "강렬한 비트에 맞춘 짧고 끊어지는 강한 팝핀 모션"
    },
    wave_fluid: {
        color: "#0891b2",     // Cyan 600
        emissive: "#164e63",  // Cyan 900
        scaleY: 0.95,
        description: "전신을 부드럽게 사용하는 웨이브, 실루엣이 유연함"
    },
    y2k_point: {
        color: "#f59e0b",     // Amber 500
        emissive: "#92400e",  // Amber 800
        scaleY: 1.1,
        description: "시선을 사로잡는 Y2K 아이돌 풍의 화려한 포인트 안무"
    }
};

export function getStyleForClip(clipId: string): ClipStyle {
    return clipStyles[clipId] || clipStyles.idle_bounce;
}
