/**
 * Generate PWA icons using Sharp
 * 
 * Prerequisites: npm install --save-dev sharp
 * Usage: node generate-icons-sharp.js
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logoSvg = path.join(__dirname, 'src', 'assets', 'logo_vectorized.svg');
const fallbackSvg = path.join(__dirname, 'public', 'app-icon.svg');
const publicDir = path.join(__dirname, 'public');

const sizes = [
  { size: 192, name: 'pwa-192x192.png' },
  { size: 512, name: 'pwa-512x512.png' },
  { size: 180, name: 'apple-touch-icon.png' }
];

async function generateIcons() {
  try {
    const svgPath = fs.existsSync(logoSvg) ? logoSvg : fallbackSvg;
    const sourceLabel = svgPath === logoSvg ? 'src/assets/logo_vectorized.svg' : 'public/app-icon.svg';
    console.log(`📱 Generating PWA & notification icons from ${sourceLabel}...\n`);

    if (!fs.existsSync(svgPath)) {
      console.error('❌ Error: No SVG found. Add src/assets/logo_vectorized.svg or public/app-icon.svg');
      process.exit(1);
    }

    for (const { size, name } of sizes) {
      const outputPath = path.join(publicDir, name);
      
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated: ${name} (${size}×${size})`);
    }

    console.log('\n🎉 All icons generated successfully!');
    console.log('\nNext steps:');
    console.log('  1. Run: npm run build');
    console.log('  2. Test: npm run preview');
    console.log('  3. Install the PWA on your mobile device\n');

  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    console.error('\nMake sure sharp is installed:');
    console.error('  npm install --save-dev sharp\n');
    process.exit(1);
  }
}

generateIcons();
