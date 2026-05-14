import fs from 'fs';
import path from 'path';

const DATA_ROOT = 'e:/DugiGo/client/src/data';

const SUBJECT_TAXONOMY = {
  "정보처리기능사": [
    { name: "01. 소프트웨어 개발 기초", keywords: ["소프트웨어", "개발", "라이프사이클", "모델", "폭포수", "애자일", "요구사항"] },
    { name: "02. 프로그래밍 언어 활용", keywords: ["c언어", "자바", "파이썬", "변수", "배열", "포인터", "연산자", "반복문", "함수", "알고리즘"] },
    { name: "03. 데이터베이스 활용", keywords: ["sql", "릴레이션", "테이블", "데이터베이스", "조인", "정규화", "뷰", "인덱스", "트랜잭션", "ddl", "dml"] },
    { name: "04. 운영체제 및 네트워크 기초", keywords: ["운영체제", "리눅스", "유닉스", "쉘", "스케줄링", "프로세스", "네트워크", "osi", "tcp", "ip", "라우팅"] },
    { name: "05. 애플리케이션 테스트 관리", keywords: ["테스트", "블랙박스", "화이트박스", "오류", "결함", "디버깅", "검사", "통합", "유지보수"] }
  ],
  "정보처리산업기사": [
    { name: "01. 데이터베이스 구축", keywords: ["데이터베이스", "모델링", "개체", "관계", "스키마", "정규화", "sql", "튜닝"] },
    { name: "02. 전자계산기 구조", keywords: ["cpu", "중앙처리", "메모리", "주소", "명령어", "인터럽트", "채널", "디지털"] },
    { name: "03. 운영체제", keywords: ["스케줄링", "교착상태", "데드락", "기억장치", "페이지", "디렉토리", "유닉스", "리눅스"] },
    { name: "04. 소프트웨어 공학", keywords: ["dfd", "객체지향", "디자인패턴", "결합도", "응집도", "화이트박스", "유지보수"] },
    { name: "05. 데이터 통신", keywords: ["프로토콜", "osi", "네트워크", "변조", "다중화", "에러", "hdlc", "ip"] }
  ],
  "전기기능사": [
    { name: "01. 전기이론", keywords: ["저항", "전류", "전압", "직류", "교류", "콘덴서", "인덕턴스", "전자기", "자계", "오옴", "키르히호프"] },
    { name: "02. 전기기기", keywords: ["직류기", "동기기", "변압기", "유도기", "정류기", "전동기", "발전기", "회전자", "슬립", "계자"] },
    { name: "03. 전기설비", keywords: ["전선", "배선", "배관", "접지", "전선로", "조명", "절연", "공사", "금속관", "가요", "케이블"] }
  ],
  "한국사검정시험": [
    { name: "01. 선사 시대와 국가의 형성", keywords: ["구석기", "신석기", "청동기", "철기", "고조선", "부여", "고구려", "옥저", "동예", "삼한"] },
    { name: "02. 삼국 시대와 남북국 시대", keywords: ["백제", "신라", "가야", "통일신라", "발해", "불교", "유교", "골품제", "화랑도"] },
    { name: "03. 고려 시대", keywords: ["고려", "광종", "성종", "공민왕", "무신정변", "대몽항쟁", "권문세족", "불교", "청자"] },
    { name: "04. 조선 시대(전기)", keywords: ["조선", "세종", "성종", "사림", "붕당", "임진왜란", "병자호란", "경국대전", "유교"] },
    { name: "05. 조선 시대(후기)", keywords: ["영조", "정조", "실학", "세도정치", "세제개편", "농민봉기", "풍속화", "판소리"] },
    { name: "06. 근대 사회의 전개", keywords: ["흥선대원군", "개항", "동학", "갑오개혁", "대한제국", "독립협회", "항일의병", "애국계몽"] },
    { name: "07. 일제 강점기와 현대 사회", keywords: ["3.1운동", "임시정부", "무장투쟁", "광복", "대한민국", "민주주의", "경제성장", "남북"] }
  ],
  "승강기기능사": [
    { name: "01. 전기이론", keywords: ["저항", "전류", "전압", "직류", "교류", "콘덴서", "인덕턴스", "전자기", "자계", "전동기", "발전기", "브리지", "오옴", "플레밍"] },
    { name: "02. 기계일반", keywords: ["응력", "하중", "모멘트", "볼트", "너트", "베어링", "기어", "풀리", "재료역학", "압축", "인장"] },
    { name: "03. 승강기 점검 및 보수", keywords: ["안전관리", "일상점검", "정기검사", "유지관리", "비상벨", "안전장치", "보수", "점검"] },
    { name: "04. 승강기 개론", keywords: ["로프", "가이드", "브레이크", "균형추", "조속기", "도어", "유압", "에스컬레이터", "덤웨이터"] }
  ],
  "자동화설비(생산자동화)기능사": [
    { name: "01. 기계제도 및 공유압", keywords: ["도면", "투상법", "치수", "기하공차", "유압", "공압", "실린더", "밸브", "회로도"] },
    { name: "02. 자동화 기초", keywords: ["센서", "스위치", "모터", "기계요소", "나사", "기어", "베어링", "캠", "링크"] },
    { name: "03. PLC 및 제어", keywords: ["plc", "시퀀스", "논리회로", "래더", "제어", "마이컴", "인터페이스"] }
  ],
  "3D프린터운용기능사": [
    { name: "01. 제품 스캐닝 및 모델링", keywords: ["스캔", "역설계", "모델링", "cad", "카티아", "인벤터", "솔리드", "서피스"] },
    { name: "02. 3D프린터 설정 및 출력", keywords: ["슬라이싱", "stl", "g-code", "서포트", "레이어", "노즐", "베드", "필라멘트"] },
    { name: "03. 3D프린터 안전 및 후가공", keywords: ["안전", "화재", "유해", "후가공", "샌딩", "도색", "세척", "경화"] }
  ],
  "시각디자인산업기사": [
    { name: "01. 디자인론", keywords: ["디자인", "역사", "조형", "원리", "형태", "황금비", "게슈탈트"] },
    { name: "02. 색채학", keywords: ["색상", "명도", "채도", "먼셀", "오스트발트", "색체계", "대비", "조화"] },
    { name: "03. 시각디자인실무", keywords: ["광고", "편집", "패키지", "타이포", "아이덴티티", "심벌", "로고"] }
  ],
  "컴퓨터활용능력 2급": [
    { name: "01. 컴퓨터 일반", keywords: ["컴퓨터", "운영체제", "윈도우", "하드웨어", "소프트웨어", "멀티미디어", "네트워크", "모바일"] },
    { name: "02. 스프레드시트 일반", keywords: ["엑셀", "함수", "수식", "차트", "매크로", "데이터", "필터", "정렬"] }
  ],
  "전기공사산업기사": [
    { name: "01. 조명 및 전열", keywords: ["조명", "광도", "럭스", "루멘", "전열", "조도", "광속", "칸델라"] },
    { name: "02. 전기화학 및 배터리", keywords: ["전지", "배터리", "축전지", "전기화학", "패러데이", "전해"] },
    { name: "03. 전동기 응용", keywords: ["펌프", "권상", "엘리베이터", "용접", "가열", "건조", "공작기계"] },
    { name: "04. 철도설계 및 궤도", keywords: ["철도", "궤도", "전차", "급전", "가선", "조가선", "커티너리"] },
    { name: "05. 송전특성 및 선로정수", keywords: ["송전", "선로정수", "인덕턴스", "정전용량", "복도체", "다도체", "충전전류"] },
    { name: "06. 전로의 고장계산 및 중성점 접지", keywords: ["지락", "단락", "고장계산", "직접접지", "소호리액터", "저항접지"] },
    { name: "07. 이상전압 및 보호계측", keywords: ["피뢰기", "차단기", "계전기", "이상전압", "섬락", "아킹혼", "서지"] },
    { name: "08. 배전 계통 및 발전", keywords: ["배전", "변전", "수력", "화력", "원자력", "댐", "터빈"] },
    { name: "09. 직류기", keywords: ["직류기", "정류자", "브러시", "전기자", "직권", "분권", "균압"] },
    { name: "10. 동기기", keywords: ["동기기", "동기발전기", "동기전동기", "동기임피던스", "동기화"] },
    { name: "11. 변압기", keywords: ["변압기", "권수비", "변압기결선", "무부하손", "부하손", "절연유"] },
    { name: "12. 유도기 및 정류기", keywords: ["유도기", "유도전동기", "슬립", "회전자기장", "정류기", "사이리스터"] },
    { name: "13. 직류회로 및 교류회로 기초", keywords: ["옴의법칙", "키르히호프", "실효값", "평균값", "순시값", "임피던스"] },
    { name: "14. 다상교류 및 대칭좌표법", keywords: ["3상", "델타", "와이", "Y-Δ", "대칭좌표", "영상전류"] },
    { name: "15. 회로망 정리 및 과도현상", keywords: ["테브난", "노턴", "중첩의", "과도현상", "특성임피던스", "시정수"] },
    { name: "16. 전달함수 및 라플라스 변환", keywords: ["전달함수", "블록선도", "라플라스", "제어공학", "안정도"] },
    { name: "17. 공통사항 및 접지(KEC)", keywords: ["KEC", "전기설비기술기준", "접지시스템", "등전위", "피뢰시스템"] },
    { name: "18. 저압/고압/특고압 전기설비(KEC)", keywords: ["저압전기설비", "고압전기설비", "보안거리", "가공전선", "옥내배선"] },
    { name: "19. 전기철도 및 분산형 전원(KEC)", keywords: ["전기철도", "분산형", "신재생", "전기저장장치", "태양광"] }
  ]
};

async function processSubject(subject) {
  try {
    const dirPath = path.join(DATA_ROOT, subject);
    if (!fs.existsSync(dirPath)) return;

    const files = fs.readdirSync(dirPath);
    // Flexible filename matching
    const masterFile = files.find(f => 
        f.endsWith('.json') && 
        (f.includes('MASTER_DB') || f.includes('master') || f.includes('Literacy2'))
    ) || files.find(f => f.endsWith('.json') && !f.includes('.')); // Try to find any json that isn't a unit file

    if (!masterFile) {
        console.warn(`[SKIP] ${subject}: No Master DB found.`);
        return;
    }

    const masterPath = path.join(dirPath, masterFile);
    let jsonData = JSON.parse(fs.readFileSync(masterPath, 'utf8'));
    
    let questions = Array.isArray(jsonData) ? jsonData : (jsonData.questions || jsonData.data || []);
    if (questions.length === 0) return;

    const taxonomy = SUBJECT_TAXONOMY[subject];
    if (!taxonomy) return;

    const categorized = {};
    taxonomy.forEach(u => categorized[u.name] = []);
    const uncategorized = [];

    questions.forEach(q => {
      let found = false;
      const text = ((q.question || '') + ' ' + (q.explanation || '') + ' ' + (q.sub_unit || '')).toLowerCase();
      
      for (let unit of taxonomy) {
        if (unit.keywords.some(k => text.includes(k.toLowerCase()))) {
          categorized[unit.name].push({ ...q, sub_unit: unit.name });
          found = true;
          break;
        }
      }
      if (!found) uncategorized.push(q);
    });

    if (uncategorized.length > 0) {
      const defaultUnit = taxonomy[taxonomy.length - 1].name;
      uncategorized.forEach(q => {
        categorized[defaultUnit].push({ ...q, sub_unit: defaultUnit });
      });
    }

    // 마스터 DB 및 단원별 파일 모두 빈도수 높은 순으로 정렬 (빈도수 같으면 번호순)
    const sortByFrequency = (a, b) => {
        if ((b.frequency || 0) !== (a.frequency || 0)) {
            return (b.frequency || 0) - (a.frequency || 0);
        }
        return (a.number || 0) - (b.number || 0);
    };

    const updatedMaster = Object.values(categorized).flat().sort(sortByFrequency);
    
    if (!Array.isArray(jsonData)) {
        if (jsonData.questions) jsonData.questions = updatedMaster;
        else if (jsonData.data) jsonData.data = updatedMaster;
        else jsonData = updatedMaster;
    } else {
        jsonData = updatedMaster;
    }
    
    fs.writeFileSync(masterPath, JSON.stringify(jsonData, null, 2));

    for (const [unitName, items] of Object.entries(categorized)) {
      if (items.length > 0) {
        // 단원 내에서도 빈도수 높은 순으로 정렬
        items.sort(sortByFrequency);
        
        // 파일명에서 / 등 금지된 문자 제거 (윈도우 호환성)
        const safeUnitName = unitName.replace(/\//g, '_');
        const fileName = safeUnitName + '.json';
        fs.writeFileSync(path.join(dirPath, fileName), JSON.stringify(items, null, 2));
      }
    }

    console.log(`[DONE] ${subject}: Classified ${questions.length} questions into ${taxonomy.length} units.`);
  } catch (err) {
    console.error(`[ERROR] Failed to process ${subject}:`, err.message);
  }
}

async function runParallel() {
  console.log("Starting parallel classification for ALL subjects (Universal Mode)...");
  const subjects = Object.keys(SUBJECT_TAXONOMY);
  await Promise.all(subjects.map(s => processSubject(s)));
  console.log("\nAll available subjects have been explicitly classified and distributed.");
}

runParallel().catch(console.error);
