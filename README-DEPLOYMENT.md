# 🚀 English Flash Card - Deployment Guide

## Quick Start Deployment

### Option 1: Vercel Dashboard (Recommended)

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy via Vercel Dashboard**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel auto-detects Next.js configuration
   - Click "Deploy"

3. **Add Environment Variables** in Vercel Dashboard:
   - Go to Project Settings → Environment Variables
   - Add the variables from `.env.example`

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (first time - interactive setup)
vercel

# Deploy to production
vercel --prod
```

## Pre-Deployment Checklist

- [x] **Build Success**: `npm run build` completes without errors
- [x] **Production Configuration**: `vercel.json` configured
- [x] **Environment Variables**: `.env.example` template created
- [ ] **Supabase Setup**: Create Supabase project and get credentials
- [ ] **Domain Configuration**: Set up custom domain (optional)

## Environment Variables Needed

Copy these from your Supabase project dashboard:

```env
# Required - Get from Supabase Project Settings
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key

# Auto-set by Vercel
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Optional - For AI features (if implemented)
OPENAI_API_KEY=sk-...your-openai-key
```

## Database Setup (Supabase)

1. Create tables for:
   - `users` (auth handled by Supabase Auth)
   - `user_preferences` 
   - `flash_cards`
   - Set up Row Level Security (RLS) policies

2. Enable Authentication providers in Supabase Auth settings

## Post-Deployment Verification

1. **Health Check**: Visit your deployed URL
2. **API Endpoints**: Test `/api/user/preferences` 
3. **Static Assets**: Verify Chakra UI styling loads
4. **Functionality**: Test preview modal and settings

## Monitoring & Analytics

- **Vercel Analytics**: Automatically enabled
- **Error Tracking**: Consider adding Sentry
- **Logs**: Available in Vercel dashboard

## Custom Domain (Optional)

1. Add domain in Vercel project settings
2. Update DNS records as instructed
3. SSL certificate auto-provisioned

## Troubleshooting

**Build Failures**: 
- Check Next.js compatibility
- Verify environment variables
- Review build logs in Vercel dashboard

**Runtime Errors**:
- Check Function logs in Vercel
- Verify API route configurations
- Ensure Supabase connection

## Support

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs