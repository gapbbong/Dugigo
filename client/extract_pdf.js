const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const pdfPath = path.resolve(__dirname, '..', 'scan', 'ElectricExam2016.pdf');
const dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function(data) {
    // number of pages
    console.log("Pages:", data.numpages);
    // PDF title
    console.log("Title:", data.info.Title);
    // PDF text
    fs.writeFileSync(path.join(__dirname, '..', 'scan', 'extract_2016_text.txt'), data.text);
    console.log("Text extracted to " + path.join(__dirname, '..', 'scan', 'extract_2016_text.txt'));
}).catch(err => {
    console.error(err);
});
