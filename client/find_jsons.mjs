import fs from 'fs';
import path from 'path';

function searchJsonFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        searchJsonFiles(filePath, fileList);
      }
    } else if (file.endsWith('.json')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const allJsons = searchJsonFiles(path.resolve(process.cwd()));
console.log(`Total JSON files: ${allJsons.length}`);

const grouped = {};
allJsons.forEach(f => {
  const relative = path.relative(process.cwd(), f);
  const parts = relative.split(path.sep);
  if (parts.length > 2 && (parts[0] === 'public' || parts[0] === 'src') && parts[1] === 'summaries') {
    const subject = parts[2];
    if (!grouped[subject]) grouped[subject] = [];
    grouped[subject].push(parts.slice(3).join('/'));
  } else {
    const parent = parts.slice(0, -1).join('/');
    if (!grouped[parent]) grouped[parent] = [];
    grouped[parent].push(parts[parts.length - 1]);
  }
});

Object.keys(grouped).sort().forEach(sub => {
  console.log(`\nGroup: ${sub} (${grouped[sub].length} files)`);
  if (grouped[sub].length > 10) {
    console.log(`  - ${grouped[sub].slice(0, 5).join('\n  - ')}`);
    console.log(`  - ... and ${grouped[sub].length - 5} more files`);
  } else {
    console.log(`  - ${grouped[sub].join('\n  - ')}`);
  }
});
