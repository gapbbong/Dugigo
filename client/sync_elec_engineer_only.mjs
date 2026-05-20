import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

async function syncElec() {
  const conf = { subject_id: 'ELECTRIC_ENGINEER', folder: '전기기사', file: 'MASTER_DB.json' };
  const fullPath = path.resolve(process.cwd(), 'src', 'data', conf.folder, conf.file);
  if (!fs.existsSync(fullPath)) {
    console.error("❌ 파일이 없습니다:", fullPath);
    return;
  }

  console.log(`\n📂 [${conf.subject_id}] ${conf.folder} 로드 중...`);
  const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  const questions = Array.isArray(data) ? data : (data.questions || []);

  console.log(`  - 총 ${questions.length}문항 감지. 클라우드 DB 단독 업로드 시작...`);
  
  const batch = [];
  const usedKeys = new Set();

  questions.forEach((q, idx) => {
    let year = parseInt(q.year || q.exam_year);
    let round = parseInt(q.round || q.exam_round);

    if (isNaN(year) || year <= 0) year = 2021;
    if (isNaN(round) || round <= 0) round = 1;

    let qNo = parseInt(q.question_num || q.number || q.original_number || (idx + 1));
    if (isNaN(qNo) || qNo <= 0) qNo = idx + 1;

    let key = `${conf.subject_id}-${year}-${round}-${qNo}`;
    while (usedKeys.has(key)) {
      qNo += 100;
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
        unit: q.subject || q.unit || q.sub_unit || '일반',
        question_img: q.question_img || null,
        visual_coords: q.visual_coords || null,
        original_no: q.original_number || q.number || q.question_num
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
  console.log(`\n🎉 [${conf.subject_id}] 총 ${successCount}문항 완벽 동기화 완료!`);
}

syncElec();
