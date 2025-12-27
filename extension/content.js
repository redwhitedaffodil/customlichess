// Remove CSP meta tag immediately
function removeCSPMeta() {
  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (cspMeta) {
    cspMeta.remove();
    console.log('[CSP Bypass] Removed CSP meta tag');
  }
}

// Run immediately
removeCSPMeta();

// Also observe for dynamically added meta tags
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeName === 'META' && node.httpEquiv === 'Content-Security-Policy') {
        node.remove();
        console.log('[CSP Bypass] Removed dynamically added CSP meta tag');
      }
      // Also check children if it's an element
      if (node.nodeType === 1) {
        const cspMeta = node.querySelector?.('meta[http-equiv="Content-Security-Policy"]');
        if (cspMeta) {
          cspMeta.remove();
          console.log('[CSP Bypass] Removed CSP meta tag from subtree');
        }
      }
    }
  }
});

// Start observing as early as possible
observer.observe(document.documentElement || document, {
  childList: true,
  subtree: true
});

// Also try to catch it when head is available
document.addEventListener('DOMContentLoaded', removeCSPMeta);

// Final cleanup attempt
window.addEventListener('load', removeCSPMeta);
