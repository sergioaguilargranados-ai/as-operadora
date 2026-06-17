const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const svgTemplate = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#000000" rx="112" ry="112" />
  <text x="256" y="350" font-family="Arial, sans-serif" font-size="300" font-weight="bold" fill="white" text-anchor="middle">AS</text>
</svg>
`;

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function run() {
  const iconsDir = path.join(__dirname, '../public/icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  for (const size of sizes) {
    const filePath = path.join(iconsDir, `icon-${size}x${size}.png`);
    await page.setViewport({ width: size, height: size });
    await page.setContent(svgTemplate);
    await page.screenshot({ path: filePath, omitBackground: true });
    console.log(`Generated ${filePath}`);
  }

  // Generate maskable icons
  const maskableSizes = [192, 512];
  for (const size of maskableSizes) {
    const filePath = path.join(iconsDir, `icon-maskable-${size}x${size}.png`);
    const maskableSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <rect width="512" height="512" fill="#000000" />
      <text x="256" y="350" font-family="Arial, sans-serif" font-size="300" font-weight="bold" fill="white" text-anchor="middle">AS</text>
    </svg>
    `;
    await page.setViewport({ width: size, height: size });
    await page.setContent(maskableSvg);
    await page.screenshot({ path: filePath, omitBackground: true });
    console.log(`Generated ${filePath}`);
  }

  await browser.close();
}

run().catch(console.error);
