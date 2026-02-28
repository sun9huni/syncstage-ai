# 🚀 SyncStage AI: 구글 혁신 활용 사례 (Gemini / Antigravity)

본 프로젝트는 구글의 생성형 AI 기술과 에이전트 도구들을 어떻게 프로덕션 수준의 앱으로 끌어올렸는지 보여주는 최적의 예시입니다.

## 1. 모델과 기술의 융합
* **Gemini 2.0 Flash:** 압도적인 속도와 가성비를 무기로, 빈번하게 발생하는 "A&R 채팅(Patch)"과 "비주얼 요약(Visual)" 요청의 딜레이를 최소화하여 사용자 경험을 극대화했습니다.
* **Structured Output:** 오디오 분석 단계(`/api/draft`)에서 Zod Schema 구조화 출력을 강제하여 프론트엔드 파싱 에러(JSON Parse Error)율을 0%로 만들었습니다.

## 2. 도구 호출(Function Calling)의 재해석: "의도 기반 패치"
대부분의 AI 서비스가 전체 텍스트나 전체 상태를 덮어쓰는(Overwrite) 오류를 범합니다.
SyncStage AI는 **Function Calling을 "데이터베이스 Mutator"** 로 사용했습니다.
* 사용자가 "후렴구를 더 세게"라고 자연어로 지시하면, Gemini는 `update_segment(id: "seg_02", intensity: 10)` 함수를 호출합니다.
* 이를 통해 **기존 데이터의 무결성(Idempotency)**을 완벽히 지키면서도 자유로운 AI 협업이 가능해졌습니다.

## 3. 리비전 통제 구조 (Revision Control)
오류와 충돌이 난무하는 해커톤 데모 환경의 한계를 극복하기 위해, 모든 타임라인 상태에 `Revision` 번호를 부여했습니다.
* 상태 충돌 시 HTTP 409를 던지고 클라이언트에서 이를 핸들링하는 아키텍처를 도입하여 앱의 **가드레일과 생존성(Rugged Constitution)**을 입증했습니다.

## 4. Antigravity와 에이전트 주도 개발
이 프로젝트는 철저히 **에이전트와의 페어 프로그래밍**을 위해 설계되었습니다.
초기 프롬프트부터 `AGENTS.md`를 기둥으로 삼아 AI가 레포지토리를 직접 읽고 설계할 수 있게 도왔으며, 하드코딩된 프롬프트를 `src/lib/prompts.ts`로 분리하여 **"사람은 테스트하고, AI는 코딩하는"** 이상적인 해커톤 파이프라인을 구축했습니다.

---

# 🚀 SyncStage AI: Google Innovation Use Case (Gemini / Antigravity)

This project is an optimal example of how Google's generative AI technologies and agent tools have been elevated to a production-level application.

## 1. Convergence of Models and Technology
* **Gemini 2.0 Flash:** Leveraging overwhelming speed and cost-effectiveness as weapons, it maximized user experience by minimizing delays for frequently occurring "A&R Chat (Patch)" and "Visual Summary (Visual)" requests.
* **Structured Output:** Forced Zod Schema structured output during the audio analysis phase (`/api/draft`), reducing the frontend JSON parse error rate to 0%.

## 2. Reinterpretation of Tool Calling (Function Calling): "Intent-Based Patching"
Most AI services commit the error of overwriting the entire text or entire state.
SyncStage AI used **Function Calling as a "Database Mutator."**
* When a user naturally instructs "make the chorus stronger," Gemini calls the `update_segment(id: "seg_02", intensity: 10)` function.
* This allows for free AI collaboration while perfectly maintaining the **integrity (idempotency) of existing data.**

## 3. Revision Control Structure
To overcome the limitations of a hackathon demo environment where errors and conflicts are rampant, a `Revision` number was assigned to every timeline state.
* By introducing an architecture that throws HTTP 409 upon state conflicts and handles them on the client, it proved the app's **guardrails and survival (Rugged Constitution).**

## 4. Antigravity and Agent-Driven Development
This project was designed thoroughly for **pair programming with agents.**
Starting from the initial prompts, `AGENTS.md` was used as a pillar to help the AI directly read and design the repository. Hardcoded prompts were separated into `src/lib/prompts.ts`, establishing an ideal hackathon pipeline where **"humans test, and AI codes."**
