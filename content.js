// State management
let lastCaption = '';
let captionBuffer = '';
const answerQueue = [];
let isProcessing = false;
const DEBUG_MODE = true; // Set to false in production

// Constants
const PAUSE_THRESHOLD = 2000; // Time to wait for more caption text
const ANSWER_DISPLAY_TIME = 30000; // 30 seconds
const DEBOUNCE_TIME = 750; // 750ms for caption checking
let captionTimeout;

// Create UI elements
const logDiv = createLogDiv();
const answerDiv = createAnswerDiv();

// Logging System
function log(message, type = 'info') {
  if (!DEBUG_MODE && type === 'debug') return;
  
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = document.createElement('div');
  logEntry.textContent = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
  logEntry.style.color = type === 'error' ? '#ff4444' : '#44ff44';
  
  if (DEBUG_MODE && logDiv) {
    logDiv.style.display = 'block';
    logDiv.prepend(logEntry);
    if (logDiv.children.length > 20) logDiv.removeChild(logDiv.lastChild);
  }
  
  console.log(`[MeetingAssistant] ${message}`);
}

// UI Creation
function createAnswerDiv() {
  const div = document.createElement('div');
  div.id = 'meeting-assistant-answers';
  div.style.position = 'fixed';
  div.style.bottom = '20px';
  div.style.right = '20px';
  div.style.backgroundColor = 'white';
  div.style.padding = '10px';
  div.style.borderRadius = '5px';
  div.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  div.style.zIndex = '9999';
  div.style.maxWidth = '400px';
  div.style.maxHeight = '60vh';
  div.style.overflowY = 'auto';
  div.style.display = 'none';
  document.body.appendChild(div);
  return div;
}

function createLogDiv() {
  const div = document.createElement('div');
  div.id = 'meeting-assistant-logs';
  div.style.position = 'fixed';
  div.style.top = '20px';
  div.style.right = '20px';
  div.style.backgroundColor = 'rgba(0,0,0,0.7)';
  div.style.color = 'white';
  div.style.padding = '10px';
  div.style.borderRadius = '5px';
  div.style.zIndex = '9999';
  div.style.maxWidth = '400px';
  div.style.maxHeight = '40vh';
  div.style.overflowY = 'auto';
  div.style.fontFamily = 'monospace';
  div.style.fontSize = '12px';
  div.style.display = 'none';
  document.body.appendChild(div);
  return div;
}

// Caption Handling
function handleCaption(text) {
  log(`Caption received: "${text}"`, 'debug');
  
  // Clear any existing timeout
  clearTimeout(captionTimeout);
  
  // Update buffer with new text
  if (text !== lastCaption) {
    captionBuffer = text;
    lastCaption = text;
    
    // Set a timeout to process the caption after a pause in speaking
    captionTimeout = setTimeout(() => {
      processCompleteCaption(captionBuffer);
      captionBuffer = ''; // Clear buffer after processing
    }, PAUSE_THRESHOLD);
  }
}

function processCompleteCaption(text) {
  // Basic sentence completion checks
  const hasEndPunctuation = /[.!?]$/.test(text.trim());
  const isCompleteQuestion = text.trim().endsWith('?');
  
  // Only process if it seems like a complete question
  if (isCompleteQuestion && hasEndPunctuation) {
    log(`Complete question detected: "${text}"`);
    answerQueue.push(text);
    processQueue();
  } else {
    log(`Incomplete or non-question caption: "${text}"`, 'debug');
  }
}

// Queue Processing
async function processQueue() {
  if (isProcessing || answerQueue.length === 0) return;
  
  isProcessing = true;
  const removeLoader = showLoadingIndicator();
  
  try {
    while (answerQueue.length > 0) {
      const question = answerQueue.shift();
      log(`Processing question: "${question}"`);
      
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { type: 'question', question },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else if (response.status === 'error') {
              reject(new Error(response.answer));
            } else {
              resolve(response);
            }
          }
        );
      });
      
      if (response && response.answer) {
        addAnswerToUI(question, response.answer);
        log(`Answer received for: "${question}"`);
      }
    }
  } catch (error) {
    log(`Error processing queue: ${error.message}`, 'error');
    addAnswerToUI('Error', error.message);
  } finally {
    removeLoader();
    isProcessing = false;
  }
}

// UI Updates
function addAnswerToUI(question, answer) {
  const answerElement = document.createElement('div');
  answerElement.innerHTML = `
    <div style="margin: 8px 0; padding: 8px; background: #f8f9fa; border-radius: 4px;">
      <div style="font-weight: bold; color: #333;">Q: ${question}</div>
      <div style="margin-top: 4px; color: #666;">A: ${answer}</div>
    </div>
  `;
  
  answerDiv.prepend(answerElement);
  answerDiv.style.display = 'block';
  
  setTimeout(() => {
    answerElement.remove();
    if (answerDiv.children.length === 0) {
      answerDiv.style.display = 'none';
    }
  }, ANSWER_DISPLAY_TIME);
}

function showLoadingIndicator() {
  const loader = document.createElement('div');
  loader.textContent = 'Generating answer...';
  loader.style.color = '#666';
  loader.style.fontStyle = 'italic';
  answerDiv.prepend(loader);
  answerDiv.style.display = 'block';
  
  return () => {
    loader.remove();
    if (answerDiv.children.length === 0) {
      answerDiv.style.display = 'none';
    }
  };
}

// Mutation Observer Setup
function initObserver() {
  log('Initializing caption observer...');
  
  const targetNode = document.body;
  const config = { childList: true, subtree: true, characterData: true };
  const captionSelector = '.bYevke.wY1pdd .bh44bd.VbkSUe span';

  const checkCaptions = debounce(() => {
    const element = document.querySelector(captionSelector);
    if (element && element.textContent) {
      handleCaption(element.textContent);
    }
  }, DEBOUNCE_TIME);

  const observer = new MutationObserver(() => {
    checkCaptions();
  });

  observer.observe(targetNode, config);
  log('Caption observer initialized successfully');
}

// Utility Functions
function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

// Initialize
initObserver();
log('Meeting Assistant initialized');

// Cleanup on page unload
window.addEventListener('unload', () => {
  clearTimeout(captionTimeout);
});
