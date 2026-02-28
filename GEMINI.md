# 🚀 SyncStage AI: Google AI Innovation Showcase

이 프로젝트는 구글의 생성형 AI 기술과 에이전트 도구들을 활용하여 K-Pop 엔터테인먼트 산업에 실질적인 가치를 제공하는 프로덕션 수준 앱을 구현한 사례입니다.

---

## 1. 네이티브 오디오 멀티모달 추론

**Gemini 3 Flash Preview** (`gemini-3-flash-preview`)의 핵심 강점인 네이티브 오디오 이해력을 직접 활용했습니다.

- 별도의 오디오 전처리 파이프라인(BPM 추출, 스펙트럼 분석 라이브러리 등) 없이 MP3 파일을 **Gemini Files API**로 업로드
- 단일 API 호출로 드럼 킥·베이스 라인·비트 드롭 타임스탬프·전체 에너지 아크를 텍스트처럼 분석
- 분석 결과를 `responseMimeType: "application/json"` 옵션으로 구조화된 Choreo JSON 타임라인으로 직접 반환
- 오디오 무드에서 시각 프롬프트까지 단일 요청으로 도출하는 크로스 모달(Cross-modal) 추론 실현

## 2. Function Calling의 재해석: "의도 기반 패치(Intent-based Patching)"

대부분의 AI 서비스는 사용자 요청 시 전체 상태를 덮어쓰는(Overwrite) 방식을 사용합니다.
SyncStage AI는 **Function Calling을 "State Mutator"** 로 재해석했습니다.

- 사용자가 "후렴구를 더 세게"라고 자연어로 지시하면, Gemini는 `update_segment(id: "seg_03", intensity: 10)` 함수를 정확히 선택해 호출
- 기존 데이터의 무결성(Idempotency)을 유지하면서도 자유로운 AI 협업이 가능한 구조
- 한국어를 포함한 자연어 입력을 파라미터화된 도구 호출로 변환하는 신뢰성 높은 인터페이스

## 3. Revision Control을 통한 상태 무결성

모든 타임라인 상태에 `revision` 번호를 부여하여 AI 패치의 추적 가능성을 확보했습니다.

- 상태 충돌 시 HTTP 409를 반환하고 클라이언트에서 핸들링하는 낙관적 동시성 제어(Optimistic Concurrency)
- 모든 변경 이력을 `diffHistory`로 기록하여 어느 AI 도구 호출이 어떤 상태 변경을 야기했는지 추적 가능
- 이를 통해 에이전트와 사용자 간의 신뢰 가능한 협업 루프(Tiki-taka) 구현

## 4. Gemini CLI와 에이전트 주도 개발

이 프로젝트는 **Gemini CLI**와 에이전트 도구들과의 페어 프로그래밍으로 개발되었습니다.

- `AGENTS.md`를 기반으로 AI 에이전트가 레포지토리 구조와 개발 컨벤션을 일관되게 이해하고 코드를 생성
- 시스템 프롬프트를 `src/lib/prompts.ts`로 분리하여 에이전트가 독립적으로 프롬프트를 개선하고 테스트하는 구조
- API 응답 스키마를 `src/lib/schema.ts`의 Zod 정의로 중앙화하여 프론트엔드·백엔드 타입 안전성 확보
- 에이전트가 제안한 `responseMimeType: "application/json"` + 인라인 JSON 구조 명시 방식으로 구조화 출력 안정화

---

# 🚀 SyncStage AI: Google AI Innovation Showcase (English)

This project demonstrates how Google's generative AI technologies and agent tools can be leveraged to deliver real production-level value in the K-Pop entertainment industry.

## 1. Native Audio Multimodal Reasoning

Leverages **Gemini 3 Flash Preview** (`gemini-3-flash-preview`)'s native audio understanding capability directly.

- No external audio preprocessing pipeline (BPM extraction, spectrum analysis libraries, etc.) — uploads MP3 files directly via the **Gemini Files API**
- Single API call to analyze drum kicks, bass lines, beat drop timestamps, and full energy arc
- Structured Choreo JSON timeline returned directly via `responseMimeType: "application/json"` option
- Cross-modal reasoning from audio mood to visual prompts in a single request

## 2. Function Calling Reinterpreted: "Intent-Based Patching"

SyncStage AI reinterprets **Function Calling as a "State Mutator."**

- When a user instructs "make the chorus stronger" in natural language, Gemini precisely selects and calls `update_segment(id: "seg_03", intensity: 10)`
- Maintains data integrity (idempotency) while enabling free AI collaboration
- Converts natural language input (including Korean) into parameterized tool calls with high reliability

## 3. State Integrity through Revision Control

Assigns a `revision` number to every timeline state to ensure AI patch traceability.

- Returns HTTP 409 on state conflicts with client-side handling (Optimistic Concurrency Control)
- Records all change history in `diffHistory` to track which AI tool call caused which state change

## 4. Gemini CLI and Agent-Driven Development

This project was developed through pair programming with **Gemini CLI** and agent tools.

- `AGENTS.md` enables AI agents to consistently understand repository structure and conventions
- System prompts separated into `src/lib/prompts.ts` for independent prompt refinement by agents
- API response schemas centralized in `src/lib/schema.ts` (Zod) for full-stack type safety
- Structured output stabilized via `responseMimeType: "application/json"` with inline JSON structure definition
