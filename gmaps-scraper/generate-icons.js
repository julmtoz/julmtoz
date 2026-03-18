#!/usr/bin/env node
// Run: node generate-icons.js
// Requires: npm install canvas (or use browser-based approach)
//
// Simple script to generate extension icons using Canvas API
// If canvas isn't available, creates minimal valid PNG files

const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir);

// Minimal 1x1 pixel PNG (valid PNG that Chrome will accept as fallback)
// Actual PNG bytes for a small colored image
function createMinimalPNG(size) {
  // We'll try to use canvas if available
  try {
    const { createCanvas } = require('canvas');
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Background
    const gradient = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    gradient.addColorStop(0, '#6366F1');
    gradient.addColorStop(1, '#4F46E5');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
    ctx.fill();

    // Map pin
    const s = size / 28;
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(14*s, 13*s, 5*s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4F46E5';
    ctx.beginPath();
    ctx.arc(14*s, 13*s, 2.5*s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.moveTo(8*s, 14*s);
    ctx.bezierCurveTo(8*s, 10*s, 10.5*s, 8*s, 14*s, 8*s);
    ctx.bezierCurveTo(17.5*s, 8*s, 20*s, 10*s, 20*s, 14*s);
    ctx.bezierCurveTo(20*s, 18*s, 14*s, 24*s, 14*s, 24*s);
    ctx.bezierCurveTo(14*s, 24*s, 8*s, 18*s, 8*s, 14*s);
    ctx.fill();

    ctx.fillStyle = '#4F46E5';
    ctx.beginPath();
    ctx.arc(14*s, 13.5*s, 2.5*s, 0, Math.PI * 2);
    ctx.fill();

    return canvas.toBuffer('image/png');
  } catch {
    // Fallback: return a minimal valid PNG (purple 1x1)
    return Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108020000009001' +
      '2e0000000c4944415408d76360f8cfc000000002000174e2ef3f0000000049454e44ae426082',
      'hex'
    );
  }
}

[16, 32, 48, 128].forEach(size => {
  const buf = createMinimalPNG(size);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), buf);
  console.log(`Created icon${size}.png`);
});

console.log('Icons generated successfully!');
