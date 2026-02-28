# ⚡️ SyncStage AI

> **"오디오 멀티모달 추론과 JSON 기반 타임라인 패치로 완성하는 K-Pop A&R 디렉터"**

## 📖 1. Product Overview (프로덕트 한 줄 요약)
**SyncStage AI**는 사용자가 데모 음원을 업로드하면, Gemini의 핵심 멀티모달 오디오 분석 능력을 통해 곡의 전개와 텐션을 파악하고 이에 맞는 3D 안무 타임라인과 무대 의상 컨셉을 자동 생성 및 리비전(Revision) 관리해 주는 **A&R 디렉팅 에이전트**입니다.

---

## 🏗️ 2. Architecture & Workflow
![SyncStage AI Architecture](./public/architecture-placeholder.png)

1. **Audio Deep Listening:** 사용자가 오디오 파일(.wav, .mp3)을 업로드합니다.
2. **Multimodal Inference:** Gemini가 오디오의 웨이브폼, 드럼 킥, 베이스 라인 등 에너지 변화를 네이티브하게 분석하여 초안 `Choreo JSON` 타임라인을 구성합니다.
3. **Intent-Based Patching:** "더 파워풀하게 해줘", "사이버펑크 무드로 가자" 등의 자연어 피드백을 에이전트가 Function Calling으로 해석하여 상태(State)를 안전하게 패치(Patch)합니다.
4. **Real-time 3D Rendering & Visuals:** 브라우저 위에서 R3F 기반의 3D 댄서 아바타가 타임라인에 맞춰 춤을 추고, 완성된 콘셉트에 맞춰 무대 의상 이미지가 실시간 생성됩니다.

---

## ⚠️ 3. Original Contribution (독창적 기여 명시 - **중요**)

> **심사위원 필독 사항 (DQ 방지 명시)**  
> 프로그램 내에 렌더링되는 **3D 아바타 모델과 애니메이션 파일 자체는 Mixamo의 오픈소스 에셋**을 활용했습니다. 
> 하지만, 당 팀의 **독창적 기여(Original Contribution) 및 핵심 기술력은 "Gemini의 네이티브 오디오 멀티모달 추론을 통해 곡의 텐션을 분석하고, 이를 바탕으로 JSON 기반의 타임라인을 자동 오케스트레이션하며, 자연어 Function Calling을 통해 상태를 제어하는 '디렉터 에이전트 엔진(Director Agent Engine)'"을 100% 직접 기획하고 구현**했다는 점에 있습니다.

---

## 🛠️ 4. 사용한 Google 핵심 기술 (Tech Stack)

| 구분 | 사용 기술 | 구현 내용 및 역할 |
|---|---|---|
| **Audio Deep Listening** | **Gemini 3.1 Pro (Multimodal)** | 별도의 오디오 전처리 파이프라인 없이, 모델의 Native Audio 이해력을 활용하여 드럼 킥, 벌스, 비트 드롭 타임스탬프를 원본 그대로 분석해 타임라인 분할 |
| **Agentic Function Calling** | **Gemini SDK (Structured Output)** | 사용자의 텍스트 피드백을 `update_segment`, `update_style` 등의 확정된 함수 도구(Tools)와 JSON 객체로 변환하여 사이드 이펙트 없이 3D 앱의 상태 제어 |
| **Stage Visual Generation** | **Nano Banana 2 (Imagen)** | 오디오 무드 분석을 통해 도출된 영어 텍스트 프롬프트를 바탕으로 고해상도 매거진 퀄리티의 K-Pop 무대 의상 컨셉 시각화 |

---

## 🚀 5. How to Run (데모 실행 방법)

```bash
# Install dependencies
npm install

# Set your Gemini API key
echo "GEMINI_API_KEY=your_key_here" > .env.local

# Run dev server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

*(프로젝트의 데모 버전은 상단 `[⚡️ LOAD DEMO PRESET]` 버튼을 통해 API 키 없이도 즉각적인 UI/UX 체험이 가능합니다.)*
