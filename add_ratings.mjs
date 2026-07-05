import fs from 'fs'

function addRatingsToJs(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  // Match: price: "..." } or price: "..." },
  content = content.replace(/(price:\s*"[^"]*")(\s*\})/g, (match, price, close) => {
    const r = (Math.random() * 1.5 + 3.5).toFixed(1)
    return `${price},\n  rating: ${r}${close}`
  })
  fs.writeFileSync(filePath, content, 'utf8')
  console.log(`✓ ${filePath} (${content.match(/rating:/g)?.length || 0} ratings)`)
}

function addRatingsToJson(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  // Match: "price": "..." } or "price": "..." },
  content = content.replace(/("price":\s*"[^"]*")(\s*\})/g, (match, price, close) => {
    const r = (Math.random() * 1.5 + 3.5).toFixed(1)
    return `${price},\n    "rating": ${r}${close}`
  })
  fs.writeFileSync(filePath, content, 'utf8')
  console.log(`✓ ${filePath} (${content.match(/"rating":/g)?.length || 0} ratings)`)
}

addRatingsToJs('src/data/new_restaurants.js')
addRatingsToJs('src/data/provincial_restaurants.js')
addRatingsToJson('src/data/database.js')
