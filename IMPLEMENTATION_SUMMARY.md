# Background Service Worker Implementation - Summary

## Overview

Successfully implemented a background service worker architecture to bypass Content Security Policy (CSP) restrictions for external engine WebSocket connections in the Lichess External Engine Chrome extension.

## Problem Solved

**Original Issue**: Even with `web_accessible_resources`, injected scripts run under the page's CSP. Lichess's CSP blocks WebSocket connections to external hosts like `ws://localhost:8080/ws`, preventing external engine functionality.

**Solution**: WebSocket connections now run in the background service worker (privileged context with NO CSP restrictions), with messages relayed via Chrome's runtime messaging API.

## Files Created/Modified

### Created Files
1. **`extension/background.js`** (2.7 KB)
   - Background service worker managing WebSocket connections
   - Handles multiple content script connections
   - Broadcasts engine messages to connected clients
   - Implements proper error handling

2. **`extension/content.js`** (1.9 KB)
   - Bridges page and background worker
   - Uses `chrome.runtime.connect()` for persistent connection
   - Implements exponential backoff reconnection (max 10 attempts)
   - Injects required scripts into page context

3. **`extension/inject.js`** (38 KB)
   - Modified version of `lj.js` using postMessage
   - Removed direct WebSocket implementation
   - Added postMessage event listeners
   - Uses `window.location.origin` for security

4. **`ARCHITECTURE.md`** (5.4 KB)
   - Comprehensive architecture documentation
   - Details message flow and components
   - Security considerations
   - Migration notes

### Modified Files
1. **`extension/manifest.json`**
   - Version bumped to `2.1`
   - Added `background.service_worker`
   - Changed content script from `injector.js` to `content.js`
   - Changed web accessible resource from `lj.js` to `inject.js`
   - Restricted WebSocket permissions to port 8080
   - Removed unnecessary `scripting` permission

2. **`extension/README.md`**
   - Updated Technical Details section
   - Documented new architecture
   - Explained CSP bypass mechanism
   - Updated permission requirements

## Architecture

```
[Lichess Page] <--postMessage--> [Content Script] <--chrome.runtime--> [Background Worker] <--WebSocket--> [External Engine]
```

### Message Flow

**Page → Background:**
1. Page sends postMessage with `source: 'lichess-ext-page'`
2. Content script receives and forwards via `port.postMessage()`
3. Background worker receives and processes command
4. WebSocket sends to external engine

**Background → Page:**
1. WebSocket receives data from external engine
2. Background worker broadcasts to all connected ports
3. Content script receives and forwards via `window.postMessage()`
4. Page receives message with `source: 'lichess-ext-bg'`

## Security Improvements

1. **postMessage Origin Validation**
   - All `postMessage` calls use `window.location.origin` instead of `'*'`
   - Prevents message interception by malicious frames

2. **Restricted Permissions**
   - WebSocket permissions limited to `ws://localhost:8080/*` and `ws://127.0.0.1:8080/*`
   - Follows principle of least privilege

3. **Message Source Validation**
   - Content script validates `e.source !== window` and `e.data.source`
   - Background worker validates message types

4. **Error Handling**
   - Broadcast function logs errors when port communication fails
   - Content script implements exponential backoff (1s → 16s max)
   - Max 10 reconnection attempts to prevent infinite loops

## Quality Checks Passed

✅ **Syntax Validation**
- All JavaScript files pass `node --check`
- manifest.json is valid JSON

✅ **Code Review**
- Addressed all security concerns
- Improved error handling
- Implemented reconnection backoff

✅ **CodeQL Security Scan**
- 0 security alerts found
- No vulnerabilities detected

## Testing Recommendations

1. **Load Extension**
   - Open `chrome://extensions/`
   - Enable Developer mode
   - Load unpacked from `extension/` directory

2. **Verify Logs**
   - Open DevTools Console
   - Look for `[Background]`, `[Content]`, and `[ExtEngine]` messages
   - Verify no CSP errors

3. **Test External Engine**
   - Start chesshook-intermediary on port 8080
   - Enable external engine in UI
   - Verify connection succeeds
   - Verify commands are sent/received

4. **Test Reconnection**
   - Stop external engine server
   - Verify error handling
   - Restart server
   - Verify automatic reconnection (with backoff)

## Migration from v2.0

Users upgrading from version 2.0 should:

1. Remove old extension from `chrome://extensions/`
2. Install new version
3. Reload Lichess tabs
4. External engine should work without CSP errors

The old `injector.js` and `lj.js` are no longer used but remain in the repository for reference.

## Benefits

1. **CSP Bypass**: Background worker has no CSP restrictions
2. **Clean Architecture**: Clear separation of concerns
3. **Reliable Messaging**: Uses Chrome's built-in APIs
4. **Better Error Handling**: Centralized connection management
5. **Security**: Proper origin validation and restricted permissions
6. **Future-Proof**: Follows Manifest V3 best practices

## Conclusion

The background service worker architecture successfully solves the CSP blocking issue while maintaining security and following Chrome extension best practices. All code quality checks pass, and the implementation is ready for testing.
