# Google OAuth Setup - Fix for Error 400

## The Problem

Your OAuth credentials are configured as "Desktop app" but we're using a web redirect URL. This causes the "invalid_request" error.

## Solution: Reconfigure as Web Application

### Step 1: Go to Google Cloud Console

1. Open https://console.cloud.google.com/apis/credentials
2. Sign in with your Google account

### Step 2: Delete Existing Desktop Credentials (Optional)

1. Find your existing OAuth 2.0 Client ID
2. Click the trash icon to delete it (or just create a new one)

### Step 3: Create New Web Application Credentials

1. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
2. **Application type:** Select **"Web application"**
3. **Name:** "HAROFilter Web"
4. **Authorized JavaScript origins:** (Leave empty for now)
5. **Authorized redirect URIs:** Click **"+ ADD URI"** and enter:
   ```
   http://localhost:3000/api/gmail/auth
   ```
6. Click **"CREATE"**

### Step 4: Save Your New Credentials

You'll see a popup with:
- **Client ID:** Something like `xxxxx.apps.googleusercontent.com`
- **Client Secret:** Something like `GOCSPX-xxxxx`

Copy both values!

### Step 5: Update Your .env.local

Replace the existing values in `/Users/savage/HAROFilter/harofilter/.env.local`:

```env
GOOGLE_CLIENT_ID=your_new_client_id_here
GOOGLE_CLIENT_SECRET=your_new_client_secret_here
```

### Step 6: Run Gmail Auth Again

```bash
npm run gmail-auth
```

This time it should work!

---

## Alternative: Use Desktop App Flow (Quick Fix)

If you want to keep using Desktop app credentials, we can use a different flow that doesn't require a web server. Let me know if you'd prefer this approach.
