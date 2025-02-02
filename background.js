// Constants
const API_ENDPOINT = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-3-sonnet-20240229";
const MAX_TOKENS = 600;

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Background] Meeting Assistant initialized');
});

// Message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'question') {
    handleQuestionAsync(request.question, sendResponse);
    return true; // Keep the message channel open
  }
  
  if (request.type === 'checkApiKey') {
    handleApiKeyCheck(sendResponse);
    return true;
  }
});

// Main question handling function
async function handleQuestionAsync(question, sendResponse) {
  try {
    const answer = await processQuestion(question);
    console.log('[Background] Sending response:', answer);
    sendResponse({ 
      answer,
      status: 'success' 
    });
  } catch (error) {
    console.error('[Background] Error:', error);
    sendResponse({ 
      answer: `Error: ${error.message}`,
      status: 'error'
    });
  }
}

// Process the question through Anthropic API
async function processQuestion(question) {
  const { apiKey } = await chrome.storage.sync.get(['apiKey']);
  
  if (!apiKey) {
    throw new Error('API key not configured. Please set up your API key in the extension settings.');
  }

  try {
    // Make API request
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': true,
        'x-api-key': `${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        messages: [{
          role: "user",
          content: question
        }]
      })
    });

    // Handle non-200 responses
    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Background] API Error:', errorData);
      throw new Error(`API Error: ${errorData.error?.message || `Status ${response.status}`}`);
    }

    // Parse and validate response
    const data = await response.json();
    if (!data.content || !data.content[0] || !data.content[0].text) {
      console.error('[Background] Invalid API response:', data);
      throw new Error('Invalid API response format');
    }

    return data.content[0].text.trim();
  } catch (error) {
    console.error('[Background] Fetch error:', error);
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Network error. Please check your internet connection.');
    }
    throw new Error(`Failed to get response: ${error.message}`);
  }
}

// API key validation
async function handleApiKeyCheck(sendResponse) {
  try {
    const { apiKey } = await chrome.storage.sync.get(['apiKey']);
    if (!apiKey) {
      sendResponse({ valid: false, error: 'API key not configured' });
      return;
    }

    // Make a minimal API call to validate the key
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': true,
        'x-api-key': `${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 10,
        messages: [{
          role: "user",
          content: "test"
        }]
      })
    });

    if (response.ok) {
      sendResponse({ valid: true });
    } else {
      const errorData = await response.json();
      sendResponse({ 
        valid: false, 
        error: errorData.error?.message || 'Invalid API key'
      });
    }
  } catch (error) {
    console.error('[Background] API key validation error:', error);
    sendResponse({ 
      valid: false, 
      error: 'Failed to validate API key'
    });
  }
}

// Error handling utilities
function logError(error, context = '') {
  const timestamp = new Date().toISOString();
  const errorMessage = `[${timestamp}] ${context}: ${error.message}`;
  console.error(errorMessage);
  
  if (error.response) {
    console.error('Response:', error.response);
  }
}

// Listen for tab updates to check if we're on a supported page
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('meet.google.com')) {
    chrome.tabs.sendMessage(tabId, { 
      type: 'PAGE_LOADED',
      url: tab.url
    }).catch(error => {
      // Suppress errors about receiving end not existing
      if (!error.message.includes('receiving end does not exist')) {
        console.error('[Background] Tab update error:', error);
      }
    });
  }
});
