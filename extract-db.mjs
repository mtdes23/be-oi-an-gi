import fs from 'fs';
 

const content = fs.readFileSync('/Users/mtdes23.com/Desktop/@ -3,528 +3,4818 @@ import { ref, comput.yaml', 'utf8');

const regex = /\{[\s\S]*?name:.*?dish:.*?type:.*?addr:.*?dist:.*?time:.*?price:.*?\}/g;
const matches = content.match(regex);

if (matches) {
    console.log('Found', matches.length, 'objects by regex');
    const unique = new Map();
    
    for (let m of matches) {
        try {
            // Remove + or - prefixes from diff
            const cleanStr = m.replace(/^[+-]\s*/gm, '').trim();
            // Simple eval
            const obj = eval('(' + cleanStr + ')');
            if (obj && obj.name && !unique.has(obj.name)) {
                unique.set(obj.name, obj);
            }
        } catch {
            // ignore bad objects
        }
    }
    
    console.log('Unique valid objects extracted:', unique.size);
    if (unique.size > 0) {
        const output = 'export const database = [\n' + Array.from(unique.values()).map(o => '  ' + JSON.stringify(o)).join(',\n') + '\n];\n';
        fs.writeFileSync('src/data/database.js', output);
        console.log('Successfully wrote src/data/database.js');
    }
}
