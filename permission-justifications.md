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

### 2. `activeTab` Permission

**What it does:** Grants temporary access to the currently active tab when the user interacts with the extension.

**Why we need it:**
- **ChatGPT integration:** Extension needs to inject autocomplete functionality into ChatGPT pages
- **User-triggered access:** Only activates when user clicks extension icon or uses keyboard shortcuts
- **Minimal scope:** Access is limited to the specific tab and only when needed
- **Dynamic content:** ChatGPT's interface is dynamic and requires real-time interaction

**User benefit:**
- Seamless autocomplete experience within ChatGPT
- No need to manually copy/paste prompts
- Keyboard navigation works naturally in the chat interface

**Privacy impact:**
- ✅ Only accesses tabs when user explicitly interacts with extension
- ✅ No background monitoring or data collection
- ✅ Temporary access that ends when tab is closed
- ✅ Cannot access other tabs or browser data

---

### 3. Host Permissions: `https://chatgpt.com/*` and `https://chat.openai.com/*`

**What it does:** Allows content scripts to run on ChatGPT's official websites.

**Why we need it:**
- **Core functionality:** Extension's primary purpose is to enhance ChatGPT experience
- **Official domains only:** Limited to legitimate ChatGPT interfaces
- **Content script injection:** Enables autocomplete overlay and keyboard shortcuts
- **Real-time interaction:** Responds to user typing and provides instant suggestions

**User benefit:**
- Works seamlessly within ChatGPT's interface
- No need to switch between windows or copy/paste
- Maintains ChatGPT's native look and feel

**Privacy impact:**
- ✅ Limited to ChatGPT domains only
- ✅ No access to other websites or user data
- ✅ Cannot read or modify ChatGPT conversations
- ✅ Only enhances the input experience

---

## Permission Usage Summary

| Permission | Purpose | Privacy Impact | User Benefit |
|------------|---------|----------------|--------------|
| `storage` | Save user's custom prompts | Local storage only | Persistent prompts across sessions |
| `activeTab` | Inject autocomplete into ChatGPT | Temporary, user-triggered | Seamless integration |
| Host permissions | Run on ChatGPT domains | Limited to ChatGPT only | Core functionality |

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