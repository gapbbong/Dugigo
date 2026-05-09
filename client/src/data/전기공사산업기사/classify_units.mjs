import fs from 'fs';
import path from 'path';

const MASTER_DB_PATH = 'e:/DugiGo/client/src/data/전기공사산업기사/Electric_Construction_MASTER_DB.json';
const OUTPUT_DIR = 'e:/DugiGo/client/src/data/전기공사산업기사';

const units = [
  { name: "01. 조명 및 전열", keywords: ["조명", "광도", "럭스", "루멘", "전열", "조도", "광속", "칸델라", "글로브", "휘도", "램프", "반사율", "투과율"] },
  { name: "02. 전기화학 및 배터리", keywords: ["전지", "배터리", "축전지", "전기화학", "패러데이", "전해", "금속막대", "도금", "이온"] },
  { name: "03. 전동기 응용", keywords: ["펌프", "권상", "엘리베이터", "에스컬레이터", "기중기", "용접", "가열", "건조", "공작기계"] },
  { name: "04. 철도설계 및 궤도", keywords: ["철도", "궤도", "전차", "급전", "가선", "조가선", "커티너리", "브래킷", "집전", "판타그래프"] },
  { name: "05. 송전특성 및 선로정수", keywords: ["송전", "선로정수", "인덕턴스", "정전용량", "복도체", "다도체", "충전전류", "코로나", "복소전력"] },
  { name: "06. 전로의 고장계산 및 중성점 접지", keywords: ["지락", "단락", "고장계산", "직접접지", "소호리액터", "저항접지", "대칭좌표", "영상임피던스"] },
  { name: "07. 이상전압 및 보호계측", keywords: ["피뢰기", "차단기", "계전기", "이상전압", "섬락", "아킹혼", "서지", "절연협조", "변류기", "단로기"] },
  { name: "08. 배전 계통 및 발전", keywords: ["배전", "변전", "수력", "화력", "원자력", "댐", "터빈", "조정지", "펠턴", "카플란"] },
  { name: "09. 직류기", keywords: ["직류기", "정류자", "브러시", "전기자", "직권", "분권", "균압", "전기자반작용"] },
  { name: "10. 동기기", keywords: ["동기기", "동기발전기", "동기전동기", "동기임피던스", "동기화", "병렬운전"] },
  { name: "11. 변압기", keywords: ["변압기", "권수비", "변압기결선", "무부하손", "부하손", "절연유"] },
  { name: "12. 유도기 및 정류기", keywords: ["유도기", "유도전동기", "슬립", "회전자기장", "정류기", "사이리스터", "SCR", "인버터", "컨버터"] },
  { name: "13. 직류회로 및 교류회로 기초", keywords: ["옴의법칙", "키르히호프", "실효값", "평균값", "순시값", "임피던스", "리액턴스", "주파수"] },
  { name: "14. 다상교류 및 대칭좌표법", keywords: ["3상", "델타", "와이", "Y-Δ", "대칭좌표", "영상전류", "정상전류", "역상전류"] },
  { name: "15. 회로망 정리 및 과도현상", keywords: ["테브난", "노턴", "중첩의", "과도현상", "특성임피던스", "시정수"] },
  { name: "16. 전달함수 및 라플라스 변환", keywords: ["전달함수", "블록선도", "라플라스", "제어공학", "안정도", "주파수응답"] },
  { name: "17. 공통사항 및 접지(KEC)", keywords: ["KEC", "전기설비기술기준", "접지시스템", "등전위", "피뢰시스템"] },
  { name: "18. 저압/고압/특고압 전기설비(KEC)", keywords: ["저압전기설비", "고압전기설비", "보안거리", "가공전선", "옥내배선", "이격거리"] },
  { name: "19. 전기철도 및 분산형 전원(KEC)", keywords: ["전기철도", "분산형", "신재생", "전기저장장치", "태양광"] }
];

async function categorize() {
  const rawData = fs.readFileSync(MASTER_DB_PATH, 'utf8');
  const questions = JSON.parse(rawData);
  const categorized = {};
  units.forEach(u => categorized[u.name] = []);
  const uncategorized = [];

  questions.forEach(q => {
    let found = false;
    const text = (q.question + " " + (q.explanation || "")).toLowerCase();
    
    // 1. KEC 특수 처리 (5과목인 경우 우선순위)
    if (q.subject && (q.subject.includes("설비") || q.subject.includes("5과목"))) {
       // 설비 과목 내에서 세분화
       for (let i = 16; i < 19; i++) {
         if (units[i].keywords.some(k => text.includes(k.toLowerCase()))) {
           categorized[units[i].name].push(q);
           found = true;
           break;
         }
       }
       if (!found) {
         categorized[units[17].name].push(q); // 기본적으로 18단원 배정
         found = true;
       }
    } else {
      // 2. 일반 과목 키워드 매칭
      for (let unit of units) {
        if (unit.keywords.some(k => text.includes(k.toLowerCase()))) {
          categorized[unit.name].push(q);
          found = true;
          break;
        }
      }
    }

    if (!found) uncategorized.push(q);
  });

  // 미분류 처리 (가장 유사한 과목에 강제 배분)
  uncategorized.forEach(q => {
    if (q.subject && q.subject.includes("응용")) categorized[units[0].name].push(q);
    else if (q.subject && q.subject.includes("전력")) categorized[units[4].name].push(q);
    else if (q.subject && q.subject.includes("기기")) categorized[units[8].name].push(q);
    else if (q.subject && q.subject.includes("회로")) categorized[units[12].name].push(q);
    else categorized[units[4].name].push(q); // 최후의 보단은 송전
  });

  // 파일 쓰기
  for (const [unitName, items] of Object.entries(categorized)) {
    if (items.length > 0) {
      const fileName = unitName.replace(/\//g, '_') + '.json';
      fs.writeFileSync(path.join(OUTPUT_DIR, fileName), JSON.stringify(items, null, 2));
      console.log(`Created ${fileName} with ${items.length} questions.`);
    }
  }
}

categorize();
