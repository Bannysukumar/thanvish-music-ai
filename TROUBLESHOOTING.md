# Troubleshooting API.box Integration

## Common Issues

### 1. 400 Bad Request / 404 Not Found

**Symptoms:**
- Browser console shows: `POST http://localhost:5000/api/generate-music 400 (Bad Request)`
- Server logs show: `API.box API Error: Status 404` or HTML response

**Causes:**
- Incorrect API base URL
- Missing or invalid API key
- Wrong endpoint path

**Solutions:**

1. **Check your server terminal logs** - Look for:
   ```
   [API.box] Calling API endpoint: https://...
   [API.box] Using base URL: https://...
   ```

2. **Verify API Base URL:**
   - Check the API documentation at https://docs.api.box/suno-api/generate-music
   - Look for the "Base URL" or "Endpoint" section
   - Common options to try in your `.env` file:
     ```env
     API_BOX_BASE_URL=https://api.box/api/v1
     # OR
     API_BOX_BASE_URL=https://api.api.box/api/v1
     # OR check documentation for exact URL
     ```

3. **Verify API Key:**
   - Make sure `API_BOX_API_KEY` is set in your `.env` file
   - Get your API key from: https://docs.api.box/ (API Key Management page)
   - Restart your server after adding/changing the API key

4. **Check API Documentation:**
   - The endpoint should be: `{BASE_URL}/generate` (POST)
   - Verify the exact path from the documentation

### 2. HTML Response Instead of JSON

**Symptoms:**
- Server logs show: `Expected JSON but got text/html`
- Error mentions `<!DOCTYPE html>`

**Solution:**
- The API base URL is pointing to a web page, not the API endpoint
- Update `API_BOX_BASE_URL` in your `.env` file to the correct API endpoint
- Restart your server

### 3. Audio Autoplay Errors

**Symptoms:**
- Browser console shows: `NotAllowedError: play() failed because the user didn't interact with the document first`

**Solution:**
- This is a browser security feature - it's been fixed in the code
- Audio will only play after user interaction (click, touch, keypress)
- This error can be safely ignored if it appears

### 4. Environment Variables Not Loading

**Symptoms:**
- Error: `API_BOX_API_KEY environment variable is not set`

**Solution:**
1. Create a `.env` file in the project root (same level as `package.json`)
2. Add your variables:
   ```env
   API_BOX_API_KEY=your_actual_api_key_here
   API_BOX_BASE_URL=https://api.box/api/v1
   ```
3. Restart your development server
4. Make sure `.env` is in `.gitignore` (don't commit your API key!)

## Debugging Steps

1. **Check Server Logs:**
   - Look at your terminal where `npm run dev` is running
   - Check for `[API.box]` prefixed messages
   - Note the exact URL being called

2. **Verify Environment Variables:**
   ```bash
   # In your terminal, check if variables are loaded
   echo $API_BOX_API_KEY  # Should show your key (or empty if not set)
   ```

3. **Test API Endpoint Manually:**
   - Use Postman or curl to test the API endpoint directly
   - Example curl command (replace with your actual values):
     ```bash
     curl -X POST "https://api.box/api/v1/generate" \
       -H "Authorization: Bearer YOUR_API_KEY" \
       -H "Content-Type: application/json" \
       -d '{"customMode":false,"instrumental":false,"prompt":"test","model":"V5","callBackUrl":"http://localhost:5000/api/music-callback"}'
     ```

4. **Check API Documentation:**
   - Visit https://docs.api.box/suno-api/generate-music
   - Verify the exact endpoint URL and request format
   - Compare with what's in your code

## Getting Help

If you're still having issues:
1. Check the server terminal logs for detailed error messages
2. Verify your API key is valid and has credits
3. Check the API.box documentation for any recent changes
4. Verify the API endpoint URL matches the documentation exactly

