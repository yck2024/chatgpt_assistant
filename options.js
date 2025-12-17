// ChatGPT Prompt Assistant - Options Page
class PromptManager {
  constructor() {
    this.prompts = {};
    this.editingKey = null;
    this.googleDriveStatus = {
      authenticated: false,
      configured: true,
      fileId: null,
      metadata: null,
      filePath: null,
      account: null
    };
    
    this.init();
  }

  async init() {
    await this.loadPrompts();
    this.setupEventListeners();
    this.renderPrompts();
    await this.initGoogleDrive();
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

    // Conflict resolution event listeners
    document.getElementById('conflict-cancel-btn').addEventListener('click', () => {
      this.hideConflictResolutionModal();
    });

    document.getElementById('conflict-resolve-btn').addEventListener('click', () => {
      this.resolveConflicts();
    });

    // Close modal on background click
    document.getElementById('conflict-resolution-modal').addEventListener('click', (e) => {
      if (e.target.id === 'conflict-resolution-modal') {
        this.hideConflictResolutionModal();
      }
    });

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

    // Edit modal buttons - remove onclick attributes and add proper event listeners
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

    // Google Drive event listeners
    document.getElementById('google-drive-auth-btn').addEventListener('click', () => {
      this.handleGoogleDriveAuth();
    });

    document.getElementById('google-drive-upload-btn').addEventListener('click', () => {
      this.handleGoogleDriveUpload();
    });

    document.getElementById('google-drive-download-btn').addEventListener('click', () => {
      this.handleGoogleDriveDownload();
    });

    document.getElementById('google-drive-disconnect-btn').addEventListener('click', () => {
      this.handleGoogleDriveDisconnect();
    });

    document.getElementById('drive-open-link').addEventListener('click', (e) => {
      e.preventDefault();
      const url = e.currentTarget.dataset.url;
      if (url) chrome.tabs.create({ url });
    });

    // Troubleshooting event listeners
    document.getElementById('debug-oauth-btn').addEventListener('click', () => {
      this.openDebugOAuth();
    });

    document.getElementById('test-drive-btn').addEventListener('click', () => {
      this.openTestDrive();
    });

    document.getElementById('debug-oauth2-config-btn').addEventListener('click', () => {
      this.debugOAuth2Config();
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

  formatBytes(bytes) {
    const size = Number(bytes);
    if (!Number.isFinite(size) || size < 0) return 'Unknown';

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = size;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }

    const precision = unitIndex === 0 || value >= 10 ? 0 : 1;
    return `${value.toFixed(precision)} ${units[unitIndex]}`;
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

  // Google Drive Methods
  async initGoogleDrive() {
    try {
      await this.updateGoogleDriveStatus();
    } catch (error) {
      console.error('[Options] Google Drive init error:', error);
    }
  }

  async updateGoogleDriveStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'googleDriveGetStatus' });
      
      if (response.success) {
        this.googleDriveStatus = {
          authenticated: response.authenticated,
          configured: response.configured,
          fileId: response.fileId,
          metadata: response.metadata,
          filePath: response.filePath || null,
          account: response.account || null
        };
        this.updateGoogleDriveUI();
      } else {
        console.error('[Options] Google Drive status error:', response.error);
        this.googleDriveStatus = {
          authenticated: false,
          configured: false,
          fileId: null,
          metadata: null,
          filePath: null,
          account: null
        };
        this.updateGoogleDriveUI();
      }
    } catch (error) {
      console.error('[Options] Google Drive status error:', error);
      this.googleDriveStatus = {
        authenticated: false,
        configured: false,
        fileId: null,
        metadata: null,
        filePath: null,
        account: null
      };
      this.updateGoogleDriveUI();
    }
  }

  updateGoogleDriveUI() {
    const authStatus = document.getElementById('auth-status');
    const statusText = document.getElementById('status-text');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const lastUpdated = document.getElementById('last-updated');
    const driveAccount = document.getElementById('drive-account');
    const drivePath = document.getElementById('drive-path');
    const driveSize = document.getElementById('drive-size');
    const driveOpenLink = document.getElementById('drive-open-link');
    
    const authBtn = document.getElementById('google-drive-auth-btn');
    const uploadBtn = document.getElementById('google-drive-upload-btn');
    const downloadBtn = document.getElementById('google-drive-download-btn');
    const disconnectBtn = document.getElementById('google-drive-disconnect-btn');

    const hideDriveLink = () => {
      driveOpenLink.style.display = 'none';
      driveOpenLink.dataset.url = '';
    };

    if (!this.googleDriveStatus.configured) {
      authStatus.style.background = '#f59e0b';
      statusText.textContent = 'OAuth2 not configured. Please check setup guide.';
      fileInfo.style.display = 'none';
      hideDriveLink();

      authBtn.style.display = 'none';
      uploadBtn.style.display = 'none';
      downloadBtn.style.display = 'none';
      disconnectBtn.style.display = 'none';
      return;
    }

    if (!this.googleDriveStatus.authenticated) {
      authStatus.style.background = '#d1d5db';
      statusText.textContent = 'Not connected to Google Drive';
      fileInfo.style.display = 'none';
      hideDriveLink();

      authBtn.style.display = 'inline-block';
      uploadBtn.style.display = 'none';
      downloadBtn.style.display = 'none';
      disconnectBtn.style.display = 'none';
      return;
    }

    const metadata = this.googleDriveStatus.metadata;
    const account = this.googleDriveStatus.account || metadata?.owners?.[0] || null;
    const accountLabel =
      account?.emailAddress && account?.displayName
        ? `${account.displayName} (${account.emailAddress})`
        : account?.emailAddress || account?.displayName || 'Unknown';

    authStatus.style.background = '#10b981';
    statusText.textContent = account?.emailAddress
      ? `Connected to Google Drive (${account.emailAddress})`
      : 'Connected to Google Drive';

    fileInfo.style.display = 'block';
    driveAccount.textContent = accountLabel;

    const path =
      this.googleDriveStatus.filePath || (metadata?.name ? `My Drive/${metadata.name}` : 'My Drive');
    drivePath.textContent = path;

    if (metadata) {
      fileName.textContent = metadata.name || 'ai-prompt-assistant-prompts.json';
      lastUpdated.textContent = metadata.modifiedTime
        ? new Date(metadata.modifiedTime).toLocaleString()
        : 'Unknown';
      driveSize.textContent = metadata.size != null ? this.formatBytes(metadata.size) : 'Unknown';

      if (metadata.webViewLink) {
        driveOpenLink.style.display = 'inline';
        driveOpenLink.dataset.url = metadata.webViewLink;
      } else {
        hideDriveLink();
      }
    } else {
      fileName.textContent = 'ai-prompt-assistant-prompts.json';
      lastUpdated.textContent = 'Not uploaded yet';
      driveSize.textContent = 'Unknown';
      hideDriveLink();
    }

    authBtn.style.display = 'none';
    uploadBtn.style.display = 'inline-block';
    downloadBtn.style.display = 'inline-block';
    disconnectBtn.style.display = 'inline-block';
  }

  async handleGoogleDriveAuth() {
    try {
      const authBtn = document.getElementById('google-drive-auth-btn');
      authBtn.disabled = true;
      authBtn.textContent = 'Connecting...';

      const response = await chrome.runtime.sendMessage({ action: 'googleDriveAuth' });
      
      if (response.success) {
        await this.updateGoogleDriveStatus();
        this.showSuccess('Successfully connected to Google Drive!');
      } else {
        this.showError('Failed to connect to Google Drive: ' + response.error);
      }
    } catch (error) {
      this.showError('Failed to connect to Google Drive: ' + error.message);
    } finally {
      const authBtn = document.getElementById('google-drive-auth-btn');
      authBtn.disabled = false;
      authBtn.textContent = 'Connect to Google Drive';
    }
  }

  async handleGoogleDriveUpload() {
    try {
      const uploadBtn = document.getElementById('google-drive-upload-btn');
      uploadBtn.disabled = true;
      uploadBtn.textContent = 'Checking for conflicts...';

      const response = await chrome.runtime.sendMessage({ 
        action: 'googleDriveUpload', 
        prompts: this.prompts 
      });
      
      if (response.success) {
        await this.updateGoogleDriveStatus();
        if (response.autoMerged) {
          this.showSuccess('Prompts uploaded successfully! New prompts from Google Drive were automatically merged.');
          // Reload prompts to show merged data
          await this.loadPrompts();
          this.renderPrompts();
        } else {
          this.showSuccess('Prompts uploaded to Google Drive successfully!');
        }
      } else if (response.hasConflicts) {
        // Show conflict resolution modal
        this.showConflictResolutionModal(response.conflicts, response.remotePrompts, response.localPrompts);
      } else {
        this.showError('Failed to upload prompts: ' + response.error);
      }
    } catch (error) {
      this.showError('Failed to upload prompts: ' + error.message);
    } finally {
      const uploadBtn = document.getElementById('google-drive-upload-btn');
      uploadBtn.disabled = false;
      uploadBtn.textContent = 'Upload to Drive';
    }
  }

  async handleGoogleDriveDownload() {
    try {
      const downloadBtn = document.getElementById('google-drive-download-btn');
      downloadBtn.disabled = true;
      downloadBtn.textContent = 'Downloading...';

      const response = await chrome.runtime.sendMessage({ action: 'googleDriveDownload' });
      
      if (response.success) {
        // Check for conflicts with existing prompts
        const downloadedPrompts = response.prompts;
        const promptKeys = Object.keys(downloadedPrompts);
        const conflicts = promptKeys.filter(key => this.prompts[key]);
        
        if (conflicts.length > 0) {
          const shouldOverwrite = confirm(
            `The following prompts already exist and will be overwritten:\n${conflicts.map(key => `//${key}`).join(', ')}\n\nDo you want to continue?`
          );
          
          if (!shouldOverwrite) {
            return;
          }
        }

        // Merge downloaded prompts with existing ones
        Object.assign(this.prompts, downloadedPrompts);
        await this.savePrompts();
        await this.renderPrompts();
        await this.updateGoogleDriveStatus();
        
        this.showSuccess(`Successfully downloaded ${promptKeys.length} prompt(s) from Google Drive!`);
      } else {
        this.showError('Failed to download prompts: ' + response.error);
      }
    } catch (error) {
      this.showError('Failed to download prompts: ' + error.message);
    } finally {
      const downloadBtn = document.getElementById('google-drive-download-btn');
      downloadBtn.disabled = false;
      downloadBtn.textContent = 'Download from Drive';
    }
  }

  async handleGoogleDriveDisconnect() {
    try {
      const shouldDisconnect = confirm(
        'Are you sure you want to disconnect from Google Drive? This will remove the connection but keep your local prompts.'
      );
      
      if (!shouldDisconnect) {
        return;
      }

      const disconnectBtn = document.getElementById('google-drive-disconnect-btn');
      disconnectBtn.disabled = true;
      disconnectBtn.textContent = 'Disconnecting...';

      console.log('[Options] Sending disconnect request...');
      const response = await chrome.runtime.sendMessage({ action: 'googleDriveDisconnect' });
      console.log('[Options] Disconnect response:', response);
      
      if (response.success) {
        this.googleDriveStatus = {
          authenticated: false,
          configured: true,
          fileId: null,
          metadata: null,
          filePath: null,
          account: null
        };
        this.updateGoogleDriveUI();
        this.showSuccess('Successfully disconnected from Google Drive!');
      } else {
        this.showError('Failed to disconnect: ' + response.error);
      }
    } catch (error) {
      console.error('[Options] Disconnect error:', error);
      this.showError('Failed to disconnect: ' + error.message);
    } finally {
      const disconnectBtn = document.getElementById('google-drive-disconnect-btn');
      disconnectBtn.disabled = false;
      disconnectBtn.textContent = 'Disconnect';
    }
  }

  // Open OAuth debug tool
  openDebugOAuth() {
    const url = chrome.runtime.getURL('debug-oauth.html');
    chrome.tabs.create({ url });
  }

  // Open Google Drive test tool
  openTestDrive() {
    const url = chrome.runtime.getURL('test-google-drive.html');
    chrome.tabs.create({ url });
  }

  // Debug OAuth2 configuration
  async debugOAuth2Config() {
    try {
      console.log('[Options] Debugging OAuth2 configuration...');
      const response = await chrome.runtime.sendMessage({ action: 'debugOAuth2Config' });
      console.log('[Options] Debug response:', response);
      
      if (response.success) {
        const message = `
OAuth2 Configuration Debug:
- Service exists: ${response.serviceExists}
- Client ID: ${response.clientId}
- Is configured: ${response.isConfigured}
        `.trim();
        
        this.showSuccess(message);
        console.log('[Options] Debug info:', message);
      } else {
        this.showError('Failed to debug OAuth2 configuration: ' + response.error);
      }
    } catch (error) {
      console.error('[Options] Debug error:', error);
      this.showError('Failed to debug OAuth2 configuration: ' + error.message);
    }
  }

  // Show conflict resolution modal
  showConflictResolutionModal(conflicts, remotePrompts, localPrompts) {
    this.conflictData = {
      conflicts,
      remotePrompts,
      localPrompts,
      resolutions: {}
    };

    const modal = document.getElementById('conflict-resolution-modal');
    const conflictList = document.getElementById('conflict-list');
    
    // Clear previous content
    conflictList.innerHTML = '';
    
    // Render each conflict
    conflicts.modified.forEach((conflict, index) => {
      const conflictElement = this.createConflictElement(conflict, index);
      conflictList.appendChild(conflictElement);
    });

    modal.style.display = 'block';
  }

  // Create conflict element with diff viewer and resolution options
  createConflictElement(conflict, index) {
    const div = document.createElement('div');
    div.className = 'conflict-item';
    div.innerHTML = `
      <div class="conflict-header">
        <div class="conflict-key">Prompt Key: "${conflict.key}"</div>
      </div>
      <div class="conflict-content">
        <div class="conflict-versions">
          <div class="version-section">
            <div class="version-header">
              📱 Your Local Version
            </div>
            <div class="version-content">${this.escapeHtml(conflict.local)}</div>
          </div>
          <div class="version-section">
            <div class="version-header">
              ☁️ Google Drive Version
            </div>
            <div class="version-content">${this.escapeHtml(conflict.remote)}</div>
          </div>
        </div>
        <div class="conflict-resolution">
          <div class="resolution-options">
            <label class="resolution-radio" data-conflict="${index}" data-resolution="local">
              <input type="radio" name="conflict_${index}" value="local" />
              Keep Local Version
            </label>
            <label class="resolution-radio" data-conflict="${index}" data-resolution="remote">
              <input type="radio" name="conflict_${index}" value="remote" />
              Keep Google Drive Version
            </label>
            <label class="resolution-radio" data-conflict="${index}" data-resolution="both">
              <input type="radio" name="conflict_${index}" value="both" />
              Keep Both (rename with suffix)
            </label>
          </div>
        </div>
      </div>
    `;

    // Add event listeners for radio buttons
    div.addEventListener('change', (e) => {
      if (e.target.type === 'radio') {
        const conflictIndex = e.target.closest('.resolution-radio').dataset.conflict;
        const resolution = e.target.closest('.resolution-radio').dataset.resolution;
        this.conflictData.resolutions[conflictIndex] = resolution;
        
        // Update visual selection
        div.querySelectorAll('.resolution-radio').forEach(radio => {
          radio.classList.remove('selected');
        });
        e.target.closest('.resolution-radio').classList.add('selected');
        
        // Enable resolve button if all conflicts have resolutions
        this.updateResolveButtonState();
      }
    });

    return div;
  }

  // Hide conflict resolution modal
  hideConflictResolutionModal() {
    document.getElementById('conflict-resolution-modal').style.display = 'none';
    this.conflictData = null;
  }

  // Update resolve button state based on conflict resolutions
  updateResolveButtonState() {
    const resolveBtn = document.getElementById('conflict-resolve-btn');
    const totalConflicts = this.conflictData.conflicts.modified.length;
    const resolvedConflicts = Object.keys(this.conflictData.resolutions).length;
    
    resolveBtn.disabled = resolvedConflicts < totalConflicts;
  }

  // Resolve conflicts and upload
  async resolveConflicts() {
    try {
      const resolveBtn = document.getElementById('conflict-resolve-btn');
      resolveBtn.disabled = true;
      resolveBtn.textContent = 'Applying Resolution...';

      // Build final prompts based on user choices
      const finalPrompts = { ...this.conflictData.localPrompts };
      
      this.conflictData.conflicts.modified.forEach((conflict, index) => {
        const resolution = this.conflictData.resolutions[index];
        
        switch (resolution) {
          case 'local':
            // Keep local version (already in finalPrompts)
            break;
          case 'remote':
            // Use remote version
            finalPrompts[conflict.key] = conflict.remote;
            break;
          case 'both':
            // Keep both - local stays, add remote with suffix
            const suffix = '_drive';
            let newKey = conflict.key + suffix;
            let counter = 1;
            while (finalPrompts[newKey]) {
              newKey = conflict.key + suffix + '_' + counter;
              counter++;
            }
            finalPrompts[newKey] = conflict.remote;
            break;
        }
      });

      // Add any new prompts from remote that don't conflict
      this.conflictData.conflicts.added.forEach(item => {
        finalPrompts[item.key] = item.content;
      });

      // Force upload the resolved prompts
      const response = await chrome.runtime.sendMessage({
        action: 'googleDriveForceUpload',
        prompts: finalPrompts
      });

      if (response.success) {
        // Update local storage with resolved prompts
        this.prompts = finalPrompts;
        await this.savePrompts();
        this.renderPrompts();
        await this.updateGoogleDriveStatus();
        
        this.hideConflictResolutionModal();
        this.showSuccess('Conflicts resolved and prompts uploaded successfully!');
      } else {
        this.showError('Failed to upload resolved prompts: ' + response.error);
      }
    } catch (error) {
      this.showError('Failed to resolve conflicts: ' + error.message);
    } finally {
      const resolveBtn = document.getElementById('conflict-resolve-btn');
      resolveBtn.disabled = false;
      resolveBtn.textContent = 'Apply Resolution';
    }
  }

  // Escape HTML for safe display
  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  new PromptManager();
}); 
