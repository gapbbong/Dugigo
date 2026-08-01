import fs from 'fs';
import path from 'path';

// Unit names mapping
const UNIT_NAMES = {
  '10': '10. 유압 기초 및 유동 법칙'
};

const SET_COUNTS = {
  '10': 2
};

function getHybridSvg(slideId, imagePath) {
  const bgImage = `<image href="${imagePath}" x="0" y="0" width="400" height="250" preserveAspectRatio="xMidYMid slice" />`;
  const gradientOverlay = `
    <rect x="0" y="0" width="400" height="250" fill="url(#overlay-grad)" opacity="0.35" />
    <defs>
      <linearGradient id="overlay-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.1" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.75" />
      </linearGradient>
    </defs>
  `;

  // Standard drop shadow filter for text labels
  const shadowFilter = `
    <defs>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.6"/>
      </filter>
    </defs>
  `;

  switch(slideId) {
    case 2: // Pascal's Law
      return `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">
        ${bgImage}
        ${gradientOverlay}
        ${shadowFilter}
        <rect x="15" y="55" width="145" height="30" rx="4" fill="#0f172a" opacity="0.8" />
        <text x="87" y="74" font-family="sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">입력 피스톤 (A1, F1)</text>
        <line x1="87" y1="88" x2="87" y2="115" stroke="#f43f5e" stroke-width="2.5" marker-end="url(#arrow)"/>
        
        <rect x="240" y="55" width="145" height="30" rx="4" fill="#0f172a" opacity="0.8" />
        <text x="312" y="74" font-family="sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">출력 피스톤 (A2, F2)</text>
        <line x1="312" y1="88" x2="312" y2="115" stroke="#10b981" stroke-width="2.5" marker-end="url(#arrow)"/>

        <rect x="70" y="185" width="260" height="45" rx="6" fill="#1e1b4b" stroke="#6366f1" stroke-width="1.5" opacity="0.9" />
        <text x="200" y="203" font-family="sans-serif" font-size="10" font-weight="bold" fill="#38bdf8" text-anchor="middle">압력 P = F1/A1 = F2/A2 (사방으로 동일)</text>
        <text x="200" y="219" font-family="sans-serif" font-size="9.5" font-weight="bold" fill="#a5b4fc" text-anchor="middle">출력 하중 F2 = F1 * (A2 / A1)</text>

        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#f43f5e"/>
          </marker>
        </defs>
      </svg>`;

    case 3: // Continuity Equation
      return `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">
        ${bgImage}
        ${gradientOverlay}
        ${shadowFilter}
        <rect x="15" y="45" width="145" height="42" rx="4" fill="#0f172a" opacity="0.8" />
        <text x="87" y="61" font-family="sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">단면적 넓음 (A1)</text>
        <text x="87" y="76" font-family="sans-serif" font-size="9" fill="#38bdf8" text-anchor="middle">유속 느림 (v1) / 압력 높음</text>
        
        <rect x="240" y="45" width="145" height="42" rx="4" fill="#0f172a" opacity="0.8" />
        <text x="312" y="61" font-family="sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">단면적 좁음 (A2)</text>
        <text x="312" y="76" font-family="sans-serif" font-size="9" fill="#f43f5e" text-anchor="middle">유속 빠름 (v2) / 압력 낮음</text>

        <rect x="70" y="185" width="260" height="45" rx="6" fill="#1e1b4b" stroke="#6366f1" stroke-width="1.5" opacity="0.9" />
        <text x="200" y="211" font-family="sans-serif" font-size="11" font-weight="bold" fill="#38bdf8" text-anchor="middle">체적유량 Q = A1 * v1 = A2 * v2 = 일정</text>
      </svg>`;

    case 4: // Torricelli
      return `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">
        ${bgImage}
        ${gradientOverlay}
        ${shadowFilter}
        <rect x="15" y="45" width="145" height="35" rx="4" fill="#0f172a" opacity="0.8" />
        <text x="87" y="60" font-family="sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">수위 높이차 (h)</text>
        <text x="87" y="73" font-family="sans-serif" font-size="9" fill="#38bdf8" text-anchor="middle">위치 에너지 크기 결정</text>
        
        <rect x="235" y="125" width="150" height="35" rx="4" fill="#0f172a" opacity="0.8" />
        <text x="310" y="140" font-family="sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">분출 속도 v = √(2gh)</text>
        <text x="310" y="153" font-family="sans-serif" font-size="9" fill="#f43f5e" text-anchor="middle">수위에 비례하여 유출속도 결정</text>

        <rect x="70" y="185" width="260" height="45" rx="6" fill="#1e1b4b" stroke="#6366f1" stroke-width="1.5" opacity="0.9" />
        <text x="200" y="211" font-family="sans-serif" font-size="10" font-weight="bold" fill="#38bdf8" text-anchor="middle">기체거동(보일 법칙): P1 * V1 = P2 * V2</text>
      </svg>`;

    case 5: // Bernoulli
      return `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">
        ${bgImage}
        ${gradientOverlay}
        ${shadowFilter}
        <rect x="15" y="45" width="165" height="40" rx="4" fill="#0f172a" opacity="0.8" />
        <text x="97" y="60" font-family="sans-serif" font-size="9.5" font-weight="bold" fill="#ffffff" text-anchor="middle">베르누이 정리 (에너지 보존)</text>
        <text x="97" y="75" font-family="sans-serif" font-size="8" fill="#a5b4fc" text-anchor="middle">압력에너지 + 속도에너지 + 위치에너지 = 일정</text>

        <rect x="230" y="45" width="155" height="55" rx="4" fill="#0f172a" opacity="0.8" />
        <text x="307" y="60" font-family="sans-serif" font-size="9" fill="#38bdf8" text-anchor="middle">압력수두: P/γ (유압에너지)</text>
        <text x="307" y="75" font-family="sans-serif" font-size="9" fill="#f43f5e" text-anchor="middle">속도수두: v²/2g (운동에너지)</text>
        <text x="307" y="90" font-family="sans-serif" font-size="9" fill="#10b981" text-anchor="middle">위치수두: Z (위치에너지)</text>

        <rect x="70" y="185" width="260" height="45" rx="6" fill="#1e1b4b" stroke="#6366f1" stroke-width="1.5" opacity="0.9" />
        <text x="200" y="211" font-family="sans-serif" font-size="10.5" font-weight="bold" fill="#38bdf8" text-anchor="middle">전수두 H = P/γ + v²/2g + Z = 일정</text>
      </svg>`;

    case 6: // Cavitation
      return `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">
        ${bgImage}
        ${gradientOverlay}
        ${shadowFilter}
        <rect x="15" y="45" width="165" height="45" rx="4" fill="#7f1d1d" stroke="#f87171" stroke-width="1" opacity="0.85" />
        <text x="97" y="62" font-family="sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">원인: 급격한 감압</text>
        <text x="97" y="77" font-family="sans-serif" font-size="8.5" fill="#fca5a5" text-anchor="middle">국부 압력 &lt; 오일의 포화증기압</text>
        
        <rect x="220" y="45" width="165" height="45" rx="4" fill="#7f1d1d" stroke="#f87171" stroke-width="1" opacity="0.85" />
        <text x="302" y="62" font-family="sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">피해: 공동현상 발생</text>
        <text x="302" y="77" font-family="sans-serif" font-size="8.5" fill="#fca5a5" text-anchor="middle">진동, 금속 소음, 실린더 침식</text>

        <rect x="60" y="180" width="280" height="50" rx="6" fill="#1e1b4b" stroke="#6366f1" stroke-width="1.5" opacity="0.9" />
        <text x="200" y="198" font-family="sans-serif" font-size="10" font-weight="bold" fill="#38bdf8" text-anchor="middle">💡 방지 대책</text>
        <text x="200" y="216" font-family="sans-serif" font-size="9.5" fill="#a5b4fc" text-anchor="middle">펌프 흡입높이를 낮추고 흡입관 직경을 확장</text>
      </svg>`;

    case 7: // Pressure
      return `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">
        ${bgImage}
        ${gradientOverlay}
        ${shadowFilter}
        <rect x="15" y="50" width="160" height="35" rx="4" fill="#0f172a" opacity="0.8" />
        <text x="95" y="65" font-family="sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">게이지압 (대기압 기준 = 0)</text>
        <text x="95" y="78" font-family="sans-serif" font-size="8.5" fill="#38bdf8" text-anchor="middle">대기압보다 높을 때 양(+)의 압력</text>
        
        <rect x="225" y="50" width="160" height="35" rx="4" fill="#0f172a" opacity="0.8" />
        <text x="305" y="65" font-family="sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">절대압력 (완전진공 기준 = 0)</text>
        <text x="305" y="78" font-family="sans-serif" font-size="8.5" fill="#f43f5e" text-anchor="middle">완전진공 대비 실제 총압력</text>

        <rect x="60" y="185" width="280" height="45" rx="6" fill="#1e1b4b" stroke="#6366f1" stroke-width="1.5" opacity="0.9" />
        <text x="200" y="203" font-family="sans-serif" font-size="11" font-weight="bold" fill="#38bdf8" text-anchor="middle">절대압력 = 대기압 + 게이지압력</text>
        <text x="200" y="219" font-family="sans-serif" font-size="9" fill="#a5b4fc" text-anchor="middle">표준대기압 (1기압) ≒ 1.0332 kgf/㎠ ≒ 1 kgf/㎠</text>
      </svg>`;

    case 8: // Hydraulic vs Pneumatic
      return `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">
        ${bgImage}
        ${gradientOverlay}
        ${shadowFilter}
        <rect x="15" y="45" width="165" height="60" rx="4" fill="#1e3a8a" stroke="#3b82f6" stroke-width="1" opacity="0.85" />
        <text x="97" y="63" font-family="sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">💧 유압 (Hydraulic)</text>
        <text x="97" y="80" font-family="sans-serif" font-size="8.5" fill="#93c5fd" text-anchor="middle">비압축성 작동유 / 정밀 속도 제어</text>
        <text x="97" y="93" font-family="sans-serif" font-size="8.5" fill="#93c5fd" text-anchor="middle">고압 및 톤 단위의 대출력 용이</text>
        
        <rect x="220" y="45" width="165" height="60" rx="4" fill="#064e3b" stroke="#10b981" stroke-width="1" opacity="0.85" />
        <text x="302" y="63" font-family="sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">💨 공압 (Pneumatic)</text>
        <text x="302" y="80" font-family="sans-serif" font-size="8.5" fill="#a7f3d0" text-anchor="middle">압축성 공기 / 정밀제어 곤란</text>
        <text x="302" y="93" font-family="sans-serif" font-size="8.5" fill="#a7f3d0" text-anchor="middle">방출이 자유롭고 속도/안전 우수</text>

        <rect x="70" y="190" width="260" height="40" rx="6" fill="#1e1b4b" stroke="#6366f1" stroke-width="1.5" opacity="0.9" />
        <text x="200" y="214" font-family="sans-serif" font-size="10.5" font-weight="bold" fill="#38bdf8" text-anchor="middle">비압축성 작동유 vs 압축성 공기</text>
      </svg>`;

    case 9: // Valves & Fuse
      return `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">
        ${bgImage}
        ${gradientOverlay}
        ${shadowFilter}
        <rect x="15" y="45" width="165" height="45" rx="4" fill="#0f172a" opacity="0.8" />
        <text x="97" y="62" font-family="sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">릴리프 밸브 (Relief)</text>
        <text x="97" y="77" font-family="sans-serif" font-size="8.5" fill="#38bdf8" text-anchor="middle">설정압 이상 시 오일 릴리스(안전)</text>
        
        <rect x="220" y="45" width="165" height="45" rx="4" fill="#0f172a" opacity="0.8" />
        <text x="302" y="62" font-family="sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle">교축 밸브 (Throttle)</text>
        <text x="302" y="77" font-family="sans-serif" font-size="8.5" fill="#f43f5e" text-anchor="middle">유로 좁혀 유량 조절 (속도 제어)</text>

        <rect x="60" y="180" width="280" height="50" rx="6" fill="#1e1b4b" stroke="#6366f1" stroke-width="1.5" opacity="0.9" />
        <text x="200" y="198" font-family="sans-serif" font-size="10" font-weight="bold" fill="#38bdf8" text-anchor="middle">유체 퓨즈 (Fluid Fuse)</text>
        <text x="200" y="216" font-family="sans-serif" font-size="9" fill="#a5b4fc" text-anchor="middle">압력 비정상 상승 시 격막이 터져 전체 회로 보호</text>
      </svg>`;

    default:
      return '';
  }
}

function getSvg(slideId) {
  const bg = `<rect width="400" height="250" rx="20" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>`;
  
  switch (slideId) {
    case 2: // Pascal's Law
      return `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">${bg}
        <text x="200" y="35" font-family="sans-serif" font-size="15" font-weight="bold" fill="#0f172a" text-anchor="middle">파스칼의 법칙 (Piston Force Amplification)</text>
        <path d="M 60,80 L 60,160 L 340,160 L 340,70" fill="none" stroke="#e2e8f0" stroke-width="40" stroke-linecap="square"/>
        <path d="M 60,80 L 60,160 L 340,160 L 340,70" fill="none" stroke="#3b82f6" stroke-width="36" stroke-linecap="square"/>
        
        {/* Piston 1 */}
        <rect x="42" y="70" width="36" height="15" fill="#475569" rx="2"/>
        <line x1="60" y1="70" x2="60" y2="45" stroke="#475569" stroke-width="4"/>
        <text x="60" y="38" font-family="sans-serif" font-size="11" font-weight="bold" fill="#b91c1c" text-anchor="middle">입력 F1 = 15 kN</text>
        <text x="60" y="110" font-family="sans-serif" font-size="10" fill="#ffffff" font-weight="bold" text-anchor="middle">A1=10㎠</text>

        {/* Piston 2 */}
        <rect x="322" y="50" width="36" height="15" fill="#475569" rx="2"/>
        <line x1="340" y1="50" x2="340" y2="25" stroke="#475569" stroke-width="4"/>
        <text x="340" y="18" font-family="sans-serif" font-size="11" font-weight="bold" fill="#047857" text-anchor="middle">출력 F2 = 300 kN</text>
        <text x="340" y="90" font-family="sans-serif" font-size="10" fill="#ffffff" font-weight="bold" text-anchor="middle">A2=200㎠</text>

        {/* Formula */}
        <rect x="90" y="190" width="220" height="40" rx="8" fill="#1e293b" />
        <text x="200" y="215" font-family="sans-serif" font-size="13" font-weight="bold" fill="#38bdf8" text-anchor="middle">F1 / A1 = F2 / A2 = 압력 P</text>
      </svg>`;
      
    case 3: // Continuity Equation
      return `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">${bg}
        <text x="200" y="35" font-family="sans-serif" font-size="15" font-weight="bold" fill="#0f172a" text-anchor="middle">유량 연속의 법칙 (Q = A * v)</text>
        
        {/* Converging Pipe */}
        <path d="M 50,80 L 180,80 L 250,110 L 350,110 L 350,150 L 250,150 L 180,180 L 50,180 Z" fill="#dbeafe" stroke="#3b82f6" stroke-width="2"/>
        
        {/* Left Side (Large) */}
        <line x1="80" y1="90" x2="80" y2="170" stroke="#1d4ed8" stroke-width="1.5" stroke-dasharray="3 3"/>
        <text x="80" y="70" font-family="sans-serif" font-size="11" font-weight="bold" fill="#1d4ed8" text-anchor="middle">넓은 관 (A1)</text>
        <text x="80" y="135" font-family="sans-serif" font-size="11" fill="#1e3a8a" text-anchor="middle">유속 v1 (느림)</text>
        
        {/* Arrow left */}
        <line x1="110" y1="130" x2="140" y2="130" stroke="#1d4ed8" stroke-width="2" marker-end="url(#arrow)"/>

        {/* Right Side (Small) */}
        <line x1="300" y1="115" x2="300" y2="145" stroke="#047857" stroke-width="1.5" stroke-dasharray="3 3"/>
        <text x="300" y="100" font-family="sans-serif" font-size="11" font-weight="bold" fill="#047857" text-anchor="middle">좁은 관 (A2)</text>
        <text x="300" y="135" font-family="sans-serif" font-size="11" fill="#064e3b" text-anchor="middle">유속 v2 (빠름)</text>
        
        {/* Arrow right */}
        <line x1="315" y1="130" x2="335" y2="130" stroke="#047857" stroke-width="2" marker-end="url(#arrow)"/>

        {/* Formula */}
        <text x="200" y="215" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0f172a" text-anchor="middle">Q = A1 * v1 = A2 * v2 = 일정</text>
        <text x="200" y="235" font-family="sans-serif" font-size="10" fill="#475569" text-anchor="middle">관이 좁아지면 유속은 단면적 비에 비례하여 빨라진다</text>
        
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569"/>
          </marker>
        </defs>
      </svg>`;
      
    case 4: // Boyle's & Torricelli's Law
      return `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">${bg}
        <text x="200" y="30" font-family="sans-serif" font-size="15" font-weight="bold" fill="#0f172a" text-anchor="middle">토리첼리의 정리 (Torricelli's Law)</text>
        
        {/* Water Tank */}
        <rect x="80" y="55" width="100" height="120" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        <line x1="80" y1="80" x2="180" y2="80" stroke="#93c5fd" stroke-width="2"/> {/* Water level */}
        
        {/* Hole & Ejecting Water */}
        <path d="M 180,150 Q 230,150 250,200" fill="none" stroke="#2563eb" stroke-width="4" marker-end="url(#arrow)"/>
        
        {/* Height Labels */}
        <line x1="200" y1="80" x2="200" y2="150" stroke="#dc2626" stroke-width="1.5"/>
        <text x="210" y="120" font-family="sans-serif" font-size="12" font-weight="bold" fill="#b91c1c">높이차 h</text>

        {/* Velocity Label */}
        <text x="270" y="180" font-family="sans-serif" font-size="11" font-weight="bold" fill="#1d4ed8">유속 v</text>

        {/* Formula Box */}
        <rect x="70" y="195" width="260" height="40" rx="8" fill="#f1f5f9" stroke="#cbd5e1"/>
        <text x="200" y="220" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="middle">v = √(2 * g * h)</text>
        
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb"/>
          </marker>
        </defs>
      </svg>`;
      
    case 5: // Bernoulli's Theorem
      return `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">${bg}
        <text x="200" y="30" font-family="sans-serif" font-size="15" font-weight="bold" fill="#0f172a" text-anchor="middle">베르누이의 정리 (Bernoulli's Theorem)</text>
        
        {/* Pipe with height change */}
        <path d="M 50,150 L 150,150 L 250,80 L 350,80 M 350,110 L 260,110 L 160,180 L 50,180" fill="none" stroke="#dbeafe" stroke-width="30" stroke-linecap="square"/>
        <path d="M 50,150 L 150,150 L 250,80 L 350,80 M 350,110 L 260,110 L 160,180 L 50,180" fill="none" stroke="#3b82f6" stroke-width="2"/>

        {/* Height lines */}
        <line x1="100" y1="165" x2="100" y2="220" stroke="#94a3b8" stroke-width="1" stroke-dasharray="3 3"/>
        <line x1="300" y1="95" x2="300" y2="220" stroke="#94a3b8" stroke-width="1" stroke-dasharray="3 3"/>
        <line x1="50" y1="220" x2="350" y2="220" stroke="#475569" stroke-width="1.5"/> {/* Ground */}
        
        <text x="100" y="235" font-family="sans-serif" font-size="10" fill="#475569" text-anchor="middle">기준면 (Z1)</text>
        <text x="300" y="235" font-family="sans-serif" font-size="10" fill="#475569" text-anchor="middle">기준면 (Z2)</text>

        {/* Equation Terms */}
        <text x="200" y="160" font-family="sans-serif" font-size="13" font-weight="bold" fill="#1e3a8a" text-anchor="middle">압력수두 + 속도수두 + 위치수두 = 일정</text>
        <text x="200" y="185" font-family="sans-serif" font-size="11" fill="#0f172a" text-anchor="middle">P/γ + v²/2g + Z = Constant</text>
      </svg>`;
      
    case 6: // Cavitation
      return `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">${bg}
        <text x="200" y="30" font-family="sans-serif" font-size="15" font-weight="bold" fill="#0f172a" text-anchor="middle">공동현상 (Cavitation) 원리</text>
        
        {/* Venturi Tube */}
        <path d="M 40,70 L 150,70 L 190,110 L 210,110 L 250,70 L 360,70 L 360,170 L 250,170 L 210,130 L 190,130 L 150,170 L 40,170 Z" fill="#eff6ff" stroke="#3b82f6" stroke-width="2"/>
        
        {/* Bubbles in the narrow neck */}
        <circle cx="195" cy="120" r="4" fill="#93c5fd" opacity="0.8"/>
        <circle cx="205" cy="122" r="3" fill="#93c5fd" opacity="0.8"/>
        <circle cx="200" cy="125" r="2" fill="#93c5fd" opacity="0.8"/>
        <circle cx="212" cy="118" r="4" fill="#93c5fd" opacity="0.8"/>
        <circle cx="220" cy="115" r="5" fill="#60a5fa" opacity="0.6"/>
        <circle cx="228" cy="120" r="3" fill="#60a5fa" opacity="0.6"/>
        
        {/* Labels */}
        <text x="90" y="125" font-family="sans-serif" font-size="11" fill="#475569" text-anchor="middle">유속 보통\n압력 높음</text>
        <text x="200" y="95" font-family="sans-serif" font-size="11" font-weight="bold" fill="#dc2626" text-anchor="middle">압력 급하강 (기포 발생!)</text>
        <text x="310" y="125" font-family="sans-serif" font-size="11" fill="#475569" text-anchor="middle">기포 폭발\n진동/소음 유발</text>
        
        <text x="200" y="210" font-family="sans-serif" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="middle">오일 압력이 포화증기압 이하일 때 발생</text>
      </svg>`;
      
    case 7: // Pressure Units
      return `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">${bg}
        <text x="200" y="35" font-family="sans-serif" font-size="15" font-weight="bold" fill="#0f172a" text-anchor="middle">대기압, 게이지압, 절대압력 관계</text>
        
        {/* Scale vertical lines */}
        <line x1="80" y1="200" x2="340" y2="200" stroke="#475569" stroke-width="2"/> {/* Absolute zero vacuum */}
        <text x="210" y="215" font-family="sans-serif" font-size="10" fill="#475569" text-anchor="middle">완전진공 (절대압력 0)</text>

        <line x1="80" y1="130" x2="340" y2="130" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4 2"/> {/* Std Atm */}
        <text x="210" y="145" font-family="sans-serif" font-size="10" fill="#b91c1c" font-weight="bold" text-anchor="middle">표준대기압 (1 atm = 1.0332 kgf/㎠)</text>
        
        {/* Pressure range arrows */}
        <line x1="120" y1="200" x2="120" y2="60" stroke="#3b82f6" stroke-width="3" marker-end="url(#arrow)"/>
        <text x="110" y="100" font-family="sans-serif" font-size="11" font-weight="bold" fill="#1d4ed8" transform="rotate(-90, 110, 100)" text-anchor="middle">절대압력 (P_abs)</text>
        
        <line x1="280" y1="130" x2="280" y2="60" stroke="#10b981" stroke-width="3" marker-end="url(#arrow)"/>
        <text x="295" y="95" font-family="sans-serif" font-size="11" font-weight="bold" fill="#047857" transform="rotate(90, 295, 95)" text-anchor="middle">게이지압 (P_gauge)</text>

        {/* Formula */}
        <text x="200" y="180" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="middle">절대압력 = 대기압 + 게이지압</text>
        
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#475569"/>
          </marker>
        </defs>
      </svg>`;
      
    case 8: // Hydraulic vs Pneumatic
      return `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">${bg}
        <text x="200" y="35" font-family="sans-serif" font-size="15" font-weight="bold" fill="#0f172a" text-anchor="middle">유압 vs 공압 특징 비교</text>
        
        <g transform="translate(30, 60)">
          <rect x="0" y="0" width="160" height="150" rx="10" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5"/>
          <text x="80" y="25" font-family="sans-serif" font-size="13" font-weight="bold" fill="#1d4ed8" text-anchor="middle">💧 유압 (Hydraulic)</text>
          <text x="15" y="55" font-family="sans-serif" font-size="11" fill="#334155">• 비압축성 (정밀 제어)</text>
          <text x="15" y="80" font-family="sans-serif" font-size="11" fill="#334155">• 대출력/고압 용이</text>
          <text x="15" y="105" font-family="sans-serif" font-size="11" fill="#334155">• 응답속도 빠름</text>
          <text x="15" y="130" font-family="sans-serif" font-size="11" fill="#334155">• 화재 위험 있음</text>
        </g>

        <g transform="translate(210, 60)">
          <rect x="0" y="0" width="160" height="150" rx="10" fill="#f0fdf4" stroke="#16a34a" stroke-width="1.5"/>
          <text x="80" y="25" font-family="sans-serif" font-size="13" font-weight="bold" fill="#16a34a" text-anchor="middle">💨 공압 (Pneumatic)</text>
          <text x="15" y="55" font-family="sans-serif" font-size="11" fill="#334155">• 압축성 (정밀제어 어려움)</text>
          <text x="15" y="80" font-family="sans-serif" font-size="11" fill="#334155">• 배관 연결/방출 용이</text>
          <text x="15" y="105" font-family="sans-serif" font-size="11" fill="#334155">• 속도 빠름, 화재 안전</text>
          <text x="15" y="130" font-family="sans-serif" font-size="11" fill="#334155">• 에너지 저장 용이</text>
        </g>
      </svg>`;
      
    case 9: // Valves & Fuse
      return `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">${bg}
        <text x="200" y="35" font-family="sans-serif" font-size="15" font-weight="bold" fill="#0f172a" text-anchor="middle">압력/유량 조절 장치 기호</text>
        
        {/* Relief Valve Symbol */}
        <g transform="translate(80, 70)">
          <rect x="0" y="0" width="100" height="100" rx="8" fill="#ffffff" stroke="#475569" stroke-width="2"/>
          <text x="50" y="-10" font-family="sans-serif" font-size="11" font-weight="bold" fill="#334155" text-anchor="middle">릴리프밸브 (Relief)</text>
          <line x1="50" y1="10" x2="50" y2="40" stroke="#dc2626" stroke-width="2" marker-end="url(#arrow)"/>
          <line x1="50" y1="60" x2="50" y2="90" stroke="#dc2626" stroke-width="2"/>
          <path d="M 35,50 L 65,50" stroke="#cbd5e1" stroke-width="2"/>
          <path d="M 15,20 C 25,30 25,70 15,80" fill="none" stroke="#475569" stroke-width="1.5" stroke-dasharray="3 2"/> {/* Spring */}
        </g>

        {/* Throttle Valve Symbol */}
        <g transform="translate(220, 70)">
          <rect x="0" y="0" width="100" height="100" rx="8" fill="#ffffff" stroke="#475569" stroke-width="2"/>
          <text x="50" y="-10" font-family="sans-serif" font-size="11" font-weight="bold" fill="#334155" text-anchor="middle">교축밸브 (Throttle)</text>
          <path d="M 15,50 C 35,25 65,25 85,50" fill="none" stroke="#3b82f6" stroke-width="3"/>
          <path d="M 15,50 C 35,75 65,75 85,50" fill="none" stroke="#3b82f6" stroke-width="3"/>
          <line x1="20" y1="80" x2="80" y2="20" stroke="#ef4444" stroke-width="2" marker-end="url(#arrow)"/> {/* Arrow for adjustment */}
        </g>
        
        <text x="200" y="210" font-family="sans-serif" font-size="11" fill="#475569" text-anchor="middle">유체퓨즈: 일정 압력 도달 시 격막이 파열되어 장비를 보호</text>
      </svg>`;
  }

  // Cover / Fallback
  return `<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">${bg}
    <text x="200" y="60" font-family="sans-serif" font-size="16" font-weight="bold" fill="#0f172a" text-anchor="middle">10. 유압 기초 및 유동 법칙</text>
    <rect x="60" y="95" width="280" height="70" rx="10" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5"/>
    <circle cx="100" cy="130" r="18" fill="#dbeafe"/>
    <text x="100" y="136" font-family="sans-serif" font-size="18" text-anchor="middle">⚙️</text>
    <text x="135" y="125" font-family="sans-serif" font-size="12" font-weight="bold" fill="#1e3a8a">단원 요점 정리 슬라이드</text>
    <text x="135" y="145" font-family="sans-serif" font-size="10" fill="#475569">기출문제를 풀기 전 필수 개념들을 복습하세요.</text>
    <text x="200" y="205" font-family="sans-serif" font-size="11" fill="#94a3b8" text-anchor="middle">두기고 Smart License Slide System</text>
  </svg>`;
}

function generate() {
  const targetDir = 'F:/App/Dukigo/client/public/summaries/자동화설비산업기사';
  
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  console.log("Generating high-density slides for Unit 10...");

  const allSlides = [
    {
      id: 1,
      style: "Expert",
      image: "",
      emoji: "📘",
      title: "10. 유압 기초 및 유동 법칙 학습 시작!",
      content: "이번 단원은 유체역학의 기초 법칙과 압력 전달에 관한 핵심 단원입니다. 시험에 나오는 계산 문제와 말장난 함정들을 정복하기 위해 꼭 알아야 할 8가지 세부 개념들을 하나씩 짚고 넘어가 봅시다!",
      exam_point: "📌 학습 로드맵\n- 파스칼의 원리 응용 계산\n- 연속방정식 배관 흐름 유속 계산\n- 공동현상(캐비테이션) 방지대책\n- 대기압과 절대압 변환 연산",
      svg: getSvg(1)
    },
    {
      id: 2,
      style: "Expert",
      image: "/images/자동화설비산업기사/10/pascal_law_piston.jpg",
      emoji: "⚖️",
      title: "파스칼의 법칙과 힘의 확대 비율",
      content: "밀폐된 용기 안에 들어있는 오일(유체)의 일부분에 힘을 가하면, 발생하는 압력은 모든 방향으로 감쇠 없이 고스란히 전달됩니다. 이 원리로 작은 피스톤 면적에 작은 힘을 가해 넓은 피스톤 쪽에서 엄청난 하중을 뿜어낼 수 있습니다.",
      exam_point: "🧮 파스칼의 계산 공식\n- 압력 P = F1 / A1 = F2 / A2\n- 출력 하중 F2 = F1 * (A2 / A1)\n- (예제) 면적이 20배(10㎠ → 200㎠) 늘어나면 출력 하중 또한 20배 늘어납니다.",
      svg: getHybridSvg(2, "/images/자동화설비산업기사/10/pascal_law_piston.jpg")
    },
    {
      id: 3,
      style: "Expert",
      image: "/images/자동화설비산업기사/10/continuity_equation_flow.jpg",
      emoji: "🌊",
      title: "연속방정식 (배관 굵기와 유속의 상관관계)",
      content: "배관 안의 유체 흐름에서 임의의 단면을 통과하는 체적유량(Q)은 언제나 일정하게 유지됩니다. 즉, 관의 직경이 좁아지면 단면적이 작아지는 만큼 유체가 흘러가야 하는 유속은 그에 비례하여 빨라지게 됩니다.",
      exam_point: "🧮 연속방정식 공식\n- 유량 Q = A1 * v1 = A2 * v2 = 일정\n- 관의 지름이 절반으로 줄어들면 단면적은 4분의 1이 되므로, 통과 속도는 4배 빨라져야 유량이 보존됩니다.",
      svg: getHybridSvg(3, "/images/자동화설비산업기사/10/continuity_equation_flow.jpg")
    },
    {
      id: 4,
      style: "Expert",
      image: "/images/자동화설비산업기사/10/torricelli_water_jet.jpg",
      emoji: "🪂",
      title: "기체 거동(보일 법칙)과 분출 속도(토리첼리)",
      content: "온도가 일정할 때 기체의 압력과 부피는 서로 반비례합니다(보일의 법칙). 또한 수조 하부에 구멍을 뚫어 물이 뿜어져 나오는 유속은 그 구멍 위로 쌓인 수위의 높이차에 의해서만 결정됩니다(토리첼리의 정리).",
      exam_point: "🧮 토리첼리 유속 계산 공식\n- 속도 v = √(2 * g * h)  (g: 중력가속도 9.81m/s², h: 높이)\n- 압축 공기는 압력과 부피가 반비례(P1 * V1 = P2 * V2)하여 거동합니다.",
      svg: getHybridSvg(4, "/images/자동화설비산업기사/10/torricelli_water_jet.jpg")
    },
    {
      id: 5,
      style: "Expert",
      image: "/images/자동화설비산업기사/10/bernoulli_pipe_flow.jpg",
      emoji: "📏",
      title: "베르누이 정리 (에너지 보존 법칙)",
      content: "마찰이 없는 흐름에서 유체가 가진 모든 에너지(압력에너지, 속도에너지, 위치에너지)의 합은 어느 지점에서나 동일합니다. 따라서 관이 좁아져 속도가 빨라지면(속도에너지 상승) 그 지점의 유압은 도리어 낮아지게(압력에너지 감소) 됩니다.",
      exam_point: "🧮 베르누이 방정식\n- P/γ (압력수두) + v²/2g (속도수두) + Z (위치수두) = 일정\n- 세 가지 수두의 전체 합을 '전수두(H)'라고 하며, 에너지는 보존됩니다.",
      svg: getHybridSvg(5, "/images/자동화설비산업기사/10/bernoulli_pipe_flow.jpg")
    },
    {
      id: 6,
      style: "Expert",
      image: "/images/자동화설비산업기사/10/cavitation_bubbles_valve.jpg",
      emoji: "🫧",
      title: "공동현상 (캐비테이션) 발생 원인과 대책",
      content: "배관 속 흐름의 압력이 급격히 낮아져 오일의 포화증기압보다 떨어지면, 오일 내에 기포가 무수히 발생합니다. 이 기포가 고압부를 지날 때 폭발하면서 소음, 격렬한 진동, 펌프 부식을 발생시키는 현상을 공동현상이라고 합니다.",
      exam_point: "⚠️ 캐비테이션 예방 대책\n- 펌프 흡입 높이를 낮추고 회전수를 지나치게 높이지 말 것\n- 흡입관 관경을 넓혀 유속을 늦추고, 흡입 필터(여과기)를 주기적으로 세척할 것",
      svg: getHybridSvg(6, "/images/자동화설비산업기사/10/cavitation_bubbles_valve.jpg")
    },
    {
      id: 7,
      style: "Expert",
      image: "/images/자동화설비산업기사/10/industrial_pressure_gauge.jpg",
      emoji: "🌡️",
      title: "압력의 표기 방법 (게이지압 vs 절대압력)",
      content: "대기압(1 atm = 1.0332 kgf/㎠)을 기준점 0으로 놓고 재는 일반 압력을 '게이지압력'이라고 하며, 완전진공 상태를 0으로 놓고 측정하는 우주적 압력을 '절대압력'이라고 합니다.",
      exam_point: "🧮 절대압력 변환 공식\n- 절대압력 = 대기압 + 게이지압력\n- (예제) 게이지압이 8 kgf/㎠일 때 절대압은 8 + 1.0332 = 9.03 kgf/㎠입니다.\n- 표준 1기압과 수치가 가장 가까운 보기는 1 kgf/㎠입니다.",
      svg: getHybridSvg(7, "/images/자동화설비산업기사/10/industrial_pressure_gauge.jpg")
    },
    {
      id: 8,
      style: "Expert",
      image: "/images/자동화설비산업기사/10/hydraulic_vs_pneumatic.jpg",
      emoji: "⚡",
      title: "유압식 제어와 공압식 제어의 대조 분석",
      content: "유압은 기름(비압축성)을 쓰므로 응답성이 높고 초소형 장치로도 톤 단위의 엄청난 출력을 내지만 기름 유출 위험이 있습니다. 공압은 공기(압축성)를 쓰므로 다루기 쉽고 안전하지만 정확한 위치 제어가 어렵습니다.",
      exam_point: "🔍 공/유압 장단점\n- 공압 장점: 대기 중 공기를 무한 채집 가능, 방출 자유로움\n- 공압 단점: 공기의 압축성 성질 때문에 정밀 정지/위치 제어 곤란\n- 유압 장점: 파스칼 법칙으로 큰 출력 하중, 부드러운 작동 가능",
      svg: getHybridSvg(8, "/images/자동화설비산업기사/10/hydraulic_vs_pneumatic.jpg")
    },
    {
      id: 9,
      style: "Expert",
      image: "/images/자동화설비산업기사/10/valve_manifold_systems.jpg",
      emoji: "💡",
      title: "유압 배관 보호 요소 및 압력 밸브",
      content: "유압 장치의 작동유 압력과 유량을 조절하기 위해 여러 밸브가 쓰입니다. 설정치 이상의 과도 압력이 차오를 때 내부 막을 찢고 터져 기기를 보호하는 '유체 퓨즈', 방향 관계없이 교축하는 '스로틀 밸브'가 대표적입니다.",
      exam_point: "🔍 밸브 기호 및 기능\n- 릴리프 밸브: 시스템 안전 보장을 위한 최대 압력 제한\n- 스로틀 밸브: 유로 단면적을 좁혀 양방향 흐름 유량 제어\n- 유체 퓨즈: 고압에 의한 격막 파열로 기기 파손 예방",
      svg: getHybridSvg(9, "/images/자동화설비산업기사/10/valve_manifold_systems.jpg")
    }
  ];

  const cleanUnitName = UNIT_NAMES['10'].trim();
  const safeUnitName = cleanUnitName.replace(/[^a-z0-9가-힣]/gi, '_');

  // Destination 1: Next.js public summaries runtime path
  const publicDir = 'F:/App/Dukigo/client/public/summaries/자동화설비산업기사';
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Destination 2: Project data inspection path under client/src/data/자동화설비산업기사/10/
  const inspectDir = 'F:/App/Dukigo/client/src/data/자동화설비산업기사/10';
  if (!fs.existsSync(inspectDir)) {
    fs.mkdirSync(inspectDir, { recursive: true });
  }

  // Save for Set 1 (Slides 1 to 5)
  const set1Slides = allSlides.slice(0, 5);
  const payload1 = {
    subject: "자동화설비산업기사",
    unit: cleanUnitName,
    set: 1,
    slides: set1Slides
  };
  fs.writeFileSync(
    path.join(publicDir, `${safeUnitName}_1세트.json`),
    JSON.stringify(payload1, null, 2),
    'utf8'
  );
  fs.writeFileSync(
    path.join(inspectDir, `${safeUnitName}_1세트.json`),
    JSON.stringify(payload1, null, 2),
    'utf8'
  );

  // Save for Set 2 (Slides 1 and 6 to 9)
  const set2Slides = [allSlides[0], ...allSlides.slice(5)];
  const reindexedSet2 = set2Slides.map((s, idx) => ({ ...s, id: idx + 1 }));
  const payload2 = {
    subject: "자동화설비산업기사",
    unit: cleanUnitName,
    set: 2,
    slides: reindexedSet2
  };
  fs.writeFileSync(
    path.join(publicDir, `${safeUnitName}_2세트.json`),
    JSON.stringify(payload2, null, 2),
    'utf8'
  );
  fs.writeFileSync(
    path.join(inspectDir, `${safeUnitName}_2세트.json`),
    JSON.stringify(payload2, null, 2),
    'utf8'
  );

  console.log("Unit 10 slides successfully generated in both public/summaries and src/data/자동화설비산업기사/10/!");
}

generate();
