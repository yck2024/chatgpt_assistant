# How to Test Google Drive Integration

## The Problem

If you're seeing errors like "Cannot read properties of undefined (reading 'sendMessage')" when opening the test HTML files directly, it's because these files need to run within the extension context. This has been fixed in the latest version.

## The Solution

### ✅ Correct Way to Test

1. **Open Extension Options:**
   - Go to `chrome://extensions/`
   - Find "AI Prompt Assistant" 
   - Click "Options"

2. **Access Test Tools:**
   - Scroll down to the "Google Drive Sync" section
   - Click "OAuth Debug Tool" to test OAuth2 configuration
   - Click "Google Drive Test" to test full Google Drive integration

### ❌ Incorrect Way

- Opening `debug-oauth.html` or `test-google-drive.html` directly in the browser
- Dragging and dropping the HTML files into Chrome
- Opening them as regular web pages

## Why This Happens

Chrome extensions have a security model that prevents regular web pages from accessing extension APIs like `chrome.runtime.sendMessage()`. The test pages need to be opened as extension pages to have access to these APIs.

## Alternative Testing Methods

If you need to test from outside the extension:

1. **Use Browser Console:**
   - Go to any webpage
   - Open Developer Tools (F12)
   - In the Console tab, you can test some basic extension functions

2. **Use Extension Background Page:**
   - Go to `chrome://extensions/`
   - Find your extension
   - Click "Service Worker" under "Inspect views"
   - This opens the background script console where you can test extension functions

## Quick Test Commands

Once you have the test pages open correctly, you can use these commands in the browser console:

```javascript
// Test OAuth2 configuration
chrome.runtime.getManifest().oauth2

// Test authentication
chrome.identity.getAuthToken({ interactive: true }, (token) => {
  console.log('Token:', token);
  console.log('Error:', chrome.runtime.lastError);
});

// Test extension messaging
chrome.runtime.sendMessage({ action: 'googleDriveGetStatus' }, (response) => {
  console.log('Response:', response);
});
```

## Troubleshooting

If you're still having issues:

1. **Reload the extension** in `chrome://extensions/`
2. **Check the console** for any JavaScript errors
3. **Verify OAuth2 setup** using the debug tool
4. **Check the troubleshooting guide** in `oauth2-troubleshooting.md`

## Expected Results

When working correctly, you should see:
- ✅ Extension status showing "OK"
- ✅ OAuth2 configuration working
- ✅ Ability to authenticate with Google
- ✅ File upload/download functionality working

## Recent Updates

The test pages have been updated to work directly with Chrome extension APIs instead of relying on message passing. This means:
- ✅ Test pages now work properly when opened through the extension context
- ✅ Direct OAuth2 testing without background script communication
- ✅ More reliable testing and debugging capabilities
- ✅ Better error messages and debugging information 