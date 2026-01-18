# Firebase Authentication 400 Error Fix

## Problem
The server-side admin login is getting a 400 error when calling the Firebase Identity Toolkit API:
```
identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=...
Failed to load resource: the server responded with a status of 400
```

## Root Cause
This error typically occurs when:
1. **API Key Restrictions**: The API key has HTTP referrer restrictions that block server-side requests
2. **API Not Enabled**: The Identity Toolkit API is not enabled for the project
3. **Invalid API Key**: The API key doesn't have the right permissions

## Solution

### Option 1: Enable Identity Toolkit API (Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `thanvish-ai-52bd9`
3. Navigate to **APIs & Services** > **Library**
4. Search for "Identity Toolkit API"
5. Click on it and click **Enable**

### Option 2: Check API Key Restrictions

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `thanvish-ai-52bd9`
3. Navigate to **APIs & Services** > **Credentials**
4. Find your API key: `AIzaSyDR9Ek6Rnz4jRzwG5EEs2trZYioC02XRwM`
5. Click on it to edit
6. Under **API restrictions**:
   - Select "Restrict key"
   - Make sure "Identity Toolkit API" is checked
7. Under **Application restrictions**:
   - For server-side use, select "None" or "IP addresses" (if you have a fixed server IP)
   - **Do NOT** use "HTTP referrers" for server-side API calls
8. Click **Save**

### Option 3: Create a New API Key for Server Use

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project: `thanvish-ai-52bd9`
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **API Key**
5. Name it "Server API Key" or similar
6. Under **API restrictions**:
   - Select "Restrict key"
   - Enable "Identity Toolkit API"
7. Under **Application restrictions**:
   - Select "None" (for server-side use)
8. Copy the new API key
9. Update your environment variable:
   ```bash
   VITE_FIREBASE_API_KEY=your_new_api_key_here
   ```

### Option 4: Use Environment Variable

Make sure you're using the correct API key via environment variable:

1. Create or update `.env` file in the project root:
   ```
   VITE_FIREBASE_API_KEY=AIzaSyDR9Ek6Rnz4jRzwG5EEs2trZYioC02XRwM
   ```

2. Restart your server after updating the environment variable

## Verify the Fix

After making changes:

1. Restart your development server
2. Try logging in again
3. Check the server console for more detailed error messages (the code now logs the actual error)

## Alternative: Use Firebase Admin SDK (More Secure)

If the REST API continues to cause issues, consider using Firebase Admin SDK to verify passwords. However, this requires a different approach since Admin SDK doesn't directly verify passwords. You would need to:

1. Have the client authenticate with Firebase SDK
2. Send the ID token to the server
3. Verify the token on the server using Admin SDK

This is more secure but requires client-side changes.

## Quick Check

Run this to verify the API key works:
```bash
curl -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyDR9Ek6Rnz4jRzwG5EEs2trZYioC02XRwM" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","returnSecureToken":true}'
```

If you get a 400 error, it's likely an API key restriction issue.

