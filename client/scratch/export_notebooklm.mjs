import fs from 'fs';
import path from 'path';

const subjects = ['정보처리기능사', '승강기기능사', '전기기능사'];
const baseDataDir = path.join(process.cwd(), 'src', 'data');
const outputBaseDir = path.join(process.cwd(), '..', 'notebook_lm_sources');

const classifyQuestion = (sub, q) => {
  const text = ((q.question || '') + ' ' + (q.explanation || '')).toLowerCase();

  if (sub === '정보처리기능사') {
    if (q.sub_unit) return q.sub_unit;
    if (/sql|릴레이션|테이블|데이터베이스|조인|정규화|뷰|인덱스|트랜잭션|ddl|dml|dcl|select|update|delete|insert|기본키|외래키/.test(text)) return "데이터베이스 활용";
    if (/테스트|블랙박스|화이트박스|오류|결함|디버깅|검사|통합|알파|베타|유지보수|스텁|드라이버|단위|인수/.test(text)) return "애플리케이션 테스트 관리";
    if (/운영체제|리눅스|유닉스|쉘|스케줄링|프로세스|네트워크|osi|tcp|ip|라우팅|보안|통신|윈도우|dos|디렉터리/.test(text)) return "운영체제 및 네트워크 기초";
    if (/c언어|자바|파이썬|변수|배열|포인터|연산자|반복문|함수|클래스|객체|상속|알고리즘|순서도|자료구조|스택|큐|트리/.test(text)) return "프로그래밍 언어 활용";
    return "소프트웨어 개발 기초";
  }

  if (sub === '승강기기능사') {
    if (/저항|전류|전압|직류|교류|콘덴서|인덕턴스|전자기|자계|전동기|발전기|브리지|오옴|플레밍/.test(text)) return "전기이론";
    if (/응력|하중|모멘트|볼트|너트|베어링|기어|풀리|재료역학|압축|인장/.test(text)) return "기계일반";
    if (/안전관리|일상점검|정기검사|유지관리|비상벨|안전장치|보수|점검/.test(text)) return "승강기 점검 및 보수";
    return "승강기 개론";
  }

  if (sub === '전기기능사') {
    if (/전선|배선|배관|접지|전선로|조명|절연|공사|금속관|가요|케이블/.test(text)) return "[설비] 전기설비";
    if (/직류기|동기기|변압기|유도기|정류기|전동기|발전기|회전자|슬립|계자/.test(text)) return "[기기] 전기기기";
    return "[이론] 전기이론";
  }

  return "기본 단원";
};

if (!fs.existsSync(outputBaseDir)) {
  fs.mkdirSync(outputBaseDir, { recursive: true });
}

subjects.forEach(sub => {
  const subDataDir = path.join(baseDataDir, sub);
  if (!fs.existsSync(subDataDir)) return;

  const files = fs.readdirSync(subDataDir).filter(f => f.endsWith('.json'));
  const groupedQuestions = {};

  files.forEach(file => {
    const fileContent = fs.readFileSync(path.join(subDataDir, file), 'utf-8');
    const data = JSON.parse(fileContent);
    const questions = Array.isArray(data) ? data : (data.questions || []);

    questions.forEach(q => {
      const unitName = classifyQuestion(sub, q);
      if (!groupedQuestions[unitName]) {
        groupedQuestions[unitName] = [];
      }
      groupedQuestions[unitName].push(q);
    });
  });

  const subOutputDir = path.join(outputBaseDir, sub);
  if (!fs.existsSync(subOutputDir)) {
    fs.mkdirSync(subOutputDir, { recursive: true });
  }

  const setSize = 30;
  let runningSetIdx = 0;

  // 가나다 순으로 단원 정렬해서 연속된 세트 번호 생성
  const sortedUnits = Object.entries(groupedQuestions).sort((a, b) => a[0].localeCompare(b[0]));

  sortedUnits.forEach(([unitName, qs]) => {
    const sortedQs = qs.sort((a, b) => {
      const textA = (a.question || '').toString();
      const textB = (b.question || '').toString();
      return textA.localeCompare(textB);
    });

    const totalSets = Math.ceil(sortedQs.length / setSize);
    const startSetIdx = runningSetIdx + 1;
    runningSetIdx += totalSets;

    for (let setIdx = 0; setIdx < totalSets; setIdx++) {
      const start = setIdx * setSize;
      const end = Math.min((setIdx + 1) * setSize, sortedQs.length);
      const setQs = sortedQs.slice(start, end);
      const globalSetNum = startSetIdx + setIdx;

      let outputText = `### ${sub} - ${unitName} (${globalSetNum}세트) ###\n\n`;

      setQs.forEach((q, idx) => {
        const number = q.number || (start + idx + 1);
        const question = q.question || '문제 내용 없음';
        const choices = Array.isArray(q.choices) ? q.choices.map((c, cIdx) => `${cIdx + 1}) ${c}`).join('  ') : '보기 없음';
        const answer = q.answer || '정답 없음';
        const explanation = q.explanation || '해설 없음';

        outputText += `[문항 ${number}]\n`;
        outputText += `질문: ${question}\n`;
        outputText += `보기: ${choices}\n`;
        outputText += `정답: ${answer}번\n`;
        outputText += `해설: ${explanation}\n`;
        outputText += `--------------------------------------------------\n\n`;
      });

      const safeUnitName = unitName.replace(/[\\/:"*?<>|]/g, '_');
      fs.writeFileSync(path.join(subOutputDir, `${safeUnitName}_${globalSetNum}세트.txt`), outputText, 'utf-8');
    }
  });

  console.log(`[완료] ${sub} 세트별 파일 생성 완료 (${runningSetIdx}개 세트)`);
});
