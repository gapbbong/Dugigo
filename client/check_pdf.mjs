import fs from 'fs';
import pdf from 'pdf-parse';

const pdfPath = 'e:\\DugiGo\\scan\\ElectricExam2019.pdf';

async function checkPdf() {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer, { max: 10 }); // Just first 10 pages
    console.log(data.text);
}

checkPdf().catch(console.error);
