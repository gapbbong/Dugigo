import fs from 'fs';
import path from 'path';

const dataDir = 'e:/DugiGo/client/src/data/전기공사산업기사';
const imageDir = 'e:/DugiGo/client/public/summaries/전기공사산업기사';
const publicPathPrefix = '/summaries/전기공사산업기사/';

// 이미지 파일 목록 가져오기 (매핑 속도 향상을 위해 맵 생성)
const imageFiles = fs.readdirSync(imageDir).filter(f => f.endsWith('.webp'));

function mapImages() {
  const unitFiles = fs.readdirSync(dataDir).filter(f => f.endsWith('.json') && f.startsWith('0') || f.startsWith('1'));

  unitFiles.forEach(file => {
    const filePath = path.join(dataDir, file);
    const questions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let updatedCount = 0;

    questions.forEach(q => {
      // id: ec_전기공사산업기사20150531_교사용__1
      // target: ec_전기공사산업기사20150531_교사용__q1.webp
      
      const targetFileName = q.id.replace(/__(\d+)$/, '__q$1.webp');
      
      const foundImage = imageFiles.find(img => img === targetFileName);

      if (foundImage) {
        q.image = publicPathPrefix + foundImage;
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      fs.writeFileSync(filePath, JSON.stringify(questions, null, 2));
      console.log(`Updated ${file}: Linked ${updatedCount} images.`);
    }
  });
}

mapImages();
