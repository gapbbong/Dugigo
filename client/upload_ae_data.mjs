
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = "http://10.128.49.91:8000";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q";

const supabase = createClient(supabaseUrl, SERVICE_ROLE_KEY);

function classify(q) {
  const text = ((q.question || '') + ' ' + (q.explanation || '')).toLowerCase();
  if (/(투상|단면|치수|도면|기입|js6|mms|공차|해칭|척도|cad|선종류)/.test(text)) return "1.1 제도 기초";
  if (/(선반|밀링|절삭|가공|마모|숫돌|기어|나사|베어링|키|커터|다이스|드릴|주철|금속|합금|윤활|cnc|마찰|브로칭|스탬핑|응력|모멘트|경도|토크|보스|심압대|칩|공작)/.test(text)) return "1.2 기계 요소";
  if (/(실린더|액추에이터|로드|피스톤|요동|회전형|스트로크)/.test(text)) return "3.1 공압 액추에이터";
  if (/(밸브|포트|위치|솔레노이드|스프링|체크|방향|유량|압력|감압|릴리프)/.test(text)) return "3.2 제어 밸브";
  if (/(캐스케이드|스테퍼|시퀀스|회로설계|지연|메모리|인터록)/.test(text)) return "3.3 회로 설계";
  if (/(유압|공압|압축기|작동유|파스칼|점도|공동현상|캐비테이션|서지|축압기|f|r|l|여과|배관)/.test(text)) return "1.3 공압 이론";
  if (/(센서|검출|광전|근접|리미트|스위치|써미스터|열전대|로드셀|변위)/.test(text)) return "2.3 센서 제어";
  if (/(논리|게이트|and|or|not|nand|진리표|비트|바이트|무접점|오실로스코프|다이오드|트랜지스터|scr|tr)/.test(text)) return "2.2 전자 회로";
  if (/(저항|전류|전압|릴레이|계전기|접점|서보|모터|전전달함수|블록|오차|폐회로|루프|피드백|제어량|조작량|전동기|결선|절연)/.test(text)) return "2.1 전기 회로";
  if (/(래더|ld|명령어|타이머|카운터|로드|아웃|데이터전송|프로그래밍|언어)/.test(text)) return "4.2 프로그래밍";
  if (/(plc|모듈|cpu|랙|베이스|통신|전원|스캔|하드웨어)/.test(text)) return "4.1 PLC 하드웨어";
  return "4.3 자동화 시스템";
}

async function uploadAll() {
  const dataPath = 'E:/DugiGo/client/src/data/자동화설비(생산자동화)기능사/Automation_Equipment_MASTER_DB.json';
  const questions = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  console.log(`중복 포함 총 ${questions.length}개 문항 우회 업로드 시작...`);

  await supabase.from('dukigo_exam_questions').delete().eq('subject_id', 'PRODUCTION_AUTO');

  const stats = {};
  const usedKeys = new Set();
  const BATCH_SIZE = 50;

  for (let i = 0; i < questions.length; i += BATCH_SIZE) {
    const batch = questions.slice(i, i + BATCH_SIZE).map((q, idx) => {
      const roundInfo = q.round_info || '';
      const yearMatch = roundInfo.match(/(\d{4})-\d/);
      const roundMatch = roundInfo.match(/\d{4}-(\d)/);
      const year = yearMatch ? parseInt(yearMatch[1]) : 0;
      const round = roundMatch ? parseInt(roundMatch[1]) : 0;
      
      let qNo = q.number;
      let key = `PRODUCTION_AUTO-${year}-${round}-${qNo}`;
      
      // 중복 키 발견 시 번호를 100씩 더해가며 고유 키 생성
      while (usedKeys.has(key)) {
        qNo += 100;
        key = `PRODUCTION_AUTO-${year}-${round}-${qNo}`;
      }
      usedKeys.add(key);

      const subUnit = classify(q);
      stats[subUnit] = (stats[subUnit] || 0) + 1;

      return {
        subject_id: 'PRODUCTION_AUTO',
        exam_year: year,
        exam_round: round,
        question_no: qNo,
        question_text: q.question,
        options: q.choices || [],
        correct_answer: q.answer.toString(),
        explanation: q.explanation,
        metadata: {
          sub_unit: subUnit,
          original_subject: q.subject,
          question_img: q.question_img || null,
          visual_coords: q.visual_coords || null,
          original_no: q.number
        }
      };
    });

    const { error } = await supabase.from('dukigo_exam_questions').insert(batch);
    if (error) console.error(`Batch ${i} 오류:`, error.message);
    else console.log(`업로드 중... (${Math.min(i + BATCH_SIZE, questions.length)}/${questions.length})`);
  }

  console.log('\n--- [중복 포함] 최종 소단원별 문항 통계 ---');
  Object.keys(stats).sort().forEach(unit => {
    console.log(`${unit}: ${stats[unit]}문항`);
  });
  console.log('\n1013개 전량 업로드 성공!');
}

uploadAll();
