# Clerk Authentication Setup Guide

## Quick Start (5 minutes)

### Step 1: Create Clerk Account
1. Go to https://dashboard.clerk.com
2. Click "Sign Up" and create your account
3. Verify your email

### Step 2: Create Application
1. Click "Add application" or "Create Application"
2. Enter your application name: **Personal Finance Auto-Pilot**
3. Select authentication methods:
   - ✅ **Email** (with password)
   - ✅ **Google** (recommended for better UX)
   - Optional: GitHub, Facebook, etc.
4. Click "Create application"

### Step 3: Get API Keys
After creating your application, you'll see the API keys dashboard:

1. **Publishable Key** (starts with `pk_test_...`)
   - This is safe to expose in your frontend
   - Copy this key

2. **Secret Key** (starts with `sk_test_...`)
   - Keep this secret - never commit to version control
   - Copy this key

### Step 4: Configure Environment Variables
1. In your project root, copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and add your keys:
   ```env
   # OpenAI API Key
   OPENAI_API_KEY=sk-proj-your-openai-key-here
   
   # Clerk Authentication Keys
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXX
   CLERK_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXXXXXXXX
   ```

3. Save the file

### Step 5: Configure Clerk Paths
In your Clerk Dashboard, go to **Configure** → **Paths**:

Set these paths:
- **Sign-in URL**: `/sign-in`
- **Sign-up URL**: `/sign-up`
- **After sign-in URL**: `/dashboard`
- **After sign-up URL**: `/dashboard`
- **Home URL**: `/`

Click "Save"

### Step 6: Test Your Setup
1. Start your development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000

3. You should see the landing page

4. Click "Get Started" to test sign-up

5. After signing up, you should be redirected to `/dashboard`

## Troubleshooting

### Error: "Missing publishableKey"
**Solution**: Make sure your `.env.local` file has the correct `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

### Error: "Invalid token"
**Solution**: 
1. Check that your `CLERK_SECRET_KEY` is correct
2. Make sure you're using keys from the same Clerk application
3. Try regenerating your keys in Clerk Dashboard

### Redirects not working
**Solution**: 
1. Verify the paths in Clerk Dashboard match exactly:
   - Sign-in: `/sign-in` (not `/sign-in/`)
   - After sign-in: `/dashboard`
2. Clear your browser cache
3. Restart your dev server

### Authentication works but API calls fail
**Solution**: 
1. Make sure you've added the `auth()` checks to API routes
2. Check that the middleware is configured correctly
3. Look at browser console for 401 errors

## Social Authentication Setup (Optional)

### Adding Google Login
1. In Clerk Dashboard, go to **Configure** → **Social Connections**
2. Click on **Google**
3. Toggle "Enable for Sign-up and Sign-in"
4. For development, Clerk provides default credentials
5. For production, you'll need to create Google OAuth credentials

### Adding Other Providers
Similar process for:
- GitHub
- Facebook
- Apple
- Microsoft
- LinkedIn

## Production Deployment

### Environment Variables
When deploying to Vercel, Netlify, or other platforms:

1. Add these environment variables in your hosting platform:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
   CLERK_SECRET_KEY=sk_live_...
   OPENAI_API_KEY=sk-proj-...
   ```

2. **Important**: Use production keys (starting with `pk_live_` and `sk_live_`)

### Getting Production Keys
1. In Clerk Dashboard, toggle from "Development" to "Production" (top navigation)
2. Copy your production keys
3. Use these in your production environment

### Domain Configuration
1. In Clerk Dashboard → **Domains**
2. Add your production domain (e.g., `myapp.com`)
3. Clerk will automatically handle HTTPS

## Security Best Practices

### ✅ Do's
- ✅ Keep `CLERK_SECRET_KEY` secret
- ✅ Use environment variables
- ✅ Enable MFA for your Clerk account
- ✅ Use production keys in production
- ✅ Regularly rotate API keys

### ❌ Don'ts
- ❌ Never commit `.env.local` to git
- ❌ Never share your secret key
- ❌ Never use production keys in development
- ❌ Never log or expose secret keys in client code

## Testing User Management

### Creating Test Users
1. In Clerk Dashboard → **Users**
2. Click "Create user"
3. Fill in test user details
4. Use this account for testing

### Viewing User Sessions
1. Go to **Sessions** in Clerk Dashboard
2. See all active sessions
3. Revoke sessions if needed

### Checking Sign-in Activity
1. Go to **Events** in Clerk Dashboard
2. View all authentication events
3. Monitor for suspicious activity

## Advanced Features (Optional)

### Custom Email Templates
1. Go to **Messaging** → **Email**
2. Customize verification emails
3. Add your branding

### Organization Support
Enable multi-tenant organizations:
1. Go to **Configure** → **Organizations**
2. Toggle "Enable Organizations"
3. Configure roles and permissions

### Webhooks
Sync user data with your database:
1. Go to **Webhooks**
2. Add endpoint URL
3. Subscribe to events (user.created, user.updated)

## Additional Resources

- 📚 [Clerk Documentation](https://clerk.com/docs)
- 🎥 [Video Tutorials](https://www.youtube.com/c/ClerkDev)
- 💬 [Clerk Discord Community](https://discord.com/invite/clerk)
- 🐛 [GitHub Issues](https://github.com/clerkinc/javascript)

## Support

If you encounter issues:
1. Check Clerk Status: https://status.clerk.com
2. Search Clerk Docs: https://clerk.com/docs
3. Ask in Clerk Discord: https://discord.com/invite/clerk
4. Contact Clerk Support: support@clerk.com

---

**Need Help?** Check [AUTHENTICATION_IMPLEMENTATION.md](AUTHENTICATION_IMPLEMENTATION.md) for detailed implementation notes.
