// ChatGPT Prompt Assistant - Options Page
class PromptManager {
  constructor() {
    this.prompts = {};
    this.editingKey = null;
    
    this.init();
  }

  async init() {
    await this.loadPrompts();
    this.setupEventListeners();
    this.renderPrompts();
  }

  async loadPrompts() {
    try {
      const result = await new Promise((resolve, reject) => {
        chrome.storage.local.get('chatgpt-prompts', (data) => {
          if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
          else resolve(data['chatgpt-prompts'] || {});
        });
      });
      this.prompts = result;
    } catch (error) {
      this.showError('Failed to load prompts: ' + error.message);
      this.prompts = {};
    }
  }

  async savePrompts() {
    try {
      await new Promise((resolve, reject) => {
        chrome.storage.local.set({'chatgpt-prompts': this.prompts}, () => {
          if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
          else resolve();
        });
      });
      // Dispatch custom event to notify content script
      window.dispatchEvent(new CustomEvent('promptsUpdated'));
      // Also dispatch to other tabs if possible
      try {
        chrome.tabs.query({url: "*://chatgpt.com/*"}, (tabs) => {
          tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {action: 'promptsUpdated'});
          });
        });
        chrome.tabs.query({url: "*://chat.openai.com/*"}, (tabs) => {
          tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {action: 'promptsUpdated'});
          });
        });
      } catch (e) {
        // Ignore if chrome.tabs is not available
      }
    } catch (error) {
      this.showError('Failed to save prompts: ' + error.message);
      throw error;
    }
  }

  setupEventListeners() {
    // Add prompt form
    document.getElementById('add-prompt-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.addPrompt();
    });

    // Export button
    document.getElementById('export-btn').addEventListener('click', () => {
      this.exportPrompts();
    });

    // Import button
    document.getElementById('import-btn').addEventListener('click', () => {
      document.getElementById('import-file-input').click();
    });

    // Import file input
    document.getElementById('import-file-input').addEventListener('change', (e) => {
      this.importPrompts(e);
    });

    // Enter key in key input
    document.getElementById('prompt-key').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('prompt-content').focus();
      }
    });

    // Auto-focus key input
    document.getElementById('prompt-key').focus();

    // Event delegation for Edit/Delete buttons
    document.getElementById('prompts-container').addEventListener('click', (e) => {
      const editBtn = e.target.closest('.btn-secondary');
      const deleteBtn = e.target.closest('.btn-danger');
      if (editBtn && editBtn.dataset.key) {
        this.editPrompt(editBtn.dataset.key);
      } else if (deleteBtn && deleteBtn.dataset.key) {
        this.deletePrompt(deleteBtn.dataset.key);
      }
    });

    // Edit modal event listeners
    document.getElementById('edit-modal').addEventListener('click', (e) => {
      if (e.target.id === 'edit-modal') {
        this.closeEditModal();
      }
    });

    // Edit modal buttons
    const editModal = document.getElementById('edit-modal');
    const cancelBtn = editModal.querySelector('button[onclick="closeEditModal()"]');
    const saveBtn = editModal.querySelector('button[onclick="saveEdit()"]');
    
    if (cancelBtn) {
      cancelBtn.removeAttribute('onclick');
      cancelBtn.addEventListener('click', () => this.closeEditModal());
    }
    
    if (saveBtn) {
      saveBtn.removeAttribute('onclick');
      saveBtn.addEventListener('click', () => this.saveEdit());
    }

    // Handle escape key for edit modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('edit-modal');
        if (modal.style.display !== 'none') {
          this.closeEditModal();
        }
      }
    });
  }

  async addPrompt() {
    const keyInput = document.getElementById('prompt-key');
    const contentInput = document.getElementById('prompt-content');
    
    const key = keyInput.value.trim();
    const content = contentInput.value.trim();

    // Validation
    if (!key) {
      this.showError('Please enter a shortcut key');
      keyInput.focus();
      return;
    }

    if (!content) {
      this.showError('Please enter prompt content');
      contentInput.focus();
      return;
    }

    // Remove leading double slash if present
    const cleanKey = key.startsWith('//') ? key.substring(2) : key;

    // Check for spaces in key
    if (cleanKey.includes(' ')) {
      this.showError('Shortcut key cannot contain spaces');
      keyInput.focus();
      return;
    }

    // Check if key already exists
    if (this.prompts[cleanKey]) {
      this.showError(`Shortcut "//${cleanKey}" already exists. Please choose a different key.`);
      keyInput.focus();
      return;
    }

    try {
      // Add prompt
      this.prompts[cleanKey] = content;
      await this.savePrompts();

      // Clear form
      keyInput.value = '';
      contentInput.value = '';
      keyInput.focus();

      // Update UI
      await this.renderPrompts();
      this.showSuccess(`Prompt "//${cleanKey}" added successfully!`);
    } catch (error) {
      // Error already shown in savePrompts
    }
  }

  async deletePrompt(key) {
    if (!confirm(`Are you sure you want to delete the prompt "//${key}"?`)) {
      return;
    }

    try {
      delete this.prompts[key];
      await this.savePrompts();
      await this.renderPrompts();
      this.showSuccess(`Prompt "//${key}" deleted successfully!`);
    } catch (error) {
      // Error already shown in savePrompts
    }
  }

  editPrompt(key) {
    this.editingKey = key;
    document.getElementById('edit-prompt-key').value = key;
    document.getElementById('edit-prompt-content').value = this.prompts[key];
    document.getElementById('edit-modal').style.display = 'block';
    document.getElementById('edit-prompt-key').focus();
  }

  async saveEdit() {
    const keyInput = document.getElementById('edit-prompt-key');
    const contentInput = document.getElementById('edit-prompt-content');
    
    const newKey = keyInput.value.trim();
    const newContent = contentInput.value.trim();

    // Validation
    if (!newKey) {
      this.showError('Please enter a shortcut key');
      keyInput.focus();
      return;
    }

    if (!newContent) {
      this.showError('Please enter prompt content');
      contentInput.focus();
      return;
    }

    // Remove leading double slash if present
    const cleanKey = newKey.startsWith('//') ? newKey.substring(2) : newKey;

    // Check for spaces in key
    if (cleanKey.includes(' ')) {
      this.showError('Shortcut key cannot contain spaces');
      keyInput.focus();
      return;
    }

    // Check if key already exists (unless it's the same key we're editing)
    if (cleanKey !== this.editingKey && this.prompts[cleanKey]) {
      this.showError(`Shortcut "//${cleanKey}" already exists. Please choose a different key.`);
      keyInput.focus();
      return;
    }

    try {
      // Remove old key if it changed
      if (cleanKey !== this.editingKey) {
        delete this.prompts[this.editingKey];
      }

      // Add/update prompt
      this.prompts[cleanKey] = newContent;
      await this.savePrompts();

      // Close modal and update UI
      this.closeEditModal();
      await this.renderPrompts();
      this.showSuccess(`Prompt "//${cleanKey}" updated successfully!`);
    } catch (error) {
      // Error already shown in savePrompts
    }
  }

  closeEditModal() {
    document.getElementById('edit-modal').style.display = 'none';
    this.editingKey = null;
  }

  renderPrompts() {
    const container = document.getElementById('prompts-container');
    const promptKeys = Object.keys(this.prompts);

    if (promptKeys.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>No prompts yet</h3>
          <p>Add your first prompt above to get started!</p>
        </div>
      `;
      return;
    }

    // Sort prompts alphabetically
    promptKeys.sort();

    container.innerHTML = promptKeys.map(key => `
      <div class="prompt-item">
        <div class="prompt-header">
          <div class="prompt-key">//${key}</div>
          <div class="prompt-actions">
            <button class="btn btn-secondary btn-sm" data-key="${key}">
              Edit
            </button>
            <button class="btn btn-danger btn-sm" data-key="${key}">
              Delete
            </button>
          </div>
        </div>
        <div class="prompt-content">${this.escapeHtml(this.prompts[key])}</div>
      </div>
    `).join('');
  }

  exportPrompts() {
    if (Object.keys(this.prompts).length === 0) {
      this.showError('No prompts to export');
      return;
    }

    try {
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        prompts: this.prompts
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `chatgpt-prompts-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.showSuccess('Prompts exported successfully!');
    } catch (error) {
      this.showError('Failed to export prompts: ' + error.message);
    }
  }

  async importPrompts(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importData = JSON.parse(text);

      // Validate the import data structure
      if (!importData.prompts || typeof importData.prompts !== 'object') {
        throw new Error('Invalid JSON format: missing or invalid prompts object');
      }

      const importedPrompts = importData.prompts;
      const promptKeys = Object.keys(importedPrompts);

      if (promptKeys.length === 0) {
        this.showError('No prompts found in the imported file');
        return;
      }

      // Check for conflicts with existing prompts
      const conflicts = promptKeys.filter(key => this.prompts[key]);
      
      if (conflicts.length > 0) {
        const shouldOverwrite = confirm(
          `The following prompts already exist and will be overwritten:\n${conflicts.map(key => `//${key}`).join(', ')}\n\nDo you want to continue?`
        );
        
        if (!shouldOverwrite) {
          return;
        }
      }

      // Merge imported prompts with existing ones
      Object.assign(this.prompts, importedPrompts);
      
      await this.savePrompts();
      await this.renderPrompts();
      
      this.showSuccess(`Successfully imported ${promptKeys.length} prompt(s)!`);
      
      // Clear the file input
      event.target.value = '';
    } catch (error) {
      this.showError('Failed to import prompts: ' + error.message);
      // Clear the file input on error
      event.target.value = '';
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    const errorDiv = document.getElementById('error-message');
    
    errorDiv.style.display = 'none';
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    
    setTimeout(() => {
      successDiv.style.display = 'none';
    }, 3000);
  }

  showError(message) {
    const successDiv = document.getElementById('success-message');
    const errorDiv = document.getElementById('error-message');
    
    successDiv.style.display = 'none';
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
      errorDiv.style.display = 'none';
    }, 5000);
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  new PromptManager();
});

// Close modal when clicking outside
document.addEventListener('click', (e) => {
  const modal = document.getElementById('edit-modal');
  if (e.target === modal) {
    promptManager.closeEditModal();
  }
});

// Handle escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const modal = document.getElementById('edit-modal');
    if (modal.style.display !== 'none') {
      promptManager.closeEditModal();
    }
  }
});
  