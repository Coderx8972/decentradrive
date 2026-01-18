# 🚀 Backend Deployment Guide - Render.com (FREE)

## Step-by-Step Deployment

### 1. Prepare Your Backend

✅ Files ready:
- `server/render.yaml` - Render configuration
- `server/package.json` - Dependencies
- `server/index.js` - Updated with CORS

### 2. Deploy to Render.com

**Go to**: https://render.com

1. **Sign up** with GitHub account (free)

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect GitHub repository OR manual deploy
   
3. **Configure Service**:
   ```
   Name: decentradrive-backend
   Region: Oregon (US West)
   Branch: main
   Root Directory: server
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   Plan: Free
   ```

4. **Add Environment Variables**:
   Click "Environment" → "Add Environment Variable"
   
   Add these from your `.env` file:
   ```
   PINATA_API_KEY=your_pinata_api_key_here
   PINATA_SECRET_API_KEY=your_pinata_secret_here
   PINATA_GATEWAY=your_pinata_gateway
   PORT=10000
   NODE_ENV=production
   ```

5. **Deploy**:
   - Click "Create Web Service"
   - Wait 3-5 minutes for deployment
   - Get your URL: `https://decentradrive-backend.onrender.com`

### 3. Update Vercel Frontend

**In Vercel Dashboard:**

1. Go to your project → Settings → Environment Variables

2. Add:
   ```
   REACT_APP_BACKEND_URL=https://decentradrive-backend.onrender.com
   ```

3. **Redeploy** the frontend

### 4. Update Backend CORS

After getting Vercel URL, add to Render environment variables:
```
FRONTEND_URL=https://your-app.vercel.app
```

### 5. Test Upload

1. Go to your Vercel URL
2. Connect wallet
3. Try uploading a file
4. Should work! ✅

## Troubleshooting

**If uploads still fail:**

1. Check Render logs:
   - Go to Render dashboard → Your service → Logs
   - Look for errors

2. Check browser console (F12):
   - Network tab → Look for failed requests
   - Console tab → Look for CORS errors

3. Verify environment variables:
   - Render dashboard → Environment
   - Make sure all Pinata keys are set

## Alternative: Railway.app

If Render doesn't work, try Railway:

1. Go to https://railway.app
2. Sign up (free $5/month credit)
3. New Project → Deploy from GitHub
4. Select `server` folder
5. Add environment variables
6. Get URL and update Vercel

## Cost

**Render Free Tier:**
- ✅ 750 hours/month
- ✅ Automatic sleep after 15 min inactivity
- ✅ Perfect for demos
- ⚠️ First request after sleep takes 30-60 seconds

**Railway Free Tier:**
- ✅ $5 credit/month
- ✅ No sleep, always on
- ✅ Better for active use

## Your Backend will be at:

```
https://decentradrive-backend.onrender.com
```

Add this to Vercel environment variables and redeploy!
