# Fresh OAuth Setup - Clean Start

If the consent screen keeps loading, start fresh:

## Step 1: Delete Old Credentials

1. Go to https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID: `823837541501-hph3p9somurc3j81fpf7qgnp8vluhdep`
3. Click the trash icon to delete it
4. Confirm deletion

## Step 2: Create New OAuth Consent Screen

1. Go to https://console.cloud.google.com/apis/credentials/consent
2. **User Type:** Select "External"
3. Click **"CREATE"**

**App Information:**
- App name: `HAROFilter`
- User support email: `untttld@gmail.com`
- Developer contact: `untttld@gmail.com`

Click **"SAVE AND CONTINUE"**

**Scopes:**
- Click **"ADD OR REMOVE SCOPES"**
- Manually add these scope URLs:
  ```
  https://www.googleapis.com/auth/gmail.readonly
  https://www.googleapis.com/auth/gmail.modify
  ```
- Click **"UPDATE"**
- Click **"SAVE AND CONTINUE"**

**Test Users:**
- Click **"+ ADD USERS"**
- Add: `untttld@gmail.com`
- Click **"ADD"**
- Click **"SAVE AND CONTINUE"**

**Summary:**
- Review and click **"BACK TO DASHBOARD"**

## Step 3: Create New OAuth Credentials

1. Go to https://console.cloud.google.com/apis/credentials
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. **Application type:** Web application
4. **Name:** HAROFilter Web Client
5. **Authorized redirect URIs:**
   - Click **"+ ADD URI"**
   - Enter: `http://localhost:3000/api/gmail/auth`
6. Click **"CREATE"**
7. **COPY** your new Client ID and Client Secret

## Step 4: Update .env.local

Replace the old credentials with your new ones:

```env
GOOGLE_CLIENT_ID=your_new_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_new_secret
```

## Step 5: Test Again

```bash
npm run gmail-auth
```

This time it should work!
