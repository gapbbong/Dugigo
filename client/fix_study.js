const fs = require('fs');

// 1. Fix 80 Praises in StudyClient.tsx
let studyClient = fs.readFileSync('e:/DugiGo/client/src/app/study/[subject]/StudyClient.tsx', 'utf8');

const praisesArray = [
  "완벽하게 이해하셨네요 👏", "대단해요! 아주 정확합니다 🎯", "훌륭합니다! 💯", "정확해요! 이 기세로 계속 가봐요 🚀",
  "정말 잘하셨어요! 🌟", "완벽해요! 핵심을 찌르셨네요 ✨", "대정답! 찰떡같이 맞추셨네요 🎉", "아주 좋아요! 개념이 꽉 잡혀있네요 👍",
  "최고예요! 폼 미쳤다 🤩", "정답입니다! 승강기 마스터가 눈앞에 🏆", "기가 막힌 정답입니다 👏", "이해력이 쏙쏙! 완벽해요 💡",
  "틀림없는 정답! 훌륭해요 🎯", "아주 똑똑한 선택이네요 🧠", "감탄이 절로 나옵니다 🎇", "정답 요정 강림! 🧚",
  "이 기세면 합격은 문제없어요 🚀", "정답! 개념 정리가 완벽하네요 📚", "놀라운 실력입니다 😲", "명쾌한 정답! 최고예요 ✨",
  "정답입니다! 오늘의 에이스 🥇", "퍼펙트! 빈틈이 없네요 🛡️", "확실하게 아시는군요 🎯", "정답! 공부한 보람이 있네요 📝",
  "정답의 기운이 팍팍 느껴져요 🌟", "정확한 판단력! 훌륭합니다 ⚖️", "이 구역의 정답왕 👑", "스펀지 같은 흡수력! 대단해요 🧽",
  "정답! 정말 대단한 집중력이에요 🔍", "백점 만점에 만점 💯", "멋진 정답! 박수를 보냅니다 👏", "정답! 실력이 일취월장하네요 📈",
  "맞습니다! 개념을 꿰뚫고 계시네요 🎯", "정답! 오늘의 베스트 플레이어 🏅", "이해가 깊군요! 대단해요 🌊", "정답! 자신감을 가지셔도 좋습니다 💪",
  "아주 깔끔한 정답입니다 🧼", "정답! 두뇌 회전이 엄청나네요 🌪️", "대단해요! 아주 스마트한 선택 🎓", "정답! 흠잡을 데가 없어요 🔍",
  "완벽한 정답! 칭찬 스티커 꾹 💮", "정답! 빛나는 실력입니다 💫", "놀라운 정답! 감동했어요 🥺", "정답! 천재 아니신가요? 🤯",
  "아주 정확해요! 나이스 샷 🏌️", "정답! 실력이 보통이 아니네요 🏋️", "맞습니다! 개념 장인 인정 🛠️", "정답! 정말 매끄러운 풀이네요 🧊",
  "완벽 그 자체! 💯", "정답! 훌륭한 통찰력입니다 🔭", "맞아요! 어떻게 알았죠? 🕵️", "정답! 당신의 지식에 건배 🥂",
  "정답! 지식이 차곡차곡 쌓이네요 🧱", "아주 좋아요! 정답의 달인 🌙", "정답! 실력 발휘 제대로 하시네요 🎆", "맞습니다! 정말 자랑스러워요 🏆",
  "정답! 뇌가 번뜩이는 순간 ⚡", "아주 정확합니다! 정답! 🎯", "정답! 오늘 무슨 날인가요? 🎉", "훌륭해요! 정답 제조기 🏭",
  "정답! 지식의 샘이 마르지 않네요 ⛲", "맞습니다! 개념 폭발 🌋", "정답! 아주 예리한 선택이네요 🗡️", "정답! 눈부신 정답 행진 ☀️",
  "완벽합니다! 정답 사냥꾼 🏹", "정답! 아주 속 시원한 정답 🧊", "맞아요! 실력이 금메달 감 🥇", "정답! 당신은 정답 자판기 📠",
  "아주 좋아요! 정답 릴레이 🏃", "정답! 멈추지 않는 정답 본능 🐅", "정답! 개념이 머릿속에 쏙쏙 🧠", "훌륭해요! 정답률 100% 도전 📈",
  "정답! 아주 든든한 실력입니다 🏰", "맞습니다! 훌륭한 기본기 🧱", "정답! 흔들림 없는 실력 🏔️", "정답! 정말 나이스합니다 👍",
  "아주 정확해요! 백발백중 🎯", "정답! 멋진 정답 감사합니다 💐", "맞아요! 정답의 스페셜리스트 🕵️", "정답! 오늘도 빛나는 실력 ✨"
];

const praisesCode = `                            const praises = ${JSON.stringify(praisesArray, null, 2)};`;

const targetRegex = /const praises = \[\s*"완벽하게 이해하셨네요 👏"[\s\S]*?\];/;
studyClient = studyClient.replace(targetRegex, praisesCode);
fs.writeFileSync('e:/DugiGo/client/src/app/study/[subject]/StudyClient.tsx', studyClient);
console.log('Updated StudyClient.tsx with 80 praises');


// 2. Fix LaTeX backslashes in MASTER_DB.json
const dbPath = 'e:/DugiGo/client/src/data/승강기기능사/MASTER_DB.json';
let dbContent = fs.readFileSync(dbPath, 'utf8');

// Replace \text with \\text, \frac with \\frac, etc. IF NOT ALREADY escaped
// We can find all patterns like " \text" or "\text" and replace with "\\text".
// Actually, it's safer to just replace all `\text` with `\\text` etc.
// In raw string representation of JSON, `\t` is a tab, `\f` is a form feed.
// Wait! If the file contains actual tab characters, `\t` might literally be a tab character!
// So let's replace actual tab followed by "ext" with "\\text".
// Let's replace actual form-feed followed by "rac" with "\\frac".
// Let's replace actual tab followed by "imes" with "\\times".
// Let's replace "\n" with "\\n" ? No, "\n" is newline, which is fine if it's meant to be a newline. But wait, `\n` might be a newline character or literal \n.
// Actually, let's fix it by parsing and stringifying! Wait, parsing will result in corrupted text like `<tab>ext`.
// We can write a regex on the raw text string.

dbContent = dbContent.replace(/\\text/g, '\\\\text');
dbContent = dbContent.replace(/\\frac/g, '\\\\frac');
dbContent = dbContent.replace(/\\times/g, '\\\\times');
dbContent = dbContent.replace(/\\left/g, '\\\\left');
dbContent = dbContent.replace(/\\right/g, '\\\\right');
dbContent = dbContent.replace(/\\pi/g, '\\\\pi');
dbContent = dbContent.replace(/\\cdot/g, '\\\\cdot');
dbContent = dbContent.replace(/\\omega/g, '\\\\omega');
dbContent = dbContent.replace(/\\theta/g, '\\\\theta');
dbContent = dbContent.replace(/\\alpha/g, '\\\\alpha');
dbContent = dbContent.replace(/\\beta/g, '\\\\beta');
dbContent = dbContent.replace(/\\gamma/g, '\\\\gamma');
dbContent = dbContent.replace(/\\mu/g, '\\\\mu');
dbContent = dbContent.replace(/\\rho/g, '\\\\rho');
dbContent = dbContent.replace(/\\sigma/g, '\\\\sigma');
dbContent = dbContent.replace(/\\sum/g, '\\\\sum');
dbContent = dbContent.replace(/\\int/g, '\\\\int');
dbContent = dbContent.replace(/\\infty/g, '\\\\infty');
dbContent = dbContent.replace(/\\rightarrow/g, '\\\\rightarrow');
dbContent = dbContent.replace(/\\leftarrow/g, '\\\\leftarrow');
dbContent = dbContent.replace(/\\downarrow/g, '\\\\downarrow');
dbContent = dbContent.replace(/\\uparrow/g, '\\\\uparrow');
dbContent = dbContent.replace(/\\leq/g, '\\\\leq');
dbContent = dbContent.replace(/\\geq/g, '\\\\geq');
dbContent = dbContent.replace(/\\equiv/g, '\\\\equiv');
dbContent = dbContent.replace(/\\approx/g, '\\\\approx');
dbContent = dbContent.replace(/\\sqrt/g, '\\\\sqrt');
dbContent = dbContent.replace(/\\circ/g, '\\\\circ');
dbContent = dbContent.replace(/\\angle/g, '\\\\angle');
dbContent = dbContent.replace(/\\sin/g, '\\\\sin');
dbContent = dbContent.replace(/\\cos/g, '\\\\cos');
dbContent = dbContent.replace(/\\tan/g, '\\\\tan');

// Fix the case where it actually became a TAB or FORM FEED!
dbContent = dbContent.replace(/\text\{/g, '\\\\text{'); // This matches \t ext{
dbContent = dbContent.replace(/\frac\{/g, '\\\\frac{'); // This matches \f rac{

// Wait, \text is tab + ext!
// In JavaScript regex, \t matches tab.
dbContent = dbContent.replace(/\text\{/g, '\\\\text{'); 
dbContent = dbContent.replace(/\frac\{/g, '\\\\frac{'); 
dbContent = dbContent.replace(/\times/g, '\\\\times'); 

fs.writeFileSync(dbPath, dbContent);
console.log('Fixed MASTER_DB.json LaTeX escapes');

// Let's also check 기계일반_1세트.json etc if they have \text
const checkSet = (setPath) => {
  if(fs.existsSync(setPath)) {
     let content = fs.readFileSync(setPath, 'utf8');
     content = content.replace(/\text\{/g, '\\\\text{').replace(/\frac\{/g, '\\\\frac{').replace(/\times/g, '\\\\times');
     fs.writeFileSync(setPath, content);
  }
};
checkSet('e:/DugiGo/client/src/summaries/승강기기능사/기계일반_1세트.json');
checkSet('e:/DugiGo/client/src/summaries/승강기기능사/기계일반_2세트.json');
checkSet('e:/DugiGo/client/src/summaries/승강기기능사/기계일반_3세트.json');
checkSet('e:/DugiGo/client/src/summaries/승강기기능사/기계일반_4세트.json');
checkSet('e:/DugiGo/client/src/summaries/승강기기능사/기계일반_5세트.json');
