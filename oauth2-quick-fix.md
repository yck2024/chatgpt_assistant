# Quick Fix for "bad client id" Error

## 🚨 **Immediate Steps to Fix**

### **1. Get Your Extension ID**
1. Go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Find your extension and copy the **Extension ID** (not the name)

### **2. Update Google Cloud Console**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Find your OAuth 2.0 Client ID and click on it
4. In the **Application ID** field, paste your extension ID
5. Click **Save**

### **3. Verify OAuth Consent Screen**
1. Go to **APIs & Services** → **OAuth consent screen**
2. Make sure your email is added as a **Test user**
3. Verify the scope `https://www.googleapis.com/auth/drive.file` is added

### **4. Reload Extension**
1. Go to `chrome://extensions/`
2. Click the refresh icon on your extension
3. Try the Google Drive connection again

## 🔍 **Common Issues & Solutions**

### **Issue: Extension ID Mismatch**
- **Symptom**: "bad client id" error
- **Solution**: Copy the exact extension ID from `chrome://extensions/` and paste it in Google Cloud Console

### **Issue: Not Added as Test User**
- **Symptom**: "Access blocked" error
- **Solution**: Add your Google account email to the OAuth consent screen test users

### **Issue: Google Drive API Not Enabled**
- **Symptom**: Various API errors
- **Solution**: Enable Google Drive API in Google Cloud Console

### **Issue: Wrong OAuth Client Type**
- **Symptom**: Authentication failures
- **Solution**: Make sure you created "OAuth 2.0 Client ID" (not service account)

## 📋 **Complete Checklist**

- [ ] Extension ID copied from `chrome://extensions/`
- [ ] Extension ID pasted in Google Cloud Console OAuth2 credentials
- [ ] OAuth consent screen configured
- [ ] Scope `https://www.googleapis.com/auth/drive.file` added
- [ ] Your email added as test user
- [ ] Google Drive API enabled
- [ ] Extension reloaded in Chrome
- [ ] Tested with debug page (`debug-oauth.html`)

## 🛠️ **Debug Tools**

1. **Use the debug page**: Open `debug-oauth.html` in your extension
2. **Check browser console**: Look for detailed error messages
3. **Verify manifest.json**: Ensure OAuth2 configuration is correct

## 📞 **Still Having Issues?**

If the problem persists:

1. **Double-check the extension ID** - it should look like: `abcdefghijklmnopqrstuvwxyz123456`
2. **Wait a few minutes** - Google Cloud Console changes can take time to propagate
3. **Try in incognito mode** - to rule out browser cache issues
4. **Check the debug page** - it will show exactly what's wrong

## 🔗 **Useful Links**

- [Google Cloud Console](https://console.cloud.google.com/)
- [Chrome Extensions Page](chrome://extensions/)
- [OAuth2 Setup Guide](google-oauth-setup-guide.md) 