# AI 개발을 위한 상세 기획안

이 문서는 시스템 고도화 항목들을 기술적으로 상세화하여 개발 프롬프트 또는 시스템 설계서의 핵심 뼈대로 사용할 수 있도록 정리한 것입니다.

---

## 🏗️ 1. 글로벌 컨트롤 타워: 운영자 제어 변수 (Global Config)
소유자와 선생님이 코드 수정 없이 대시보드에서 즉시 튜닝할 수 있도록 모든 수치를 변수화합니다.

### A. 학습 및 게임화 밸런스 (STUDY_CONFIG)
- **PASS_THRESHOLD_ACCURACY**: 트레이싱 통과 점수 (Default: 95)
- **TEMP_WEIGHTS**: `{ CORRECT: +2.0, WRONG: -1.0, STREAK_BONUS: +0.5 }`
- **IDLE_TIMEOUTS**: `{ SHORT: 90, LONG: 240 }` (초 단위 무응답 감지)
- **SUBJECT_TYPE**: `['KEC', 'Architecture', '3D_Print', 'General_School']` (과목 확장용)

### B. 보안 및 접근 제어 (SECURITY_CONFIG)
- **MAX_TABS**: 허용 브라우저 탭 수 (Default: 1)
- **SCREEN_PROTECTION_LEVEL**: `['NONE', 'BLUR', 'LOCK', 'LOGOUT']`
- **WATERMARK_OPACITY**: 사용자 정보 워터마크 투명도 (0.1 ~ 0.5)

### C. 비즈니스 및 환급 (FINANCE_CONFIG)
- **BASE_FEE**: 기본 수강료 (Toss Payments 연동 금액)
- **REFUND_POLICY**: `{ TYPE: 'FULL_REFUND', CONDITION: 'CERTIFICATE_VALIDATED' }`
- **TRIAL_LIMIT**: 미리보기 제공 문항 수 (Default: 10)

---

## 👨‍👩‍👧‍👦 2. 확장 모듈: 학부모 모니터링 & 격려 시스템
부모님이 자녀의 학습에 개입하되, **'감시'가 아닌 '격려'**의 도구가 되도록 설계합니다.

- **실시간 안심 알림**: 자녀가 학습을 시작하거나 '피버 모드' 진입 시 Push 알림.
- **격려 메시지 (Nudge)**: 부모 앱에서 "화이팅!" 버튼 클릭 시 자녀 학습 화면에 애니메이션과 함께 부모님이 설정한 보너스 온도(+0.5) 지급.
- **주간 리포트**: "이번 주 우리 아이의 가장 뜨거웠던 순간(최고 온도)", "취약한 KEC 수치 암기 현황" 제공.

---

## 💳 3. 토스 페이먼츠 & 환급 자동화 파이프라인
신뢰도를 높이기 위한 '선결제 후 환급' 프로세스의 상태 머신(State Machine)입니다.

1. **Payment (Toss API)**: 결제 완료 시 `User_Subscription` 테이블에 `paid` 상태 기록.
2. **Study & Exam**: 실전 CBT 60점 이상 달성 및 실제 시험 응시.
3. **OCR Verification**: 사용자가 합격증 업로드 -> Google Vision API 또는 자체 OCR 엔진으로 이름/생년월일/합격여부 대조.
4. **Auto Refund**: 검증 성공 시 토스 페이먼츠 `CancelPayment` API 호출 (전액 환급 처리).

---

## 🔄 4. 통합 데이터 흐름도 (Advanced DFD)
- **Tenant(학교/과목) 레이어**: `School_ID`, `Subject_ID`를 기준으로 모든 DB Query가 필터링됩니다.
- **Security 레이어**: Heartbeat가 끊기거나 Config 위반 시 즉시 UI를 차단합니다.
- **Action 레이어**: 학습 데이터는 Teacher와 Parent 대시보드에 실시간(Real-time)으로 브로드캐스팅됩니다.

---

## 🛠️ 5. AI를 위한 구현 순서 (Function Execution Order)
AI에게 코드를 작성시킬 때 이 순서를 지키라고 명시하세요.

1. **Interface Definition**: Config 객체와 User/Subject 스키마 정의.
2. **Infrastructure**: Supabase Auth 및 `useConfig` 커스텀 훅 (DB의 설정값을 클라이언트에 주입).
3. **Core Logic**: `calculateAccuracy` (트레이싱) -> `updateTemperature` (보상) -> `logAudit` (보안).
4. **Payment Hook**: `useTossPayment` (결제창 호출 및 웹훅 처리).
5. **Parental API**: 부모-자녀 연결 및 격려 메시지 전송 RPC 함수.
6. **UI/UX**: Framer Motion 기반의 온도 게이지 및 피버 모드 시각화.

---

## 🏗️ 6. 멀티 테넌트 및 역할 기반 DB 설계 (The Foundation)
모든 데이터는 학교(`school_id`)와 과목(`subject_id`)에 따라 격리되어야 합니다.

### [Table: `Global_Configs`]
- `id`, `school_id`, `subject_id`, `config_json`: (운영 제어 변수 저장)

### [Table: `User_Relations`]
- `id`, `parent_id` (UUID), `student_id` (UUID), `is_active` (boolean): (학부모-자녀 연결)

---

## 🛡️ 7. 인프라 및 보안 모듈 상세 (Module 1)
### [Logic: `SecurityGuard` 함수 시퀀스]
1. **`useHeartbeat`**: `localStorage`에 `tab_id`와 `last_active`를 1초마다 갱신. `storage` 이벤트를 감지하여 다른 탭이 활성화되면 현재 페이지를 `blur` 처리하고 안내 모달 출력.
2. **`CanvasRenderer`**: 텍스트 데이터를 받아 `HTML Canvas`에 렌더링. `ctx.fillText` 시 `Math.random()`을 이용해 미세한 노이즈와 간섭선을 추가하여 OCR 방지.
3. **`useAdaptiveStyle`**: 기기 사양을 체크하여 저사양 기기일 경우 애니메이션 속성 조정.

---

## 🧠 8. 지능형 학습 엔진 상세 (Module 2)
### [Logic: `calculateLevenshtein(s1, s2)`]
- **목적**: 따라쓰기(Tracing)의 정확도 산출.
- **상세**: 삽입, 삭제, 교체 가중치 계산. `accuracy >= TRACING_PASS_THRESHOLD`일 때만 다음 단계 잠금 해제.

### [Logic: `ActiveRecallGenerator`]
1. 이론 텍스트 내에서 **숫자**, **단위**, **고유명사** 자동 추출.
2. 추출된 단어를 입력창으로 치환하여 노출.

---

## 🔥 9. 도파민 루프 및 몰입 제어 상세 (Module 3 & 4)
### [Sequence: `onCorrectAnswer`]
1. **Vibration API**: 진동 피드백.
2. **Temperature Update**: 정답 시 온도 상승.
3. **Combo Check**: 일정 콤보 달성 시 효과 및 보너스 온도.
4. **Fever Mode**: 특정 온도 도달 시 테마 전환 및 애니메이션 가속.

---

## 👨‍🏫 10. 교사 및 학부모 관제 시스템 (Module 5)
### [API: `generateAIComment(student_id)`]
- 최근 학습 데이터를 수집하여 AI가 상담 코멘트 자동 생성 (예: "수치 암기는 우수하나 계산 공식 적용에 코칭 필요").

### [API: `ParentNudge`]
- 학부모의 '응원하기' 클릭 시 실시간 토스트 메시지와 애니메이션 노출.

---

## 💰 11. 결제 및 환급 상태 머신 (Module 6)
| 단계 | 액션 | 조건 |
| :--- | :--- | :--- |
| `PAID` | 토스 결제 완료 | `payment_key` 저장 |
| `VERIFYING` | 합격증 업로드 | `Google Vision API` 호출 |
| `MANUAL_REVIEW` | AI 신뢰도 저하 | 확신도 임계값 미달 시 관리자 개입 |
| `APPROVED` | 검증 성공 | 이미지 중복 체크 통과 |
| `REFUNDED` | 토스 API 호출 | 전액 환급 처리 및 로그 기록 |

---

## 💡 개발 시 유의사항
- **UI 일관성**: `Shadcn/UI` 및 `Tailwind CSS`를 사용한 Atomic Design 적용.
- **상태 중심 UI**: `config` 객체에 따라 버튼 노출 및 레이아웃이 동적으로 변하도록 설계.
- **멱등성 확보**: 환급 요청 시 중복 처리가 되지 않도록 DB 레벨에서 고유 제약 조건 설정.
