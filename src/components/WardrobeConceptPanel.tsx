"use client";

interface WardrobeConceptPanelProps {
    imageUrl: string | null;
    styleName: string | null;
    description: string | null;
    source: string | null;
    isLoading: boolean;
    onGenerate: () => void;
    onRegenerate: () => void;
    hasDraft: boolean;
}

const SOURCE_CONFIG: Record<string, { label: string; gradient: string; text: string; dot: string }> = {
    "imagen-4": {
        label: "✦ Imagen 4",
        gradient: "from-blue-600 to-violet-600",
        text: "text-violet-200",
        dot: "bg-violet-400",
    },
    "imagen-3": {
        label: "✦ Imagen 3",
        gradient: "from-blue-600 to-violet-600",
        text: "text-violet-200",
        dot: "bg-violet-400",
    },
    "gemini-2.5-flash": {
        label: "✦ Gemini 2.5",
        gradient: "from-fuchsia-600 to-pink-600",
        text: "text-pink-200",
        dot: "bg-pink-400",
    },
    "gemini-2.0-flash": {
        label: "✦ Gemini",
        gradient: "from-fuchsia-600 to-pink-600",
        text: "text-pink-200",
        dot: "bg-pink-400",
    },
    fallback: {
        label: "◈ Style Mapped",
        gradient: "from-neutral-700 to-neutral-600",
        text: "text-neutral-300",
        dot: "bg-neutral-500",
    },
};

export default function WardrobeConceptPanel({
    imageUrl,
    styleName,
    description,
    source,
    isLoading,
    onGenerate,
    onRegenerate,
    hasDraft,
}: WardrobeConceptPanelProps) {
    const src = source ? (SOURCE_CONFIG[source] ?? SOURCE_CONFIG.fallback) : null;

    return (
        <div className="flex flex-col w-full h-full bg-neutral-900 border border-neutral-700 rounded-xl overflow-hidden shadow-2xl">
            {/* Panel Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-neutral-800 shrink-0">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                    👗 Stage Wardrobe
                </h3>
                {styleName && (
                    <span className="text-[10px] px-2 py-1 bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 rounded-full font-mono truncate max-w-[120px]">
                        {styleName}
                    </span>
                )}
            </div>

            {/* Image Area — forced 3:4 aspect ratio */}
            <div className="relative w-full" style={{ aspectRatio: "3/4" }}>

                {/* === SKELETON LOADING === */}
                {isLoading && (
                    <div className="absolute inset-0 bg-neutral-800 flex flex-col items-center justify-center gap-3">
                        {/* Shimmer bars */}
                        <div className="w-full h-full absolute inset-0 overflow-hidden">
                            <div
                                className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite]"
                                style={{
                                    background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.12), transparent)",
                                }}
                            />
                        </div>
                        <div className="relative z-10 flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-[3px] border-violet-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-[11px] text-violet-400 font-medium tracking-wide text-center px-4">
                                AI가 무대 의상 콘셉트를<br />
                                <span className="text-violet-300">스케치하는 중...</span>
                            </p>
                        </div>
                    </div>
                )}

                {/* === IMAGE LOADED === */}
                {!isLoading && imageUrl && (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={imageUrl}
                            alt={styleName || "Wardrobe Concept"}
                            className="w-full h-full object-cover"
                        />
                        {/* Bottom gradient overlay */}
                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/95 via-black/60 to-transparent pt-16 px-3 pb-3">
                            {styleName && (
                                <>
                                    <p className="text-[9px] text-neutral-400 uppercase tracking-[0.2em] mb-0.5">
                                        Concept Style
                                    </p>
                                    <p className="text-sm font-bold text-white leading-tight drop-shadow-lg">
                                        {styleName}
                                    </p>
                                </>
                            )}
                        </div>
                        {/* Source badge — top right */}
                        {src && (
                            <div className={`absolute top-2 right-2 flex items-center gap-1 text-[9px] px-2 py-1 rounded-full bg-gradient-to-r ${src.gradient} ${src.text} font-mono shadow-lg`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${src.dot} animate-pulse`} />
                                {src.label}
                            </div>
                        )}
                        {/* Regenerate button — top left */}
                        <button
                            onClick={onRegenerate}
                            className="absolute top-2 left-2 text-[9px] bg-black/60 hover:bg-black/80 backdrop-blur-md text-white px-2 py-1 rounded border border-white/20 transition-colors"
                        >
                            ↺ Regen
                        </button>
                    </>
                )}

                {/* === EMPTY STATE === */}
                {!isLoading && !imageUrl && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-4 text-center">
                        <div className="text-3xl opacity-20">🎨</div>
                        {hasDraft ? (
                            <button
                                onClick={onGenerate}
                                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-full text-[11px] font-bold tracking-widest uppercase transition-all shadow-lg shadow-violet-900/40"
                            >
                                Visualize Concept
                            </button>
                        ) : (
                            <p className="text-[11px] text-neutral-600 italic">
                                Load a draft to generate visuals
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Description Footer */}
            {!isLoading && description && (
                <div className="px-3 py-2 border-t border-neutral-800 shrink-0">
                    <p className="text-[10px] text-neutral-500 leading-relaxed line-clamp-2">
                        {description}
                    </p>
                </div>
            )}
        </div>
    );
}
