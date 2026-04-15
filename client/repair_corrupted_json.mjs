import fs from 'fs';
import path from 'path';

const dataDir = 'e:/DugiGo/client/src/data/전기기능사';

function repairOptions(q) {
  let changed = false;
  const options = [...q.options];
  
  options.forEach((opt, idx) => {
    // pattern 1: starts with a comma like ",000"
    if (opt.startsWith(',')) {
      const match = q.explanation.match(new RegExp('(\\d+)' + opt.replace(/,/g, '\\,'), 'i'));
      if (match) {
        options[idx] = match[1] + opt;
        changed = true;
      } else {
        // pattern 2: try to find any 4-digit number ending in the same way
        const suffix = opt.substring(1); // e.g. "000"
        const numbers = q.explanation.match(/\d{1,3},?\d{3}/g) || [];
        for (const num of numbers) {
          if (num.endsWith(suffix)) {
            options[idx] = num;
            changed = true;
            break;
          }
        }
      }
    }
    
    // pattern 3: suspicious "0" or truncated single digits
    if (opt === '0' || opt === '') {
       // Only try if the explanation has a clear result for this index
       // This is risky, but let's look for large numbers in explanation if answer matches idx+1
       if (q.answer === idx + 1) {
          const match = q.explanation.match(/(\d+,?\d+|\d+)\s*\[[A-Za-z]+\]/);
          if (match) {
            options[idx] = match[1];
            changed = true;
          }
       }
    }
  });

  if (changed) {
    q.options = options;
  }
  return changed;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const rawData = JSON.parse(content);
    const questions = Array.isArray(rawData) ? rawData : rawData.questions;
    if (!questions) return;

    let totalChanged = 0;
    questions.forEach(q => {
      if (repairOptions(q)) totalChanged++;
    });

    if (totalChanged > 0) {
      const output = Array.isArray(rawData) ? questions : { ...rawData, questions };
      fs.writeFileSync(filePath, JSON.stringify(output, null, 2));
      console.log(`REPAIRED ${totalChanged} items in: ${path.basename(filePath)}`);
    }
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err.message);
  }
}

const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
files.forEach(f => processFile(path.join(dataDir, f)));
console.log('Local repair attempt complete.');
