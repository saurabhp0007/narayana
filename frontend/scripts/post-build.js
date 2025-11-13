#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Copy _redirects and 404.html to dist folder after build
const distPath = path.join(__dirname, '../dist');
const publicPath = path.join(__dirname, '../public');

const filesToCopy = ['_redirects', '404.html'];

console.log('Post-build: Copying SPA routing files...');

filesToCopy.forEach(file => {
  const src = path.join(publicPath, file);
  const dest = path.join(distPath, file);

  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied ${file} to dist/`);
  } else {
    console.log(`⚠ Warning: ${file} not found in public/`);
  }
});

console.log('Post-build: Complete!');
