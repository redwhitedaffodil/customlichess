// Bridge between page and background service worker
let port = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 1000;

function connectToBackground() {
  port = chrome.runtime.connect({ name: 'engine-bridge' });
  
  // Reset reconnect counter on successful connection
  reconnectAttempts = 0;
  
  port.onMessage.addListener((msg) => {
    // Forward to page
    window.postMessage({ source: 'lichess-ext-bg', ...msg }, window.location.origin);
  });
  
  port.onDisconnect.addListener(() => {
    console.log('[Content] Disconnected from background');
    
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      // Exponential backoff: 1s, 2s, 4s, 8s, up to 16s
      const delay = Math.min(BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts), 16000);
      reconnectAttempts++;
      console.log(`[Content] Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
      setTimeout(connectToBackground, delay);
    } else {
      console.error('[Content] Max reconnection attempts reached, giving up');
    }
  });
}

// Listen for messages from page
window.addEventListener('message', (e) => {
  if (e.source !== window || !e.data || e.data.source !== 'lichess-ext-page') return;
  
  // Forward to background
  if (port) {
    port.postMessage(e.data);
  }
});

// Inject the main script
function injectScript(file) {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL(file);
  script.onload = () => script.remove();
  (document.head || document.documentElement).appendChild(script);
}

// Connect to background
connectToBackground();

// Inject scripts when DOM is ready
if (document.head) {
  injectScript('chess.js');
  injectScript('stockfish.js');
  injectScript('inject.js');
} else {
  document.addEventListener('DOMContentLoaded', () => {
    injectScript('chess.js');
    injectScript('stockfish.js');
    injectScript('inject.js');
  });
}

console.log('[Content] Content script loaded');
