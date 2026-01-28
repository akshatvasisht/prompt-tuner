#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function convertSvgToPng() {
  const svgPath = path.join(__dirname, '../assets/icon.svg');
  const pngPath = path.join(__dirname, '../assets/icon.png');
  
  const svgContent = fs.readFileSync(svgPath, 'utf8');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Create HTML with SVG
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <body style="margin: 0; padding: 0; background: transparent;">
        ${svgContent}
      </body>
    </html>
  `);
  
  // Wait for SVG to render
  await page.waitForTimeout(100);
  
  // Take screenshot of the SVG element
  const svgElement = await page.$('svg');
  await svgElement.screenshot({
    path: pngPath,
    omitBackground: false
  });
  
  await browser.close();
  console.log(`✓ Converted ${svgPath} to ${pngPath}`);
}

convertSvgToPng().catch(console.error);
