// ChatGPT Prompt Assistant - Content Script
class PromptAssistant {
  constructor() {
    this.prompts = {};
    this.autocompleteDiv = null;
    this.currentInput = null;
    this.isAutocompleteVisible = false;
    this.selectedIndex = -1;
    this.filteredPrompts = [];
    this.lastSlashPosition = -1;
    
    this.init();
  }

  async init() {
    this.loadPrompts();
    this.setupEventListeners();
    this.injectStyles();
  }

  loadPrompts() {
    try {
      const stored = localStorage.getItem('chatgpt-prompts');
      this.prompts = stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load prompts:', error);
      this.prompts = {};
    }
  }

  setupEventListeners() {
    // Listen for storage changes
    window.addEventListener('storage', (e) => {
      if (e.key === 'chatgpt-prompts') {
        this.prompts = e.newValue ? JSON.parse(e.newValue) : {};
      }
    });

    // Listen for custom events from options page
    window.addEventListener('promptsUpdated', (e) => {
      this.loadPrompts();
    });

    // Listen for messages from extension
    try {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'promptsUpdated') {
          this.loadPrompts();
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

  attachToTextarea() {
    // ChatGPT textarea selectors (may need updates as ChatGPT UI changes)
    const selectors = [
      'textarea[placeholder*="Message"]',
      'textarea[data-testid="textbox"]',
      '#prompt-textarea',
      'textarea'
    ];

    for (const selector of selectors) {
      const textarea = document.querySelector(selector);
      if (textarea && !textarea.hasAttribute('data-prompt-assistant')) {
        textarea.setAttribute('data-prompt-assistant', 'true');
        this.setupTextareaEvents(textarea);
        break;
      }
    }
  }

  setupTextareaEvents(textarea) {
    textarea.addEventListener('input', (e) => this.handleInput(e));
    textarea.addEventListener('keydown', (e) => this.handleKeydown(e));
    textarea.addEventListener('blur', (e) => this.handleBlur(e));
  }

  handleInput(e) {
    const textarea = e.target;
    const text = textarea.value;
    const cursorPos = textarea.selectionStart;

    // Find the last slash before cursor
    const lastSlash = text.lastIndexOf('/', cursorPos - 1);
    
    if (lastSlash !== -1) {
      // Check if there's no space between slash and cursor
      const afterSlash = text.substring(lastSlash + 1, cursorPos);
      if (!afterSlash.includes(' ') && !afterSlash.includes('\n')) {
        this.lastSlashPosition = lastSlash;
        this.showAutocomplete(textarea, afterSlash);
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
          <div class="prompt-key">/${prompt.key}</div>
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

    const textarea = this.currentInput;
    const text = textarea.value;
    const cursorPos = textarea.selectionStart;

    // Replace from slash to cursor with prompt value
    const newText = text.substring(0, this.lastSlashPosition) + prompt.value + text.substring(cursorPos);
    
    textarea.value = newText;
    textarea.focus();
    
    // Set cursor at end of inserted text
    const newPos = this.lastSlashPosition + prompt.value.length;
    textarea.setSelectionRange(newPos, newPos);

    // Trigger input event for ChatGPT
    textarea.dispatchEvent(new Event('input', { bubbles: true }));

    this.hideAutocomplete();
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