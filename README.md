# SyncStage AI

**AI-powered K-pop choreography direction platform.**  
Upload audio → get an instant choreography timeline → refine it with natural language using Gemini.

---

## Demo Flow

1. **Upload Audio** — drop any MP3/WAV file
2. **AI Draft** — Gemini analyzes the audio and generates a segment-by-segment choreography timeline
3. **Visual Concept** — generates a K-pop visual style concept (image + description)
4. **Director's Notes** — type natural language instructions (e.g. "make the last section more powerful") and Gemini rewrites the timeline and visual concept simultaneously

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) |
| AI | Google Gemini (`@google/genai`) — Files API, Function Calling, Structured Output |
| 3D Visualization | React Three Fiber + drei |
| Audio Waveform | WaveSurfer.js |
| Type Safety | TypeScript + Zod v4 |
| Styling | Tailwind CSS v4 |

---

## Getting Started

```bash
# Install dependencies
npm install

# Set your Gemini API key
echo "GEMINI_API_KEY=your_key_here" > .env.local

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main dashboard UI
│   ├── layout.tsx            # Root layout + metadata
│   └── api/
│       ├── draft/route.ts    # Audio → choreography draft (Gemini Files API)
│       ├── patch/route.ts    # Natural language → timeline patch (Function Calling)
│       ├── visual/route.ts   # Visual concept generation (Gemini)
│       └── state/route.ts    # In-memory state read
├── components/
│   ├── WaveformTimeline.tsx  # Audio waveform + segment overlay (WaveSurfer.js)
│   └── ThreeCanvas.tsx       # 3D dancer visualization (React Three Fiber)
└── lib/
    ├── schema.ts             # Zod schemas (Segment, VisualConcept, SyncStageDraft)
    └── store.ts              # In-memory state store (hackathon scope)
```

---

## Gemini API Usage

| API | Endpoint | Feature |
|-----|----------|---------|
| Files API | `/api/draft` | Upload audio for multimodal analysis |
| Structured Output | `/api/draft` | JSON Schema-constrained choreography generation |
| Function Calling | `/api/patch` | `update_segment`, `update_style` parallel tool calls |
| Text Generation | `/api/visual` | Visual concept prompt refinement |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google AI Studio API key |

Get your key at [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey)
