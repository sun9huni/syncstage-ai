"use client";

import { useEffect, useState } from "react";
import WaveformTimeline from "@/components/WaveformTimeline";
import ThreeCanvas from "@/components/ThreeCanvas";
import SegmentList from "@/components/SegmentList";
import { SyncStageDraft } from "@/lib/schema";

export default function Home() {
  const [draft, setDraft] = useState<SyncStageDraft | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Gemini is Choreographing...");
  const [chatInput, setChatInput] = useState("");
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Image Generation States
  const [imageUrl, setImageUrl] = useState<string | null>(null);
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
    } catch (err: any) {
      showError(`Upload failed: ${err.message}`);
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
    } catch (err: any) {
      showError(`Patch failed: ${err.message}`);
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
      if (data.success) setImageUrl(data.imageUrl);
    } catch (err: any) {
      showError(`Visual failed: ${err.message}`);
    } finally {
      setImageLoading(false);
    }
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
        {draft && (
          <div className="text-xs bg-neutral-800 px-3 py-1 rounded-full text-neutral-400 flex items-center gap-2 border border-neutral-700">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>Revision: <span className="text-white font-mono">{draft.revision}</span></span>
          </div>
        )}
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
            <ThreeCanvas activeSegment={activeSegment} draft={draft} />
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
                onClick={() => setAudioUrl("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3")}
                className="bg-neutral-700 hover:bg-neutral-600 text-neutral-300 px-2 py-1 rounded text-[10px] transition-all border border-neutral-600"
                title="Load demo track"
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
          {/* Visual Concept */}
          <div className="bg-neutral-800 rounded-lg overflow-hidden shadow-xl flex flex-col border border-neutral-700">
            <div className="p-3 bg-neutral-900 border-b border-black text-[11px] uppercase tracking-widest font-bold flex justify-between items-center">
              <span className="text-neutral-400">Stage Wardrobe</span>
              {draft?.visualConcept && (
                <span className="text-[10px] text-fuchsia-400 px-2 py-0.5 bg-fuchsia-500/10 rounded border border-fuchsia-500/20">
                  {draft.visualConcept.style}
                </span>
              )}
            </div>
            <div className="p-4 flex-1 overflow-y-auto relative">
              {draft?.visualConcept ? (
                <div className="h-full flex flex-col">
                  {imageUrl ? (
                    <div className="relative group flex-1 mb-4 rounded-lg overflow-hidden border border-neutral-700">
                      <img src={imageUrl} alt="Concept" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-3">
                        <button
                          onClick={handleGenerateImage}
                          className="text-[10px] bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-2 py-1 rounded border border-white/20 transition-colors"
                        >
                          Regenerate
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 mb-4 bg-black/40 rounded-lg border border-dashed border-neutral-700 flex flex-col items-center justify-center p-4 text-center">
                      <p className="text-[10px] text-neutral-500 mb-3 italic leading-relaxed">
                        "{draft.visualConcept.imagePrompt.substring(0, 80)}..."
                      </p>
                      <button
                        onClick={handleGenerateImage}
                        disabled={imageLoading}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-full text-[11px] font-bold tracking-widest uppercase transition-all shadow-lg"
                      >
                        {imageLoading ? "Generating..." : "Visualize Concept"}
                      </button>
                    </div>
                  )}
                  <div className="text-[10px] text-neutral-400 leading-relaxed bg-black/20 p-2 rounded">
                    <span className="text-fuchsia-500 font-bold">PROMPT:</span> {draft.visualConcept.imagePrompt}
                  </div>
                </div>
              ) : (
                <div className="text-neutral-600 h-full flex items-center justify-center italic text-xs">Waiting for AI Draft...</div>
              )}
            </div>
          </div>

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
              A&R Director's Notes
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
