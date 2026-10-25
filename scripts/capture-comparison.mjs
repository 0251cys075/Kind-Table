import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:4000';
const OUT_DIR = path.resolve('ui-current');
const NEW_DIR = path.resolve('ui-new-features');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}
if (!fs.existsSync(NEW_DIR)) {
  fs.mkdirSync(NEW_DIR, { recursive: true });
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
  console.log('Launching Chrome for UI Comparison captures...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Ensure logged-out state for the 30 baseline comparison screenshots
  await page.goto(`${BASE_URL}/#home`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => {
    localStorage.removeItem('kindtable_user');
  });

  console.log('\n--- Capturing 30 Logged-Out Current Screens ---');
  for (const pageInfo of PAGES) {
    for (const vp of VIEWPORTS) {
      for (const mode of MODES) {
        await page.setViewport({ width: vp.width, height: vp.height });
        await page.emulateMediaFeatures([
          { name: 'prefers-color-scheme', value: mode },
        ]);

        const url = `${BASE_URL}/${pageInfo.hash}`;
        await page.goto(url, { waitUntil: 'networkidle0' });

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
        console.log(`Saved current: ${fileName}`);
      }
    }
  }

  console.log('\n--- Capturing New Features & Screens ---');
  await page.setViewport({ width: 1280, height: 800 });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await page.evaluate(() => {
    document.documentElement.classList.remove('dark');
  });

  // 1. Log In page
  await page.goto(`${BASE_URL}/#login`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(NEW_DIR, 'login_desktop_light.png') });
  console.log('Saved: login_desktop_light.png');

  // 2. Sign Up page
  await page.goto(`${BASE_URL}/#signup`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(NEW_DIR, 'signup_desktop_light.png') });
  console.log('Saved: signup_desktop_light.png');

  // 3. NGO Map view
  await page.goto(`${BASE_URL}/#ngo`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 400));
  // Click Map toggle button
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const mapBtn = buttons.find((b) => b.textContent && b.textContent.includes('Map'));
    if (mapBtn) mapBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(NEW_DIR, 'ngo_map_desktop_light.png') });
  console.log('Saved: ngo_map_desktop_light.png');

  // 4. Admin Users sub-view
  await page.goto(`${BASE_URL}/#admin`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 500));
  // Click Users sidebar tab
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const usersBtn = buttons.find((b) => b.textContent && b.textContent.includes('Users'));
    if (usersBtn) usersBtn.click();
  });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: path.join(NEW_DIR, 'admin_users_desktop_light.png') });
  console.log('Saved: admin_users_desktop_light.png');

  // 5. My Profile page (Logged In as Donor)
  await page.goto(`${BASE_URL}/#login`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 300));
  // Click Demo Donor
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const donorDemo = buttons.find((b) => b.textContent && b.textContent.includes('Donor'));
    if (donorDemo) donorDemo.click();
  });
  await new Promise((r) => setTimeout(r, 800));
  await page.goto(`${BASE_URL}/#profile`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(NEW_DIR, 'profile_desktop_light.png') });
  console.log('Saved: profile_desktop_light.png');

  // 6. Donor page with logged-in read-only donor name
  await page.goto(`${BASE_URL}/#donor`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(NEW_DIR, 'donor_loggedin_desktop_light.png') });
  console.log('Saved: donor_loggedin_desktop_light.png');

  await browser.close();
  console.log('\nAll comparison and new feature screenshots captured successfully.');
}

run().catch((err) => {
  console.error('Error during comparison capture:', err);
  process.exit(1);
});
