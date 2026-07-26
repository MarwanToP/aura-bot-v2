// ================================================================
//  Aura Bot v2.0 — Live Browser Automation Controller
// ================================================================
import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

console.log('🤖 Launching live Chrome automation controller...');

try {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const pages = await browser.pages();
  const page = pages[0] || await browser.newPage();

  console.log('🌐 Step 1: Navigating to GitHub repository...');
  await page.goto('https://github.com/MarwanToP/aura-bot-v2', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  console.log('🌐 Step 2: Opening Render Blueprint Deployment tab...');
  const pageRender = await browser.newPage();
  await pageRender.goto('https://dashboard.render.com/select-repo?type=blueprint', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  console.log('🌐 Step 3: Opening Koyeb Cloud Dashboard tab...');
  const pageKoyeb = await browser.newPage();
  await pageKoyeb.goto('https://app.koyeb.com', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  console.log('🌐 Step 4: Opening Discloud Console tab...');
  const pageDiscloud = await browser.newPage();
  await pageDiscloud.goto('https://discloud.app', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));

  console.log('✨ Live browser control completed successfully! All tabs are active in Chrome.');
} catch (err) {
  console.error('❌ Browser automation error:', err.message);
  process.exit(1);
}
