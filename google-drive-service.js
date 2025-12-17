// Google Drive Service for Chrome Extension
// Handles OAuth2 authentication and Drive API operations

class GoogleDriveService {
  constructor() {
    this.clientId = '811759403062-oilssdj6ou5jdjv9ht4ko2tl384bre09.apps.googleusercontent.com';
    this.scopes = ['https://www.googleapis.com/auth/drive.file'];
    this.fileName = 'ai-prompt-assistant-prompts.json';
    this.fileId = null;
    this.maxPathDepth = 10;
  }

  // Initialize the service and check authentication status
  async init() {
    try {
      await this.loadFileId();
      return await this.isAuthenticated();
    } catch (error) {
      console.error('[GoogleDrive] Init error:', error);
      return false;
    }
  }

  // Check if OAuth2 is properly configured
  isOAuth2Configured() {
    const hasClientId = !!(this.clientId && this.clientId !== 'YOUR_CLIENT_ID.apps.googleusercontent.com');
    console.log('[GoogleDrive] OAuth2 configuration check:', {
      clientId: this.clientId,
      hasClientId: hasClientId,
      isDefaultClientId: this.clientId === 'YOUR_CLIENT_ID.apps.googleusercontent.com'
    });
    return hasClientId;
  }

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      const token = await this.getAuthToken({ interactive: false });
      return !!token;
    } catch (error) {
      // Don't log this as an error since it's expected when user hasn't authenticated yet
      if (error.message.includes('OAuth2 not granted or revoked')) {
        console.log('[GoogleDrive] User not authenticated yet');
      } else {
        console.error('[GoogleDrive] Auth check error:', error);
      }
      return false;
    }
  }

  // Get authentication token
  async getAuthToken({ interactive = false } = {}) {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive }, (token) => {
        if (chrome.runtime.lastError) {
          // Provide more specific error messages
          const errorMessage = chrome.runtime.lastError.message || 'Unknown OAuth2 error';
          if (errorMessage.includes('OAuth2 not granted or revoked')) {
            reject(new Error('OAuth2 not granted or revoked'));
          } else if (errorMessage.includes('invalid_grant')) {
            reject(new Error(`OAuth2 token error (invalid_grant): ${errorMessage}`));
          } else if (errorMessage.includes('Invalid client')) {
            reject(new Error('Invalid OAuth2 client configuration. Please check your client ID.'));
          } else if (errorMessage.includes('Access blocked')) {
            reject(new Error('Access blocked. Please check OAuth consent screen configuration.'));
          } else if (errorMessage.includes('bad client id')) {
            reject(new Error('Bad client id. Please verify your OAuth client and extension ID configuration.'));
          } else {
            reject(new Error(errorMessage));
          }
        } else {
          resolve(token);
        }
      });
    });
  }

  async clearAllCachedAuthTokens() {
    return new Promise((resolve) => {
      if (chrome.identity?.clearAllCachedAuthTokens) {
        chrome.identity.clearAllCachedAuthTokens(() => resolve());
      } else {
        resolve();
      }
    });
  }

  async removeCachedAuthToken(token) {
    if (!token) return;
    return new Promise((resolve) => {
      chrome.identity.removeCachedAuthToken({ token }, () => resolve());
    });
  }

  async revokeToken(token) {
    if (!token) return;
    try {
      await fetch('https://oauth2.googleapis.com/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `token=${encodeURIComponent(token)}`
      });
    } catch (error) {
      console.warn('[GoogleDrive] Failed to revoke token on server:', error);
    }
  }

  isRecoverableAuthError(error) {
    const message = error?.message || '';
    return message.includes('invalid_grant') || message.includes('OAuth2 not granted or revoked');
  }

  // Authenticate user (interactive)
  async authenticate() {
    try {
      await this.clearAllCachedAuthTokens();
      return await this.getAuthToken({ interactive: true });
    } catch (error) {
      if (!this.isRecoverableAuthError(error)) throw error;
      await this.clearAllCachedAuthTokens();
      return await this.getAuthToken({ interactive: true });
    }
  }

  async fetchWithAuth(url, options = {}, { interactive = false, retryOnUnauthorized = true } = {}) {
    const token = await this.getAuthToken({ interactive });

    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (retryOnUnauthorized && response.status === 401) {
      await this.removeCachedAuthToken(token);
      await this.clearAllCachedAuthTokens();

      const retryToken = await this.getAuthToken({ interactive });
      const retryHeaders = new Headers(options.headers || {});
      retryHeaders.set('Authorization', `Bearer ${retryToken}`);

      return fetch(url, {
        ...options,
        headers: retryHeaders
      });
    }

    return response;
  }

  // Remove authentication token
  async removeAuthToken() {
    try {
      const token = await this.getAuthToken({ interactive: false });
      if (token) {
        await this.removeCachedAuthToken(token);
        await this.revokeToken(token);
      }
    } catch (error) {
      if (!this.isRecoverableAuthError(error)) {
        console.warn('[GoogleDrive] Failed to get token for removal:', error.message);
      }
    } finally {
      await this.clearAllCachedAuthTokens();
    }
  }

  // Load file ID from storage
  async loadFileId() {
    return new Promise((resolve, reject) => {
      console.log('[GoogleDrive] Loading file ID from storage...');
      chrome.storage.local.get('googleDriveFileId', (data) => {
        if (chrome.runtime.lastError) {
          console.error('[GoogleDrive] Error loading file ID from storage:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          this.fileId = data.googleDriveFileId || null;
          console.log('[GoogleDrive] Loaded file ID from storage:', this.fileId);
          resolve(this.fileId);
        }
      });
    });
  }

  // Save file ID to storage
  async saveFileId(fileId) {
    console.log('[GoogleDrive] Saving file ID to storage:', fileId);
    this.fileId = fileId;
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ googleDriveFileId: fileId }, () => {
        if (chrome.runtime.lastError) {
          console.error('[GoogleDrive] Error saving file ID to storage:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          console.log('[GoogleDrive] File ID saved to storage successfully');
          resolve();
        }
      });
    });
  }

  // Find existing prompts file or create new one
  async findOrCreateFile() {
    try {
      // First, try to find existing file
      const existingFile = await this.findFile();
      if (existingFile) {
        await this.saveFileId(existingFile.id);
        return existingFile;
      }

      // Create new file if not found
      const newFile = await this.createFile();
      await this.saveFileId(newFile.id);
      return newFile;
    } catch (error) {
      console.error('[GoogleDrive] Find or create file error:', error);
      throw error;
    }
  }

  // Search for existing prompts file
  async findFile() {
    try {
      console.log('[GoogleDrive] Searching for file with name:', this.fileName);
      const query = `name='${this.fileName}' and trashed=false`;
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,modifiedTime)`;

      console.log('[GoogleDrive] Search query:', query);
      console.log('[GoogleDrive] Search URL:', url);

      const response = await this.fetchWithAuth(url, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        console.error('[GoogleDrive] Search request failed:', response.status, response.statusText);
        throw new Error(`Failed to search files: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[GoogleDrive] Search response:', data);
      console.log('[GoogleDrive] Found files count:', data.files ? data.files.length : 0);
      
      if (data.files && data.files.length > 0) {
        console.log('[GoogleDrive] Returning first file:', data.files[0]);
        return data.files[0];
      } else {
        console.log('[GoogleDrive] No files found matching the criteria');
        return null;
      }
    } catch (error) {
      console.error('[GoogleDrive] Error in findFile:', error);
      throw error;
    }
  }

  // Create new prompts file
  async createFile() {
    const url = 'https://www.googleapis.com/drive/v3/files';

    const fileMetadata = {
      name: this.fileName,
      mimeType: 'application/json',
      description: 'AI Prompt Assistant prompts backup'
    };

    const response = await this.fetchWithAuth(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(fileMetadata)
    });

    if (!response.ok) {
      throw new Error(`Failed to create file: ${response.status}`);
    }

    return await response.json();
  }

  // Upload prompts to Google Drive with conflict detection
  async uploadPrompts(prompts) {
    try {
      console.log('[GoogleDrive] Starting upload with conflict detection...');
      
      // Check for conflicts before uploading
      const conflictResult = await this.detectConflicts(prompts);
      
      if (conflictResult.hasConflicts) {
        // Return conflict data for UI to handle
        console.log('[GoogleDrive] Conflicts detected, returning to UI for resolution');
        return {
          success: false,
          hasConflicts: true,
          conflicts: conflictResult.conflicts,
          remotePrompts: conflictResult.remotePrompts,
          localPrompts: prompts
        };
      } else if (conflictResult.canAutoMerge) {
        // Auto-merge safe conflicts and upload
        console.log('[GoogleDrive] Auto-merging safe conflicts...');
        const uploadResult = await this.performUpload(conflictResult.mergedPrompts);
        return {
          success: true,
          autoMerged: true,
          result: uploadResult
        };
      } else {
        // No conflicts, proceed with normal upload
        console.log('[GoogleDrive] No conflicts, proceeding with normal upload');
        const uploadResult = await this.performUpload(prompts);
        return {
          success: true,
          autoMerged: false,
          result: uploadResult
        };
      }
    } catch (error) {
      console.error('[GoogleDrive] Upload error:', error);
      throw error;
    }
  }

  // Perform the actual upload without conflict checking
  async performUpload(prompts) {
    const file = await this.findOrCreateFile();
    
    const content = JSON.stringify({
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      prompts: prompts
    }, null, 2);

    const url = `https://www.googleapis.com/upload/drive/v3/files/${file.id}?uploadType=media`;

    const response = await this.fetchWithAuth(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: content
    });

    if (!response.ok) {
      throw new Error(`Failed to upload prompts: ${response.status}`);
    }

    console.log('[GoogleDrive] Prompts uploaded successfully');
    return await response.json();
  }

  // Force upload without conflict detection (used after user resolves conflicts)
  async forceUpload(prompts) {
    const result = await this.performUpload(prompts);
    return { success: true, result };
  }

  // Detect conflicts between local and remote prompts
  async detectConflicts(localPrompts) {
    try {
      console.log('[GoogleDrive] Checking for conflicts...');
      console.log('[GoogleDrive] Local prompts count:', Object.keys(localPrompts).length);
      
      // Download current version from Drive
      const remoteData = await this.downloadPrompts();
      const remotePrompts = remoteData || {};
      
      console.log('[GoogleDrive] Remote prompts count:', Object.keys(remotePrompts).length);
      
      const conflicts = {
        modified: [],    // Same key, different content - needs user decision
        added: [],       // New in remote - can auto-merge
        deleted: []      // Deleted locally but exists in remote - needs user decision
      };

      const localKeys = Object.keys(localPrompts);
      const remoteKeys = Object.keys(remotePrompts);
      
      console.log('[GoogleDrive] Local keys:', localKeys);
      console.log('[GoogleDrive] Remote keys:', remoteKeys);
      
      // Check for conflicts in existing keys
      for (const key of localKeys) {
        if (remotePrompts[key]) {
          if (localPrompts[key] !== remotePrompts[key]) {
            // Same key, different content - conflict!
            console.log(`[GoogleDrive] Conflict detected for key: ${key}`);
            conflicts.modified.push({
              key,
              local: localPrompts[key],
              remote: remotePrompts[key]
            });
          }
        }
      }
      
      // Check for new prompts added remotely
      for (const key of remoteKeys) {
        if (!localPrompts[key]) {
          console.log(`[GoogleDrive] New remote prompt found: ${key}`);
          conflicts.added.push({
            key,
            content: remotePrompts[key]
          });
        }
      }

      const hasConflicts = conflicts.modified.length > 0;
      const canAutoMerge = conflicts.added.length > 0 && conflicts.modified.length === 0;
      
      console.log('[GoogleDrive] Conflict detection results:', {
        hasConflicts,
        canAutoMerge,
        modifiedCount: conflicts.modified.length,
        addedCount: conflicts.added.length
      });
      
      let mergedPrompts = null;
      if (canAutoMerge) {
        // Auto-merge: combine local prompts with new remote prompts
        mergedPrompts = { ...localPrompts };
        conflicts.added.forEach(item => {
          mergedPrompts[item.key] = item.content;
        });
        console.log('[GoogleDrive] Auto-merge prepared, merged prompts count:', Object.keys(mergedPrompts).length);
      }

      return {
        hasConflicts,
        canAutoMerge,
        conflicts,
        remotePrompts,
        mergedPrompts
      };
      
    } catch (error) {
      // If we can't download (e.g., no file exists), no conflicts
      console.log('[GoogleDrive] No remote file or download failed, proceeding without conflict check:', error.message);
      return {
        hasConflicts: false,
        canAutoMerge: false,
        conflicts: { modified: [], added: [], deleted: [] },
        remotePrompts: {},
        mergedPrompts: null
      };
    }
  }

  // Download prompts from Google Drive
  async downloadPrompts() {
    try {
      console.log('[GoogleDrive] Starting download process...');
      console.log('[GoogleDrive] Current fileId:', this.fileId);
      
      if (!this.fileId) {
        console.log('[GoogleDrive] No fileId in memory, loading from storage...');
        await this.loadFileId();
        console.log('[GoogleDrive] FileId after loading from storage:', this.fileId);
      }

      // If no file ID is stored locally, try to find an existing file on Google Drive
      if (!this.fileId) {
        console.log('[GoogleDrive] No local file ID found, searching for existing file...');
        try {
          const existingFile = await this.findFile();
          console.log('[GoogleDrive] Search result:', existingFile);
          if (existingFile) {
            await this.saveFileId(existingFile.id);
            this.fileId = existingFile.id;
            console.log('[GoogleDrive] Found existing file, saved file ID:', existingFile.id);
          } else {
            console.log('[GoogleDrive] No existing file found on Google Drive');
            throw new Error('No prompts file found on Google Drive. Please upload your prompts first.');
          }
        } catch (searchError) {
          console.error('[GoogleDrive] Error searching for existing file:', searchError);
          throw new Error(`Failed to search for existing file: ${searchError.message}`);
        }
      }

      console.log('[GoogleDrive] Using fileId for download:', this.fileId);
      const url = `https://www.googleapis.com/drive/v3/files/${this.fileId}?alt=media`;

      console.log('[GoogleDrive] Downloading from URL:', url);
      const response = await this.fetchWithAuth(url, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('[GoogleDrive] File not found (404), removing stored file ID and searching again...');
          // File not found, remove stored file ID and try to find another file
          await this.saveFileId(null);
          this.fileId = null;
          console.log('[GoogleDrive] Stored file ID not found, searching for existing file...');
          const existingFile = await this.findFile();
          if (existingFile) {
            await this.saveFileId(existingFile.id);
            this.fileId = existingFile.id;
            console.log('[GoogleDrive] Found existing file, retrying download with new file ID:', existingFile.id);
            // Retry download with new file ID
            return this.downloadPrompts();
          } else {
            console.log('[GoogleDrive] No existing file found after 404 error');
            throw new Error('No prompts file found on Google Drive. Please upload your prompts first.');
          }
        }
        throw new Error(`Failed to download prompts: ${response.status} ${response.statusText}`);
      }

      const raw = await response.text();
      if (!raw.trim()) {
        console.log('[GoogleDrive] Drive file is empty, returning empty prompts');
        return {};
      }

      let data;
      try {
        data = JSON.parse(raw);
      } catch (parseError) {
        throw new Error('Prompts file contains invalid JSON. Try uploading again to re-create it.');
      }

      console.log('[GoogleDrive] Prompts downloaded successfully');
      if (!data || typeof data !== 'object' || Array.isArray(data)) return {};

      if ('prompts' in data) {
        return data.prompts && typeof data.prompts === 'object' && !Array.isArray(data.prompts)
          ? data.prompts
          : {};
      }

      if ('version' in data || 'lastUpdated' in data) return {};
      return data;
    } catch (error) {
      console.error('[GoogleDrive] Download error:', error);
      throw error;
    }
  }

  // Get file metadata
  async getFileMetadata() {
    try {
      if (!this.fileId) {
        await this.loadFileId();
      }

      // If no file ID is stored locally, try to find an existing file on Google Drive
      if (!this.fileId) {
        console.log('[GoogleDrive] No local file ID found, searching for existing file...');
        const existingFile = await this.findFile();
        if (existingFile) {
          await this.saveFileId(existingFile.id);
          console.log('[GoogleDrive] Found existing file, saved file ID:', existingFile.id);
        } else {
          return null; // No file found, return null instead of throwing error
        }
      }

      const url = `https://www.googleapis.com/drive/v3/files/${this.fileId}?fields=id,name,modifiedTime,size,parents,webViewLink,owners(displayName,emailAddress)`;

      const response = await this.fetchWithAuth(url, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        if (response.status === 404) {
          // File not found, remove stored file ID and try to find another file
          await this.saveFileId(null);
          console.log('[GoogleDrive] Stored file ID not found, searching for existing file...');
          const existingFile = await this.findFile();
          if (existingFile) {
            await this.saveFileId(existingFile.id);
            // Retry metadata fetch with new file ID
            return this.getFileMetadata();
          } else {
            return null; // No file found, return null instead of throwing error
          }
        }
        throw new Error(`Failed to get metadata: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[GoogleDrive] Metadata error:', error);
      throw error;
    }
  }

  async getFilePath(metadataOverride = null) {
    const metadata = metadataOverride || (await this.getFileMetadata());
    if (!metadata) return null;

    const fileName = metadata.name || this.fileName;
    const parents = metadata.parents || [];
    const folderNames = [];

    let currentParentId = parents[0] || 'root';
    while (
      currentParentId &&
      currentParentId !== 'root' &&
      folderNames.length < this.maxPathDepth
    ) {
      const url = `https://www.googleapis.com/drive/v3/files/${currentParentId}?fields=id,name,parents`;
      const response = await this.fetchWithAuth(url, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) break;

      const folder = await response.json();
      folderNames.push(folder.name || currentParentId);
      currentParentId = folder.parents?.[0] || 'root';
    }

    const parts = ['My Drive', ...folderNames.reverse(), fileName].filter(Boolean);
    return parts.join('/');
  }

  // Delete the prompts file
  async deleteFile() {
    try {
      if (!this.fileId) {
        await this.loadFileId();
      }

      if (!this.fileId) {
        return;
      }

      const url = `https://www.googleapis.com/drive/v3/files/${this.fileId}`;

      const response = await this.fetchWithAuth(url, { method: 'DELETE' });

      if (!response.ok && response.status !== 404) {
        throw new Error(`Failed to delete file: ${response.status}`);
      }

      await this.saveFileId(null);
      console.log('[GoogleDrive] File deleted successfully');
    } catch (error) {
      console.error('[GoogleDrive] Delete error:', error);
      throw error;
    }
  }

  // Handle token refresh
  async refreshToken() {
    try {
      await this.removeAuthToken();
      const newToken = await this.authenticate();
      return newToken;
    } catch (error) {
      console.error('[GoogleDrive] Token refresh error:', error);
      throw error;
    }
  }

  // Clear all authentication and file data
  async clearAllData() {
    try {
      console.log('[GoogleDrive] Clearing all authentication and file data...');
      await this.removeAuthToken();
      await this.saveFileId(null);
      this.fileId = null;
      console.log('[GoogleDrive] All data cleared successfully');
    } catch (error) {
      console.error('[GoogleDrive] Error clearing data:', error);
      throw error;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GoogleDriveService;
} 
