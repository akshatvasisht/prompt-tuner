import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [16, 32, 48, 64, 128, 512]; // 512 for Plasmo auto-generation
const svgPath = path.join(__dirname, '../assets/logo.svg');
const outputDir = path.join(__dirname, '../assets');

async function generateIcons() {
  console.log('Converting logo.svg to PNG icons...\n');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Read SVG file
  const svgBuffer = fs.readFileSync(svgPath);

  // Generate main icon.png for Plasmo (512x512)
  const mainIconPath = path.join(outputDir, 'icon.png');
  try {
    await sharp(svgBuffer)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(mainIconPath);

    console.log(`✓ Generated 512x512 main icon: icon.png (Plasmo will auto-generate sizes)`);
  } catch (error) {
    console.error(`✗ Failed to generate main icon:`, error.message);
  }

  // Generate individual size icons for Chrome Web Store assets
  for (const size of sizes) {
    if (size === 512) continue; // Skip 512, already created as icon.png

    const outputPath = path.join(outputDir, `icon-${size}.png`);

    try {
      await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated ${size}x${size} icon: icon-${size}.png`);
    } catch (error) {
      console.error(`✗ Failed to generate ${size}x${size} icon:`, error.message);
    }
  }

  console.log('\n✓ Icon generation complete!');
  console.log('  - icon.png (512x512) will be used by Plasmo to auto-generate sizes');
  console.log('  - icon-*.png files are available for Chrome Web Store assets');
}

generateIcons().catch(console.error);
