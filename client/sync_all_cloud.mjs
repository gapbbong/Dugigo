import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("❌ .env.local 파일에서 URL 또는 서비스 롤 키를 찾을 수 없습니다.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const SUBJECT_CONFIGS = [
  { subject_id: 'ELEVATOR', folder: '승강기기능사', file: 'MASTER_DB.json' },
  { subject_id: 'ELECTRICITY', folder: '전기기능사', file: 'MASTER_DB.json' },
  { subject_id: 'INFOPRO', folder: '정보처리기능사', file: 'MASTER_DB.json' },
  { subject_id: 'LITERACY_2', folder: '컴퓨터활용능력 2급', file: 'Literacy2_MASTER_DB.json' },
  { subject_id: 'PRODUCTION_AUTO', folder: '자동화설비(생산자동화)기능사', file: 'Automation_Equipment_MASTER_DB.json' },
  { subject_id: 'ELECTRIC_CONSTRUCTION', folder: '전기공사산업기사', file: 'Electric_Construction_MASTER_DB.json' },
  { subject_id: 'VISUAL_DESIGN', folder: '시각디자인산업기사', file: 'VisualDesign_MASTER_DB.json' },
  { subject_id: 'ELECTRIC_ENGINEER', folder: '전기기사', file: 'MASTER_DB.json' }
];

async function syncAllSubjects() {
  console.log("=================================================");
  console.log(" 🚀 DugiGo 마스터 DB -> Supabase 클라우드 전면 동기화 ");
  console.log(` 🌐 타겟 DB: ${supabaseUrl}`);
  console.log("=================================================\n");

  for (const conf of SUBJECT_CONFIGS) {
    const fullPath = path.resolve(process.cwd(), 'src', 'data', conf.folder, conf.file);
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️ [SKIP] 파일을 찾을 수 없습니다: ${conf.folder}/${conf.file}`);
      continue;
    }

    console.log(`\n📂 [${conf.subject_id}] ${conf.folder} 로드 중...`);
    const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    const questions = Array.isArray(data) ? data : (data.questions || []);

    console.log(`  - 총 ${questions.length}문항 감지. 클라우드 업로드 준비 중...`);
    
    const batch = [];
    const usedKeys = new Set();

    questions.forEach(q => {
      let year = parseInt(q.year || q.exam_year);
      let round = parseInt(q.round || q.exam_round);

      if (isNaN(year) || year === 0) {
        if (q.round_info) {
          const ym = q.round_info.match(/(\d{4})-\d/);
          if (ym) year = parseInt(ym[1]);
        }
      }
      if (isNaN(round) || round === 0) {
        if (q.round_info) {
          const rm = q.round_info.match(/\d{4}-(\d)/);
          if (rm) round = parseInt(rm[1]);
        }
      }

      if (isNaN(year) || year <= 0) year = 2025;
      if (isNaN(round) || round <= 0) round = 1;

      let qNo = parseInt(q.question_num || q.number || q.question_no);
      if (isNaN(qNo) || qNo <= 0) qNo = Math.floor(Math.random() * 1000) + 1;

      let key = `${conf.subject_id}-${year}-${round}-${qNo}`;
      while (usedKeys.has(key)) {
        qNo += 100; // 고유 키 확보
        key = `${conf.subject_id}-${year}-${round}-${qNo}`;
      }
      usedKeys.add(key);

      batch.push({
        subject_id: conf.subject_id,
        exam_year: year,
        exam_round: round,
        question_no: qNo,
        question_text: q.question || q.question_text || '문제 없음',
        options: q.choices || q.options || [],
        correct_answer: (q.answer || q.correct_answer || '1').toString(),
        explanation: q.explanation || '',
        metadata: {
          level: q.level || '중',
          unit: q.unit || q.sub_unit || q.category || '일반',
          question_img: q.question_img || null,
          visual_coords: q.visual_coords || null,
          original_no: q.question_num || q.number
        }
      });
    });

    const BATCH_SIZE = 100;
    let successCount = 0;

    for (let i = 0; i < batch.length; i += BATCH_SIZE) {
      const slice = batch.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('dukigo_exam_questions').upsert(slice, {
        onConflict: 'subject_id,exam_year,exam_round,question_no'
      });

      if (error) {
        console.error(`\n  ❌ [배치 에러 ${i}~${i+slice.length}]: ${error.message}`);
      } else {
        successCount += slice.length;
        process.stdout.write(`  ✅ 업로드 진행: ${successCount} / ${batch.length}\r`);
      }
    }
    console.log(`\n  🎉 [${conf.subject_id}] 총 ${successCount}문항 동기화 완료!`);
  }

  console.log("\n=================================================");
  console.log(" 👑 전 과목 클라우드 동기화가 성공적으로 끝났습니다! ");
  console.log("=================================================");
}

syncAllSubjects().catch(console.error);
