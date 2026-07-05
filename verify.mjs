import fs from 'fs';
const c = fs.readFileSync('D:/VIBE CODE/be-oi-an-gi/src/data/new_restaurants.js','utf8');
const oldThuDuc = (c.match(/dist: "Thủ Đức"/g) || []).length;
const newThuDuc = (c.match(/Thành phố Thủ Đức/g) || []).length;
const oldDist = (c.match(/oldDist/g) || []).length;
console.log('new_restaurants.js:');
console.log('  Cũ Thủ Đức:', oldThuDuc);
console.log('  Mới TP Thủ Đức:', newThuDuc);
console.log('  Có oldDist:', oldDist);

const c2 = fs.readFileSync('D:/VIBE CODE/be-oi-an-gi/src/data/database.js','utf8');
const oldThuDuc2 = (c2.match(/"dist": "Thủ Đức"/g) || []).length;
const newThuDuc2 = (c2.match(/Thành phố Thủ Đức/g) || []).length;
const oldDist2 = (c2.match(/oldDist/g) || []).length;
console.log('\ndatabase.js:');
console.log('  Cũ Thủ Đức:', oldThuDuc2);
console.log('  Mới TP Thủ Đức:', newThuDuc2);
console.log('  Có oldDist:', oldDist2);
