# OAuth2 Authentication Troubleshooting Guide

## Error: "OAuth2 not granted or revoked"

This error occurs when the Chrome extension tries to access Google Drive but the OAuth2 authentication hasn't been completed or has been revoked.

## Quick Fix Steps

### 1. Check OAuth2 Configuration

First, verify that your OAuth2 is properly configured:

1. Open the extension options page (chrome://extensions/ → Find your extension → Click "Options")
2. Scroll down to the "Google Drive Sync" section
3. Click "OAuth Debug Tool" to open the debug page
4. Click "Get Extension Info" to see your extension ID
5. Click "Test OAuth2 Config" to check if OAuth2 is working

### 2. Verify Google Cloud Console Setup

Make sure your Google Cloud Console is properly configured:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" → "Credentials"
4. Check that you have an OAuth 2.0 Client ID for Chrome Extension
5. Verify the Application ID matches your extension ID exactly

### 3. Check OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Make sure your email is added as a test user
3. Verify the scope `https://www.googleapis.com/auth/drive.file` is included

### 4. Test Authentication

1. Open the extension options page
2. Go to the Google Drive section
3. Click "Connect to Google Drive"
4. Complete the OAuth flow

## Common Issues and Solutions

### Issue: "Invalid client" error
**Solution:** 
- Check that the client ID in `manifest.json` and `google-drive-service.js` matches exactly
- Verify the extension ID in Google Cloud Console matches your actual extension ID

### Issue: "Access blocked" error
**Solution:**
- Add your Google account email as a test user in the OAuth consent screen
- Make sure the Google Drive API is enabled in your project

### Issue: "Scope not allowed" error
**Solution:**
- Add the scope `https://www.googleapis.com/auth/drive.file` to your OAuth consent screen
- Verify the scope is correctly listed in `manifest.json`

### Issue: Extension not loading
**Solution:**
- Check the browser console for JavaScript errors
- Verify all files are in the correct locations
- Ensure the manifest.json syntax is valid

## Testing Your Setup

Use the test tools included with the extension:

1. **Extension Options:** Go to chrome://extensions/ → Find your extension → Click "Options"
2. **OAuth Debug Tool:** Click "OAuth Debug Tool" in the Google Drive Sync section
3. **Google Drive Test:** Click "Google Drive Test" in the Google Drive Sync section

## Manual Verification Steps

1. **Check Extension ID:**
   ```javascript
   // In Chrome console on any page
   chrome.runtime.id
   ```

2. **Check OAuth2 Configuration:**
   ```javascript
   // In extension options page console
   chrome.runtime.getManifest().oauth2
   ```

3. **Test Token Request:**
   ```javascript
   // In extension background script console
   chrome.identity.getAuthToken({ interactive: true }, (token) => {
     console.log('Token:', token);
     console.log('Error:', chrome.runtime.lastError);
   });
   ```

## If All Else Fails

1. **Reset OAuth2:**
   - Go to chrome://settings/ → Privacy and security → Site Settings → Google Drive
   - Remove any existing permissions
   - Try authenticating again

2. **Recreate OAuth2 Credentials:**
   - Delete the existing OAuth 2.0 Client ID in Google Cloud Console
   - Create a new one with the correct extension ID
   - Update `manifest.json` and `google-drive-service.js`

3. **Check Network Issues:**
   - Ensure you can access Google APIs
   - Check if any firewall or proxy is blocking the requests

## Support

If you're still having issues:

1. Check the browser console for detailed error messages
2. Use the debug tools in the extension options page
3. Verify your Google Cloud Console setup matches the guide in `google-oauth-setup-guide.md`
4. Test with the provided test tools in the extension options page

## Expected Behavior After Fix

Once properly configured:
- The extension should show "Connected to Google Drive" in the options page
- You should be able to upload and download prompts
- No OAuth2 errors should appear in the console
- The Google Drive integration should work seamlessly
- Test pages should work without CSP violations

## Recent Fixes

- **CSP Issues Resolved**: Test pages now use external JavaScript files instead of inline scripts
- **Proper Event Handling**: All buttons use proper event listeners instead of inline onclick handlers
- **Better Error Handling**: Improved error messages and debugging capabilities 