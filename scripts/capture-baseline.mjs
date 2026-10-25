import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:4000';
const OUT_DIR = path.resolve('ui-baseline');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const PAGES = [
  { name: 'home', hash: '#home' },
  { name: 'donor', hash: '#donor' },
  { name: 'ngo', hash: '#ngo' },
  { name: 'admin', hash: '#admin' },
  { name: 'how-it-works', hash: '#how-it-works' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'phone', width: 360, height: 640 },
];

const MODES = ['light', 'dark'];

async function run() {
  console.log('Launching Chrome for UI Baseline capture...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  for (const pageInfo of PAGES) {
    for (const vp of VIEWPORTS) {
      for (const mode of MODES) {
        await page.setViewport({ width: vp.width, height: vp.height });
        await page.emulateMediaFeatures([
          { name: 'prefers-color-scheme', value: mode },
        ]);

        const url = `${BASE_URL}/${pageInfo.hash}`;
        await page.goto(url, { waitUntil: 'networkidle0' });

        // If dark mode, toggle dark class on html if needed
        if (mode === 'dark') {
          await page.evaluate(() => {
            document.documentElement.classList.add('dark');
          });
        } else {
          await page.evaluate(() => {
            document.documentElement.classList.remove('dark');
          });
        }

        await new Promise((r) => setTimeout(r, 400));

        const fileName = `${pageInfo.name}_${vp.name}_${mode}.png`;
        const filePath = path.join(OUT_DIR, fileName);
        await page.screenshot({ path: filePath, fullPage: false });
        console.log(`Saved baseline: ${fileName}`);
      }
    }
  }

  await browser.close();
  console.log(`\nSuccessfully captured all 30 baseline screenshots in ${OUT_DIR}`);
}

run().catch((err) => {
  console.error('Error capturing baseline:', err);
  process.exit(1);
});
