import fs from 'fs';
import path from 'path';

const subjects = [
  { name: "승강기기능사", targetSets: 46 },
  { name: "정보처리기능사", targetSets: 10 },
  { name: "전기기능사", targetSets: 54 } // 1602 questions / 30 = 54 sets
];

function checkProgress() {
  console.log("==========================================");
  console.log("📊 DugiGo+ 학습 데이터 생성 종합 리포트");
  console.log("==========================================\n");

  subjects.forEach(subject => {
    const summariesDir = `e:/DugiGo/client/src/summaries/${subject.name}`;
    const publicDir = `e:/DugiGo/client/public/summaries/${subject.name}`;

    console.log(`[ 과목: ${subject.name} ]`);
    
    if (!fs.existsSync(summariesDir)) {
      console.log("- 아직 요약 폴더가 생성되지 않았습니다.\n");
      return;
    }

    const jsonFiles = fs.readdirSync(summariesDir).filter(f => f.endsWith('.json'));
    const units = {};
    let totalSlides = 0;

    jsonFiles.forEach(file => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(summariesDir, file), 'utf8'));
        const unit = data.unit || "기타";
        units[unit] = (units[unit] || 0) + 1;
        totalSlides += (data.slides || []).length;
      } catch (e) {}
    });

    console.log("  1) 텍스트 요약 (JSON)");
    Object.entries(units).sort().forEach(([name, count]) => {
      console.log(`     - ${name.padEnd(20)}: ${count.toString().padStart(2)} 세트`);
    });

    if (fs.existsSync(publicDir)) {
      const images = fs.readdirSync(publicDir).filter(f => f.endsWith('.webp'));
      const imgCount = images.length;
      const imgPercent = totalSlides > 0 ? Math.round((imgCount / totalSlides) * 100) : 0;
      console.log(`  2) 이미지 생성 (WebP): ${imgCount} / ${totalSlides} 개 (${imgPercent}%)`);
    } else {
      console.log("  2) 이미지 생성 (WebP): 0 개 (대기 중)");
    }
    
    const totalPercent = Math.round((jsonFiles.length / subject.targetSets) * 100);
    console.log(`  3) 최종 달성률: ${totalPercent}% (${jsonFiles.length}/${subject.targetSets} 세트)\n`);
  });

  console.log("==========================================");
  console.log("Tip: 'node check_progress.mjs'를 실행하면 언제든 확인 가능합니다.");
}

checkProgress();
