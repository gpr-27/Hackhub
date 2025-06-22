# Deployment Guide

## Overview
Your health app consists of two parts:
1. **Frontend (React)** - Can be deployed to Netlify
2. **Backend (Express.js + MongoDB)** - Needs to be deployed to a server platform

## Part 1: Deploy Backend Server

### Option A: Deploy to Railway (Recommended)
1. Go to [Railway.app](https://railway.app)
2. Sign up/login with GitHub
3. Click "Deploy from GitHub repo"
4. Select your repository
5. Add environment variables:
   - `MONGODB_CONNECTION_STRING`: Your MongoDB Atlas connection string
   - `SESSION_SECRET`: A secure random string
   - `NODE_ENV`: production
   - `PORT`: 3001

### Option B: Deploy to Render
1. Go to [Render.com](https://render.com)
2. Connect your GitHub account
3. Create a new "Web Service"
4. Select your repository
5. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment Variables**: Same as above

### Option C: Deploy to Heroku
1. Install Heroku CLI
2. Run: `heroku create your-app-name`
3. Set environment variables: `heroku config:set MONGODB_CONNECTION_STRING=your-connection-string`
4. Deploy: `git push heroku main`

## Part 2: Deploy Frontend to Netlify

### Prerequisites
Before deploying to Netlify, you need to:

1. **Update API URLs in all components** (I've started this process)
2. **Get your backend server URL** from step 1
3. **Set environment variable** in Netlify

### Steps:

1. **Build and test locally**:
   ```bash
   npm run build
   ```

2. **Deploy to Netlify**:
   
   **Option A: Drag and Drop**
   - Run `npm run build`
   - Go to [Netlify.com](https://netlify.com)
   - Drag the `build` folder to the deploy area

   **Option B: Connect GitHub (Recommended)**
   - Go to [Netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub account
   - Select your repository
   - Build settings are automatically configured from `netlify.toml`

3. **Set Environment Variables in Netlify**:
   - Go to Site Settings > Environment Variables
   - Add: `REACT_APP_API_URL` = `https://your-backend-url.com`

## Important Notes

### Security Considerations
- Never commit `.env` files with real credentials
- Use environment variables for all sensitive data
- Update CORS settings in your backend to include your Netlify domain

### Backend CORS Update Needed
In your `server.js`, update the CORS origin array to include your Netlify domain:
```javascript
origin: [
  'http://localhost:3000', 
  'https://your-netlify-app.netlify.app',
  'https://your-custom-domain.com'
]
```

### Database Setup
Make sure your MongoDB Atlas:
1. Has the correct connection string
2. Allows connections from anywhere (0.0.0.0/0) for cloud deployments
3. Has the proper database user with read/write permissions

## Testing
1. Test your backend API endpoints independently
2. Test your frontend with the deployed backend URL
3. Test all authentication flows
4. Test all CRUD operations

## Troubleshooting
- Check Netlify build logs for frontend issues
- Check your backend service logs for API issues
- Verify environment variables are set correctly
- Check browser network tab for CORS errors 