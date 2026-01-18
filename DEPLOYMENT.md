# DecentraDrive - Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Pinata Account**: Get API keys from [pinata.cloud](https://pinata.cloud)
3. **GitHub Account**: Push your code to GitHub (optional but recommended)

## Deployment Steps

### Method 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Login to Vercel**:
   ```bash
   vercel login
   ```

4. **Deploy**:
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - What's your project's name? **decentradrive**
   - In which directory is your code located? **.**
   - Want to override the settings? **N**

5. **Set Environment Variables**:
   ```bash
   vercel env add PINATA_API_KEY
   vercel env add PINATA_SECRET_KEY
   vercel env add REACT_APP_CONTRACT_ADDRESS
   ```
   
   Enter the values when prompted. For each variable, select:
   - **Production**, **Preview**, and **Development**

6. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

### Method 2: Deploy via GitHub Integration

1. **Push Code to GitHub**:
   ```bash
   git add .
   git commit -m "Add Vercel deployment configuration"
   git push origin main
   ```

2. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel will auto-detect settings from `vercel.json`

3. **Configure Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add the following:
     - `PINATA_API_KEY`: Your Pinata API key
     - `PINATA_SECRET_KEY`: Your Pinata secret key
     - `REACT_APP_CONTRACT_ADDRESS`: `0x21e103C4151Aa6A49F75a35CCBEe85382Fa8e9Ea`

4. **Deploy**:
   - Click **Deploy**
   - Vercel will automatically build and deploy your app

## Configuration Files

The deployment uses these configuration files:

- **vercel.json**: Vercel project configuration
  - Routes API calls to `/api/*` to serverless functions
  - Serves React build from `client/build`
  - Configures CORS headers

- **api/index.js**: Serverless API handler
  - Handles IPFS uploads via Pinata
  - Serves files from IPFS
  - Memory-based file uploads (no disk storage)

- **.vercelignore**: Files to exclude from deployment
  - Excludes server folder, node_modules, artifacts, etc.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PINATA_API_KEY` | Pinata API key for IPFS uploads | Yes |
| `PINATA_SECRET_KEY` | Pinata secret key | Yes |
| `REACT_APP_CONTRACT_ADDRESS` | Smart contract address on Sepolia | Yes |

## Post-Deployment

1. **Get Your Deployment URL**:
   - After deployment, Vercel will provide a URL like `https://decentradrive-xxx.vercel.app`

2. **Test the Application**:
   - Visit your deployment URL
   - Connect MetaMask wallet
   - Try uploading a file

3. **Custom Domain (Optional)**:
   - Go to Project Settings → Domains
   - Add your custom domain
   - Configure DNS settings as instructed

## Architecture

```
┌─────────────────────────────────────┐
│     Vercel Edge Network (CDN)       │
└─────────────────────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
    ┌────▼────┐    ┌─────▼─────┐
    │  React  │    │ Serverless │
    │  SPA    │    │    API     │
    │ (Static)│    │ /api/...   │
    └────┬────┘    └─────┬──────┘
         │               │
         │        ┌──────▼──────┐
         │        │   Pinata    │
         │        │    IPFS     │
         │        └─────────────┘
         │
    ┌────▼────────┐
    │  Ethereum   │
    │  (Sepolia)  │
    └─────────────┘
```

## Troubleshooting

### Build Fails

**Issue**: Build fails with `Module not found`

**Solution**: 
```bash
cd client
npm install
cd ..
npm install
```

### API Routes Don't Work

**Issue**: `/api/*` routes return 404

**Solution**: 
- Check `vercel.json` rewrites configuration
- Ensure `api/index.js` exists
- Check Vercel function logs

### Environment Variables Not Working

**Issue**: App can't connect to IPFS

**Solution**:
- Verify environment variables in Vercel dashboard
- Redeploy after adding/updating variables
- Check that variables are added for Production environment

### MetaMask Connection Issues

**Issue**: Wallet won't connect

**Solution**:
- Ensure MetaMask is on Sepolia testnet
- Clear browser cache
- Check browser console for errors

## Monitoring

- **Vercel Dashboard**: View deployment logs and analytics
- **Function Logs**: Check serverless function execution logs
- **Browser Console**: Debug client-side issues
- **Etherscan**: Monitor smart contract transactions

## Cost

Vercel **Free Tier** includes:
- ✅ 100GB bandwidth/month
- ✅ Unlimited deployments
- ✅ 100 serverless function invocations/day
- ✅ Automatic SSL
- ✅ Custom domains

This should be sufficient for development and moderate usage.

## Support

For issues:
1. Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
2. Review function logs in Vercel dashboard
3. Check browser console for client errors
4. Verify smart contract on Sepolia Etherscan

---

**Ready to deploy?** Run `vercel` in your project directory!
