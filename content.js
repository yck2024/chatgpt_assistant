// AI Prompt Assistant - Content Script
class PromptAssistant {
  constructor() {
    this.prompts = {};
    this.autocompleteDiv = null;
    this.currentInput = null;
    this.isAutocompleteVisible = false;
    this.selectedIndex = -1;
    this.filteredPrompts = [];
    this.lastSlashPosition = -1;
    this.platform = this.detectPlatform();
    
    this.init();
  }

  detectPlatform() {
    const hostname = window.location.hostname;
    if (hostname.includes('chat.openai.com') || hostname.includes('chatgpt.com')) {
      return 'chatgpt';
    } else if (hostname.includes('claude.ai')) {
      return 'claude';
    } else if (hostname.includes('gemini.google.com') || hostname.includes('aistudio.google.com')) {
      return 'gemini';
    }
    return 'unknown';
  }

  async init() {
    await this.loadPrompts();
    this.setupEventListeners();
    this.injectStyles();
  }

  async loadPrompts() {
    try {
      const result = await new Promise((resolve, reject) => {
        chrome.storage.local.get('chatgpt-prompts', (data) => {
          if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
          else resolve(data['chatgpt-prompts'] || {});
        });
      });
      console.log('[PromptAssistant] loadPrompts result:', result);
      this.prompts = result;
    } catch (error) {
      console.error('Failed to load prompts:', error);
      this.prompts = {};
    }
  }

  setupEventListeners() {
    // Listen for storage changes
    window.addEventListener('storage', async (e) => {
      if (e.key === 'chatgpt-prompts') {
        await this.loadPrompts();
      }
    });

    // Listen for custom events from options page
    window.addEventListener('promptsUpdated', async (e) => {
      await this.loadPrompts();
    });

    // Listen for messages from extension
    try {
      chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
        if (message.action === 'promptsUpdated') {
          await this.loadPrompts();
        }
      });
    } catch (e) {
      // Chrome runtime not available, ignore
    }

    // Set up observers for dynamic content
    this.observeForTextarea();
  }

  observeForTextarea() {
    const observer = new MutationObserver(() => {
      this.attachToTextarea();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Initial attachment
    this.attachToTextarea();
  }

  getPlatformSelectors() {
    switch (this.platform) {
      case 'chatgpt':
        return [
          '#prompt-textarea', // contenteditable div
          'textarea[placeholder*="Message"]',
          'textarea[data-testid="textbox"]',
          'textarea'
        ];
      case 'claude':
        return [
          '[data-testid="composer-input"]',
          '[contenteditable="true"]',
          'textarea[placeholder*="Message"]',
          'textarea[placeholder*="Ask"]',
          'textarea'
        ];
      case 'gemini':
        return [
          '[data-testid="composer-input"]',
          '[contenteditable="true"]',
          'textarea[placeholder*="Message"]',
          'textarea[placeholder*="Ask"]',
          'textarea'
        ];
      default:
        return [
          'textarea[placeholder*="Message"]',
          'textarea[placeholder*="Ask"]',
          '[contenteditable="true"]',
          'textarea'
        ];
    }
  }

  attachToTextarea() {
    const selectors = this.getPlatformSelectors();

    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        if (el && !el.hasAttribute('data-prompt-assistant')) {
          // Additional checks for contenteditable elements
          if (el.isContentEditable || el.tagName === 'TEXTAREA') {
            el.setAttribute('data-prompt-assistant', 'true');
            this.setupTextareaEvents(el);
            console.log(`[PromptAssistant] Attached to ${this.platform} element:`, el);
            break;
          }
        }
      }
    }
  }

  setupTextareaEvents(el) {
    if (el.isContentEditable) {
      el.addEventListener('input', (e) => this.handleInputContentEditable(e));
      el.addEventListener('keydown', (e) => this.handleKeydown(e));
      el.addEventListener('blur', (e) => this.handleBlur(e));
    } else {
      el.addEventListener('input', (e) => this.handleInput(e));
      el.addEventListener('keydown', (e) => this.handleKeydown(e));
      el.addEventListener('blur', (e) => this.handleBlur(e));
    }
  }

  handleInputContentEditable(e) {
    const el = e.target;
    if (!el || typeof el.innerText !== 'string') return;
    const text = el.innerText;
    // Get cursor position in plain text
    let cursorPos = 0;
    const selection = window.getSelection();
    if (selection && selection.anchorNode) {
      // Only works if selection is inside the contenteditable
      if (el.contains(selection.anchorNode)) {
        // Calculate offset from start of text
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(el);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        cursorPos = preCaretRange.toString().length;
      }
    }
    console.log('[PromptAssistant] handleInputContentEditable:', { text, cursorPos, prompts: this.prompts });
    // Find the last double slash before cursor
    const lastDoubleSlash = text.lastIndexOf('//', cursorPos - 1);
    if (lastDoubleSlash !== -1) {
      // Check if there's no space between double slash and cursor
      const afterDoubleSlash = text.substring(lastDoubleSlash + 2, cursorPos);
      console.log('[PromptAssistant] afterDoubleSlash:', afterDoubleSlash);
      if (!afterDoubleSlash.includes(' ') && !afterDoubleSlash.includes('\n')) {
        this.lastSlashPosition = lastDoubleSlash;
        console.log('[PromptAssistant] showAutocomplete with filter:', afterDoubleSlash);
        this.showAutocomplete(el, afterDoubleSlash);
        return;
      }
    }
    this.hideAutocomplete();
  }

  handleInput(e) {
    const textarea = e.target;
    if (!textarea || typeof textarea.value !== 'string') return;
    const text = textarea.value;
    const cursorPos = textarea.selectionStart;

    // Find the last double slash before cursor
    const lastDoubleSlash = text.lastIndexOf('//', cursorPos - 1);
    if (lastDoubleSlash !== -1) {
      // Check if there's no space between double slash and cursor
      const afterDoubleSlash = text.substring(lastDoubleSlash + 2, cursorPos);
      if (!afterDoubleSlash.includes(' ') && !afterDoubleSlash.includes('\n')) {
        this.lastSlashPosition = lastDoubleSlash;
        this.showAutocomplete(textarea, afterDoubleSlash);
        return;
      }
    }
    this.hideAutocomplete();
  }

  handleKeydown(e) {
    if (!this.isAutocompleteVisible) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredPrompts.length - 1);
        this.updateSelection();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        this.updateSelection();
        break;
      case 'Enter':
      case 'Tab':
        if (this.selectedIndex >= 0) {
          e.preventDefault();
          this.insertPrompt(this.filteredPrompts[this.selectedIndex]);
        }
        break;
      case 'Escape':
        this.hideAutocomplete();
        break;
    }
  }

  handleBlur(e) {
    // Delay hiding to allow for click events
    setTimeout(() => this.hideAutocomplete(), 150);
  }

  showAutocomplete(textarea, filter) {
    console.log('[PromptAssistant] showAutocomplete called. Filter:', filter, 'Prompts:', this.prompts);
    this.currentInput = textarea;
    this.filteredPrompts = this.filterPrompts(filter);

    if (this.filteredPrompts.length === 0) {
      this.hideAutocomplete();
      return;
    }

    if (!this.autocompleteDiv) {
      this.createAutocompleteDiv();
    }

    this.updateAutocompleteContent();
    this.positionAutocomplete(textarea);
    this.isAutocompleteVisible = true;
    this.selectedIndex = 0;
    this.updateSelection();
  }

  filterPrompts(filter) {
    const filterLower = filter.toLowerCase();
    return Object.entries(this.prompts)
      .filter(([key]) => key.toLowerCase().includes(filterLower))
      .map(([key, value]) => ({ key, value }));
  }

  createAutocompleteDiv() {
    this.autocompleteDiv = document.createElement('div');
    this.autocompleteDiv.className = 'prompt-autocomplete';
    document.body.appendChild(this.autocompleteDiv);
  }

  updateAutocompleteContent() {
    if (!this.autocompleteDiv) return;

    this.autocompleteDiv.innerHTML = this.filteredPrompts
      .map((prompt, index) => `
        <div class="prompt-item" data-index="${index}">
          <div class="prompt-key">//${prompt.key}</div>
          <div class="prompt-preview">${this.truncateText(prompt.value, 60)}</div>
        </div>
      `).join('');

    // Add click listeners
    this.autocompleteDiv.querySelectorAll('.prompt-item').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.index);
        this.insertPrompt(this.filteredPrompts[index]);
      });
    });
  }

  updateSelection() {
    if (!this.autocompleteDiv) return;

    const items = this.autocompleteDiv.querySelectorAll('.prompt-item');
    items.forEach((item, index) => {
      item.classList.toggle('selected', index === this.selectedIndex);
    });
  }

  positionAutocomplete(textarea) {
    if (!this.autocompleteDiv) return;

    const rect = textarea.getBoundingClientRect();
    this.autocompleteDiv.style.position = 'fixed';
    this.autocompleteDiv.style.left = `${rect.left}px`;
    this.autocompleteDiv.style.top = `${rect.bottom + 5}px`;
    this.autocompleteDiv.style.width = `${Math.max(rect.width, 300)}px`;
    this.autocompleteDiv.style.display = 'block';
  }

  insertPrompt(prompt) {
    if (!this.currentInput) return;
    const el = this.currentInput;
    if (el.isContentEditable) {
      // Contenteditable div logic
      const text = el.innerText;
      // Get cursor position
      let cursorPos = 0;
      const selection = window.getSelection();
      if (selection && selection.anchorNode && el.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(el);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        cursorPos = preCaretRange.toString().length;
      }
      // Replace from double slash to cursor with prompt value
      const newText = text.substring(0, this.lastSlashPosition) + prompt.value + text.substring(cursorPos);
      el.innerText = newText;
      // Set cursor at end of inserted text
      el.focus();
      const newPos = this.lastSlashPosition + prompt.value.length;
      // Move caret to newPos
      const setCaret = (el, pos) => {
        const range = document.createRange();
        const sel = window.getSelection();
        let node = el.firstChild;
        let chars = 0;
        while (node && node.nodeType === 3 && chars + node.length < pos) {
          chars += node.length;
          node = node.nextSibling;
        }
        if (node && node.nodeType === 3) {
          range.setStart(node, pos - chars);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        }
      };
      setCaret(el, newPos);
      // Trigger input event for the platform
      el.dispatchEvent(new Event('input', { bubbles: true }));
      this.hideAutocomplete();
    } else {
      // Fallback to textarea logic
      const textarea = el;
      const text = textarea.value;
      const cursorPos = textarea.selectionStart;
      // Replace from double slash to cursor with prompt value
      const newText = text.substring(0, this.lastSlashPosition) + prompt.value + text.substring(cursorPos);
      textarea.value = newText;
      textarea.focus();
      // Set cursor at end of inserted text
      const newPos = this.lastSlashPosition + prompt.value.length;
      textarea.setSelectionRange(newPos, newPos);
      // Trigger input event for the platform
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      this.hideAutocomplete();
    }
  }

  hideAutocomplete() {
    if (this.autocompleteDiv) {
      this.autocompleteDiv.style.display = 'none';
    }
    this.isAutocompleteVisible = false;
    this.selectedIndex = -1;
    this.currentInput = null;
  }

  truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  injectStyles() {
    if (document.getElementById('prompt-assistant-styles')) return;

    const style = document.createElement('style');
    style.id = 'prompt-assistant-styles';
    style.textContent = `
      .prompt-autocomplete {
        position: fixed;
        background: white;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        max-height: 200px;
        overflow-y: auto;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .prompt-item {
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid #f3f4f6;
      }

      .prompt-item:last-child {
        border-bottom: none;
      }

      .prompt-item:hover,
      .prompt-item.selected {
        background-color: #f3f4f6;
      }

      .prompt-key {
        font-weight: 600;
        color: #374151;
        font-size: 14px;
      }

      .prompt-preview {
        color: #6b7280;
        font-size: 12px;
        margin-top: 2px;
      }

      @media (prefers-color-scheme: dark) {
        .prompt-autocomplete {
          background: #1f2937;
          border-color: #374151;
          color: white;
        }

        .prompt-item {
          border-bottom-color: #374151;
        }

        .prompt-item:hover,
        .prompt-item.selected {
          background-color: #374151;
        }

        .prompt-key {
          color: #f9fafb;
        }

        .prompt-preview {
          color: #9ca3af;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new PromptAssistant());
} else {
  new PromptAssistant();
}