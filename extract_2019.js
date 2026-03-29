const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('e:\\DuKiGo\\scan\\ElectricExam2019.pdf');

pdf(dataBuffer).then(function(data) {
    console.log("Pages:", data.numpages);
    console.log("Title:", data.info.Title);
    fs.writeFileSync('e:\\DuKiGo\\scan\\extract_2019_text.txt', data.text);
    console.log("Text extracted to e:\\DuKiGo\\scan\\extract_2019_text.txt");
}).catch(err => {
    console.error(err);
});
