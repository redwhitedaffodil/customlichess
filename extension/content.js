// Bridge between page and background service worker
let port = null;

function connectToBackground() {
  port = chrome.runtime.connect({ name: 'engine-bridge' });
  
  port.onMessage.addListener((msg) => {
    // Forward to page
    window.postMessage({ source: 'lichess-ext-bg', ...msg }, '*');
  });
  
  port.onDisconnect.addListener(() => {
    console.log('[Content] Disconnected from background, reconnecting...');
    setTimeout(connectToBackground, 1000);
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
