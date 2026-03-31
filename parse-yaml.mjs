import fs from 'fs';
 

const filePath = '/Users/mtdes23.com/Desktop/@ -3,528 +3,4818 @@ import { ref, comput.yaml';
let content = fs.readFileSync(filePath, 'utf8');

let startIndex = content.indexOf('const database = [');
if (startIndex !== -1) {
    let arrayStr = content.substring(startIndex + 17);
    let lastBrace = arrayStr.lastIndexOf('}');
    if (lastBrace !== -1) {
        arrayStr = arrayStr.substring(0, lastBrace + 1) + ']';
        try {
            const data = eval('(' + arrayStr + ')');
            if (!Array.isArray(data)) throw new Error("Parsed data is not an array");
            const unique = [];
            const seen = new Set();
            for(let obj of data) {
                if(obj && obj.name && !seen.has(obj.name)) {
                    unique.push(obj);
                    seen.add(obj.name);
                }
            }
            const output = 'export const database = [\n' + unique.map(obj => '  ' + JSON.stringify(obj)).join(',\n') + '\n];\n';
            fs.writeFileSync('src/data/database.js', output);
            console.log(`Successfully wrote ${unique.length} unique items to database.js`);
        } catch(e) {
            console.log('Error parsing array:', e);
        }
    }
} else {
    console.log('Could not find const database = [');
}
