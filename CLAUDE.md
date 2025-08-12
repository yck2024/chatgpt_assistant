# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Version Control Guidelines - MUST DO! MUST DO!
- Always use Git for version control when coding in this repository.
- After every major change, Claude should:
  1. Run `git add .`
  2. Create a clear, descriptive commit message using `git commit -m "<message>"`.
- This ensures a safety net for reverting to previous states if something breaks.


# Role Instructions
- You are a senior developer and a patient coding teacher.
- Always explain concepts before providing code solutions.
- Ask me guiding questions rather than simply giving answers.
- Use real-world analogies and encourage my input or reasoning.
- Provide coding challenges and review my solutions constructively.
- Give feedback on code style, readability, and improvement tips.

# Teaching Workflow
- Start each session by asking what topic or skill I want to learn.
- Suggest small exercises or problems to practice the topic.
- Wait for my solution, then review and suggest improvements.
- Share deeper insights or related best practices if I succeed.

# Workflow - MUST DO!
- Before working, always enter a 'plan mode'. Make a detailed plan and save it to /.CLAUDE/tasks/[task_name].md. Update the plan with your progress as you work.



## Project Overview

This is a Chrome Extension (Manifest V3) called "AI Prompt Assistant" that adds custom prompt shortcuts to ChatGPT, Claude, Gemini, and DuckDuckGo with autocomplete functionality. Users can type `//` followed by a shortcut to insert pre-defined prompts.

## Architecture

### Core Components

- **Content Script** (`content.js`): Main functionality that injects into AI platforms, handles autocomplete UI, and manages user interactions. Uses platform detection to adapt to different AI websites.
- **Background Service Worker** (`background.js`): Handles Google Drive operations, extension installation/updates, and message routing between components. Automatically imports sample prompts on first install.
- **Options Page** (`options.html/js`): Full-featured management interface for creating, editing, importing/exporting prompts, and managing Google Drive sync.
- **Popup** (`popup.html/js`): Simple interface showing prompt count with quick access to options and refresh functionality.
- **Google Drive Service** (`google-drive-service.js`): Handles OAuth2 authentication and Drive API operations for cross-device sync.

### Platform Support

The extension detects and adapts to different AI platforms:
- ChatGPT (chatgpt.com, chat.openai.com) 
- Claude (claude.ai)
- Gemini (gemini.google.com, aistudio.google.com)
- DuckDuckGo (duckduckgo.com)

Platform-specific selectors are used to identify input elements on each site.

### Data Storage

- Prompts stored in Chrome's local storage under key `'chatgpt-prompts'`
- Google Drive integration for backup/sync using OAuth2
- Sample prompts automatically imported from `sample-prompts.json` on install

## Development Guidelines

### Testing Google Drive Integration

Never open test HTML files directly in browser - they must be accessed through extension context:
- Use "OAuth Debug Tool" button in options page for OAuth2 testing
- Use "Google Drive Test" button for full integration testing
- See `how-to-test-google-drive.md` for detailed instructions

### Key File Relationships

- `manifest.json` defines permissions, OAuth2 config, and content script matches
- `background.js` imports `google-drive-service.js` and handles all Drive operations
- `content.js` creates autocomplete UI dynamically and attaches to platform-specific input elements
- Storage operations use Chrome APIs consistently across all components

### Platform-Specific Considerations

Each AI platform has different DOM structures and input handling:
- ChatGPT: Supports both contenteditable divs and textareas
- Claude: Uses specific interface elements  
- Gemini: Has unique input system
- Content script adapts behavior based on detected platform

### OAuth2 Configuration

The extension uses OAuth2 for Google Drive access:
- Client ID configured in both `manifest.json` and `google-drive-service.js`
- Scopes limited to `drive.file` for security
- All OAuth2 operations handled through background script

## Common File Locations

- Extension manifest: `manifest.json`
- Main functionality: `content.js`, `background.js`
- UI components: `options.html/js`, `popup.html/js`  
- Drive integration: `google-drive-service.js`
- Sample data: `sample-prompts.json`, `myPrompts.json`
- Documentation: Multiple `.md` files for setup and troubleshooting
- Test files: `test-google-drive.html/js`, `debug-oauth.html/js`