import fs from 'fs';
import process from 'process';
import { database as existingData } from './src/data/database.js';

const html = fs.readFileSync('./src/data_hcm.html', 'utf8');

// Regex to find rows between <tbody> and </tbody>
const tbodyMatch = html.match(/<tbody>([\s\S]*?)<\/tbody>/);
if (!tbodyMatch) {
    console.error('No tbody found in HTML');
    process.exit(1);
}

const tbody = tbodyMatch[1];
const rows = tbody.match(/<tr[^>]*>[\s\S]*?<\/tr>/g);
const newData = [];

const getText = (html) => {
    if (!html) return '';
    return html
        .replace(/<[^>]+>/g, '') // remove tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/\n|\r/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

rows.forEach(row => {
    const cols = row.match(/<td[^>]*>([\s\S]*?)<\/td>/g);
    if (!cols || cols.length < 6) return; // Need at least name, dish, type, addr, dist

    // HTML Structure:
    // 0: STT
    // 1: Tên quán
    // 2: Tên món
    // 3: Phân loại món
    // 4: Tên đường
    // 5: Quận
    // 6: Giờ mở cửa
    // 7: Khoảng giá

    const name = getText(cols[1]);
    const dish = getText(cols[2]);
    const type = getText(cols[3]);
    const addr = getText(cols[4]);
    const dist = getText(cols[5]);
    const time = cols[6] ? getText(cols[6]) : '';
    const price = cols[7] ? getText(cols[7]) : '';

    if (name === 'Tên quán' || !name) return; // Skip header or empty

    // Normalize comparison keys
    const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isDuplicate = existingData.some(item => 
        normalize(item.name) === normalize(name) && 
        normalize(item.addr) === normalize(addr)
    );

    if (!isDuplicate) {
        newData.push({ name, dish, type, addr, dist, time, price });
    }
});

if (newData.length > 0) {
    console.log(`Adding ${newData.length} new items.`);
    const mergedData = [...existingData, ...newData];
    const content = `export const database = ${JSON.stringify(mergedData, null, 2)};\n`;
    fs.writeFileSync('./src/data/database.js', content);
    
    // Check for new districts
    const existingDistricts = new Set(existingData.map(item => item.dist));
    const newDistricts = [...new Set(newData.map(item => item.dist))].filter(d => d && !existingDistricts.has(d));
    if (newDistricts.length > 0) {
        console.log('New districts found:', newDistricts);
    }
} else {
    console.log('No new items found.');
}
