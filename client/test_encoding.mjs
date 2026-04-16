import fs from 'fs';
import { TextDecoder } from 'util';

const file = 'e:/DugiGo/client/src/data/전기기능사/2019_03_questions.json';
const buffer = fs.readFileSync(file);

const decoderEUC = new TextDecoder('euc-kr');
const contentEUC = decoderEUC.decode(buffer);

if (!contentEUC.includes('\uFFFD')) {
  console.log('EUC-KR decoding SUCCESS!');
  // Check for the known string
  if (contentEUC.includes('기자력')) {
    console.log('Found "기자력" after EUC-KR decoding!');
  }
} else {
  console.log('EUC-KR decoding still has issues.');
}

const decoderUTF8 = new TextDecoder('utf-8');
const contentUTF8 = decoderUTF8.decode(buffer);
// Count diamonds
const diamonds = contentUTF8.match(/\uFFFD/g)?.length || 0;
console.log(`UTF-8 diamonds: ${diamonds}`);
