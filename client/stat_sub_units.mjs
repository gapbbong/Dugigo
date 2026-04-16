import fs from 'fs';
import path from 'path';

const dataDir = 'e:/DugiGo/client/src/data/전기기능사';
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));

const stats = {
    "1단원: 전기이론": {
        "정전기와 콘덴서": 0,    // 콘덴서, 정전, 전하, 전위, 유전율
        "자기장과 인덕턴스": 0,  // 자속, 자장, 인덕턴스, 헨리, 자기
        "직류 및 교류회로": 0,   // 임피던스, 위상, 역률, 실효값, R-L-C
        "기타 이론": 0
    },
    "2단원: 전기기기": {
        "직류기": 0,           // 직류 발전기, 직류 전동기, 정류자
        "변압기": 0,           // 변압기, 권수비, 철손, 동손
        "유도기": 0,           // 유도 전동기, 슬립, 회전수
        "동기기": 0,           // 동기 발전기, 동기 임피던스
        "정류기 및 제어": 0     // 사이리스터, SCR, 다이오드
    },
    "3단원: 전기설비": {
        "배선재료 및 공구": 0,   // 새들, 커플링, 전선관, 공구
        "옥내배선공사": 0,      // 가요 전선관, 합성수지관, 금속관
        "가공/배전/접지": 0     // 가공 전선, 접지, 배전반, 수용가
    }
};

const uniqueKeys = new Set();

files.forEach(f => {
    try {
        const data = JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf-8'));
        data.forEach(q => {
            const key = `${q.year}-${q.round}-${q.question_num}`;
            if (uniqueKeys.has(key)) return;
            uniqueKeys.add(key);

            const text = (q.question + (q.explanation || '')).replace(/\s/g, '');
            const n = q.question_num;

            if (n >= 1 && n <= 20) {
                if (text.includes('콘덴서') || text.includes('전하') || text.includes('정전')) stats["1단원: 전기이론"]["정전기와 콘덴서"]++;
                else if (text.includes('자속') || text.includes('자기') || text.includes('헨리')) stats["1단원: 전기이론"]["자기장과 인덕턴스"]++;
                else if (text.includes('임피던스') || text.includes('회로') || text.includes('역률')) stats["1단원: 전기이론"]["직류 및 교류회로"]++;
                else stats["1단원: 전기이론"]["기타 이론"]++;
            } 
            else if (n >= 21 && n <= 40) {
                if (text.includes('직류')) stats["2단원: 전기기기"]["직류기"]++;
                else if (text.includes('변압기')) stats["2단원: 전기기기"]["변압기"]++;
                else if (text.includes('유도')) stats["2단원: 전기기기"]["유도기"]++;
                else if (text.includes('동기')) stats["2단원: 전기기기"]["동기기"]++;
                else stats["2단원: 전기기기"]["정류기 및 제어"]++;
            }
            else if (n >= 41 && n <= 60) {
                if (text.includes('공구') || text.includes('재료') || text.includes('전선관')) stats["3단원: 전기설비"]["배선재료 및 공구"]++;
                else if (text.includes('옥내') || text.includes('배선')) stats["3단원: 전기설비"]["옥내배선공사"]++;
                else stats["3단원: 전기설비"]["가공/배전/접지"]++;
            }
        });
    } catch (e) {}
});

console.log(JSON.stringify(stats, null, 2));
