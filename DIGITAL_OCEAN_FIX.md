# Digital Ocean /adminLogin Route Fix

## 🔴 Problem
Routes like `/adminLogin`, `/products`, etc. return **404 Not Found** when accessed directly in production, but work fine locally.

## 🎯 Root Cause
Digital Ocean App Platform is serving your Expo/React app as static files. When someone visits `/adminLogin` directly, the server looks for a file at that path, doesn't find it, and returns 404. This is the classic **Single Page Application (SPA) routing problem**.

Local works because the dev server (`expo start --web`) automatically handles SPA routing.

---

## ✅ Solution: Configure Digital Ocean Settings

### **Step 1: Update App Settings in Digital Ocean Dashboard**

1. **Go to Digital Ocean Dashboard:**
   - Navigate to: https://cloud.digitalocean.com/apps
   - Click on your frontend app

2. **Go to Settings:**
   - Click on **"Settings"** tab
   - Scroll to **"Components"** section
   - Click on your **static site component** (usually named "web" or "frontend")

3. **Edit Component Settings:**
   - Click **"Edit"** button

4. **Configure SPA Routing:**
   Scroll down and set these **EXACT** values:

   ```
   Error Document: index.html
   ```

   ✅ This is the most important setting - it tells Digital Ocean to serve `index.html` when a route is not found.

5. **Verify Other Settings:**
   ```
   Build Command: npm run build
   Output Directory: dist
   ```

6. **Save Changes:**
   - Click **"Save"**
   - Click **"Save"** again on the component page

7. **Trigger Deployment:**
   - Go back to main app page
   - Click **"Actions"** → **"Force Rebuild and Deploy"**

---

### **Step 2: Verify Deployment Settings**

After redeploying, verify these settings are applied:

1. In Digital Ocean dashboard, go to your app
2. Click **"Settings"** → **"Components"** → **[Your Static Site]**
3. Verify you see:
   ```
   Error Document: index.html ✅
   Output Directory: dist ✅
   ```

---

### **Step 3: Test After Deployment**

1. **Wait for deployment to complete** (usually 3-5 minutes)

2. **Test these URLs directly** in browser (not by navigating within the app):
   ```
   https://your-app.ondigitalocean.app/adminLogin  ✅ Should load
   https://your-app.ondigitalocean.app/products    ✅ Should load
   https://your-app.ondigitalocean.app/profile     ✅ Should load
   ```

3. **All routes should now work!**

---

## 🔧 Alternative Method: Using App Spec YAML

If you prefer to configure via YAML file instead of the dashboard:

### **Option A: Import App Spec**

1. In Digital Ocean dashboard, go to your app
2. Click **"Settings"** → **"App Spec"**
3. Click **"Edit"**
4. Replace with this spec:

```yaml
name: narayana-frontend
region: nyc
static_sites:
  - name: web
    github:
      branch: main
      deploy_on_push: true
      repo: saurabhp0007/narayana
    source_dir: /frontend
    build_command: npm run build
    output_dir: dist
    error_document: index.html
    index_document: index.html
    catchall_document: index.html
    routes:
      - path: /
```

5. Click **"Save"**
6. Click **"Deploy"**

---

### **Option B: Using doctl CLI**

If you have `doctl` installed:

```bash
# Get your app ID
doctl apps list

# Update app spec
doctl apps update YOUR_APP_ID --spec .do/app.yaml

# Force rebuild
doctl apps create-deployment YOUR_APP_ID
```

---

## 🚨 Common Mistakes to Avoid

### ❌ **Mistake 1: Not setting Error Document**
```
Error Document: [empty]  ❌ Routes will 404
Error Document: index.html  ✅ Routes will work
```

### ❌ **Mistake 2: Wrong Output Directory**
```
Output Directory: build  ❌ Wrong for Expo
Output Directory: dist   ✅ Correct for Expo
```

### ❌ **Mistake 3: Not Redeploying After Changes**
- Settings changes require a **manual redeploy**
- Just saving settings is not enough
- Click **"Force Rebuild and Deploy"**

### ❌ **Mistake 4: Cached Old Deployment**
If routes still don't work after deploying:
1. Clear browser cache (Ctrl+Shift+Delete)
2. Try in incognito/private mode
3. Wait 5 minutes for CDN cache to clear

---

## 🔍 Debugging Steps

If routes still don't work:

### **1. Check Build Logs**
1. Go to Digital Ocean app dashboard
2. Click **"Runtime Logs"** or **"Build Logs"**
3. Look for errors during build
4. Verify `dist/` folder contains `index.html`

### **2. Check Deployment Output**
The build logs should show:
```
✅ Build complete!
📦 Build output contents:
-rw-r--r-- 1 root root  1234 Jan 01 12:00 index.html
-rw-r--r-- 1 root root    24 Jan 01 12:00 _redirects
-rw-r--r-- 1 root root   378 Jan 01 12:00 404.html
```

### **3. Check Settings Again**
Sometimes settings don't save properly. Double-check:
```bash
# In Digital Ocean dashboard
Settings → Components → [Static Site] → Edit

Error Document should show: index.html
```

### **4. Test with Browser DevTools**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Visit: `https://your-app.ondigitalocean.app/adminLogin`
4. Check response:
   - ❌ If you see "404 Not Found" → Settings not applied
   - ✅ If you see HTML with "Redirecting..." or the app loads → Fixed!

---

## 📱 Quick Fix Checklist

- [ ] 1. Go to Digital Ocean app settings
- [ ] 2. Edit static site component
- [ ] 3. Set Error Document to: `index.html`
- [ ] 4. Save settings
- [ ] 5. Click "Force Rebuild and Deploy"
- [ ] 6. Wait 3-5 minutes for deployment
- [ ] 7. Clear browser cache
- [ ] 8. Test `/adminLogin` directly in browser
- [ ] 9. ✅ Routes should work!

---

## 🎥 Visual Guide

**Where to find the setting:**

```
Digital Ocean Dashboard
  └── Apps
      └── [Your Frontend App]
          └── Settings tab
              └── Components section
                  └── [web or frontend component]
                      └── Edit button
                          └── Scroll down
                              └── Error Document: index.html ← Set this!
```

---

## ⚡ Express Server Alternative (If Static Doesn't Work)

If the static site configuration still doesn't work, you can switch to a Node.js server:

### **Step 1: Add Express dependency**

In `frontend/package.json`, add to dependencies:
```json
"dependencies": {
  "express": "^4.18.0"
}
```

### **Step 2: Update Digital Ocean Settings**

1. Change component type from **"Static Site"** to **"Web Service"**
2. Set these values:
   ```
   Build Command: npm install && npm run build
   Run Command: node server.js
   HTTP Port: 8080
   Source Directory: frontend
   ```

3. Deploy

The `server.js` file already exists in your repo and will handle all routing correctly.

---

## 📞 Still Need Help?

If routes still don't work after following all steps:

1. **Take screenshots of:**
   - Digital Ocean app settings (Error Document section)
   - Browser Network tab showing the failing request
   - Build logs from Digital Ocean

2. **Check:**
   - Is the deployment successful?
   - Is the app using the latest code?
   - Are you testing the correct URL?

3. **Try:**
   - Delete and recreate the app in Digital Ocean
   - Use the Express server alternative
   - Contact Digital Ocean support with screenshots

---

## ✅ Expected Result

After fixing:

| Before | After |
|--------|-------|
| ❌ `https://your-app/adminLogin` → 404 | ✅ `https://your-app/adminLogin` → Loads admin login page |
| ❌ `https://your-app/products` → 404 | ✅ `https://your-app/products` → Loads products page |
| ❌ Direct URL access broken | ✅ All routes work via direct URL |
| ❌ Page refresh returns 404 | ✅ Page refresh works normally |

---

**The fix is simple:** Just set `Error Document: index.html` in Digital Ocean settings and redeploy! 🚀
