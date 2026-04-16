import fs from 'fs';
import path from 'path';

const MASTER_DB_PATHS = [
    'E:/Quiz-extraction/output/ElectricExam_MASTER_DB.json',
    'E:/Quiz-extraction/output/ElectricExam_MASTER_DB_2016.json'
];

async function syncMasterDB() {
    console.log('🔄 [마스터 DB 업데이트] 두 개의 DB 파일 동기화 시작...');

    // 1. 소단원 매핑 정보 구축
    const subUnitMap = new Map();
    const cachePath = 'e:/DugiGo/client/classification_cache.json';
    if (fs.existsSync(cachePath)) {
        const cache = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
        Object.entries(cache).forEach(([qText, unit]) => {
            subUnitMap.set(qText.trim(), unit);
        });
    }

    const normalize = (text) => {
        if (!text) return '';
        return text.toString()
            .replace(/\\[a-zA-Z]+/g, '') 
            .replace(/[\s\$\{\}\[\]\(\)\-\_\+\=\.\,\|\/]/g, '') 
            .trim();
    };

    const normalizedSubUnitMap = new Map();
    subUnitMap.forEach((unit, qText) => {
        const norm = normalize(qText);
        if (norm.length > 5) {
            normalizedSubUnitMap.set(norm, unit);
        }
    });

    console.log(`🔍 총 ${subUnitMap.size}개의 소단원 매핑 정보를 확보했습니다.`);

    // 2. 각 마스터 DB 파일 처리
    MASTER_DB_PATHS.forEach(dbPath => {
        if (!fs.existsSync(dbPath)) {
            console.warn(`⚠️ 파일을 찾을 수 없음: ${dbPath}`);
            return;
        }

        console.log(`📂 [${path.basename(dbPath)}] 작업 중...`);
        let masterData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
        let updateCount = 0;

        const updatedMasterData = masterData.map(q => {
            let subunit = subUnitMap.get(q.question?.trim());
            if (!subunit) {
                subunit = normalizedSubUnitMap.get(normalize(q.question));
            }

            if (subunit) {
                q.sub_unit = subunit;
                updateCount++;
            }
            return q;
        });

        fs.writeFileSync(dbPath, JSON.stringify(updatedMasterData, null, 2), 'utf-8');
        console.log(`✅ [${path.basename(dbPath)}] 완료! ${updateCount}개 문항 업데이트됨.`);
    });

    console.log(`🏁 모든 마스터 DB가 최신 상태로 갱신되었습니다.`);
}

syncMasterDB();
