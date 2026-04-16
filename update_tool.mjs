import fs from 'fs';

const EXISTING_HTML = fs.readFileSync('e:\\DugiGo\\crop_diagrams.html', 'utf-8');
const NEW_COORDS = JSON.parse(fs.readFileSync('e:\\DugiGo\\new_coords.json', 'utf-8'));

// Normalize IDs in existing list if any
// Also convert new coords to the format expected by the tool

function updateTool() {
    const diagrams = [];
    
    // 1. Keep or update existing ones (manually verified likely better)
    // Actually, let's just use the NEW ones from Gemini for the ones that were missing,
    // and fix the IDs for the ones that were already there.
    
    const existingMatch = EXISTING_HTML.match(/const DIAGRAMS = \[([\s\S]*?)\];/);
    if (!existingMatch) return;
    
    // We'll reconstruct the DIAGRAMS array
    const combined = [];
    const seenIds = new Set();

    // Map new ones first (since they have the correct ID format)
    NEW_COORDS.forEach(c => {
        if (c.page) {
            combined.push(c);
            seenIds.add(c.id);
        }
    });

    // Add existing ones if not already seen
    // (Note: Existing ones in HTML had 2015_01_04 format)
    const existingLines = existingMatch[1].split('\n');
    existingLines.forEach(line => {
        const idMatch = line.match(/id: '(.*?)'/);
        if (idMatch) {
            const id = idMatch[1].replace(/_0(\d)$/, '_$1'); // Normalize 2015_01_04 -> 2015_01_4
            if (!seenIds.has(id)) {
                // Parse the rest of the line or just keep it with updated ID
                const newLine = line.replace(/id: '.*?'/, `id: '${id}'`);
                // This is a bit hacky, but let's try to parse the whole object
                try {
                    const objStr = line.trim().replace(/,$/, '');
                    if (objStr.startsWith('{')) {
                        const obj = eval(`(${objStr})`);
                        obj.id = id;
                        combined.push(obj);
                        seenIds.add(id);
                    }
                } catch (e) {}
            }
        }
    });

    const newDiagramsJs = `const DIAGRAMS = ${JSON.stringify(combined, null, 2)};`;
    const newHtml = EXISTING_HTML.replace(/const DIAGRAMS = \[[\s\S]*?\];/, newDiagramsJs);
    
    fs.writeFileSync('e:\\DugiGo\\crop_diagrams_updated.html', newHtml);
    console.log('Updated tool saved to crop_diagrams_updated.html');
}

updateTool();
