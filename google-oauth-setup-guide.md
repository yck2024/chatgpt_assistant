# Google OAuth2 Setup Guide for AI Prompt Assistant

This guide will help you set up Google OAuth2 authentication for your Chrome extension to enable Google Drive sync functionality.

## Prerequisites

- A Google account
- Access to the Google Cloud Console
- Your Chrome extension's ID

## Step 1: Get Your Chrome Extension ID

1. Load your extension in Chrome:
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked" and select your extension folder
   - Note the extension ID (displayed under the extension name)

## Step 2: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter a project name (e.g., "AI Prompt Assistant")
4. Click "Create"

## Step 3: Enable the Google Drive API

1. In your Google Cloud project, go to "APIs & Services" → "Library"
2. Search for "Google Drive API"
3. Click on "Google Drive API" and then "Enable"

## Step 4: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" user type and click "Create"
3. Fill in the required information:
   - **App name**: AI Prompt Assistant
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
4. Click "Save and Continue"
5. On "Scopes" page, click "Add or Remove Scopes"
6. Find and select "Google Drive API" → "https://www.googleapis.com/auth/drive.file"
7. Click "Update" and then "Save and Continue"
8. On "Test users" page, add your Google account email
9. Click "Save and Continue" and then "Back to Dashboard"

## Step 5: Create OAuth2 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Chrome Extension" as the application type
4. Enter a name (e.g., "AI Prompt Assistant Extension")
5. For "Application ID", enter your Chrome extension ID (from Step 1)
6. Click "Create"
7. Copy the generated Client ID

## Step 6: Update Your Extension Configuration

1. Open `manifest.json` in your extension folder
2. Replace `YOUR_CLIENT_ID.apps.googleusercontent.com` with your actual Client ID:

```json
{
  "oauth2": {
    "client_id": "123456789-abcdefghijklmnop.apps.googleusercontent.com",
    "scopes": [
      "https://www.googleapis.com/auth/drive.file"
    ]
  }
}
```

3. Open `google-drive-service.js`
4. Replace the client ID in the constructor:

```javascript
constructor() {
  this.clientId = '123456789-abcdefghijklmnop.apps.googleusercontent.com';
  // ... rest of the code
}
```

## Step 7: Test the Integration

1. Reload your extension in Chrome (`chrome://extensions/` → click refresh icon)
2. Open the extension options page
3. Click "Connect to Google Drive"
4. Complete the OAuth flow
5. Test uploading and downloading prompts

## Troubleshooting

### Common Issues

1. **"Invalid client" error**
   - Ensure the Client ID in `manifest.json` and `google-drive-service.js` matches exactly
   - Verify the extension ID in Google Cloud Console matches your actual extension ID

2. **"Access blocked" error**
   - Make sure your Google account is added as a test user in the OAuth consent screen
   - Check that the Google Drive API is enabled

3. **"Scope not allowed" error**
   - Verify the scope `https://www.googleapis.com/auth/drive.file` is added to the OAuth consent screen
   - Ensure the scope is correctly listed in `manifest.json`

4. **Extension not loading**
   - Check the browser console for JavaScript errors
   - Verify all files are in the correct locations
   - Ensure the manifest.json syntax is valid

### Security Notes

- The `drive.file` scope only allows access to files created by your extension
- User data is stored securely in their Google Drive
- No personal data is transmitted to external servers
- The extension only requests the minimum necessary permissions

### Production Deployment

Before publishing to the Chrome Web Store:

1. Submit your OAuth consent screen for verification (if targeting external users)
2. Update the extension ID in Google Cloud Console to match the production ID
3. Test thoroughly with the production configuration

## File Structure

After setup, your extension should have these files:

```
ChatGPT_prompt_assistant/
├── manifest.json (updated with OAuth2 config)
├── background.js (updated with Google Drive handlers)
├── google-drive-service.js (new file)
├── options.html (updated with Google Drive UI)
├── options.js (updated with Google Drive methods)
└── ... (other existing files)
```

## API Usage

The extension uses these Google Drive API endpoints:

- `GET /drive/v3/files` - Search for existing files
- `POST /drive/v3/files` - Create new files
- `PATCH /upload/drive/v3/files/{fileId}` - Update file content
- `GET /drive/v3/files/{fileId}?alt=media` - Download file content
- `DELETE /drive/v3/files/{fileId}` - Delete files

All requests are authenticated using OAuth2 tokens obtained via `chrome.identity.getAuthToken()`. 