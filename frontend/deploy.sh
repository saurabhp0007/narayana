#!/bin/bash

# Deploy script for Digital Ocean App Platform
# This ensures all routing files are properly copied

echo "🚀 Starting build process..."

# Build the app
npm run build

echo "✅ Build complete!"

# Ensure routing files exist in dist
if [ ! -f "dist/_redirects" ]; then
  echo "⚠️  Warning: _redirects not found in dist, copying..."
  cp public/_redirects dist/_redirects 2>/dev/null || echo "⚠️  _redirects file missing"
fi

if [ ! -f "dist/404.html" ]; then
  echo "⚠️  Warning: 404.html not found in dist, copying..."
  cp public/404.html dist/404.html 2>/dev/null || echo "⚠️  404.html file missing"
fi

# List dist contents
echo ""
echo "📦 Build output contents:"
ls -la dist/ | head -20

echo ""
echo "✅ Deploy preparation complete!"
echo "📝 Make sure to configure Digital Ocean settings:"
echo "   - Error Document: index.html"
echo "   - Index Document: index.html"
