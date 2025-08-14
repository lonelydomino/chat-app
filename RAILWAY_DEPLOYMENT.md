# Railway Deployment Guide

## 🚀 Quick Deploy

1. **Connect your GitHub repo** to Railway
2. **Set environment variables** (see below)
3. **Deploy automatically** on push

## ⚙️ Environment Variables

Set these in Railway dashboard:

```bash
# Database URLs
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chat-app
REDIS_URL=redis://username:password@host:port

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Environment
NODE_ENV=production

# Optional: Custom port (Railway sets this automatically)
PORT=3000
```

## 🔧 Build Configuration

Railway will automatically:
- Install dependencies with `yarn install`
- Build with `yarn build`
- Start with `yarn start`

## 🐛 Troubleshooting

### Build Fails
- Check environment variables are set
- Ensure MongoDB and Redis URLs are correct
- Check Railway logs for specific error messages

### Runtime Errors
- Verify database connections
- Check JWT_SECRET is set
- Ensure all required env vars are present

### Common Issues
1. **Missing MONGODB_URI**: App can't connect to database
2. **Missing REDIS_URL**: Caching won't work
3. **Missing JWT_SECRET**: Authentication will fail
4. **Wrong NODE_ENV**: Development code might run in production

## 📱 Testing After Deploy

1. **Check health endpoint**: `https://your-app.railway.app/api/test`
2. **Test database connection**: Try to register/login
3. **Verify WebSocket**: Check if real-time chat works

## 🔄 Redeploy

- **Automatic**: Push to GitHub main branch
- **Manual**: Use Railway dashboard "Deploy" button
- **Rollback**: Use Railway dashboard to revert to previous version
