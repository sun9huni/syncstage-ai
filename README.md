# ⚡️ SyncStage AI

> **K-Pop A&R Director powered by Gemini Native Audio Multimodal Intelligence**
>
> **Gemini 네이티브 오디오 멀티모달 분석으로 완성하는 K-Pop A&R 디렉터**

🌐 **Live Demo:** [https://syncstage-ai.vercel.app](https://syncstage-ai.vercel.app)

---

## 🎤 Problem

> *"한국, 특히 서울은 엔터테인먼트 분야의 글로벌 강국입니다. Google의 AI 제품을 활용하여 음악, TV, 영화, 게임 전반에 걸쳐 혁신적인 경험을 어떻게 만들 수 있을까요?"*
>
> *"Korea, especially Seoul, is a global powerhouse in entertainment. How can Google's AI products be used to create innovative experiences across music, TV, film, and games?"*

K-Pop 무대 기획은 대형 기획사의 전유물입니다. 개인 작곡가나 독립 아티스트가 안무와 무대 의상 컨셉을 디렉팅하려면 전문 인력 고용에 수백만 원이 필요합니다. 아이디어가 있어도 시각화할 수단이 없어 기회 자체를 포기하는 경우가 대부분입니다.

K-pop stage direction — choreography and wardrobe concepting — is only accessible to major labels. Independent artists and self-producers face costs that make it impossible. Most creators with great music simply give up on visualizing their stage.

---

## 💡 Solution

**SyncStage AI**는 이 장벽을 허뭅니다. 음원을 업로드하면 Gemini가 비트 드롭과 에너지 흐름을 분석해 3D 안무 타임라인과 무대 의상 컨셉 이미지를 자동 생성합니다. 자연어 한 줄로 원하는 구간을 실시간 수정할 수 있습니다. 음악만 있으면, 누구나 대형 기획사 수준의 A&R 디렉팅을 경험할 수 있습니다.

**SyncStage AI** removes that barrier. Upload your track and Gemini analyzes the beat drops and energy to auto-generate a 3D choreography timeline and stage wardrobe concept. Refine anything with a single natural language command. Your music. Your stage. No agency needed.

---

## 🏗️ Architecture & Workflow

```mermaid
graph TD
    User([🎵 Audio Upload]) --> DraftAPI(API: /api/draft)
    DraftAPI -->|Gemini 3 Flash Preview\nNative Audio Analysis| Analysis[Multimodal Audio Analysis\nBeat Drop · Energy Arc · Mood]
    Analysis -->|Choreo JSON| Timeline[Structured Timeline\nPhase 3: Analysis Report]
    Timeline --> UI[Phase 4: Real-time 3D Choreography\nReact Three Fiber]
    UI --> VisualAPI(API: /api/visual)
    VisualAPI -->|gemini-2.0-flash-exp-image-generation| StageImage[Phase 5: Stage Wardrobe Image]

    UserFeedback([💬 Natural Language Feedback]) --> PatchAPI(API: /api/patch)
    PatchAPI -->|Gemini 3 Flash Preview\nFunction Calling| PatchEngine[Agentic Patch Engine\nupdate_segment · update_style]
    PatchEngine -->|Safe State Mutation| Timeline
```

| Phase | Action | 설명 / Description |
|---|---|---|
| 0 | **Upload** | 음원 업로드 또는 내장 트랙 선택 · Upload audio or use built-in demo track |
| 1 | **Ready** | 오디오 웨이브폼 표시, 분석 버튼 활성화 · Waveform renders, Analyze button activates |
| 2 | **Analyzing** | Gemini가 드럼 킥·베이스·비트 드롭 타임스탬프 직접 청취 · Gemini natively listens and extracts beat drop timestamps |
| 3 | **Report** | AI 분석 리포트 (섹션 수, Beat Drop 타임, Energy Arc) · AI analysis report shown |
| 4 | **Choreography** | 3D 댄서가 타임라인에 맞춰 춤추고 자연어로 실시간 수정 · 3D dancer performs; natural language patches apply in real time |
| 5 | **Wardrobe** | 오디오 무드에서 도출된 무대 의상 컨셉 이미지 생성 · Stage wardrobe concept image generated from audio mood |

---

## 🛠️ Key Google Technologies

| Category | Technology | Role |
|---|---|---|
| **Audio Intelligence** | **Gemini 3 Flash Preview** (`gemini-3-flash-preview`) | Directly analyzes drum kicks, bass lines, and beat drop timestamps from raw MP3 via Gemini Files API — no external audio preprocessing library needed |
| **Agentic Function Calling** | **Gemini 3 Flash Preview** (Function Calling) | Converts natural language feedback (Korean & English) into `update_segment` / `update_style` tool calls — safely mutates only the targeted 3D state |
| **Visual Generation** | **Gemini Flash Image Generation** (`gemini-2.0-flash-exp-image-generation`) | Generates K-Pop stage wardrobe concept images from audio mood-derived prompts, returned as inline base64 |

---

## ✨ Key Features

- **Single-API Audio Intelligence** — MP3 하나로 구조·텐션·무드를 단일 Gemini 호출로 분석. No external BPM/spectrum libraries.
- **Intent-based Patching** — Function Calling을 "State Mutator"로 활용. 전체 덮어쓰기 없이 정확한 세그먼트만 수정. The agent understands *intent*, not just keywords.
- **Cross-modal Reasoning** — 오디오 무드 분석이 의상 이미지 프롬프트로 자동 연결. Audio vibe directly drives the visual generation prompt.

---

## ⚠️ Original Contribution

> 3D 아바타 모델·애니메이션 파일은 **Mixamo 오픈소스 에셋**을 사용했습니다.
> The 3D avatar models and animation files use **Mixamo open-source assets**.

본 팀의 독창적 기여는 **Gemini 네이티브 오디오 추론 → JSON 타임라인 오케스트레이션 → 자연어 Function Calling으로 3D 상태 제어**하는 Director Agent Engine을 100% 직접 설계·구현한 것입니다.

Our original contribution is the **Director Agent Engine** — analyzing song tension through Gemini's native audio inference, orchestrating a JSON-based timeline, and controlling 3D state through natural language Function Calling.

---

## 🚀 How to Run

```bash
npm install
echo "GEMINI_API_KEY=your_key_here" > .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

`⚡ Use Built-in K-pop Demo Track` 버튼으로 즉시 체험 가능. A Gemini API key is required for live AI analysis.
