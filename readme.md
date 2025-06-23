# ChatGPT Prompt Assistant

A Chrome extension that adds custom prompt shortcuts to ChatGPT with autocomplete functionality.

## Features

- **Quick Prompt Access**: Type `/` followed by your shortcut to see available prompts
- **Autocomplete**: Filter prompts as you type (e.g., `/r` shows prompts starting with "r")
- **Easy Management**: Add, edit, and delete prompts through a user-friendly interface
- **Keyboard Navigation**: Use arrow keys to navigate and Enter/Tab to select
- **Dark Mode Support**: Automatically adapts to your system's theme

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

## Usage

### Adding Prompts

1. Click the extension icon in your browser toolbar
2. Click "Manage Prompts" to open the settings page
3. Enter a shortcut key (e.g., "reviseEnglish") and the prompt content
4. Click "Add Prompt"

### Using Prompts in ChatGPT

1. Go to ChatGPT (chatgpt.com or chat.openai.com)
2. Click in the message input box
3. Type `/` to see all available prompts
4. Continue typing to filter (e.g., `/rev` to find "reviseEnglish")
5. Use arrow keys to navigate the list
6. Press Enter or Tab to insert the selected prompt

### Managing Prompts

- **Edit**: Click the "Edit" button next to any prompt in the settings
- **Delete**: Click the "Delete" button (with confirmation)
- **View Count**: The popup shows how many prompts you have saved

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

## Technical Details

- **Storage**: Uses Chrome's sync storage to keep prompts across devices
- **Compatibility**: Works with ChatGPT web interface
- **Performance**: Lightweight with minimal impact on page load
- **Privacy**: All data stored locally, no external servers

## Troubleshooting

### Autocomplete Not Showing
- Make sure you're on chatgpt.com or chat.openai.com
- Try refreshing the page
- Check that the extension is enabled in chrome://extensions/

### Prompts Not Saving
- Check Chrome's storage permissions
- Try the "Refresh" button in the popup
- Reload the extension if needed

### Interface Issues
- Clear browser cache and reload ChatGPT
- Make sure you're using a recent version of Chrome
- Check for conflicts with other extensions

## Development

### File Structure
```
├── manifest.json          # Extension manifest
├── content.js             # Main functionality script
├── content.css            # Autocomplete styling
├── options.html           # Settings page
├── options.js             # Settings functionality
├── popup.html             # Extension popup
├── popup.js               # Popup functionality
└── README.md              # This file
```

### Key Components
- **Content Script**: Handles ChatGPT page interaction and autocomplete
- **Options Page**: Manages prompt storage and editing
- **Popup**: Quick access and status display
- **Storage**: Chrome sync storage for cross-device syncing

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve the extension.

## License

This project is open source and available under the MIT License.