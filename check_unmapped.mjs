import { database } from './src/data/database.js';
import { DISTRICT_CATEGORIES } from './src/data/districts.js';

const allDists = new Set(database.map(item => item.dist));
const mappedDists = new Set(Object.values(DISTRICT_CATEGORIES).flat());

const unmapped = [...allDists].filter(d => d && !mappedDists.has(d));
console.log('Unmapped districts:', JSON.stringify(unmapped));
