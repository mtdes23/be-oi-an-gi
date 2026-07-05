import fs from 'fs';

const MIGRATION_MAP = {
  'Quận 2': 'Thành phố Thủ Đức',
  'Quận 9': 'Thành phố Thủ Đức',
  'Quận Thủ Đức': 'Thành phố Thủ Đức',
  'Thủ Đức': 'Thành phố Thủ Đức',
};

const files = [
  'D:/VIBE CODE/be-oi-an-gi/src/data/database.js',
  'D:/VIBE CODE/be-oi-an-gi/src/data/new_restaurants.js',
];

let totalUpdated = 0;

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let fileUpdated = 0;

  for (const [oldDist, newDist] of Object.entries(MIGRATION_MAP)) {
    // Fix dist values in new_restaurants.js (has oldDist but wrong dist)
    const fixRegex = new RegExp(`dist:\\s*"${oldDist}"`, 'g');
    content = content.replace(fixRegex, `dist: "${newDist}"`);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`${filePath.split('/').pop()}: fixed dist values`);
});

console.log('Done fixing dist values');
