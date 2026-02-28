"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import { SyncStageDraft } from "@/lib/schema";

export default function WaveformTimeline({ draft, audioUrl, onTimeUpdate }: {
    draft: SyncStageDraft | null;
    audioUrl: string | null;
    onTimeUpdate: (ms: number) => void;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const regionsPluginRef = useRef<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Initialize wavesurfer
    useEffect(() => {
        if (!containerRef.current || !audioUrl) return;

        regionsPluginRef.current = RegionsPlugin.create();

        wavesurferRef.current = WaveSurfer.create({
            container: containerRef.current,
            waveColor: "#4f46e5", // Indigo 600
            progressColor: "#818cf8", // Indigo 400
            cursorColor: "#f59e0b", // Amber 500
            url: audioUrl,
            height: 80,
            barWidth: 2,
            barGap: 3,
            plugins: [regionsPluginRef.current],
        });

        // 🔥 Single Source of Truth: Wavesurfer dictates the time
        const handleTimeUpdate = () => {
            if (wavesurferRef.current) {
                onTimeUpdate(wavesurferRef.current.getCurrentTime() * 1000);
            }
        };

        wavesurferRef.current.on('timeupdate', handleTimeUpdate);
        wavesurferRef.current.on('play', () => setIsPlaying(true));
        wavesurferRef.current.on('pause', () => setIsPlaying(false));

        // Ensure seek also updates the time immediately
        wavesurferRef.current.on('interaction', handleTimeUpdate);

        return () => {
            wavesurferRef.current?.destroy();
        };
    }, [audioUrl]);

    // Update regions when draft changes
    useEffect(() => {
        if (!draft || !regionsPluginRef.current) return;

        regionsPluginRef.current.clearRegions();

        draft.segments.forEach((seg, idx) => {
            regionsPluginRef.current.addRegion({
                id: seg.id,
                start: seg.startMs / 1000,
                end: seg.endMs / 1000,
                content: seg.clipId,
                color: idx % 2 === 0 ? "rgba(79, 70, 229, 0.2)" : "rgba(129, 140, 248, 0.2)",
                drag: false,
                resize: false,
            });
        });

    }, [draft]);

    const togglePlay = () => {
        wavesurferRef.current?.playPause();
    };

    return (
        <div className="w-full flex-1 flex flex-col justify-center">
            <div className="relative group">
                <div
                    ref={containerRef}
                    className="w-full bg-neutral-900 rounded-lg border border-neutral-800 shadow-2xl overflow-hidden"
                />
                {/* Visual playback indicator */}
                {!draft && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] pointer-events-none">
                        <span className="text-xs text-neutral-400 uppercase tracking-widest">Upload Audio to Start</span>
                    </div>
                )}
            </div>

            <div className="mt-6 flex justify-center items-center gap-8">
                <div className="text-[10px] font-mono text-neutral-500 w-16 text-right">
                    {wavesurferRef.current ? wavesurferRef.current.getCurrentTime().toFixed(2) : "0.00"}s
                </div>

                <button
                    onClick={togglePlay}
                    disabled={!draft}
                    className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all active:scale-90 disabled:opacity-30 disabled:shadow-none"
                >
                    {isPlaying ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                    ) : (
                        <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    )}
                </button>

                <div className="text-[10px] font-mono text-neutral-500 w-16">
                    {wavesurferRef.current ? wavesurferRef.current.getDuration().toFixed(2) : "0.00"}s
                </div>
            </div>
        </div>
    );
}
