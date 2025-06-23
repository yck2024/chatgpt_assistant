// ChatGPT Prompt Assistant - Popup
document.addEventListener('DOMContentLoaded', () => {
  // Load and display prompt count
  updatePromptCount();

  // Setup event listeners
  document.getElementById('open-options').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });

  document.getElementById('refresh-prompts').addEventListener('click', () => {
    updatePromptCount();
    
    // Briefly show feedback
    const btn = document.getElementById('refresh-prompts');
    const originalText = btn.textContent;
    btn.textContent = 'Refreshed!';
    btn.style.background = '#10b981';
    btn.style.color = 'white';
    
    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
      btn.style.color = '';
    }, 1000);
  });
});

function updatePromptCount() {
  try {
    chrome.storage.local.get('chatgpt-prompts', (data) => {
      const prompts = data['chatgpt-prompts'] || {};
      const count = Object.keys(prompts).length;
      document.getElementById('prompt-count').textContent = count;
    });
  } catch (error) {
    console.error('Failed to load prompts:', error);
    document.getElementById('prompt-count').textContent = '?';
  }
}