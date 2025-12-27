# Background Service Worker Architecture

## Problem

Even with `web_accessible_resources`, injected scripts still run under the page's Content Security Policy (CSP). Lichess's CSP blocks WebSocket connections to external hosts like `ws://localhost:8080/ws`, preventing external engine connections.

## Solution

We now use a **background service worker** architecture where:

1. The WebSocket connection to the external engine is made from the **background service worker** (which has NO CSP restrictions)
2. The content script communicates with the background via `chrome.runtime.connect()`
3. Engine commands/responses are relayed between the page and background worker

## Architecture Diagram

```
[Lichess Page] <--postMessage--> [Content Script] <--chrome.runtime--> [Background Worker] <--WebSocket--> [External Engine]
```

## Key Changes

### 1. New Background Service Worker (`background.js`)

**Purpose**: Manages WebSocket connections in a privileged context without CSP restrictions.

**Key Features**:
- Maintains a single WebSocket connection to the external engine
- Handles multiple content script connections via `chrome.runtime.onConnect`
- Broadcasts engine messages to all connected content scripts
- Manages connection state and error handling

**Message Types**:
- `connect` - Request to connect to an external engine
- `disconnect` - Request to disconnect from external engine
- `send` - Send a command to the external engine
- `status` - Reports connection status to content scripts
- `open` - WebSocket connection opened
- `message` - Data received from external engine
- `error` - WebSocket error occurred
- `close` - WebSocket connection closed

### 2. Content Script Bridge (`content.js`)

**Purpose**: Bridges communication between the page and background worker.

**Key Features**:
- Establishes a persistent connection to background via `chrome.runtime.connect()`
- Forwards messages from background to page via `window.postMessage()`
- Forwards messages from page to background via `port.postMessage()`
- Automatically reconnects if the connection is lost
- Injects required scripts into the page context

**Communication Flow**:
1. Page → `window.postMessage()` → Content Script → `port.postMessage()` → Background
2. Background → `port.postMessage()` → Content Script → `window.postMessage()` → Page

### 3. Modified Injected Script (`inject.js`)

**Purpose**: Runs in the page context with modified external engine communication.

**Key Changes from `lj.js`**:
- Removed direct WebSocket creation (`new TrueNativeWebSocket()`)
- Added `window.addEventListener('message')` to receive messages from content script
- Replaced `connectExternalEngine()` to use postMessage instead of WebSocket
- Replaced `disconnectExternalEngine()` to use postMessage
- Updated `sendToEngine()` to use `sendToExternalEngine()` helper
- Added `sendToExternalEngine()` helper that uses postMessage

**Message Handlers**:
- `status` - Updates connection state
- `open` - Handles connection established (sends initial configuration)
- `message` - Routes engine output to appropriate handlers
- `error` - Handles connection errors
- `close` - Handles connection closure

### 4. Updated Manifest (`manifest.json`)

**Key Changes**:
- Version bumped to `2.1`
- Removed `scripting` permission (no longer needed)
- Added `host_permissions` for WebSocket URLs:
  - `ws://localhost/*`
  - `ws://127.0.0.1/*`
- Added `background.service_worker` pointing to `background.js`
- Changed content script from `injector.js` to `content.js`
- Changed web accessible resource from `lj.js` to `inject.js`

## Benefits

1. **No CSP Restrictions**: Background service worker runs in a privileged context with no CSP limitations
2. **Clean Separation**: Clear separation between page context, content script, and background worker
3. **Reliable Communication**: Uses Chrome's built-in messaging APIs (`chrome.runtime`) instead of fragile CSP workarounds
4. **Better Error Handling**: Centralized connection management in background worker
5. **Future-Proof**: Aligns with Chrome extension best practices and Manifest V3 architecture

## Migration Notes

For users upgrading from version 2.0:

1. Remove the old extension from `chrome://extensions/`
2. Install the new version
3. Reload any open Lichess tabs
4. External engine functionality should work without any CSP errors

The old `injector.js` and `lj.js` files are no longer used and can be ignored. All functionality is now provided by `content.js`, `inject.js`, and `background.js`.

## Testing

To verify the implementation works:

1. Load the extension in Chrome
2. Navigate to Lichess.org
3. Open Chrome DevTools Console
4. Look for messages from:
   - `[Background]` - Background service worker logs
   - `[Content]` - Content script logs
   - `[ExtEngine]` - External engine logs
5. Enable external engine in the UI
6. Check that WebSocket connection succeeds with no CSP errors
7. Verify engine commands are sent and responses received

## Security Considerations

- Background worker only connects to localhost WebSocket URLs (not external hosts)
- All communication between components is properly scoped with message source validation
- No sensitive data is stored or transmitted beyond what's necessary for engine operation
- Extension only runs on Lichess.org domains as specified in manifest
