import fs from 'fs';
import path from 'path';

const subject = "전기기사";
const unit = "01. 전기자기학 (1부)";
const set = "1";

const cleanUnit = unit.replace(/\s*\(\d+부\)$/, '').trim();
const safeUnitName = cleanUnit.replace(/[^a-z0-9가-힣]/gi, '_');
const summaryFileName = `${safeUnitName}_${set}세트.json`;
const fallbackFileName = `${cleanUnit.replace(/^\d+\.\s*/, '').replace(/[^a-z0-9가-힣]/gi, '_')}_${set}세트.json`;

const summariesBase = path.join(process.cwd(), 'public', 'summaries');
const srcSummariesBase = path.join(process.cwd(), 'src', 'summaries');

const publicPath = path.join(summariesBase, subject, summaryFileName);
const fallbackPublicPath = path.join(summariesBase, subject, fallbackFileName);
const srcPath = path.join(srcSummariesBase, subject, summaryFileName);
const fallbackSrcPath = path.join(srcSummariesBase, subject, fallbackFileName);

console.log("publicPath:", publicPath);
console.log("fallbackPublicPath:", fallbackPublicPath);
console.log("srcPath:", srcPath);
console.log("fallbackSrcPath:", fallbackSrcPath);

console.log("publicPath exists:", fs.existsSync(publicPath));
console.log("fallbackPublicPath exists:", fs.existsSync(fallbackPublicPath));
console.log("srcPath exists:", fs.existsSync(srcPath));
console.log("fallbackSrcPath exists:", fs.existsSync(fallbackSrcPath));

const summaryPath = fs.existsSync(publicPath) ? publicPath : 
                  (fs.existsSync(fallbackPublicPath) ? fallbackPublicPath : 
                  (fs.existsSync(srcPath) ? srcPath : fallbackSrcPath));

console.log("Selected summaryPath:", summaryPath);
console.log("summaryPath exists:", fs.existsSync(summaryPath));
if (fs.existsSync(summaryPath)) {
  const content = fs.readFileSync(summaryPath, 'utf-8');
  console.log("JSON parsed successfully:", !!JSON.parse(content));
}
