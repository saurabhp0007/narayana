# Deployment Guide for Digital Ocean

## Issue: Routes not working (404 errors)

The frontend is a Single Page Application (SPA) that uses client-side routing. When deployed to static hosting like Digital Ocean App Platform, direct navigation to routes like `/adminLogin` will fail unless the server is configured to serve `index.html` for all routes.

## Solution

This repository includes several configuration files to handle SPA routing:

### 1. `.do/app.yaml` - Digital Ocean App Platform Configuration

Located at `frontend/.do/app.yaml`, this file configures Digital Ocean to:
- Set `error_document: index.html`
- Set `catchall_document: index.html`
- This ensures all routes serve the index.html file

### 2. `public/_redirects` - Netlify-style redirects

Located at `frontend/public/_redirects`, this file contains:
```
/*    /index.html   200
```

This tells compatible hosting providers to serve index.html for all routes with a 200 status code (not a 301/302 redirect).

### 3. `public/404.html` - Fallback error page

Located at `frontend/public/404.html`, this page automatically redirects to the homepage when a 404 occurs, preserving the URL for client-side routing.

### 4. Post-build script

Located at `frontend/scripts/post-build.js`, this script automatically copies `_redirects` and `404.html` from the `public/` directory to the `dist/` directory after build.

## Deployment Steps for Digital Ocean App Platform

### Option 1: Using Digital Ocean Dashboard

1. Go to your Digital Ocean App Platform dashboard
2. Select your app
3. Go to Settings → Components → [Your Static Site]
4. Under "Static Site Configuration":
   - Set **Error Document** to: `index.html`
   - Set **Output Directory** to: `dist`
5. Save and redeploy

### Option 2: Using app.yaml (Recommended)

1. Ensure the `.do/app.yaml` file exists in your repository
2. Push your changes to GitHub
3. Digital Ocean will automatically use this configuration
4. Redeploy your app

### Option 3: Manual Configuration

If the above options don't work, you can add these headers/rules:

1. In Digital Ocean App Platform, go to your static site settings
2. Add custom error pages:
   - 404 Error → `index.html`

## Build Command

The build command is already configured in `package.json`:

```json
{
  "scripts": {
    "build": "expo export --platform web && node scripts/post-build.js"
  }
}
```

This will:
1. Build the Expo web app to `dist/`
2. Copy `_redirects` and `404.html` to `dist/`

## Testing Locally

To test the build locally:

```bash
cd frontend
npm run build
# Serve the dist folder with a static server
npx serve dist
```

Then try accessing different routes directly (e.g., `/adminLogin`) to verify they work.

## Common Issues

### Routes still returning 404

If routes are still returning 404 after deployment:

1. **Check Digital Ocean Logs**: Look for any errors in the deployment logs
2. **Verify Files Exist**: Ensure `_redirects` and `404.html` are in the `dist/` folder after build
3. **Check Build Output**: Run `npm run build` locally and verify the files are copied
4. **Force Rebuild**: In Digital Ocean, trigger a manual rebuild
5. **Cache Issue**: Clear your browser cache and CDN cache

### Homepage works but other routes don't

This indicates the SPA routing configuration isn't being applied. Double-check:
- The `.do/app.yaml` file is in the correct location
- The error document is set to `index.html` in Digital Ocean settings
- You've redeployed after making configuration changes

### Infinite redirect loop

If you get stuck in a redirect loop:
- Check that you're using `200` status code in `_redirects`, not `301` or `302`
- Verify the 404.html script isn't conflicting with server-side redirects

## Alternative: Using a Simple Node Server

If static site configuration doesn't work, you can deploy with a simple Node.js server:

1. Create `server.js` in frontend/:
```javascript
const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

2. Update package.json:
```json
{
  "scripts": {
    "start:server": "node server.js"
  },
  "dependencies": {
    "express": "^4.18.0"
  }
}
```

3. In Digital Ocean, change component type to "Web Service" instead of "Static Site"
4. Set start command to: `npm run start:server`

## Support

If issues persist, check:
- Digital Ocean App Platform Documentation: https://docs.digitalocean.com/products/app-platform/
- Expo Web Documentation: https://docs.expo.dev/workflow/web/
