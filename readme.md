# AI Prompt Assistant

A Chrome extension that adds custom prompt shortcuts to ChatGPT, Claude, Gemini, DuckDuckGo, and Microsoft Copilot with autocomplete functionality.

## Features

- **Multi-Platform Support**: Works with ChatGPT, Claude, Gemini, DuckDuckGo, and Microsoft Copilot
- **Quick Prompt Access**: Type `//` followed by your shortcut to see available prompts
- **Autocomplete**: Filter prompts as you type (e.g., `//r` shows prompts starting with "r")
- **Easy Management**: Add, edit, and delete prompts through a user-friendly interface
- **Export/Import**: Export your prompts as JSON and import prompts from JSON files
- **Google Drive Sync**: Backup and sync your prompts to Google Drive for cross-device access
- **Keyboard Navigation**: Use arrow keys to navigate and Enter/Tab to select
- **Dark Mode Support**: Automatically adapts to your system's theme
- **Cross-Platform Sync**: Your prompts work across all supported AI platforms

## Installation

### From Source (Development)

1. Download or clone all the extension files to a folder
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the folder containing the extension files
5. The extension should now be installed and active

### Required Files

Make sure your extension folder contains these files:
- `manifest.json`
- `content.js`
- `content.css`
- `options.html`
- `options.js`
- `popup.html`
- `popup.js`
- `background.js`
- `google-drive-service.js` (for Google Drive sync)

## Usage

### Adding Prompts

1. Click the extension icon in your browser toolbar
2. Click "Manage Prompts" to open the settings page
3. Enter a shortcut key (e.g., "reviseEnglish") and the prompt content
4. Click "Add Prompt"

### Using Prompts in AI Platforms

1. Go to any supported platform:
   - **ChatGPT**: chatgpt.com or chat.openai.com
   - **Claude**: claude.ai
   - **Gemini**: gemini.google.com or aistudio.google.com
   - **DuckDuckGo**: duckduckgo.com
   - **Microsoft Copilot**: copilot.microsoft.com or m365.cloud.microsoft
2. Click in the message input box
3. Type `//` to see all available prompts
4. Continue typing to filter (e.g., `//rev` to find "reviseEnglish")
5. Use arrow keys to navigate the list
6. Press Enter or Tab to insert the selected prompt

### Managing Prompts

- **Edit**: Click the "Edit" button next to any prompt in the settings
- **Delete**: Click the "Delete" button (with confirmation)
- **View Count**: The popup shows how many prompts you have saved
- **Cross-Platform**: Prompts work on all supported AI platforms

### Export and Import Prompts

You can export your prompts as a JSON file and import prompts from JSON files:

- **Export**: Click "Export JSON" in the settings page to download all your prompts
- **Import**: Click "Import JSON" to select a JSON file with prompts to import
- **Conflict Resolution**: If imported prompts conflict with existing ones, you'll be asked to confirm overwriting
- **Backup**: Use export to create backups of your prompt collection
- **Sharing**: Share your prompt collections with others by exporting and sharing the JSON file

### Google Drive Sync

Sync your prompts to Google Drive for secure backup and cross-device access:

- **Connect**: Click "Connect to Google Drive" in the settings page
- **Upload**: Save your current prompts to Google Drive
- **Download**: Restore prompts from Google Drive to your local storage
- **Automatic Backup**: Your prompts are stored in a private file in your Google Drive
- **Cross-Device**: Access your prompts from any device with the extension installed

**Setup Required**: Before using Google Drive sync, you need to configure OAuth2 credentials. See the [Google OAuth2 Setup Guide](google-oauth-setup-guide.md) for detailed instructions.

The JSON format includes:
```json
{
  "version": "1.0",
  "exportDate": "2024-01-15T10:30:00.000Z",
  "prompts": {
    "shortcutKey": "prompt content",
    "anotherKey": "another prompt content"
  }
}
```

## Example Prompts

Here are some useful prompts to get you started:

- **Key**: `reviseEnglish`  
  **Content**: "Please revise this English message to make it more polite and professional:"

- **Key**: `summarize`  
  **Content**: "Please provide a concise summary of the following text:"

- **Key**: `translate`  
  **Content**: "Please translate the following text to English:"

- **Key**: `explain`  
  **Content**: "Please explain the following concept in simple terms:"

- **Key**: `codeReview`  
  **Content**: "Please review this code and suggest improvements for readability and performance:"

## Supported Platforms

- **ChatGPT** (chatgpt.com, chat.openai.com)
- **Claude** (claude.ai)
- **Gemini** (gemini.google.com, aistudio.google.com)
- **DuckDuckGo** (duckduckgo.com)
- **Microsoft Copilot** (copilot.microsoft.com, m365.cloud.microsoft)

## Technical Details

- **Storage**: Uses Chrome's sync storage to keep prompts across devices
- **Compatibility**: Works with multiple AI platform web interfaces
- **Performance**: Lightweight with minimal impact on page load
- **Privacy**: All data stored locally, no external servers
- **Platform Detection**: Automatically detects and adapts to different AI platforms

## Troubleshooting

### Autocomplete Not Showing
- Make sure you're on a supported platform (ChatGPT, Claude, Gemini, DuckDuckGo, or Microsoft Copilot)
- Try refreshing the page
- Check that the extension is enabled in chrome://extensions/

### Prompts Not Saving
- Check Chrome's storage permissions
- Try the "Refresh" button in the popup
- Reload the extension if needed

### Interface Issues
- Clear browser cache and reload the AI platform
- Make sure you're using a recent version of Chrome
- Check for conflicts with other extensions

### Platform-Specific Issues
- **ChatGPT**: Works with both contenteditable and textarea inputs
- **Claude**: Optimized for Claude's interface elements
- **Gemini**: Compatible with Gemini's input system
- **DuckDuckGo**: Compatible with search interface
- **Microsoft Copilot**: Works with both web and M365 interfaces

### Google Drive Sync Issues
- Check the [OAuth2 Troubleshooting Guide](oauth2-troubleshooting.md) for setup issues
- Use the built-in test tools in the extension options page
- Verify your Google Cloud Console configuration
- Make sure you're using the correct extension ID in OAuth2 credentials

## Testing

### Testing Google Drive Integration
To test the Google Drive functionality:

1. Open the extension options page (chrome://extensions/ → Find extension → Options)
2. Scroll to the "Google Drive Sync" section
3. Click "OAuth Debug Tool" to test OAuth2 configuration
4. Click "Google Drive Test" to test full integration

**Note**: Do not open the test HTML files directly in the browser. They must be opened through the extension context to work properly.

For detailed testing instructions, see [How to Test Google Drive Integration](how-to-test-google-drive.md).

## Development

### File Structure
```
├── manifest.json              # Extension manifest
├── content.js                 # Main functionality script
├── content.css                # Autocomplete styling
├── options.html               # Settings page
├── options.js                 # Settings functionality
├── popup.html                 # Extension popup
├── popup.js                   # Popup functionality
├── background.js              # Background service worker
├── google-drive-service.js    # Google Drive API integration
├── google-oauth-setup-guide.md # OAuth2 setup instructions
├── test-google-drive.html     # Testing page for Google Drive
└── README.md                  # This file
```

### Key Components
- **Content Script**: Handles multi-platform page interaction and autocomplete
- **Platform Detection**: Automatically identifies and adapts to different AI platforms
- **Options Page**: Manages prompt storage and editing
- **Popup**: Quick access and status display
- **Background Service Worker**: Handles Google Drive operations and message routing
- **Google Drive Service**: Manages OAuth2 authentication and Drive API operations
- **Storage**: Chrome sync storage for cross-device syncing

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve the extension.

## License

This project is open source and available under the MIT License.