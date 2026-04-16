const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('e:\\DuKiGo\\scan\\ElectricExam2016.pdf');

pdf(dataBuffer).then(function(data) {
    // number of pages
    console.log("Pages:", data.numpages);
    // PDF title
    console.log("Title:", data.info.Title);
    // PDF text
    fs.writeFileSync('e:\\DuKiGo\\scan\\extract_2016_text.txt', data.text);
    console.log("Text extracted to e:\\DuKiGo\\scan\\extract_2016_text.txt");
}).catch(err => {
    console.error(err);
});
