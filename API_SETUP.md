# API.box Music Generation Setup

This application has been migrated from OpenAI to API.box for music generation.

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# API.box API Key (required)
API_BOX_API_KEY=your_api_key_here

# Optional: API.box Base URL (defaults to https://api.api.box/api/v1)
# Correct endpoint: https://api.api.box/api/v1 (note: api.api.box, not api.box)
API_BOX_BASE_URL=https://api.api.box/api/v1

# Optional: API.box Model (defaults to V5)
# Options: V3_5, V4, V4_5, V4_5PLUS, V5
API_BOX_MODEL=V5

# Optional: Callback URL for webhooks (defaults to http://localhost:5000/api/music-callback)
# Set this to your production URL when deploying
API_BOX_CALLBACK_URL=http://localhost:5000/api/music-callback

# Optional: Base URL for callback generation (used if API_BOX_CALLBACK_URL is not set)
BASE_URL=http://localhost:5000
```

## Getting Your API Key

1. Visit [API.box](https://docs.api.box/) and sign up for an account
2. Navigate to the API Key Management page
3. Copy your API key and add it to your `.env` file

## How It Works

1. **Music Generation**: When a user requests music generation, the API creates an async task and returns a `taskId`
2. **Status Polling**: The client automatically polls the status endpoint every 5 seconds until generation is complete
3. **Webhook Callbacks**: Alternatively, API.box can send callbacks to `/api/music-callback` when generation completes
4. **Audio URL**: Once complete, the composition is updated with the generated audio URL

## API Endpoints

- `POST /api/generate-music` - Start music generation (returns taskId)
- `GET /api/generate-music/:taskId/status` - Check generation status
- `POST /api/music-callback` - Webhook endpoint for API.box callbacks

## Notes

- Generated files are retained by API.box for 14 days
- The API supports multiple model versions with different capabilities
- Non-custom mode is used by default (simpler, prompt-only approach)
- Music generation is asynchronous and may take 20+ seconds to complete

