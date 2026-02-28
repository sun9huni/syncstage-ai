"use client";

import { useEffect, useState } from "react";
import WaveformTimeline from "@/components/WaveformTimeline";
import ThreeCanvas from "@/components/ThreeCanvas";
import SegmentList from "@/components/SegmentList";
import WardrobeConceptPanel from "@/components/WardrobeConceptPanel";
import { SyncStageDraft } from "@/lib/schema";

export default function Home() {
  const [draft, setDraft] = useState<SyncStageDraft | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Gemini is Choreographing...");
  const [chatInput, setChatInput] = useState("");
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>("/demo.wav");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Image Generation States
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageSource, setImageSource] = useState<string | null>(null);
  const [imageDescription, setImageDescription] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  // Fetch initial state
  useEffect(() => {
    fetch("/api/state")
      .then((res) => res.json())
      .then((data) => {
        if (data.draft) setDraft(data.draft);
        if (data.diffHistory) setHistory(data.diffHistory);
      });
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setImageUrl(null);
    setImageSource(null);
    setAudioUrl(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoadingMsg("Uploading audio to Gemini...");
      const res = await fetch("/api/draft", { method: "POST", body: formData });
      setLoadingMsg("Analyzing beats & generating choreography...");
      const data = await res.json();
      if (data.error) { showError(`Draft failed: ${data.error}`); return; }
      setDraft(data);
      const stateRes = await fetch("/api/state");
      const stateData = await stateRes.json();
      setHistory(stateData.diffHistory || []);
    } catch (err: unknown) {
      showError(`Upload failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
      setLoadingMsg("Gemini is Choreographing...");
    }
  };

  const handleLoadPreset = async () => {
    setLoading(true);
    setLoadingMsg("Loading demo preset...");
    try {
      const res = await fetch("/api/preset", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setDraft(data.draft);
        setAudioUrl("/demo.wav");
        setImageUrl(null);
        setHistory([{ timestamp: new Date().toISOString(), description: "Demo preset loaded." }]);
      }
    } catch (err: unknown) {
      showError(`Preset failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
      setLoadingMsg("Gemini is Choreographing...");
    }
  };

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
      if (data.error) { showError(`Patch failed: ${data.error}`); return; }
      if (data.success) {
        setDraft(data.draft);
        setChatInput("");
        const stateRes = await fetch("/api/state");
        const stateData = await stateRes.json();
        setHistory(stateData.diffHistory || []);
      }
    } catch (err: unknown) {
      showError(`Patch failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
      setLoadingMsg("Gemini is Choreographing...");
    }
  };

  const handleGenerateImage = async () => {
    setImageLoading(true);
    try {
      const res = await fetch("/api/visual", { method: "POST" });
      const data = await res.json();
      if (data.error) { showError(`Visual failed: ${data.error}`); return; }
      if (data.success) {
        setImageUrl(data.imageUrl);
        setImageSource(data.source || null);
        setImageDescription(data.description || null);
      }
    } catch (err: unknown) {
      showError(`Visual failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setImageLoading(false);
    }
  };

  // Demo-safe mock patch: instant visual change without API call
  const DEMO_PATCHES = [
    { label: "더 파워풀하게", fn: (d: SyncStageDraft): SyncStageDraft => ({ ...d, revision: d.revision + 1, lastAction: "더 파워풀하게", segments: d.segments.map((s, i) => i === 2 ? { ...s, clipId: "arms_hiphop" as const, intensity: 10, reason: "Maximum energy drop — crowd ignition moment." } : s) }) },
    { label: "힙합 무드로", fn: (d: SyncStageDraft): SyncStageDraft => ({ ...d, revision: d.revision + 1, lastAction: "힙합 무드로", segments: d.segments.map(s => ({ ...s, clipId: "hiphop_dance" as const, intensity: Math.min(10, s.intensity + 1) })) }) },
    { label: "사이버펑크 스타일", fn: (d: SyncStageDraft): SyncStageDraft => ({ ...d, revision: d.revision + 1, lastAction: "사이버펑크 스타일", visualConcept: { style: "Cyberpunk Dark", imagePrompt: "K-pop performers in black leather and neon chrome on a dark laser stage, cinematic 8k." } }) },
    { label: "재즈댄스 포인트", fn: (d: SyncStageDraft): SyncStageDraft => ({ ...d, revision: d.revision + 1, lastAction: "재즈댄스 포인트", segments: d.segments.map((s, i) => i === 4 ? { ...s, clipId: "jazz_dance" as const, intensity: 9, reason: "Iconic jazz finale — elegant ending pose." } : s) }) },
  ];

  const handleMockPatch = (patch: typeof DEMO_PATCHES[0]) => {
    if (!draft) return;
    const updated = patch.fn(draft);
    setDraft(updated);
    setHistory(prev => [...prev, { timestamp: new Date().toISOString(), description: `[Demo] ${patch.label}` }]);
    setImageUrl(null);
  };

  // Find current active segment based on currentTimeMs
  const activeSegment = draft?.segments?.find(
    (s) => currentTimeMs >= s.startMs && currentTimeMs < s.endMs
  );

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col font-sans">
      {/* Error Toast */}
      {errorMsg && (
        <div className="fixed top-4 right-4 z-50 bg-red-900/90 border border-red-500 text-red-200 text-xs px-4 py-3 rounded-lg shadow-2xl backdrop-blur-sm max-w-sm flex items-start gap-2">
          <span className="text-red-400 mt-0.5">⚠</span>
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="ml-auto text-red-400 hover:text-white pl-2">✕</button>
        </div>
      )}
      <header className="p-4 border-b border-neutral-800 flex justify-between items-center bg-black">
        <h1 className="text-xl font-bold tracking-tight text-fuchsia-500 italic">SyncStage AI</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handleLoadPreset}
            disabled={loading}
            className="text-xs bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 px-3 py-1.5 rounded-full transition-all font-mono tracking-tight disabled:opacity-40"
            title="Load a pre-built demo — no API call needed"
          >
            ⚡ LOAD DEMO PRESET
          </button>
          {draft && (
            <div className="text-xs bg-neutral-800 px-3 py-1 rounded-full text-neutral-400 flex items-center gap-2 border border-neutral-700">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span>Revision: <span className="text-white font-mono">{draft.revision}</span></span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 grid-rows-2 gap-4 p-4">
        {/* Panel 1: 3D Viewer */}
        <div className="bg-neutral-800 rounded-lg overflow-hidden relative shadow-2xl row-span-1 lg:row-span-2 flex flex-col border border-neutral-700">
          <div className="p-3 bg-neutral-900 border-b border-black text-[11px] uppercase tracking-widest font-bold flex justify-between items-center">
            <span className="text-neutral-400">3D Choreo Storyboard</span>
            {activeSegment && (
              <span className="text-fuchsia-500 bg-fuchsia-500/10 px-2 py-0.5 rounded border border-fuchsia-500/20">
                MOVE: {activeSegment.clipId.replace('_', ' ')}
              </span>
            )}
          </div>
          <div className="flex-1 relative">
            <ThreeCanvas activeSegment={activeSegment} />
            {loading && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm z-20">
                <div className="w-12 h-12 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <div className="text-sm font-medium tracking-widest text-fuchsia-400 uppercase">{loadingMsg}</div>
              </div>
            )}
          </div>
        </div>

        {/* Panel 2: Waveform & Audio Upload */}
        <div className="bg-neutral-800 rounded-lg overflow-hidden flex flex-col shadow-xl border border-neutral-700">
          <div className="p-3 bg-neutral-900 border-b border-black text-[11px] uppercase tracking-widest font-bold flex justify-between items-center gap-2">
            <span className="text-neutral-400">Audio Master Pipeline</span>
            <div className="flex gap-2">
              <button
                onClick={() => setAudioUrl("/demo.wav")}
                className="bg-neutral-700 hover:bg-neutral-600 text-neutral-300 px-2 py-1 rounded text-[10px] transition-all border border-neutral-600"
                title="Load built-in demo track"
              >
                DEMO TRACK
              </button>
              <label className="cursor-pointer bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-3 py-1 rounded text-[10px] transition-all">
                UPLOAD WAV/MP3
                <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>
          <div className="flex-1 p-6 flex flex-col justify-center">
            <WaveformTimeline
              draft={draft}
              audioUrl={audioUrl}
              onTimeUpdate={setCurrentTimeMs}
            />
          </div>
        </div>

        {/* Panel 3: Visual Concept / Segment List / A&R Chat */}
        <div className="grid grid-cols-3 gap-4">
          {/* Wardrobe Concept Panel — Imagen 3 */}
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
              {draft && (
                <span className="text-[10px] text-indigo-400 font-mono">
                  {draft.segments.length} segments
                </span>
              )}
            </div>
            <div className="flex-1 p-3 overflow-y-auto">
              <SegmentList
                segments={draft?.segments || []}
                activeSegmentId={activeSegment?.id}
              />
            </div>
          </div>

          {/* A&R Chat Box */}
          <div className="bg-neutral-800 rounded-lg overflow-hidden shadow-xl flex flex-col border border-neutral-700">
            <div className="p-3 bg-neutral-900 border-b border-black text-[11px] uppercase tracking-widest font-bold text-neutral-400">
              A&amp;R Director&apos;s Notes
            </div>
            <div className="flex-1 p-3 overflow-y-auto text-[11px] space-y-3 font-mono">
              {history.length === 0 && <div className="text-neutral-600 italic">History is empty. Ready for instructions.</div>}
              {history.map((h, i) => (
                <div key={i} className="bg-black/30 p-2 rounded border-l-2 border-indigo-500">
                  <div className="text-[9px] text-neutral-500 mb-1 opacity-50">{new Date(h.timestamp).toLocaleTimeString()}</div>
                  <div className="text-neutral-300 leading-relaxed">{h.description}</div>
                </div>
              ))}
            </div>
            {/* Quick Demo Patches */}
            {draft && (
              <div className="px-3 pb-2 bg-neutral-900 border-t border-neutral-800 pt-2 flex flex-wrap gap-1">
                {DEMO_PATCHES.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => handleMockPatch(p)}
                    className="px-2 py-1 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-300 border border-indigo-700/50 rounded text-[10px] transition-colors"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
            <div className="p-3 bg-neutral-900 border-t border-black flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Talk to A&R Gemini..."
                className="flex-1 bg-black rounded-md px-3 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-neutral-800"
                onKeyDown={(e) => e.key === 'Enter' && handlePatch()}
                disabled={loading || !draft}
              />
              <button
                onClick={handlePatch}
                disabled={loading || !draft || !chatInput}
                className="px-3 py-1 bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50 rounded text-xs transition-colors font-bold"
              >
                PATCH
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
