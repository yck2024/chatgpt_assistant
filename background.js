// AI Prompt Assistant - Background Script
// Handles extension installation and automatic sample prompt import

// Import Google Drive service
importScripts('google-drive-service.js');

// Initialize Google Drive service
let googleDriveService = new GoogleDriveService();

// Handle extension installation or update
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install' || details.reason === 'update') {
    console.log(`[PromptAssistant] Extension ${details.reason}ed, importing and merging sample prompts...`);
    await importAndMergeSamplePrompts(details.reason);
    chrome.runtime.openOptionsPage();
  }
});

// Handle messages from content scripts and options page
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'googleDriveAuth') {
    handleGoogleDriveAuth().then(sendResponse).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'googleDriveUpload') {
    handleGoogleDriveUpload(request.prompts).then(sendResponse).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
  
  if (request.action === 'googleDriveForceUpload') {
    handleGoogleDriveForceUpload(request.prompts).then(sendResponse).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
  
  if (request.action === 'googleDriveDownload') {
    handleGoogleDriveDownload().then(sendResponse).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
  
  if (request.action === 'googleDriveGetStatus') {
    handleGoogleDriveStatus().then(sendResponse).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
  
  if (request.action === 'googleDriveDisconnect') {
    handleGoogleDriveDisconnect().then(sendResponse).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
  
  if (request.action === 'debugOAuth2Config') {
    console.log('[Background] Debug OAuth2 configuration...');
    console.log('[Background] GoogleDriveService instance:', googleDriveService);
    console.log('[Background] Client ID:', googleDriveService?.clientId);
    console.log('[Background] Is configured:', googleDriveService?.isOAuth2Configured());
    sendResponse({ 
      success: true, 
      clientId: googleDriveService?.clientId,
      isConfigured: googleDriveService?.isOAuth2Configured(),
      serviceExists: !!googleDriveService
    });
    return true;
  }
});

// Handle Google Drive authentication
async function handleGoogleDriveAuth() {
  try {
    console.log('[Background] Starting Google Drive authentication...');
    console.log('[Background] GoogleDriveService instance:', googleDriveService);
    console.log('[Background] Client ID:', googleDriveService.clientId);
    
    // Check if OAuth2 is properly configured
    const isConfigured = googleDriveService.isOAuth2Configured();
    console.log('[Background] OAuth2 configured:', isConfigured);
    
    if (!isConfigured) {
      return { 
        success: false, 
        error: 'OAuth2 not configured. Please check your client ID in google-drive-service.js and manifest.json' 
      };
    }

    await googleDriveService.init();
    const isAuth = await googleDriveService.isAuthenticated();
    
    if (!isAuth) {
      await googleDriveService.authenticate();
    }
    
    return { success: true, authenticated: true };
  } catch (error) {
    console.error('[Background] Google Drive auth error:', error);
    return { success: false, error: error.message };
  }
}

// Handle Google Drive upload with conflict detection
async function handleGoogleDriveUpload(prompts) {
  try {
    // Check if OAuth2 is properly configured
    if (!googleDriveService.isOAuth2Configured()) {
      return { 
        success: false, 
        error: 'OAuth2 not configured. Please check your client ID in google-drive-service.js and manifest.json' 
      };
    }

    await googleDriveService.init();
    const isAuth = await googleDriveService.isAuthenticated();
    
    if (!isAuth) {
      throw new Error('Not authenticated. Please authenticate first.');
    }
    
    const uploadResult = await googleDriveService.uploadPrompts(prompts);
    
    // Handle conflict detection results
    if (!uploadResult.success && uploadResult.hasConflicts) {
      console.log('[Background] Conflicts detected, sending to UI for resolution');
      return { 
        success: false, 
        hasConflicts: true,
        conflicts: uploadResult.conflicts,
        remotePrompts: uploadResult.remotePrompts,
        localPrompts: uploadResult.localPrompts
      };
    }
    
    if (uploadResult.success) {
      return { 
        success: true, 
        autoMerged: uploadResult.autoMerged || false 
      };
    }
    
    // Fallback for unexpected response
    throw new Error('Unexpected upload result structure');
  } catch (error) {
    console.error('[Background] Google Drive upload error:', error);
    return { success: false, error: error.message };
  }
}

// Handle force upload after conflict resolution
async function handleGoogleDriveForceUpload(prompts) {
  try {
    // Check if OAuth2 is properly configured
    if (!googleDriveService.isOAuth2Configured()) {
      return { 
        success: false, 
        error: 'OAuth2 not configured. Please check your client ID in google-drive-service.js and manifest.json' 
      };
    }

    await googleDriveService.init();
    const isAuth = await googleDriveService.isAuthenticated();
    
    if (!isAuth) {
      throw new Error('Not authenticated. Please authenticate first.');
    }
    
    await googleDriveService.forceUpload(prompts);
    return { success: true };
  } catch (error) {
    console.error('[Background] Google Drive force upload error:', error);
    return { success: false, error: error.message };
  }
}

// Handle Google Drive download
async function handleGoogleDriveDownload() {
  try {
    console.log('[Background] Starting Google Drive download...');
    
    // Check if OAuth2 is properly configured
    if (!googleDriveService.isOAuth2Configured()) {
      console.log('[Background] OAuth2 not configured');
      return { 
        success: false, 
        error: 'OAuth2 not configured. Please check your client ID in google-drive-service.js and manifest.json' 
      };
    }

    console.log('[Background] OAuth2 is configured, initializing service...');
    await googleDriveService.init();
    console.log('[Background] Service initialized');
    
    const isAuth = await googleDriveService.isAuthenticated();
    console.log('[Background] Authentication status:', isAuth);
    
    if (!isAuth) {
      throw new Error('Not authenticated. Please authenticate first.');
    }
    
    console.log('[Background] Authenticated, downloading prompts...');
    const prompts = await googleDriveService.downloadPrompts();
    console.log('[Background] Download completed successfully');
    return { success: true, prompts };
  } catch (error) {
    console.error('[Background] Google Drive download error:', error);
    return { success: false, error: error.message };
  }
}

// Handle Google Drive status check
async function handleGoogleDriveStatus() {
  try {
    // Check if OAuth2 is properly configured
    if (!googleDriveService.isOAuth2Configured()) {
      return { 
        success: true, 
        authenticated: false, 
        configured: false,
        fileId: null 
      };
    }

    await googleDriveService.init();
    const isAuth = await googleDriveService.isAuthenticated();
    
    if (!isAuth) {
      return { success: true, authenticated: false, configured: true, fileId: null };
    }
    
    const metadata = await googleDriveService.getFileMetadata();
    return { 
      success: true, 
      authenticated: true, 
      configured: true,
      fileId: googleDriveService.fileId,
      metadata 
    };
  } catch (error) {
    console.error('[Background] Google Drive status error:', error);
    return { success: false, error: error.message };
  }
}

// Handle Google Drive disconnect
async function handleGoogleDriveDisconnect() {
  try {
    console.log('[Background] Starting Google Drive disconnect process...');
    console.log('[Background] Current GoogleDriveService instance:', googleDriveService);
    console.log('[Background] Current client ID:', googleDriveService?.clientId);
    
    // Initialize the service if not already done
    if (!googleDriveService) {
      console.log('[Background] Creating new GoogleDriveService instance...');
      googleDriveService = new GoogleDriveService();
    }
    
    await googleDriveService.init();
    console.log('[Background] GoogleDriveService initialized');
    console.log('[Background] Client ID after init:', googleDriveService.clientId);
    
    // Check authentication status before disconnect
    const wasAuthenticated = await googleDriveService.isAuthenticated();
    console.log('[Background] Authentication status before disconnect:', wasAuthenticated);
    
    // Clear all authentication and file data
    await googleDriveService.clearAllData();
    console.log('[Background] All data cleared');
    console.log('[Background] Client ID after clear:', googleDriveService.clientId);
    
    // Verify disconnect worked
    const isAuthenticated = await googleDriveService.isAuthenticated();
    console.log('[Background] Authentication status after disconnect:', isAuthenticated);
    
    console.log('[Background] Google Drive disconnected successfully');
    return { success: true, wasAuthenticated, isAuthenticated };
  } catch (error) {
    console.error('[Background] Google Drive disconnect error:', error);
    return { success: false, error: error.message };
  }
}

// Import and merge sample prompts
async function importAndMergeSamplePrompts(reason) {
  let samplePrompts;
  try {
    // Fetch sample prompts from the JSON file
    const response = await fetch(chrome.runtime.getURL('sample-prompts.json'));
    if (!response.ok) {
      throw new Error(`Failed to fetch sample prompts: ${response.status}`);
    }
    const importData = await response.json();
    
    // Validate the import data structure
    if (!importData.prompts || typeof importData.prompts !== 'object') {
      throw new Error('Invalid sample prompts format: missing or invalid prompts object');
    }
    samplePrompts = importData.prompts;
  } catch (error) {
    console.error('[PromptAssistant] Failed to fetch sample prompts, using fallback:', error);
    // Fallback to hardcoded sample prompts
    samplePrompts = {
      "reviseEnglish": "Please revise the following text to improve its English grammar, clarity, and flow while maintaining the original meaning:",
      "summarize": "Please provide a concise summary of the following text, highlighting the key points and main ideas:",
      "explain": "Please explain the following concept in simple terms that a beginner would understand:",
      "translate": "Please translate the following text to English, maintaining the original tone and meaning:",
      "codeReview": "Please review the following code for best practices, potential bugs, and suggestions for improvement:"
    };
  }

  if (!samplePrompts || Object.keys(samplePrompts).length === 0) {
    console.log('[PromptAssistant] No sample prompts to import.');
    return;
  }

  try {
    // Get existing prompts from storage
    const existingPrompts = await new Promise((resolve, reject) => {
      chrome.storage.local.get('chatgpt-prompts', (data) => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve(data['chatgpt-prompts'] || {});
      });
    });

    // Merge sample prompts with existing prompts (existing prompts take precedence)
    const mergedPrompts = { ...samplePrompts, ...existingPrompts };

    // Save the merged prompts back to storage
    await new Promise((resolve, reject) => {
      chrome.storage.local.set({ 'chatgpt-prompts': mergedPrompts }, () => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve();
      });
    });

    console.log('[PromptAssistant] Prompts successfully imported and merged.');

    // Show a notification to the user on first install
    if (reason === 'install') {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'AI Prompt Assistant',
        message: 'Sample prompts have been imported! Open the extension options to customize them.'
      });
    }
  } catch (error) {
    console.error('[PromptAssistant] Failed to merge and save prompts:', error);
  }
}