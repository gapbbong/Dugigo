import fs from 'fs';
import path from 'path';

const baseDir = 'e:/DugiGo/client/src/data';

function mergeAndCleanupElevator() {
  const dir = path.join(baseDir, '승강기기능사');
  const filesToMerge = [
    'ElevatorExam_11_16_FINAL_SUCCESS.json',
    'ElevatorExam_17_20.json',
    'ElevatorExam_21_24.json'
  ];
  
  let allQuestions = [];
  
  filesToMerge.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.existsSync(filePath)) {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const questions = Array.isArray(content) ? content : (content.questions || []);
      allQuestions = [...allQuestions, ...questions];
      console.log(`Merged ${file}: ${questions.length} questions`);
    }
  });
  
  if (allQuestions.length > 0) {
    fs.writeFileSync(path.join(dir, 'MASTER_DB.json'), JSON.stringify({ questions: allQuestions }, null, 2));
    console.log(`Created MASTER_DB.json for 승강기기능사 with ${allQuestions.length} questions`);
    
    // Cleanup
    const allFiles = fs.readdirSync(dir);
    allFiles.forEach(file => {
      if (file.endsWith('.json') && file !== 'MASTER_DB.json') {
        fs.unlinkSync(path.join(dir, file));
        console.log(`Deleted backup/component: ${file}`);
      }
    });
  }
}

function cleanupElectric() {
  const dir = path.join(baseDir, '전기기능사');
  const masterFile = 'MASTER_DB.json';
  
  if (fs.existsSync(path.join(dir, masterFile))) {
    const allFiles = fs.readdirSync(dir);
    allFiles.forEach(file => {
      if (file.endsWith('.json') && file !== masterFile) {
        fs.unlinkSync(path.join(dir, file));
        console.log(`Deleted backup/component: ${file}`);
      }
    });
    console.log(`Cleaned up 전기기능사 folder, kept ${masterFile}`);
  } else {
    console.log(`MASTER_DB.json not found in 전기기능사, skipping cleanup`);
  }
}

function cleanupInfoProcessing() {
  const dir = path.join(baseDir, '정보처리기능사');
  if (!fs.existsSync(dir)) return;
  
  // For Info Processing, they are Mock exams. Maybe merge them into one MASTER?
  // User said "최종 하나만 남겨줘", so I will merge them too.
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f.startsWith('ProgrammingMock'));
  let allQuestions = [];
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const questions = Array.isArray(content) ? content : (content.questions || []);
    allQuestions = [...allQuestions, ...questions];
    console.log(`Merged ${file}: ${questions.length} questions`);
  });
  
  if (allQuestions.length > 0) {
    fs.writeFileSync(path.join(dir, 'MASTER_DB.json'), JSON.stringify({ questions: allQuestions }, null, 2));
    console.log(`Created MASTER_DB.json for 정보처리기능사 with ${allQuestions.length} questions`);
    
    files.forEach(file => {
      fs.unlinkSync(path.join(dir, file));
      console.log(`Deleted mock file: ${file}`);
    });
  }
}

try {
  mergeAndCleanupElevator();
  cleanupElectric();
  cleanupInfoProcessing();
  console.log('Cleanup complete!');
} catch (err) {
  console.error('Error during cleanup:', err);
}
