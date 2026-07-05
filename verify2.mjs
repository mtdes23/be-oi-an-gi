import fs from 'fs';
const c = fs.readFileSync('D:/VIBE CODE/be-oi-an-gi/src/data/database.js','utf8');
const q2 = (c.match(/"dist": "Quận 2"/g) || []).length;
const q9 = (c.match(/"dist": "Quận 9"/g) || []).length;
const qTD = (c.match(/"dist": "Quận Thủ Đức"/g) || []).length;
console.log('database.js:');
console.log('  Quận 2:', q2);
console.log('  Quận 9:', q9);
console.log('  Quận Thủ Đức:', qTD);

const c2 = fs.readFileSync('D:/VIBE CODE/be-oi-an-gi/src/data/new_restaurants.js','utf8');
const q2n = (c2.match(/dist: "Quận 2"/g) || []).length;
const q9n = (c2.match(/dist: "Quận 9"/g) || []).length;
console.log('\nnew_restaurants.js:');
console.log('  Quận 2:', q2n);
console.log('  Quận 9:', q9n);
