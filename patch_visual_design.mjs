import fs from 'fs';

const path = 'e:/DugiGo/client/src/data/시각디자인산업기사/VisualDesign_MASTER_DB.json';
let content = fs.readFileSync(path, 'utf8');

// Robust Patch for Spot 2
const spot2Regex = /"explanation": "주황의 표준 색상은 5YR입니다\."\s+"명도는 같으나 채도가 다른색들은 조화를 이룬다\.",\s+"명도가 다른 두 색과 두 색 보다 어두운 명도의 색은 조화를 이룬다\."\s+\],\s+"answer": 4,/;

const spot2Replacement = `"explanation": "주황의 표준 색상은 5YR입니다."
  },
  {
    "number": 8,
    "question": "먼셀의 색채조화론에 대한 설명으로 틀린 것은?",
    "choices": [
      "모든 색을 회전혼합 했을 때 N5가 되면 조화롭다.",
      "보색 관계의 두 색이 채도와 명도가 비슷하면 동일 면적에서 조화롭다.",
      "명도는 같으나 채도가 다른색들은 조화를 이룬다.",
      "명도가 다른 두 색과 두 색 보다 어두운 명도의 색은 조화를 이룬다."
    ],
    "answer": 4,`;

if (spot2Regex.test(content)) {
    content = content.replace(spot2Regex, spot2Replacement);
    console.log("Spot 2 patched via Robust Regex!");
} else {
    console.log("Spot 2 Regex still failed. Content around mismatch:");
    const index = content.indexOf("주황의 표준 색상은 5YR입니다.");
    if (index !== -1) {
        console.log(content.substring(index, index + 200));
    }
}

fs.writeFileSync(path, content);
console.log("Patched content written.");
