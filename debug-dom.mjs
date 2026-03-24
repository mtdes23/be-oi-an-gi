import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    const html = await page.content();
    console.log("HTML START");
    console.log(html.substring(0, 1500)); // Print the start of the HTML body
    
    await browser.close();
})();
