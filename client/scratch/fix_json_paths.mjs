import fs from 'fs';
import path from 'path';

const baseDataDir = 'e:/DugiGo/client/src/data';
const basePublicDir = 'e:/DugiGo/client/public';

function fixJsonPaths(subject) {
  const filePath = path.join(baseDataDir, subject, 'MASTER_DB.json');
  if (!fs.existsSync(filePath)) return;

  console.log(`Processing ${subject}...`);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // 1. Fix localhost URLs
  // Example: http://localhost:5001/serve-image?path=...public\images\exams\2015\01\q4_1.webp
  // Should become /images/exams/2015_01/q4_1.webp
  
  content = content.replace(/http:\/\/localhost:5001\/serve-image\?path=[^'"]+/g, (match) => {
    try {
      const decoded = decodeURIComponent(match.split('path=')[1]);
      // Extract the part after "public"
      const publicIndex = decoded.toLowerCase().indexOf('public');
      if (publicIndex !== -1) {
        let relativePath = decoded.substring(publicIndex + 6).replace(/\\/g, '/');
        
        // Handle folder naming mismatch (2015/01 vs 2015_01)
        // Match patterns like /images/exams/2015/01/ and change to /images/exams/2015_01/
        relativePath = relativePath.replace(/\/images\/exams\/(\d{4})\/(\d{2})\//, '/images/exams/$1_$2/');
        
        return relativePath;
      }
    } catch (e) {
      console.error('Error parsing URL:', match);
    }
    return match;
  });

  // 2. Handle property-based images (explanation_img, etc.)
  // These usually don't have paths, just filenames.
  // We need to map them to /images/subjects/[Subject]/[filename] 
  // OR /images/exams/[Year]_[Round]/[filename]
  
  const data = JSON.parse(content);
  const questions = Array.isArray(data) ? data : (data.questions || []);
  
  questions.forEach(q => {
    ['question_img', 'explanation_img'].forEach(prop => {
      if (q[prop] && !q[prop].startsWith('/')) {
        const filename = q[prop];
        // Priority 1: Check if it's in public/images/exams/[Year]_[Round]/
        const session = `${q.year}_${q.round}`;
        const sessionPath = path.join(basePublicDir, 'images', 'exams', session, filename);
        if (fs.existsSync(sessionPath)) {
          q[prop] = `/images/exams/${session}/${filename}`;
        } else {
          // Priority 2: Check in public/images/subjects/[Subject]/
          q[prop] = `/images/subjects/${subject}/${filename}`;
          // Note: If we moved them into a subfolder 'images', we should account for that.
          // But I moved them to public/images/subjects/[Subject]/ 
          // (Move-Item src/data/Subject/images/* -Destination public/images/subjects/Subject/)
        }
      }
    });
  });

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Saved ${subject} MASTER_DB.json`);
}

const subjects = fs.readdirSync(baseDataDir).filter(f => fs.lstatSync(path.join(baseDataDir, f)).isDirectory());
subjects.forEach(fixJsonPaths);

// Cleanup large files
const pathsToDelete = [
  'e:/DugiGo/client/public/images/subjects/전기기능사/images/ElectricExam2019 - 복사본.pdf',
  'e:/DugiGo/client/public/images/subjects/전기기능사/images/temp_upload.pdf'
];

pathsToDelete.forEach(p => {
  if (fs.existsSync(p)) {
    fs.unlinkSync(p);
    console.log(`Deleted large file: ${p}`);
  }
});

console.log('JSON path fix and cleanup complete!');
