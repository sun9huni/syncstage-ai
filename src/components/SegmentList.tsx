"use client";

import React from "react";
import { Segment } from "@/lib/schema";

export default function SegmentList({
    segments,
    activeSegmentId
}: {
    segments: Segment[];
    activeSegmentId?: string;
}) {
    if (!segments || segments.length === 0) {
        return <div className="text-neutral-500 italic text-xs h-full flex items-center justify-center">No segments generated yet.</div>;
    }

    const formatTime = (ms: number) => (ms / 1000).toFixed(1) + "s";

    return (
        <div className="flex flex-col gap-2 overflow-y-auto w-full h-full pr-1">
            {segments.map((seg, idx) => {
                const isActive = activeSegmentId === seg.id;
                return (
                    <div
                        key={seg.id || idx}
                        className={`p-3 rounded border text-xs flex flex-col gap-1 transition-all duration-300 ${isActive
                                ? "bg-fuchsia-900/40 border-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.2)]"
                                : "bg-neutral-800/50 border-neutral-700 opacity-70 hover:opacity-100"
                            }`}
                    >
                        <div className="flex justify-between items-center font-mono">
                            <span className={isActive ? "text-fuchsia-400 font-bold" : "text-neutral-400"}>
                                [{formatTime(seg.startMs)} - {formatTime(seg.endMs)}]
                            </span>
                            <span className="bg-black/50 px-2 py-0.5 rounded text-[10px] text-neutral-300 font-bold border border-neutral-800">
                                Int: {seg.intensity}/10
                            </span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                            <span className={`uppercase font-bold tracking-widest ${isActive ? 'text-white' : 'text-neutral-300'}`}>
                                {seg.clipId.replace('_', ' ')}
                            </span>
                        </div>
                        <div className="text-[10px] text-neutral-500 italic mt-1 leading-relaxed">
                            "{seg.reason}"
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
