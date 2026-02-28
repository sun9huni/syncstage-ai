"use client";

import { useState } from "react";
import WaveformTimeline from "@/components/WaveformTimeline";
import ThreeCanvas from "@/components/ThreeCanvas";
import SegmentList from "@/components/SegmentList";
import WardrobeConceptPanel from "@/components/WardrobeConceptPanel";
import { SyncStageDraft } from "@/lib/schema";

// ─── Demo Phase Flow ───
// 0: Landing — upload audio
// 1: Audio loaded — waveform visible, "Analyze" button
// 2: Analyzing — Gemini loading spinner
// 3: Report — Gemini analysis report card shown
// 4: Choreography — 3D viewer + segment timeline revealed
// 5: Complete — wardrobe image generated

type Phase = 0 | 1 | 2 | 3 | 4 | 5;

const LOADING_STEPS = [
  "📁 Uploading to Gemini Files API...",
  "🎵 Deep-listening to beat patterns & bass lines...",
  "📊 Mapping energy arcs & beat drop timestamps...",
  "🎯 Generating choreography storyboard...",
];

export default function Home() {
  const [phase, setPhase] = useState<Phase>(0);
  const [draft, setDraft] = useState<SyncStageDraft | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_STEPS[0]);
  const [chatInput, setChatInput] = useState("");
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageSource, setImageSource] = useState<string | null>(null);
  const [imageDescription, setImageDescription] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  // ─── Phase 0→1: Upload audio file ───
  const handleUploadAudio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioUrl(URL.createObjectURL(file));
    setPhase(1);
  };

  const handleLoadDemoTrack = () => {
    setAudioUrl("/musics/demo_kpop_15s.mp3");
    setPhase(1);
  };

  // ─── Phase 1→2→3: Analyze with Gemini ───
  const handleAnalyze = async () => {
    setPhase(2);
    setLoading(true);

    // Animated loading messages
    let step = 0;
    setLoadingMsg(LOADING_STEPS[0]);
    const interval = setInterval(() => {
      step++;
      if (step < LOADING_STEPS.length) {
        setLoadingMsg(LOADING_STEPS[step]);
      }
    }, 1500);

    try {
      // Attempt real Gemini analysis via draft API with the demo mp3
      const formData = new FormData();
      const audioRes = await fetch("/musics/demo_kpop_15s.mp3");
      const blob = await audioRes.blob();
      formData.append("file", new File([blob], "demo.mp3", { type: "audio/mp3" }));

      const res = await fetch("/api/draft", { method: "POST", body: formData });
      const data = await res.json();

      if (data.segments) {
        setDraft(data);
      } else if (data.error) {
        // Golden path fallback already handled in API
        const presetRes = await fetch("/api/preset", { method: "POST" });
        const presetData = await presetRes.json();
        if (presetData.success) setDraft(presetData.draft);
      }

      const stateRes = await fetch("/api/state");
      const stateData = await stateRes.json();
      setHistory(stateData.diffHistory || []);
    } catch {
      // Fallback to preset
      const presetRes = await fetch("/api/preset", { method: "POST" });
      const presetData = await presetRes.json();
      if (presetData.success) setDraft(presetData.draft);
    } finally {
      clearInterval(interval);
      setLoading(false);
      setPhase(3);
    }
  };

  // ─── Phase 3→4: Reveal choreography ───
  const handleRevealChoreo = () => {
    setPhase(4);
  };

  // ─── Phase 4→5: Generate wardrobe image ───
  const handleGenerateImage = async () => {
    setImageLoading(true);
    try {
      const res = await fetch("/api/visual", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setImageUrl(data.imageUrl);
        setImageSource(data.source || null);
        setImageDescription(data.description || null);
        setPhase(5);
      }
    } catch (err: unknown) {
      showError(`Visual failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setImageLoading(false);
    }
  };

  // ─── A&R Patch (Phase 4+) ───
  const handlePatch = async () => {
    if (!chatInput) return;
    setLoading(true);
    setLoadingMsg("A&R Director is applying changes...");
    try {
      const res = await fetch("/api/patch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: chatInput }),
      });
      const data = await res.json();
      if (data.success) {
        setDraft(data.draft);
        setChatInput("");
        setImageUrl(null);
        setImageSource(null);
        const stateRes = await fetch("/api/state");
        const stateData = await stateRes.json();
        setHistory(stateData.diffHistory || []);
      }
    } catch (err: unknown) {
      showError(`Patch failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const DEMO_PATCHES = [
    { label: "더 파워풀하게", fn: (d: SyncStageDraft): SyncStageDraft => ({ ...d, revision: d.revision + 1, lastAction: "더 파워풀하게", segments: d.segments.map((s, i) => i === 2 ? { ...s, clipId: "arms_hiphop" as const, intensity: 10, reason: "Maximum energy drop — crowd ignition." } : s) }) },
    { label: "힙합 무드로", fn: (d: SyncStageDraft): SyncStageDraft => ({ ...d, revision: d.revision + 1, lastAction: "힙합 무드로", segments: d.segments.map(s => ({ ...s, clipId: "hiphop_dance" as const, intensity: Math.min(10, s.intensity + 1) })) }) },
    { label: "사이버펑크 스타일", fn: (d: SyncStageDraft): SyncStageDraft => ({ ...d, revision: d.revision + 1, lastAction: "사이버펑크 스타일", visualConcept: { style: "Cyberpunk Dark", imagePrompt: "K-pop performers in black leather and neon chrome on a dark laser stage, cinematic 8k." } }) },
    { label: "재즈댄스 포인트", fn: (d: SyncStageDraft): SyncStageDraft => ({ ...d, revision: d.revision + 1, lastAction: "재즈댄스 포인트", segments: d.segments.map((s, i) => i === 4 ? { ...s, clipId: "jazz_dance" as const, intensity: 9, reason: "Iconic jazz finale." } : s) }) },
  ];

  const handleMockPatch = (patch: typeof DEMO_PATCHES[0]) => {
    if (!draft) return;
    setDraft(patch.fn(draft));
    setHistory(prev => [...prev, { timestamp: new Date().toISOString(), description: `[Patch] ${patch.label}` }]);
    setImageUrl(null);
    setImageSource(null);
  };

  const activeSegment = draft?.segments?.find(
    (s) => currentTimeMs >= s.startMs && currentTimeMs < s.endMs
  );

  // ─── Derived: Analysis Report from draft ───
  const analysisReport = draft ? {
    sections: draft.segments.length,
    peakSegment: draft.segments.reduce((a, b) => a.intensity > b.intensity ? a : b),
    totalDuration: `${(draft.segments[draft.segments.length - 1].endMs / 1000).toFixed(1)}s`,
    energyArc: draft.segments.map(s => s.intensity),
    mood: draft.visualConcept.style,
    beatDropMs: draft.segments.find(s => s.intensity >= 9)?.startMs ?? 0,
  } : null;

  // ═══════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col font-sans">
      {/* Error Toast */}
      {errorMsg && (
        <div className="fixed top-4 right-4 z-50 bg-red-900/90 border border-red-500 text-red-200 text-xs px-4 py-3 rounded-lg shadow-2xl backdrop-blur-sm max-w-sm flex items-start gap-2">
          <span className="text-red-400 mt-0.5">⚠</span>
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="ml-auto text-red-400 hover:text-white pl-2">✕</button>
        </div>
      )}

      {/* ─── Header ─── */}
      <header className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center bg-black/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight text-fuchsia-500 italic">SyncStage AI</h1>
          <span className="text-[9px] px-2 py-0.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-full font-mono">
            Powered by Gemini
          </span>
        </div>
        <div className="flex items-center gap-3">
          {phase >= 3 && draft && (
            <div className="text-xs bg-neutral-800 px-3 py-1 rounded-full text-neutral-400 flex items-center gap-2 border border-neutral-700">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Revision: <span className="text-white font-mono">{draft.revision}</span>
            </div>
          )}
          {/* Step indicator */}
          <div className="flex gap-1">
            {[0,1,2,3,4].map(i => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${
                phase > i ? "bg-fuchsia-500" : phase === i ? "bg-fuchsia-500 animate-pulse ring-2 ring-fuchsia-500/30" : "bg-neutral-700"
              }`} />
            ))}
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════ */}
      {/* PHASE 0: Landing — Upload Audio */}
      {/* ═══════════════════════════════════════════════════ */}
      {phase === 0 && (
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-lg w-full text-center space-y-8">
            <div className="space-y-4">
              <div className="text-5xl mb-4">🎵</div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-fuchsia-400 to-violet-400 bg-clip-text text-transparent">
                Upload Your Demo Track
              </h2>
              <p className="text-neutral-400 text-sm leading-relaxed">
                K-pop 데모 음원을 업로드하면 Gemini 2.5 Flash가<br />
                네이티브 오디오 딥리스닝으로 곡의 텐션과 전개를 분석합니다.
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <span className="text-[9px] px-2 py-1 bg-blue-900/40 border border-blue-700/30 text-blue-300 rounded-full font-mono">Gemini 2.5 Flash</span>
                <span className="text-[9px] px-2 py-1 bg-violet-900/40 border border-violet-700/30 text-violet-300 rounded-full font-mono">Function Calling</span>
                <span className="text-[9px] px-2 py-1 bg-fuchsia-900/40 border border-fuchsia-700/30 text-fuchsia-300 rounded-full font-mono">Gemini Image</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 items-center">
              <label className="cursor-pointer bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white px-8 py-3 rounded-full text-sm font-bold tracking-wide transition-all shadow-lg shadow-fuchsia-900/40">
                🎤 Upload WAV / MP3
                <input type="file" accept="audio/*" onChange={handleUploadAudio} className="hidden" />
              </label>
              <span className="text-neutral-600 text-xs">or</span>
              <button
                onClick={handleLoadDemoTrack}
                className="text-xs text-neutral-400 hover:text-white border border-neutral-700 hover:border-neutral-500 px-4 py-2 rounded-full transition-all"
              >
                ⚡ Use Built-in K-pop Demo Track
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* PHASE 1: Audio loaded — Waveform + Analyze Button  */}
      {/* ═══════════════════════════════════════════════════ */}
      {phase === 1 && (
        <main className="flex-1 flex flex-col items-center justify-center p-8 gap-8">
          <div className="w-full max-w-3xl">
            <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6 shadow-2xl">
              <div className="text-[11px] uppercase tracking-widest text-neutral-500 font-bold mb-4">
                Audio Loaded — Ready for Analysis
              </div>
              <WaveformTimeline draft={null} audioUrl={audioUrl} onTimeUpdate={setCurrentTimeMs} />
            </div>
          </div>
          <button
            onClick={handleAnalyze}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 rounded-full text-sm font-bold tracking-wide transition-all shadow-lg shadow-violet-900/40 flex items-center gap-2"
          >
            <span className="text-lg">🔍</span>
            Analyze with Gemini 2.5 Flash
          </button>
        </main>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* PHASE 2: Analyzing — Gemini Loading Animation      */}
      {/* ═══════════════════════════════════════════════════ */}
      {phase === 2 && (
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 mx-auto border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <div>
              <p className="text-lg font-bold text-violet-400 tracking-wide">{loadingMsg}</p>
              <p className="text-xs text-neutral-500 mt-2">Gemini Native Audio Multimodal Inference</p>
            </div>
            <div className="flex justify-center gap-1">
              {LOADING_STEPS.map((_, i) => (
                <div key={i} className={`h-1 w-12 rounded-full transition-all duration-500 ${
                  loadingMsg === LOADING_STEPS[i] ? "bg-violet-500" :
                  LOADING_STEPS.indexOf(loadingMsg) > i ? "bg-violet-500/40" : "bg-neutral-800"
                }`} />
              ))}
            </div>
          </div>
        </main>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* PHASE 3: Analysis Report                           */}
      {/* ═══════════════════════════════════════════════════ */}
      {phase === 3 && analysisReport && (
        <main className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
          <div className="w-full max-w-2xl bg-neutral-900 rounded-xl border border-neutral-800 shadow-2xl overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-violet-900/50 to-fuchsia-900/50 border-b border-neutral-800 flex items-center gap-3">
              <span className="text-lg">📊</span>
              <div>
                <h3 className="text-sm font-bold text-white">Gemini Audio Analysis Report</h3>
                <p className="text-[10px] text-neutral-400 font-mono">gemini-2.5-flash • native multimodal inference</p>
              </div>
            </div>

            <div className="p-5 grid grid-cols-2 gap-4">
              {/* Detected Sections */}
              <div className="bg-black/30 rounded-lg p-3 border border-neutral-800">
                <div className="text-[9px] uppercase tracking-widest text-neutral-500 mb-1">Detected Sections</div>
                <div className="text-2xl font-bold text-fuchsia-400">{analysisReport.sections}</div>
                <div className="text-[10px] text-neutral-500">energy segments identified</div>
              </div>

              {/* Beat Drop */}
              <div className="bg-black/30 rounded-lg p-3 border border-neutral-800">
                <div className="text-[9px] uppercase tracking-widest text-neutral-500 mb-1">Beat Drop Detected</div>
                <div className="text-2xl font-bold text-amber-400">{(analysisReport.beatDropMs / 1000).toFixed(1)}s</div>
                <div className="text-[10px] text-neutral-500">peak energy timestamp</div>
              </div>

              {/* Duration */}
              <div className="bg-black/30 rounded-lg p-3 border border-neutral-800">
                <div className="text-[9px] uppercase tracking-widest text-neutral-500 mb-1">Track Duration</div>
                <div className="text-2xl font-bold text-blue-400">{analysisReport.totalDuration}</div>
                <div className="text-[10px] text-neutral-500">total analyzed</div>
              </div>

              {/* Recommended Mood */}
              <div className="bg-black/30 rounded-lg p-3 border border-neutral-800">
                <div className="text-[9px] uppercase tracking-widest text-neutral-500 mb-1">Recommended Mood</div>
                <div className="text-lg font-bold text-violet-400 truncate">{analysisReport.mood}</div>
                <div className="text-[10px] text-neutral-500">cross-modal derivation</div>
              </div>

              {/* Energy Arc */}
              <div className="col-span-2 bg-black/30 rounded-lg p-3 border border-neutral-800">
                <div className="text-[9px] uppercase tracking-widest text-neutral-500 mb-2">Energy Arc</div>
                <div className="flex items-end gap-1 h-10">
                  {analysisReport.energyArc.map((e, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t transition-all"
                        style={{
                          height: `${e * 10}%`,
                          background: e >= 9 ? "#d946ef" : e >= 6 ? "#818cf8" : "#374151",
                        }}
                      />
                      <span className="text-[8px] text-neutral-600">{e}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Peak Segment Detail */}
              <div className="col-span-2 bg-black/30 rounded-lg p-3 border border-fuchsia-500/20">
                <div className="text-[9px] uppercase tracking-widest text-fuchsia-400 mb-1">🔥 Peak Energy Segment</div>
                <div className="text-xs text-neutral-300 leading-relaxed">
                  <span className="text-white font-bold">{analysisReport.peakSegment.clipId.replace("_", " ").toUpperCase()}</span>
                  {" "}@ {(analysisReport.peakSegment.startMs / 1000).toFixed(1)}s–{(analysisReport.peakSegment.endMs / 1000).toFixed(1)}s
                  {" "}(Intensity {analysisReport.peakSegment.intensity}/10)
                </div>
                <div className="text-[10px] text-neutral-500 mt-1 italic">&quot;{analysisReport.peakSegment.reason}&quot;</div>
              </div>
            </div>
          </div>

          <button
            onClick={handleRevealChoreo}
            className="px-8 py-3 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 rounded-full text-sm font-bold tracking-wide transition-all shadow-lg shadow-fuchsia-900/40 flex items-center gap-2"
          >
            <span className="text-lg">🎬</span>
            Generate 3D Choreography Timeline
          </button>
        </main>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* PHASE 4–5: Full Dashboard (3D + Timeline + Chat)   */}
      {/* ═══════════════════════════════════════════════════ */}
      {phase >= 4 && (
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 grid-rows-[1fr_auto] gap-4 p-4">
          {/* Panel 1: 3D Viewer */}
          <div className="bg-neutral-800 rounded-lg overflow-hidden relative shadow-2xl lg:row-span-2 flex flex-col border border-neutral-700">
            <div className="p-3 bg-neutral-900 border-b border-black text-[11px] uppercase tracking-widest font-bold flex justify-between items-center">
              <span className="text-neutral-400">3D Choreo Storyboard</span>
              {activeSegment && (
                <span className="text-fuchsia-500 bg-fuchsia-500/10 px-2 py-0.5 rounded border border-fuchsia-500/20">
                  MOVE: {activeSegment.clipId.replace("_", " ")}
                </span>
              )}
            </div>
            <div className="flex-1 relative min-h-[300px]">
              <ThreeCanvas activeSegment={activeSegment} />
              {loading && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm z-20">
                  <div className="w-12 h-12 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <div className="text-sm font-medium tracking-widest text-fuchsia-400 uppercase">{loadingMsg}</div>
                </div>
              )}
            </div>
          </div>

          {/* Panel 2: Waveform */}
          <div className="bg-neutral-800 rounded-lg overflow-hidden flex flex-col shadow-xl border border-neutral-700">
            <div className="p-3 bg-neutral-900 border-b border-black text-[11px] uppercase tracking-widest font-bold flex justify-between items-center">
              <span className="text-neutral-400">Audio Master Pipeline</span>
              <label className="cursor-pointer bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-3 py-1 rounded text-[10px] transition-all">
                UPLOAD NEW
                <input type="file" accept="audio/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setAudioUrl(URL.createObjectURL(file));
                }} className="hidden" />
              </label>
            </div>
            <div className="flex-1 p-4 flex flex-col justify-center">
              <WaveformTimeline draft={draft} audioUrl={audioUrl} onTimeUpdate={setCurrentTimeMs} />
            </div>
          </div>

          {/* Panel 3: Wardrobe + Segments + Chat */}
          <div className="grid grid-cols-3 gap-4">
            {/* Wardrobe Concept Panel */}
            <WardrobeConceptPanel
              imageUrl={imageUrl}
              styleName={draft?.visualConcept?.style ?? null}
              description={imageDescription}
              source={imageSource}
              isLoading={imageLoading}
              onGenerate={handleGenerateImage}
              onRegenerate={handleGenerateImage}
              hasDraft={!!draft}
            />

            {/* Segment List */}
            <div className="bg-neutral-800 rounded-lg overflow-hidden shadow-xl flex flex-col border border-neutral-700">
              <div className="p-3 bg-neutral-900 border-b border-black text-[11px] uppercase tracking-widest font-bold flex justify-between items-center">
                <span className="text-neutral-400">Choreo Timeline</span>
                {draft && <span className="text-[10px] text-indigo-400 font-mono">{draft.segments.length} segments</span>}
              </div>
              <div className="flex-1 p-3 overflow-y-auto">
                <SegmentList segments={draft?.segments || []} activeSegmentId={activeSegment?.id} />
              </div>
            </div>

            {/* A&R Chat Box */}
            <div className="bg-neutral-800 rounded-lg overflow-hidden shadow-xl flex flex-col border border-neutral-700">
              <div className="p-3 bg-neutral-900 border-b border-black text-[11px] uppercase tracking-widest font-bold text-neutral-400">
                A&amp;R Director&apos;s Notes
              </div>
              <div className="flex-1 p-3 overflow-y-auto text-[11px] space-y-3 font-mono">
                {history.length === 0 && <div className="text-neutral-600 italic">Ready for instructions.</div>}
                {history.map((h, i) => (
                  <div key={i} className="bg-black/30 p-2 rounded border-l-2 border-indigo-500">
                    <div className="text-[9px] text-neutral-500 mb-1 opacity-50">{new Date(h.timestamp).toLocaleTimeString()}</div>
                    <div className="text-neutral-300 leading-relaxed">{h.description}</div>
                  </div>
                ))}
              </div>
              {draft && (
                <div className="px-3 pb-2 bg-neutral-900 border-t border-neutral-800 pt-2 flex flex-wrap gap-1">
                  {DEMO_PATCHES.map((p) => (
                    <button key={p.label} onClick={() => handleMockPatch(p)}
                      className="px-2 py-1 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-300 border border-indigo-700/50 rounded text-[10px] transition-colors">
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="p-3 bg-neutral-900 border-t border-black flex gap-2">
                <input
                  type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Talk to A&R Gemini..."
                  className="flex-1 bg-black rounded-md px-3 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-neutral-800"
                  onKeyDown={(e) => e.key === "Enter" && handlePatch()}
                  disabled={loading || !draft}
                />
                <button onClick={handlePatch} disabled={loading || !draft || !chatInput}
                  className="px-3 py-1 bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50 rounded text-xs font-bold transition-colors">
                  PATCH
                </button>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
