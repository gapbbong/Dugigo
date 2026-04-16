import fs from 'fs';
import path from 'path';

const dataDir = 'e:/DugiGo/client/src/data/전기기능사';
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

// 소단원 정의 (번호별 주제 매핑)
const topicMap = {
    // 1단원: 전기이론 (1~20번)
    1: "정전기 및 쿨롱의 법칙",
    2: "전해 및 전위 기초",
    3: "콘덴서 및 정전용량",
    4: "자기의 성질과 자석",
    5: "자기장과 비오사바르 법칙",
    6: "전자유도 및 렌츠의 법칙",
    7: "인덕턴스와 에너지",
    8: "옴의 법칙 및 저항 계산",
    9: "저항의 접속 (직·병렬)",
    10: "휘트스톤 브리지 및 전위계",
    11: "전력과 줄의 법칙",
    12: "고유저항과 온도계수",
    13: "정현파 교류 기초",
    14: "위상차와 벡터 표현",
    15: "교류 실효값과 평균값",
    16: "R-L-C 직렬 회로",
    17: "R-L-C 병렬 회로",
    18: "공진 회로의 특성",
    19: "3상 교류 및 결선 (Y-Δ)",
    20: "비정현파 및 과도현상",

    // 2단원: 전기기기 (21~40번)
    21: "직류기의 구조와 원리",
    22: "직류기의 권선법과 정류",
    23: "직류 발전기의 특성",
    24: "직류 전동기의 특성과 토크",
    25: "직류기의 손실 및 효율",
    26: "동기 발전기의 구조",
    27: "동기 임피던스와 반작용",
    28: "동기 기기의 병렬운전",
    29: "동기 전동기의 특성 (V곡선)",
    30: "변압기의 구조와 원리",
    31: "변압기의 결선과 상수 변화",
    32: "변압기의 병렬운전 조건",
    33: "변압기의 시험 및 손실",
    34: "유도 기기의 회전 원리와 구조",
    35: "유도 전동기의 슬립과 속도",
    36: "유도 전동기의 기동 및 제어",
    37: "단상 유도 전동기의 종류",
    38: "전력변환기 및 반도체 소자",
    39: "정류 회로 (SCR/다이오드)",
    40: "특수 전기 기기",

    // 3단원: 전기설비 (41~60번)
    41: "전선 및 케이블 재료",
    42: "배선 기구 및 심벌",
    43: "전기 공구 및 측정기",
    44: "전선 접속법 (슬리브/트위스트)",
    45: "절연 저항과 메거 측정",
    46: "접지 시스템의 기초 (KEC)",
    47: "금속관 공사의 기준",
    48: "합성수지관 및 덕트 공사",
    49: "가요 전선관 공사",
    50: "몰드 및 목재 공사",
    51: "조명 설계 및 광속 계산",
    52: "조명 기구의 종류와 시설",
    53: "동력 배선 및 전동기 시설",
    54: "배설반 및 분전반 공사",
    55: "가공 전선로 지지물과 경간",
    56: "지선 및 애자 시설",
    57: "수변전 설비와 차단기",
    58: "특수 장소의 전기 공사",
    59: "폭발성/가연성 장소 공사",
    60: "전기 모니터링 및 유지관리"
};

const stats = {};
Object.values(topicMap).forEach(topic => stats[topic] = 0);

const uniqueKeys = new Set();

files.forEach(f => {
    try {
        const data = JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf-8'));
        data.forEach(q => {
            const key = `${q.year}-${q.round}-${q.question_num}`;
            if (uniqueKeys.has(key)) return;
            uniqueKeys.add(key);

            const topic = topicMap[q.question_num];
            if (topic) {
                stats[topic] = (stats[topic] || 0) + 1;
            }
        });
    } catch (e) {}
});

console.log("\n--- [초세분화] 소단원별 문항 리포트 (목표: 20~35문제) ---");
console.log("---------------------------------------------------------");

let currentCategory = "";
Object.entries(topicMap).forEach(([num, topic]) => {
    const parent = num <= 20 ? "1단원(이론)" : num <= 40 ? "2단원(기기)" : "3단원(설비)";
    if (parent !== currentCategory) {
        currentCategory = parent;
        console.log(`\n[${currentCategory}]`);
    }
    const count = stats[topic];
    const bar = "█".repeat(Math.round(count / 2));
    console.log(`${num.toString().padStart(2, '0')}. ${topic.padEnd(20)} : ${count.toString().padStart(3)}문제 ${bar}`);
});

console.log("\n---------------------------------------------------------");
console.log(`총 소단원: ${Object.keys(topicMap).length}개 / 총 문항: ${uniqueKeys.size}개`);
