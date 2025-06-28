// AI Prompt Assistant - Background Script
// Handles extension installation and automatic sample prompt import

// Handle extension installation or update
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install' || details.reason === 'update') {
    console.log(`[PromptAssistant] Extension ${details.reason}ed, importing and merging sample prompts...`);
    await importAndMergeSamplePrompts(details.reason);
    chrome.runtime.openOptionsPage();
  }
});

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