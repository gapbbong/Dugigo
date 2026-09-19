// 경험치 기반 레벨 및 칭호 시스템 설정 (넘버링 + 고난도 구간 확장)
export interface LevelInfo {
  tier: number;          // 단계 번호 (1, 2, 3...)
  title: string;         // 칭호 이름 (예: 입문자, 초월자, 반신 등)
  formattedTitle: string;// 넘버링 포함 칭호 (예: "1단계 입문자", "12단계 초월자")
  shortTitle: string;    // 축약 표기 (예: "[1] 입문자")
  requiredExp: number;   // 해당 단계 도달 필요 누적 경험치
  nextExp: number | null;// 다음 단계 필요 누적 경험치
}

export const LEVEL_TIERS: { tier: number; title: string; requiredExp: number }[] = [
  // 1~12단계: 기본 구간 (기존과 동일하게 1,000 XP씩 증가하여 기존 유저 진도 완벽 보존)
  { tier: 1,  title: "입문자",     requiredExp: 0 },
  { tier: 2,  title: "초보자",     requiredExp: 1000 },
  { tier: 3,  title: "수련자",     requiredExp: 2000 },
  { tier: 4,  title: "숙련자",     requiredExp: 3000 },
  { tier: 5,  title: "전문가",     requiredExp: 4000 },
  { tier: 6,  title: "달인",       requiredExp: 5000 },
  { tier: 7,  title: "명인",       requiredExp: 6000 },
  { tier: 8,  title: "현자",       requiredExp: 7000 },
  { tier: 9,  title: "영웅",       requiredExp: 8000 },
  { tier: 10, title: "전설",       requiredExp: 9000 },
  { tier: 11, title: "신화",       requiredExp: 10000 },
  { tier: 12, title: "초월자",     requiredExp: 11000 },

  // 13단계 이상: 초월자 이후 상위 확장 구간 (단계별 필요 경험치가 점점 커지는 고난도 레벨업 곡선)
  { tier: 13, title: "반신",       requiredExp: 13000 },  // +2,000
  { tier: 14, title: "성인",       requiredExp: 16000 },  // +3,000
  { tier: 15, title: "지배자",     requiredExp: 20000 },  // +4,000
  { tier: 16, title: "불멸자",     requiredExp: 25000 },  // +5,000
  { tier: 17, title: "군주",       requiredExp: 31000 },  // +6,000
  { tier: 18, title: "대군주",     requiredExp: 38000 },  // +7,000
  { tier: 19, title: "절대자",     requiredExp: 46000 },  // +8,000
  { tier: 20, title: "신",         requiredExp: 55000 },  // +9,000
  { tier: 21, title: "창조자",     requiredExp: 65000 },  // +10,000
  { tier: 22, title: "우주적 존재", requiredExp: 80000 },  // +15,000
  { tier: 23, title: "만물통달자", requiredExp: 100000 }, // +20,000
];

/**
 * 누적 경험치(exp)를 바탕으로 현재 레벨 및 칭호 정보를 반환합니다.
 */
export function getLevelInfo(expPoints: number | undefined | null): LevelInfo {
  const exp = Math.max(0, expPoints || 0);

  let currentTier = LEVEL_TIERS[0];
  let nextExp: number | null = LEVEL_TIERS[1].requiredExp;

  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (exp >= LEVEL_TIERS[i].requiredExp) {
      currentTier = LEVEL_TIERS[i];
      nextExp = i < LEVEL_TIERS.length - 1 ? LEVEL_TIERS[i + 1].requiredExp : null;
      break;
    }
  }

  return {
    tier: currentTier.tier,
    title: currentTier.title,
    formattedTitle: `${currentTier.tier}단계 ${currentTier.title}`,
    shortTitle: `[${currentTier.tier}] ${currentTier.title}`,
    requiredExp: currentTier.requiredExp,
    nextExp
  };
}
