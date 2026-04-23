const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const routes = [
  { path: 'stock', name: 'Stock' }
];

const outDir = 'C:\\Users\\Khawla\\.gemini\\antigravity\\brain\\04197e3b-69d8-47d4-850a-a999736a8ee3\\artifacts';

(async () => {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  for (const route of routes) {
    const url = `http://localhost:4200/${route.path}`;
    console.log(`Navigating to ${url}...`);
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      // wait a bit for animations
      await new Promise(r => setTimeout(r, 1000));
      const outPath = path.join(outDir, `${route.name}.png`);
      await page.screenshot({ path: outPath, fullPage: true });
      console.log(`Saved screenshot to ${outPath}`);
    } catch (err) {
      console.error(`Failed to screenshot ${route.name}:`, err.message);
    }
  }

  await browser.close();
  console.log('Done.');
})();
