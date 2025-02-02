document.addEventListener('DOMContentLoaded', initOptions);

async function initOptions() {
  const { apiKey } = await chrome.storage.sync.get(['apiKey']);
  document.getElementById('apiKey').value = apiKey || '';
  document.getElementById('save').addEventListener('click', saveSettings);
}

async function saveSettings() {
  const apiKey = document.getElementById('apiKey').value.trim();
  const status = document.getElementById('status');
  
  try {
    if (!apiKey) throw new Error('API key is required');
    
    // Test the API key before saving
    const isValid = await testApiKey(apiKey);
    if (!isValid) {
      throw new Error('Invalid API key. Please check your key and try again.');
    }
    
    await chrome.storage.sync.set({ apiKey });
    showStatus('Settings saved successfully!', 'success');
  } catch (error) {
    showStatus(error.message, 'error');
  }
}

async function testApiKey(apiKey) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': true,
        'x-api-key': `${apiKey}`, // Fixed: Use Bearer token
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 10,
        messages: [{
          role: "user",
          content: "test"
        }]
      })
    });
    
    if (!response.ok) {
      const data = await response.json();
      console.error('API Error:', data);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Test API Key Error:', error);
    return false;
  }
}

function showStatus(message, type = 'info') {
  const status = document.getElementById('status');
  status.className = `status-message ${type}`;
  status.textContent = message;
  status.style.display = 'block';
  
  setTimeout(() => {
    status.style.display = 'none';
  }, 3000);
}
