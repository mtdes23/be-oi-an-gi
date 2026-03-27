import { database } from './src/data/database.js';
console.log(JSON.stringify([...new Set(database.map(item => item.dist))], null, 2));
