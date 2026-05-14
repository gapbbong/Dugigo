import fs from 'fs';

const path = 'e:/DugiGo/client/src/data/시각디자인산업기사/VisualDesign_MASTER_DB.json';

try {
    let content = fs.readFileSync(path, 'utf8').trim();
    console.log("Original length:", content.length);
    
    // Fix truncated value
    content = content.replace(/"visual_coords":\s*nu$/, '"visual_coords": null');
    
    // Ensure proper closure
    if (!content.endsWith(']')) {
        // Try to find the last complete object
        const lastObjectEnd = content.lastIndexOf('}');
        if (lastObjectEnd !== -1) {
            content = content.substring(0, lastObjectEnd + 1) + '\n]';
        }
    }
    
    // Final check
    try {
        JSON.parse(content);
        fs.writeFileSync(path, content);
        console.log("Successfully repaired JSON!");
    } catch (e) {
        console.error("JSON still broken after basic fix, attempting deep repair...");
        // More aggressive: remove trailing junk until it parses
        let fixed = false;
        let tempContent = content;
        while (tempContent.length > 10) {
            try {
                const trial = tempContent + '\n]';
                JSON.parse(trial);
                fs.writeFileSync(path, trial);
                console.log("Deep repair successful! Truncated at length:", trial.length);
                fixed = true;
                break;
            } catch (err) {
                tempContent = tempContent.substring(0, tempContent.lastIndexOf(','));
            }
        }
        if (!fixed) console.error("Critical failure: Could not repair JSON.");
    }
} catch (err) {
    console.error("File error:", err.message);
}
