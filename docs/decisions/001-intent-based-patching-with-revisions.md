# [ADR-001] 의도 기반 패치 및 리비전 관리 (Intent-based Patching & Revisions)

## 상태 (Status)
**수용됨 (Accepted)**
날짜: 2026-02-28

## 컨텍스트 (Context)
SyncStage AI의 MVP는 AI가 생성한 초안(Draft) 타임라인을 사용자가 자연어로 수정(Patch)할 수 있어야 합니다. 
초기 접근 방식은 AI에게 전체 JSON 배열을 던져주고 수정된 전체 배열을 반환받는 것이었으나, 이는 다음과 같은 문제가 있습니다.
1. **데이터 유실 위험:** AI가 의도치 않게 다른 세그먼트를 삭제하거나 누락할 수 있습니다.
2. **동시성 문제 (Concurrency):** 프론트엔드의 여러 컴포넌트(Waveform, 3D Canvas, Chat)가 동시에 상태를 업데이트할 때, "어느 상태가 최신인가?"를 보장할 수 없습니다.

## 결정 (Decision)
1. **의도(Intent) 기반 Patch 로직:** 
   전체 데이터를 덮어쓰는 대신, Gemini 3.1 Pro의 `Function Calling` 기능을 활용하여 도메인 액션(`update_segment`, `update_style` 등)만 호출하도록 제한합니다. 서버는 이 호출(Call)을 받아서 기존 상태를 안전하게 변형(Mutate)합니다.
2. **리비전(Revision) 기반 충돌 방지:** 
   모든 Draft에는 `revision` 번호가 할당됩니다. 클라이언트가 Patch 요청 시 현재 알고 있는 `revision`을 함께 보내며, 서버는 이 번호가 최신 상태와 다르면 즉시 거부(`409 Conflict`)합니다.

## 결과 (Consequences)
**장점 (Pros):**
* **안정성 (Reliability):** AI가 실수로 배열 구조를 망가뜨리는 일이 원천 차단됩니다.
* **Idempotency:** 네트워크 지연이나 중복 요청 발생 시, Revision 검증을 통해 상태 오염을 막습니다. (프론트엔드 최적화에 유리)
* **확장성:** 댄서 추가, 파티클 효과 추가 등 새로운 기능을 Function Calling 도구에 추가하기만 하면 됩니다.

**단점 (Cons):**
* 클라이언트 단에서 `409 Conflict` 시 데이터를 패치(refetch)하거나 캐시를 초기화하는 로직이 추가로 필요합니다.
