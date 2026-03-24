import fs from 'fs';

const content = fs.readFileSync('src/data/database.js', 'utf8').replace('export const database =', 'const database =');
const dataStr = content.substring(content.indexOf('const database =') + 16, content.lastIndexOf(']') + 1);

const database = eval('(' + dataStr + ')');
let errorCount = 0;
database.forEach((p, i) => {
  if (!p.name) { console.log('Missing name at', i, p); errorCount++; }
  if (!p.type) { console.log('Missing type at', i, p); errorCount++; }
  if (!p.dist) { console.log('Missing dist at', i, p); errorCount++; }
  if (!p.price) { console.log('Missing price at', i, p); errorCount++; }
});
console.log('Total errors:', errorCount);
