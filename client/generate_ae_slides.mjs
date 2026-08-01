import fs from 'fs';
import path from 'path';

// Unit names mapping
const UNIT_NAMES = {
  '01': '01. 절삭이론 및 절삭조건',
  '02': '02. 선반, 밀링 및 범용 공작기계',
  '03': '03. 특수가공 및 정밀가공',
  '04': '04. 재료시험 및 측정기/게이지',
  '05': '05. 기계제도 및 투상법',
  '06': '06. 치수공차 및 기하공차',
  '07': '07. 결합용/축용 기계요소',
  '08': '08. 주조, 용접 및 열처리 공정',
  '09': '09. 유압유 성질 및 점도지수',
  '10': '10. 유압 기초 및 유동 법칙',
  '11': '11. 유압 펌프 및 제어밸브',
  '12': '12. 유압 액추에이터 및 부속기기',
  '13': '13. 공압기기 및 공압 논리회로',
  '14': '14. 유공압 응용회로 및 카운터',
  '15': '15. CNC 가공 기초 및 좌표계',
  '16': '16. CNC 고정 사이클 프로그래밍',
  '17': '17. CNC 원점복귀 및 공구보정',
  '18': '18. 제어의 기초 및 블록선도',
  '19': '19. 논리 시퀀스 및 무접점 회로',
  '20': '20. 전기회로 및 계전기 제어',
  '21': '21. PLC 제어 및 로더 프로그램',
  '22': '22. 센서 및 변환기',
  '23': '23. 제어계 분류 및 서보기구',
  '24': '24. 산업용 로봇 구조 및 자유도',
  '25': '25. 로봇 구동 액추에이터 및 모터',
  '26': '26. 메카트로닉스 제어 기구',
  '27': '27. 로봇 티칭 및 플레이백',
  '28': '28. 유연생산시스템(FMS) 및 스마트공장',
  '29': '29. 물류 반송 및 자동 운반'
};

// Subunits question counts to determine set counts
const SET_COUNTS = {
  '01': 2, '02': 2, '03': 2, '04': 1, '05': 2, '06': 1, '07': 2, '08': 2, '09': 2, '10': 2,
  '11': 1, '12': 1, '13': 2, '14': 1, '15': 2, '16': 2, '17': 2, '18': 1, '19': 1, '20': 2,
  '21': 1, '22': 1, '23': 1, '24': 1, '25': 1, '26': 1, '27': 2, '28': 2, '29': 2
};

// SVGs Helper
function getSvg(unitKey, topicIdx) {
  const bg = `<rect width="400" height="250" rx="20" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>`;
  
  // Custom curated SVGs for each unit & topic
  switch (unitKey) {
    case '01':
      if (topicIdx === 0) { // 칩 형태
        return `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">${bg}
          <text x="200" y="40" font-family="sans-serif" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="middle">절삭 칩(Chip)의 4가지 형태</text>
          <g transform="translate(40, 70)">
            <rect x="0" y="0" width="70" height="120" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5"/>
            <text x="35" y="30" font-family="sans-serif" font-size="12" font-weight="bold" fill="#1d4ed8" text-anchor="middle">유동형</text>
            <path d="M15,60 C25,50 45,50 55,60 C65,70 55,90 35,90" fill="none" stroke="#2563eb" stroke-width="3"/>
            <text x="35" y="110" font-family="sans-serif" font-size="10" fill="#475569" text-anchor="middle">연성/고속 (최상)</text>
          </g>
          <g transform="translate(125, 70)">
            <rect x="0" y="0" width="70" height="120" rx="8" fill="#ecfdf5" stroke="#10b981" stroke-width="1.5"/>
            <text x="35" y="30" font-family="sans-serif" font-size="12" font-weight="bold" fill="#047857" text-anchor="middle">전단형</text>
            <path d="M15,60 L25,70 L35,60 L45,70 L55,60" fill="none" stroke="#059669" stroke-width="3"/>
            <text x="35" y="110" font-family="sans-serif" font-size="10" fill="#475569" text-anchor="middle">탄소강/중속</text>
          </g>
          <g transform="translate(210, 70)">
            <rect x="0" y="0" width="70" height="120" rx="8" fill="#fffbeb" stroke="#f59e0b" stroke-width="1.5"/>
            <text x="35" y="30" font-family="sans-serif" font-size="12" font-weight="bold" fill="#b45309" text-anchor="middle">열단형</text>
            <path d="M15,70 C15,60 25,60 30,70 C35,80 45,80 55,70" fill="none" stroke="#d97706" stroke-width="3"/>
            <text x="35" y="110" font-family="sans-serif" font-size="10" fill="#475569" text-anchor="middle">점성/저속 (찢어짐)</text>
          </g>
          <g transform="translate(295, 70)">
            <rect x="0" y="0" width="70" height="120" rx="8" fill="#fef2f2" stroke="#ef4444" stroke-width="1.5"/>
            <text x="35" y="30" font-family="sans-serif" font-size="12" font-weight="bold" fill="#b91c1c" text-anchor="middle">균열형</text>
            <circle cx="25" cy="65" r="3" fill="#dc2626"/>
            <circle cx="45" cy="70" r="4" fill="#dc2626"/>
            <circle cx="35" cy="80" r="2" fill="#dc2626"/>
            <text x="35" y="110" font-family="sans-serif" font-size="10" fill="#475569" text-anchor="middle">취성/저속 (주철)</text>
          </g>
        </svg>`;
      } else if (topicIdx === 1) { // 구성인선
        return `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">${bg}
          <text x="200" y="40" font-family="sans-serif" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="middle">구성인선(Built-up Edge) 사이클</text>
          <circle cx="200" cy="135" r="50" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="6 4"/>
          <g transform="translate(200, 85)">
            <circle cx="0" cy="0" r="20" fill="#3b82f6"/>
            <text x="0" y="4" font-family="sans-serif" font-size="10" fill="#ffffff" font-weight="bold" text-anchor="middle">발생</text>
          </g>
          <g transform="translate(250, 135)">
            <circle cx="0" cy="0" r="20" fill="#10b981"/>
            <text x="0" y="4" font-family="sans-serif" font-size="10" fill="#ffffff" font-weight="bold" text-anchor="middle">성장</text>
          </g>
          <g transform="translate(200, 185)">
            <circle cx="0" cy="0" r="20" fill="#f59e0b"/>
            <text x="0" y="4" font-family="sans-serif" font-size="10" fill="#ffffff" font-weight="bold" text-anchor="middle">분열</text>
          </g>
          <g transform="translate(150, 135)">
            <circle cx="0" cy="0" r="20" fill="#ef4444"/>
            <text x="0" y="4" font-family="sans-serif" font-size="10" fill="#ffffff" font-weight="bold" text-anchor="middle">탈락</text>
          </g>
          <text x="200" y="230" font-family="sans-serif" font-size="11" fill="#475569" text-anchor="middle">방지책: 고속 절삭, 큰 경사각, 절삭유 공급</text>
        </svg>`;
      } else { // 절삭저항 및 속도
        return `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">${bg}
          <text x="200" y="40" font-family="sans-serif" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="middle">절삭 3분력 (Forces) 대조</text>
          <g transform="translate(40, 70)">
            <rect x="0" y="0" width="320" height="35" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="1"/>
            <text x="15" y="22" font-family="sans-serif" font-size="12" font-weight="bold" fill="#1d4ed8">주분력 (가장 큼)</text>
            <text x="305" y="22" font-family="sans-serif" font-size="11" fill="#475569" text-anchor="end">가공 평행 방향 힘</text>
          </g>
          <g transform="translate(40, 115)">
            <rect x="0" y="0" width="320" height="35" rx="6" fill="#fffbeb" stroke="#f59e0b" stroke-width="1"/>
            <text x="15" y="22" font-family="sans-serif" font-size="12" font-weight="bold" fill="#b45309">배분력 (중간)</text>
            <text x="305" y="22" font-family="sans-serif" font-size="11" fill="#475569" text-anchor="end">공구를 뒤로 밀어내는 힘</text>
          </g>
          <g transform="translate(40, 160)">
            <rect x="0" y="0" width="320" height="35" rx="6" fill="#fef2f2" stroke="#ef4444" stroke-width="1"/>
            <text x="15" y="22" font-family="sans-serif" font-size="12" font-weight="bold" fill="#b91c1c">이송분력 (가장 작음)</text>
            <text x="305" y="22" font-family="sans-serif" font-size="11" fill="#475569" text-anchor="end">이송 방향 저항</text>
          </g>
          <text x="200" y="225" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="middle">v = (π * D * n) / 1000  [m/min]</text>
        </svg>`;
      }
    case '02': // 선반/밀링
      if (topicIdx === 1) { // 상향/하향 절삭
        return `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">${bg}
          <text x="200" y="35" font-family="sans-serif" font-size="15" font-weight="bold" fill="#0f172a" text-anchor="middle">상향 절삭 vs 하향 절삭</text>
          <g transform="translate(20, 60)">
            <rect x="0" y="0" width="170" height="150" rx="10" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5"/>
            <text x="85" y="25" font-family="sans-serif" font-size="13" font-weight="bold" fill="#1d4ed8" text-anchor="middle">상향 절삭 (Up Cut)</text>
            <text x="20" y="55" font-family="sans-serif" font-size="11" fill="#334155">• 회전과 이송이 반대</text>
            <text x="20" y="80" font-family="sans-serif" font-size="11" fill="#334155">• 칩이 아래에서 위로</text>
            <text x="20" y="105" font-family="sans-serif" font-size="11" fill="#334155">• 공작물을 들어올림</text>
            <text x="20" y="130" font-family="sans-serif" font-size="11" fill="#334155">• 날 마모 큼 (수명 짧음)</text>
          </g>
          <g transform="translate(210, 60)">
            <rect x="0" y="0" width="170" height="150" rx="10" fill="#ecfdf5" stroke="#10b981" stroke-width="1.5"/>
            <text x="85" y="25" font-family="sans-serif" font-size="13" font-weight="bold" fill="#047857" text-anchor="middle">하향 절삭 (Down Cut)</text>
            <text x="20" y="55" font-family="sans-serif" font-size="11" fill="#334155">• 회전과 이송이 일치</text>
            <text x="20" y="80" font-family="sans-serif" font-size="11" fill="#334155">• 칩이 위에서 아래로</text>
            <text x="20" y="105" font-family="sans-serif" font-size="11" fill="#334155">• 공작물을 아래로 누름</text>
            <text x="20" y="130" font-family="sans-serif" font-size="11" fill="#334155">• 백래시 제거 장치 필요</text>
          </g>
        </svg>`;
      }
      break;
    case '05': // 제도
      if (topicIdx === 0) {
        return `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">${bg}
          <text x="200" y="40" font-family="sans-serif" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="middle">제3각법 투상 배치도</text>
          <rect x="150" y="100" width="100" height="60" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
          <text x="200" y="135" font-family="sans-serif" font-size="14" font-weight="bold" fill="#1d4ed8" text-anchor="middle">정면도</text>
          
          <rect x="150" y="25" width="100" height="50" rx="6" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.5"/>
          <text x="200" y="55" font-family="sans-serif" font-size="12" fill="#475569" text-anchor="middle">평면도</text>

          <rect x="270" y="100" width="80" height="60" rx="6" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.5"/>
          <text x="310" y="135" font-family="sans-serif" font-size="12" fill="#475569" text-anchor="middle">우측면도</text>

          <rect x="50" y="100" width="80" height="60" rx="6" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.5"/>
          <text x="90" y="135" font-family="sans-serif" font-size="12" fill="#475569" text-anchor="middle">좌측면도</text>
          
          <text x="200" y="200" font-family="sans-serif" font-size="11" fill="#64748b" text-anchor="middle">정면도를 기준으로 위에는 평면도, 우측에는 우측면도 배치</text>
        </svg>`;
      }
      break;
    case '10': // 유압 기초
      if (topicIdx === 0) { // 파스칼 법칙
        return `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">${bg}
          <text x="200" y="40" font-family="sans-serif" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="middle">파스칼의 법칙 (Pascal's Law)</text>
          <path d="M80,100 L80,160 L320,160 L320,80" fill="none" stroke="#3b82f6" stroke-width="30" stroke-linecap="square"/>
          <rect x="65" y="70" width="30" height="30" fill="#ef4444" rx="4"/>
          <text x="80" y="60" font-family="sans-serif" font-size="11" font-weight="bold" fill="#b91c1c" text-anchor="middle">F1 = 10kgf</text>
          <text x="80" y="118" font-family="sans-serif" font-size="10" fill="#ffffff" text-anchor="middle">A1</text>
          
          <rect x="290" y="50" width="60" height="30" fill="#10b981" rx="4"/>
          <text x="320" y="40" font-family="sans-serif" font-size="11" font-weight="bold" fill="#047857" text-anchor="middle">F2 = 100kgf</text>
          <text x="320" y="98" font-family="sans-serif" font-size="10" fill="#ffffff" text-anchor="middle">A2 = A1*10</text>
          
          <text x="200" y="210" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="middle">압력 P = F1 / A1 = F2 / A2</text>
          <text x="200" y="230" font-family="sans-serif" font-size="11" fill="#475569" text-anchor="middle">"밀폐 용기 내부의 압력은 모든 방향으로 동일하게 전달된다."</text>
        </svg>`;
      }
      break;
    case '15': // CNC 기초
      if (topicIdx === 0) { // 좌표계
        return `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">${bg}
          <text x="200" y="35" font-family="sans-serif" font-size="15" font-weight="bold" fill="#0f172a" text-anchor="middle">CNC 공작기계 오른손 직각좌표계</text>
          <g transform="translate(200,130)">
            <line x1="0" y1="0" x2="100" y2="0" stroke="#3b82f6" stroke-width="3" marker-end="url(#arrow)"/>
            <text x="110" y="5" font-family="sans-serif" font-size="12" font-weight="bold" fill="#1d4ed8">+Z 축 (주축 방향)</text>
            
            <line x1="0" y1="0" x2="0" y2="-90" stroke="#10b981" stroke-width="3" marker-end="url(#arrow)"/>
            <text x="0" y="-100" font-family="sans-serif" font-size="12" font-weight="bold" fill="#047857" text-anchor="middle">+X 축</text>
            
            <line x1="0" y1="0" x2="-60" y2="60" stroke="#ef4444" stroke-width="3" marker-end="url(#arrow)"/>
            <text x="-70" y="75" font-family="sans-serif" font-size="12" font-weight="bold" fill="#b91c1c" text-anchor="middle">+Y 축</text>
          </g>
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569"/>
            </marker>
          </defs>
        </svg>`;
      }
      break;
    case '18': // 제어 기초
      if (topicIdx === 0) { // 피드백 루프
        return `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">${bg}
          <text x="200" y="40" font-family="sans-serif" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="middle">피드백 제어 시스템 블록선도</text>
          
          <rect x="20" y="90" width="70" height="40" rx="6" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1.5"/>
          <text x="55" y="115" font-family="sans-serif" font-size="11" fill="#334155" text-anchor="middle">목표값</text>
          <line x1="90" y1="110" x2="120" y2="110" stroke="#64748b" stroke-width="1.5" marker-end="url(#arrow)"/>

          <circle cx="130" cy="110" r="10" fill="none" stroke="#64748b" stroke-width="1.5"/>
          <text x="130" y="113" font-family="sans-serif" font-size="10" text-anchor="middle">±</text>
          <line x1="140" y1="110" x2="160" y2="110" stroke="#64748b" stroke-width="1.5" marker-end="url(#arrow)"/>

          <rect x="160" y="90" width="80" height="40" rx="6" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
          <text x="200" y="115" font-family="sans-serif" font-size="11" font-weight="bold" fill="#1d4ed8" text-anchor="middle">제어 장치</text>
          <line x1="240" y1="110" x2="260" y2="110" stroke="#64748b" stroke-width="1.5" marker-end="url(#arrow)"/>

          <rect x="260" y="90" width="80" height="40" rx="6" fill="#ecfdf5" stroke="#10b981" stroke-width="2"/>
          <text x="300" y="115" font-family="sans-serif" font-size="11" font-weight="bold" fill="#047857" text-anchor="middle">제어 대상</text>
          
          <line x1="340" y1="110" x2="380" y2="110" stroke="#64748b" stroke-width="1.5" marker-end="url(#arrow)"/>
          <text x="365" y="100" font-family="sans-serif" font-size="10" fill="#334155" text-anchor="middle">출력값</text>

          <line x1="360" y1="110" x2="360" y2="180" stroke="#64748b" stroke-width="1.5"/>
          <line x1="360" y1="180" x2="200" y2="180" stroke="#64748b" stroke-width="1.5"/>
          <rect x="150" y="160" width="80" height="40" rx="6" fill="#fffbeb" stroke="#f59e0b" stroke-width="1.5"/>
          <text x="190" y="185" font-family="sans-serif" font-size="11" fill="#b45309" text-anchor="middle">검출 장치</text>
          <line x1="150" y1="180" x2="130" y2="180" stroke="#64748b" stroke-width="1.5"/>
          <line x1="130" y1="180" x2="130" y2="120" stroke="#64748b" stroke-width="1.5" marker-end="url(#arrow)"/>
        </svg>`;
      }
      break;
    case '19': // 논리 시퀀스
      if (topicIdx === 0) { // 논리 게이트
        return `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">${bg}
          <text x="200" y="40" font-family="sans-serif" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="middle">3대 기본 논리 게이트</text>
          <g transform="translate(30, 80)">
            <rect x="0" y="0" width="100" height="110" rx="8" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5"/>
            <text x="50" y="25" font-family="sans-serif" font-size="14" font-weight="bold" fill="#1d4ed8" text-anchor="middle">AND</text>
            <path d="M 25 50 L 50 50 Q 75 50 75 70 Q 75 90 50 90 L 25 90 Z" fill="none" stroke="#2563eb" stroke-width="2"/>
            <text x="50" y="102" font-family="sans-serif" font-size="10" fill="#475569" text-anchor="middle">Y = A * B</text>
          </g>
          <g transform="translate(150, 80)">
            <rect x="0" y="0" width="100" height="110" rx="8" fill="#ecfdf5" stroke="#10b981" stroke-width="1.5"/>
            <text x="50" y="25" font-family="sans-serif" font-size="14" font-weight="bold" fill="#047857" text-anchor="middle">OR</text>
            <path d="M 25 50 Q 50 50 75 70 Q 50 90 25 90 Q 40 70 25 50 Z" fill="none" stroke="#059669" stroke-width="2"/>
            <text x="50" y="102" font-family="sans-serif" font-size="10" fill="#475569" text-anchor="middle">Y = A + B</text>
          </g>
          <g transform="translate(270, 80)">
            <rect x="0" y="0" width="100" height="110" rx="8" fill="#fef2f2" stroke="#ef4444" stroke-width="1.5"/>
            <text x="50" y="25" font-family="sans-serif" font-size="14" font-weight="bold" fill="#b91c1c" text-anchor="middle">NOT</text>
            <polygon points="30,50 70,70 30,90" fill="none" stroke="#dc2626" stroke-width="2"/>
            <circle cx="75" cy="70" r="4" fill="none" stroke="#dc2626" stroke-width="2"/>
            <text x="50" y="102" font-family="sans-serif" font-size="10" fill="#475569" text-anchor="middle">Y = A'</text>
          </g>
        </svg>`;
      }
      break;
    case '21': // PLC 제어
      if (topicIdx === 0) { // 래더 다이어그램
        return `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">${bg}
          <text x="200" y="35" font-family="sans-serif" font-size="15" font-weight="bold" fill="#0f172a" text-anchor="middle">PLC 래더 다이어그램 (자기유지)</text>
          <line x1="50" y1="50" x2="50" y2="200" stroke="#475569" stroke-width="3"/>
          <line x1="350" y1="50" x2="350" y2="200" stroke="#475569" stroke-width="3"/>
          
          <line x1="50" y1="90" x2="100" y2="90" stroke="#64748b" stroke-width="2"/>
          <text x="115" y="80" font-family="sans-serif" font-size="11" fill="#334155" text-anchor="middle">START</text>
          <line x1="100" y1="80" x2="100" y2="100" stroke="#3b82f6" stroke-width="2"/>
          <line x1="110" y1="80" x2="110" y2="100" stroke="#3b82f6" stroke-width="2"/>
          <line x1="110" y1="90" x2="160" y2="90" stroke="#64748b" stroke-width="2"/>
          
          <text x="175" y="80" font-family="sans-serif" font-size="11" fill="#334155" text-anchor="middle">STOP</text>
          <line x1="160" y1="80" x2="160" y2="100" stroke="#ef4444" stroke-width="2"/>
          <line x1="170" y1="80" x2="170" y2="100" stroke="#ef4444" stroke-width="2"/>
          <line x1="160" y1="100" x2="170" y2="80" stroke="#ef4444" stroke-width="2"/>
          <line x1="170" y1="90" x2="260" y2="90" stroke="#64748b" stroke-width="2"/>

          <circle cx="280" cy="90" r="15" fill="none" stroke="#10b981" stroke-width="2"/>
          <text x="280" y="94" font-family="sans-serif" font-size="11" font-weight="bold" fill="#047857" text-anchor="middle">Y0</text>
          <line x1="295" y1="90" x2="350" y2="90" stroke="#64748b" stroke-width="2"/>

          <line x1="80" y1="90" x2="80" y2="140" stroke="#64748b" stroke-width="2"/>
          <line x1="80" y1="140" x2="100" y2="140" stroke="#64748b" stroke-width="2"/>
          <text x="115" y="130" font-family="sans-serif" font-size="11" fill="#334155" text-anchor="middle">Y0접점</text>
          <line x1="100" y1="130" x2="100" y2="150" stroke="#3b82f6" stroke-width="2"/>
          <line x1="110" y1="130" x2="110" y2="150" stroke="#3b82f6" stroke-width="2"/>
          <line x1="110" y1="140" x2="140" y2="140" stroke="#64748b" stroke-width="2"/>
          <line x1="140" y1="140" x2="140" y2="90" stroke="#64748b" stroke-width="2"/>
        </svg>`;
      }
      break;
  }

  // Fallback: A nice generic visual concept illustration box
  return `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">${bg}
    <text x="200" y="50" font-family="sans-serif" font-size="15" font-weight="bold" fill="#0f172a" text-anchor="middle">자동화설비 핵심 원리 분석</text>
    <rect x="50" y="80" width="300" height="90" rx="12" fill="#eff6ff" stroke="#3b82f6" stroke-width="2" />
    <circle cx="95" cy="125" r="22" fill="#dbeafe" />
    <text x="95" y="132" font-family="sans-serif" font-size="20" text-anchor="middle">💡</text>
    <text x="135" y="115" font-family="sans-serif" font-size="13" font-weight="bold" fill="#1e3a8a">핵심 개념 요약</text>
    <text x="135" y="138" font-family="sans-serif" font-size="11" fill="#475569">주요 내용과 문제 출제 포인트를 암기하세요.</text>
    <text x="200" y="210" font-family="sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle">두기고 Smart License Slide System</text>
  </svg>`;
}

// Convert notes markdown string into structured slides
function parseNotesToSlides(unitKey, subject, unitName, notesText) {
  const slides = [];
  const parts = notesText.split('## [주제');
  
  let slideId = 1;

  // Header slide representing the unit overview
  slides.push({
    id: slideId++,
    style: "Expert",
    image: "",
    emoji: "📘",
    title: `${unitName} 학습 시작!`,
    content: `지금부터 ${unitName} 단원의 핵심 이론 요약 슬라이드를 학습합니다. 기출문제를 분석하여 꼭 외워야 할 알짜 개념들만 엄선했어요! 한 장씩 넘겨보며 원리와 출제 경향을 머릿속에 쏙쏙 집어넣어 보세요.`,
    exam_point: `📌 단원 핵심 목표\n- 주요 개념의 정의 및 특징 파악\n- 시험에 단골 출제되는 오답 함정 극복`,
    svg: getSvg(unitKey, -1)
  });

  // Extract from each topic
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const lines = part.split('\n');
    const titleLine = lines[0].replace(/^ \d+\]\s*/, '').trim(); // E.g., "절삭가공 및 칩(Chip)의 형태"
    
    // Extract core definition
    let definition = "";
    let definitionIdx = part.indexOf('### 1. 핵심 정의');
    if (definitionIdx !== -1) {
      const defSection = part.substring(definitionIdx).split('###')[1] || "";
      definition = defSection.replace('1. 핵심 정의', '').replace('핵심 정의', '').replace('###', '').trim();
    }

    // Extract main features
    let featuresText = "";
    let featuresIdx = part.indexOf('### 2. 주요 특징');
    if (featuresIdx !== -1) {
      const featSection = part.substring(featuresIdx).split('###')[1] || "";
      featuresText = featSection.replace('2. 주요 특징', '').replace('주요 특징', '').replace('###', '').trim();
    }

    // Prepare explanation text (middle-school level, simple and friendly)
    let content = definition ? definition : "단원 핵심 내용 요약입니다.";
    if (featuresText) {
      const featLines = featuresText.split('\n').map(l => l.trim()).filter(l => l.match(/^\d+\./)).slice(0, 3);
      if (featLines.length > 0) {
        content += "\n\n" + featLines.join('\n');
      }
    }

    // Clean markdown bold tags
    content = content.replace(/\*\*/g, '').substring(0, 250);

    // Extract formulas or comparisons if present to show as exam points
    let examPoint = "";
    let comparisonIdx = part.indexOf('### 3. 비교 분석');
    let formulaIdx = part.indexOf('### 3. 계산식 및 예제');
    
    if (comparisonIdx !== -1) {
      const compSection = part.substring(comparisonIdx).split('###')[1] || "";
      examPoint = "🔍 중요 대조/비교 포인트\n" + compSection.trim().replace(/\*\*/g, '').split('\n').slice(0, 5).join('\n');
    } else if (formulaIdx !== -1) {
      const formulaSection = part.substring(formulaIdx).split('###')[1] || "";
      examPoint = "🧮 공식 및 예제 풀이\n" + formulaSection.trim().replace(/\*\*/g, '').split('\n').slice(0, 6).join('\n');
    } else {
      examPoint = `📌 핵심 출제 포인트\n` + featuresText.split('\n').map(l => l.trim()).filter(l => l.match(/^\d+\./)).slice(0, 4).join('\n').replace(/\d+\.\s*/g, '• ');
    }

    slides.push({
      id: slideId++,
      style: "Expert",
      image: "",
      emoji: "⚙️",
      title: titleLine.replace(/^\]\s*/, '').trim(),
      content: content,
      exam_point: examPoint.substring(0, 300),
      svg: getSvg(unitKey, i - 1)
    });
  }

  // Extract "헷갈리기 쉬운 짝" if it exists
  const confusionIdx = notesText.indexOf('## [헷갈리기 쉬운 짝]');
  if (confusionIdx !== -1) {
    const confusionSection = notesText.substring(confusionIdx).replace('## [헷갈리기 쉬운 짝]', '').trim();
    slides.push({
      id: slideId++,
      style: "Expert",
      image: "",
      emoji: "💡",
      title: "헷갈리기 쉬운 개념 비교!",
      content: "자주 헷갈려 시험에서 오답 함정으로 자주 쓰이는 쌍둥이 개념들을 대조 정리해 둡니다. 두 용어를 서로 짝지어 정확하게 구분하는 능력이 시험 고득점의 비결이에요!",
      exam_point: "⚠️ 시험에 오답으로 출제되는 함정 포인트\n" + confusionSection.replace(/\*/g, '').trim(),
      svg: getSvg(unitKey, 99)
    });
  }

  return slides;
}

function generate() {
  const scratchDir = 'C:/Users/HomeMyRoom/.gemini/antigravity/brain/5d09c2f1-388d-441d-8443-3da420449923/scratch';
  const compNotesPath = path.join(scratchDir, 'comprehensive_notes_data.json');
  
  if (!fs.existsSync(compNotesPath)) {
    console.error("comprehensive_notes_data.json not found!");
    return;
  }
  
  const notesData = JSON.parse(fs.readFileSync(compNotesPath, 'utf8'));
  const targetDir = 'F:/App/Dukigo/client/public/summaries/자동화설비산업기사';
  
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  console.log("Generating slides for 29 units...");
  
  let totalFilesGenerated = 0;
  
  Object.keys(notesData).forEach(unitKey => {
    const rawNotes = notesData[unitKey];
    const unitName = UNIT_NAMES[unitKey];
    
    if (!unitName) {
      console.warn(`Unit key ${unitKey} has no mapping name!`);
      return;
    }
    
    // Parse the entire slides of this unit
    const allSlides = parseNotesToSlides(unitKey, '자동화설비산업기사', unitName, rawNotes);
    const setsNeeded = SET_COUNTS[unitKey] || 1;
    
    const cleanUnit = unitName.replace(/\s*\(\d+부\)$/, '').trim();
    const safeUnitName = cleanUnit.replace(/[^a-z0-9가-힣]/gi, '_');
    
    // Save for each set
    for (let setNum = 1; setNum <= setsNeeded; setNum++) {
      const fileName = `${safeUnitName}_${setNum}세트.json`;
      const filePath = path.join(targetDir, fileName);
      
      // Let's divide slides among sets
      let setSlides = [];
      if (setsNeeded === 1) {
        setSlides = allSlides;
      } else {
        // If 2 sets:
        // Set 1 gets Slide 1 (intro), Slide 2 (topic 1), Slide 3 (topic 2)
        // Set 2 gets Slide 1 (intro), Slide 4 (topic 3), and remaining slides
        if (setNum === 1) {
          setSlides = allSlides.slice(0, Math.ceil(allSlides.length / 2) + 1);
        } else {
          setSlides = [allSlides[0], ...allSlides.slice(Math.ceil(allSlides.length / 2) + 1)];
          // re-index setSlides ids
          setSlides = setSlides.map((s, idx) => ({ ...s, id: idx + 1 }));
        }
      }
      
      const payload = {
        subject: "자동화설비산업기사",
        unit: unitName,
        set: setNum,
        slides: setSlides
      };
      
      fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
      totalFilesGenerated++;
    }
  });
  
  console.log(`Successfully generated ${totalFilesGenerated} slide JSON files in: ${targetDir}`);
}

generate();
