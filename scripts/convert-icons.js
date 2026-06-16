const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function convert() {
  const iconsDir = path.join(__dirname, '../public/icons');
  const files = fs.readdirSync(iconsDir).filter(f => f.endsWith('.png'));
  
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  for (const file of files) {
    const filePath = path.join(iconsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if it's an SVG (starts with <svg)
    if (content.includes('<svg')) {
      console.log(`Converting ${file} to real PNG...`);
      // Parse the size from the filename
      const match = file.match(/(\d+)x(\d+)/);
      const width = match ? parseInt(match[1]) : 512;
      const height = match ? parseInt(match[2]) : 512;
      
      await page.setViewport({ width, height });
      await page.setContent(content);
      
      // Save screenshot as real PNG
      await page.screenshot({ path: filePath, omitBackground: true });
    }
  }

  await browser.close();
  console.log("Done converting icons.");
}

convert().catch(console.error);
