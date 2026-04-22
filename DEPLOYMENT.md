# Deployment Guide

## Vercel Deployment (Recommended)

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/pyzun)

### Manual Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Click "Deploy"

3. **Add Environment Variables**
   - Go to your project dashboard on Vercel
   - Navigate to Settings → Environment Variables
   - Add: `NEXT_PUBLIC_RAPIDAPI_KEY` with your Judge0 API key
   - Redeploy the project

### Get Judge0 API Key

1. Visit [RapidAPI Judge0 CE](https://rapidapi.com/judge0-official/api/judge0-ce/)
2. Sign up for a free account
3. Subscribe to the free plan (500 requests/month)
4. Copy your API key from the dashboard
5. Add it to your Vercel environment variables

## Other Deployment Options

### Netlify

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `out`
4. Add environment variable: `NEXT_PUBLIC_RAPIDAPI_KEY`
5. Enable Next.js static export in `next.config.ts`:
   ```typescript
   const nextConfig = {
     output: 'export',
     trailingSlash: true,
     images: {
       unoptimized: true
     }
   };
   ```

### GitHub Pages

1. Enable static export in `next.config.ts`
2. Use GitHub Actions for deployment
3. Set up secrets for environment variables

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_RAPIDAPI_KEY` | Your RapidAPI key for Judge0 CE | Yes |

## Build Commands

- **Development**: `npm run dev`
- **Build**: `npm run build`
- **Start**: `npm run start`
- **Lint**: `npm run lint`

## Performance Notes

- The app is fully static and loads quickly
- Monaco Editor is loaded dynamically to reduce initial bundle size
- Judge0 API calls are made client-side for simplicity
- No server-side rendering required