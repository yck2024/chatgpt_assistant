# Permission Justifications for Chrome Web Store

## Required Permissions

### 1. `storage` Permission

**What it does:** Allows the extension to save and retrieve user data using Chrome's storage API.

**Why we need it:**
- **Save custom prompts:** Users create personalized prompt shortcuts that need to be stored persistently
- **Cross-device sync:** Prompts sync across user's Chrome devices when sync is enabled
- **Settings persistence:** User preferences and prompt configurations are maintained between browser sessions
- **No external servers:** All data is stored locally using Chrome's built-in storage system

**User benefit:**
- Prompts are never lost when closing/reopening browser
- Seamless experience across multiple devices
- No need to recreate prompts after browser updates

**Privacy impact:**
- ✅ Data stored locally on user's device
- ✅ No data transmitted to external servers
- ✅ User has full control over their data
- ✅ Data automatically deleted when extension is uninstalled

---

### 2. `notifications` Permission

**What it does:** Allows the extension to display system notifications to the user.

**Why we need it:**
- **User feedback:** Notify users when prompts are successfully saved or imported
- **Error alerts:** Inform users when there are issues with prompt operations
- **Import/export status:** Provide feedback when bulk operations complete
- **Enhanced UX:** Give users clear confirmation of their actions

**User benefit:**
- Clear feedback when operations succeed or fail
- Better user experience with visual confirmations
- No guessing whether actions were completed successfully

**Privacy impact:**
- ✅ Only shows notifications for user-initiated actions
- ✅ No background monitoring or unsolicited notifications
- ✅ Notifications are temporary and user-controlled
- ✅ Cannot access any user data or browsing history

---

### 3. Host Permissions via Content Scripts

**What it does:** Allows content scripts to run on AI platform websites to provide autocomplete functionality.

**Why we need it:**
- **Multi-platform support:** Extension works across ChatGPT, Claude, and Gemini
- **Core functionality:** Enables autocomplete overlay and keyboard shortcuts on all supported platforms
- **Real-time interaction:** Responds to user typing and provides instant suggestions
- **Seamless integration:** Maintains native look and feel of each platform

**Supported platforms:**
- `https://chatgpt.com/*` and `https://chat.openai.com/*` - ChatGPT
- `https://claude.ai/*` - Claude AI
- `https://gemini.google.com/*` and `https://aistudio.google.com/*` - Google Gemini

**User benefit:**
- Works seamlessly across multiple AI platforms
- No need to switch between windows or copy/paste
- Consistent experience regardless of which AI platform is being used

**Privacy impact:**
- ✅ Limited to official AI platform domains only
- ✅ No access to other websites or user data
- ✅ Cannot read or modify AI conversations
- ✅ Only enhances the input experience on supported platforms

---

## Permission Usage Summary

| Permission | Purpose | Privacy Impact | User Benefit |
|------------|---------|----------------|--------------|
| `storage` | Save user's custom prompts | Local storage only | Persistent prompts across sessions |
| `notifications` | Provide user feedback | Temporary notifications only | Clear operation confirmations |
| Host permissions | Run on AI platform domains | Limited to AI platforms only | Multi-platform functionality |

## Security & Privacy Commitments

1. **No external data transmission** - All data stays on user's device
2. **Minimal permissions** - Only requests permissions absolutely necessary for functionality
3. **User control** - Users can delete all data by uninstalling the extension
4. **Transparent operation** - No hidden functionality or data collection
5. **Open source** - Code can be reviewed for security and privacy

## Alternative Approaches Considered

- **Clipboard API:** Would require users to manually copy/paste prompts (poor UX)
- **Bookmark storage:** Would limit functionality and cross-device sync
- **External servers:** Would compromise privacy and require ongoing costs
- **Broader host permissions:** Would be unnecessary and raise privacy concerns

## Compliance with Chrome Web Store Policies

✅ **Minimal permissions** - Only requests what's absolutely necessary
✅ **Clear purpose** - Each permission directly supports core functionality  
✅ **User benefit** - All permissions provide clear value to users
✅ **Privacy focused** - No data collection or external transmission
✅ **Transparent** - Clear explanation of what each permission does 

---

### 4. `identity` Permission

**What it does:** Allows the extension to request your Google identity to authenticate with Google Drive.

**Why we need it:** This permission is essential for the **Google Drive Sync** feature, which lets you back up and sync your prompts to your personal Google Drive. It securely verifies your identity via Google's OAuth 2.0 system so the extension can save a file to your drive.

**User benefit:**
- **Securely back up** your prompts in your own Google Drive.
- **Access your prompts** across different devices.
- **You remain in control** and can revoke access at any time.

**Privacy impact:**
- ✅ The extension can **only** access the specific file it creates for prompts.
- ✅ It **cannot** access any other files or folders in your Google Drive.
- ✅ Authentication is handled by Google; your password is never seen or stored. 