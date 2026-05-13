import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

if (isMainThread) {
    const dataDir = 'e:/DugiGo/client/src/data';
    
    // Recursively get all JSON files
    function getFiles(dir) {
        let results = [];
        const list = fs.readdirSync(dir);
        list.forEach(file => {
            file = path.join(dir, file);
            const stat = fs.statSync(file);
            if (stat && stat.isDirectory()) {
                results = results.concat(getFiles(file));
            } else if (file.endsWith('.json')) {
                results.push(file);
            }
        });
        return results;
    }

    const allFiles = getFiles(dataDir);
    console.log(`Found ${allFiles.length} JSON files. Starting parallel audit...`);

    const numCPUs = os.cpus().length;
    const numThreads = Math.min(numCPUs, allFiles.length);
    const chunkSize = Math.ceil(allFiles.length / numThreads);
    
    const chunks = [];
    for (let i = 0; i < allFiles.length; i += chunkSize) {
        chunks.push(allFiles.slice(i, i + chunkSize));
    }

    let completedThreads = 0;
    const allReports = [];
    const startTime = Date.now();

    chunks.forEach((chunk, index) => {
        const worker = new Worker(__filename, {
            workerData: { files: chunk, threadId: index + 1 }
        });

        worker.on('message', (report) => {
            allReports.push(...report);
        });

        worker.on('error', (err) => {
            console.error(`Thread ${index + 1} Error:`, err);
        });

        worker.on('exit', (code) => {
            completedThreads++;
            if (completedThreads === chunks.length) {
                const duration = Date.now() - startTime;
                console.log(`\n✅ Audit completed in ${duration}ms using ${chunks.length} threads.`);
                
                // Aggregate results
                const summary = {};
                let totalErrors = 0;

                allReports.forEach(r => {
                    totalErrors++;
                    const subject = r.file.split(/[\\/]/).reverse()[1]; // extract subject from parent dir
                    if (!summary[subject]) summary[subject] = {};
                    if (!summary[subject][r.reason]) summary[subject][r.reason] = 0;
                    summary[subject][r.reason]++;
                });

                console.log('\n--- 📊 Audit Summary ---');
                console.log(`Total Issues Found: ${totalErrors}`);
                for (const subj in summary) {
                    if (subj === '한국사검정시험') continue; // Skip known false positives
                    console.log(`\n[${subj}]`);
                    for (const reason in summary[subj]) {
                        console.log(`  - ${reason}: ${summary[subj][reason]}`);
                    }
                }

                // Save detailed report
                const reportPath = 'e:/DugiGo/audit_report.json';
                fs.writeFileSync(reportPath, JSON.stringify(allReports, null, 2));
                console.log(`\nDetailed report saved to: ${reportPath}`);
            }
        });
    });

} else {
    // Worker Thread Logic
    const { files, threadId } = workerData;
    const report = [];

    files.forEach(filePath => {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            if (content.includes('\uFFFD')) {
                report.push({ file: filePath, reason: 'Encoding Corruption (\\uFFFD)', num: 'N/A' });
            }

            const data = JSON.parse(content);
            if (!Array.isArray(data)) {
                report.push({ file: filePath, reason: 'Root is not an array', num: 'N/A' });
                return;
            }

            data.forEach(q => {
                const qNum = q.question_num || q.number;
                const opts = q.options || q.choices || [];
                
                if (qNum === undefined) {
                    report.push({ file: filePath, reason: 'Missing question_num', num: 'Unknown' });
                }
                if (!q.question || q.question.trim() === '') {
                    report.push({ file: filePath, reason: 'Empty question text', num: qNum });
                }
                
                if (!opts || opts.length !== 4) {
                    report.push({ file: filePath, reason: `Options count mismatch (${opts ? opts.length : 0})`, num: qNum });
                } else {
                    if (opts.some(o => o === null || o === undefined || String(o).trim() === "")) {
                        report.push({ file: filePath, reason: 'Empty option text', num: qNum });
                    }
                    if (opts.some(o => typeof o === 'string' && (o.startsWith('보기') || o.startsWith('옵션') || o.startsWith('Choice') || o === '0' || o === '1'))) {
                        report.push({ file: filePath, reason: 'Dummy/Placeholder option text', num: qNum });
                    }
                    const uniqueOpts = new Set(opts.map(o => String(o).trim()));
                    if (uniqueOpts.size < opts.length && opts.every(o => o !== null && String(o).trim() !== "")) {
                        report.push({ file: filePath, reason: 'Duplicate options in same question', num: qNum });
                    }
                }

                const ans = q.answer;
                if (typeof ans !== 'number' || ans < 1 || ans > 4) {
                    report.push({ file: filePath, reason: `Invalid answer (${ans})`, num: qNum });
                }
            });

        } catch (e) {
            report.push({ file: filePath, reason: `JSON Parse Error: ${e.message}`, num: 'N/A' });
        }
    });

    parentPort.postMessage(report);
}
