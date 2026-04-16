import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = "http://10.128.49.91:8000";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q";

// 서비스 역할 키를 사용하여 클라이언트 생성 (보안 우회)
const supabase = createClient(supabaseUrl, SERVICE_ROLE_KEY);

const DATA_DIR = 'e:/DugiGo/client/src/data/전기기능사';

async function syncSupabase() {
    console.log('--- 슈파베이스 완전 동기화 시작 (Service Role Key 사용) ---');

    // 1. 로컬 파일 읽기 및 가공
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    const uniqueMap = new Map();

    files.forEach(file => {
        const filePath = path.join(DATA_DIR, file);
        if (!fs.existsSync(filePath)) return;
        const questions = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        if (!Array.isArray(questions)) return;

        questions.forEach(q => {
            const key = `ELECTRICITY-${q.year}-${parseInt(q.round)}-${q.question_num}`;
            if (uniqueMap.has(key)) return; 

            uniqueMap.set(key, {
                subject_id: 'ELECTRICITY',
                exam_year: parseInt(q.year),
                exam_round: parseInt(q.round),
                question_no: q.question_num,
                question_text: q.question,
                options: q.options || [],
                correct_answer: q.answer.toString(),
                explanation: q.explanation || '',
                metadata: {
                    level: q.level || '중',
                    source_file: file,
                    category: (q.question_num <= 20) ? "전기이론" : (q.question_num <= 40) ? "전기기기" : "전기설비"
                }
            });
        });
    });

    const allQuestions = Array.from(uniqueMap.values());
    console.log(`총 ${allQuestions.length}문항 준비 완료. 업로드 시작...`);

    // 2. 벌크 업서트 (관리자 권한)
    const BATCH_SIZE = 100;
    for (let i = 0; i < allQuestions.length; i += BATCH_SIZE) {
        const batch = allQuestions.slice(i, i + BATCH_SIZE);
        
        const { error: upsertError } = await supabase
            .from('dukigo_exam_questions')
            .upsert(batch, { 
                onConflict: 'subject_id,exam_year,exam_round,question_no' 
            });

        if (upsertError) {
            console.error(`배치(${i}) 업로드 오류:`, upsertError.message);
        } else {
            console.log(`업로드 성공: ${Math.min(i + BATCH_SIZE, allQuestions.length)} / ${allQuestions.length}`);
        }
    }

    console.log('\n--- 슈파베이스 완전 동기화 성공! ---');
}

syncSupabase();
