# Testing Guide - Background Service Worker Implementation

## Overview

This guide walks through testing the new background service worker architecture for the Lichess External Engine Chrome extension.

## Prerequisites

1. Chrome browser (version 88+)
2. chesshook-intermediary server (optional, for external engine testing)
3. Access to lichess.org

## Part 1: Extension Installation

### Step 1: Load the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `extension/` folder from this repository
5. Verify the extension appears with:
   - Name: "Lichess External Engine"
   - Version: "2.1"
   - Status: Enabled

### Step 2: Verify Extension Loading

1. Open Chrome DevTools (F12)
2. Go to **Console** tab
3. Click the **Service Workers** link in the extension card (or navigate to `chrome://inspect/#service-workers`)
4. You should see the background service worker running
5. In the service worker's console, you should see:
   ```
   [Background] Service worker started
   ```

## Part 2: Basic Functionality Testing

### Test 1: Extension Loads on Lichess

1. Navigate to https://lichess.org
2. Open Chrome DevTools (F12) → **Console** tab
3. Verify you see these messages:
   ```
   [Content] Content script loaded
   [Content] Reconnecting in 1000ms (attempt 1/10)...
   ```
   Note: The reconnection message is expected because no ports are listening initially

4. Verify the floating control dock appears on the page (usually in top-right area)

### Test 2: Local Engine Works

1. On a lichess.org game page, click the **Hint** button in the floating dock
2. Verify you see colored arrows appear on the board showing engine suggestions
3. In the console, verify you see engine analysis messages (e.g., "info depth X score cp Y")

### Test 3: Content Script ↔ Background Communication

1. With DevTools open, go to the **Background** service worker console:
   - Visit `chrome://inspect/#service-workers`
   - Click "inspect" next to the Lichess External Engine service worker

2. In the background console, verify you see:
   ```
   [Background] Content script connected
   ```

3. This confirms the content script successfully connected to the background worker

## Part 3: External Engine Testing

### Prerequisites for External Engine Testing

1. **Install chesshook-intermediary**:
   ```bash
   # Clone the repo
   git clone https://github.com/0mlml/chesshook-intermediary
   cd chesshook-intermediary
   
   # Build
   go build
   ```

2. **Start the server**:
   ```bash
   # Run with your Stockfish binary
   ./chesshook-intermediary -engine /path/to/stockfish
   
   # Or use default (looks for stockfish in PATH)
   ./chesshook-intermediary
   ```

3. Verify the server is running:
   ```
   Server listening on :8080
   ```

### Test 4: External Engine Connection

1. On lichess.org, click the **Ext-OFF** button in the floating dock
2. It should change to **Ext-⟳** (orange, connecting)
3. In the **Background** service worker console, verify:
   ```
   [Background] Connecting to ws://localhost:8080/ws
   [Background] ✅ Connected to engine
   ```

4. In the **Page** console (main DevTools), verify:
   ```
   [ExtEngine] ✅ Connected
   [ExtEngine] Server: iam chesshook-intermediary/1.0
   [ExtEngine] Engine: engine stockfish 16
   [ExtEngine] ✅ Ready!
   ```

5. The button should now show **Ext-✓** (green, connected)

### Test 5: External Engine Analysis

1. With external engine connected, click **Hint** button
2. Verify colored arrows appear
3. In the console, verify engine messages are coming through:
   ```
   [ExtEngine] info depth 10 score cp 23 nodes 12345 ...
   [ExtEngine] bestmove e2e4 ponder e7e5
   ```

### Test 6: External Engine Reconnection

1. Stop the chesshook-intermediary server (Ctrl+C)
2. In the **Background** console, verify:
   ```
   [Background] WebSocket closed
   ```

3. In the **Page** console, verify:
   ```
   [ExtEngine] Disconnected
   ```

4. The button should show **Ext-⟳** (orange, reconnecting)

5. Restart the chesshook-intermediary server

6. Verify automatic reconnection:
   ```
   [Background] ✅ Connected to engine
   [ExtEngine] ✅ Connected
   ```

7. Button should return to **Ext-✓** (green)

## Part 4: Security Testing

### Test 7: No CSP Errors

1. With external engine connected, open the **Console** tab
2. Filter messages by "CSP" or "Content Security Policy"
3. **Expected**: No CSP errors related to WebSocket connections
4. **Before this fix**: You would see errors like:
   ```
   Refused to connect to 'ws://localhost:8080/ws' because it violates the following Content Security Policy directive: "connect-src 'self' ..."
   ```

### Test 8: Message Origin Validation

1. Open the **Console** tab on lichess.org
2. Try to inject a malicious message:
   ```javascript
   window.postMessage({ source: 'lichess-ext-page', type: 'send', data: 'uci' }, '*')
   ```

3. **Expected**: The message should be rejected because the origin is `*` instead of `window.location.origin`
4. Verify no message is sent to the background worker

### Test 9: WebSocket Permission Restriction

1. Try to configure a different port:
   ```javascript
   localStorage.setItem('externalEngineUrl', 'ws://localhost:9999/ws')
   ```

2. Reload the page and enable external engine
3. **Expected**: Connection should fail because permissions are restricted to port 8080
4. In the background console, you should see an error

## Part 5: Edge Cases

### Test 10: Multiple Tabs

1. Open 2 lichess.org tabs
2. In the **Background** console, verify:
   ```
   [Background] Content script connected
   [Background] Content script connected
   ```

3. Enable external engine in one tab
4. Verify both tabs receive the same engine messages (broadcasted)

### Test 11: Content Script Reconnection Backoff

1. Temporarily break the background connection by:
   - Disabling the extension in `chrome://extensions/`
   - Note: Don't reload the page

2. In the **Page** console, verify exponential backoff:
   ```
   [Content] Reconnecting in 1000ms (attempt 1/10)...
   [Content] Reconnecting in 2000ms (attempt 2/10)...
   [Content] Reconnecting in 4000ms (attempt 3/10)...
   [Content] Reconnecting in 8000ms (attempt 4/10)...
   [Content] Reconnecting in 16000ms (attempt 5/10)...
   ```

3. Re-enable the extension
4. Reload the page
5. Verify connection is re-established

### Test 12: Max Reconnection Attempts

1. Disable the extension
2. Wait for all reconnection attempts to exhaust
3. Verify final message:
   ```
   [Content] Max reconnection attempts reached, giving up
   ```

## Part 6: Regression Testing

### Test 13: Local Stockfish Still Works

1. Ensure external engine is **disabled** (Ext-OFF)
2. Click **Hint** button
3. Verify arrows still appear (using local Stockfish WASM)
4. Verify analysis works correctly

### Test 14: UI Controls Work

Test all UI buttons:
- **Hint** - Shows analysis arrows
- **Auto-ON/OFF** - Toggles auto-move mode
- **Cfg: X** - Cycles through presets (7.5s, 15s, 30s)
- **Arr-ON/OFF** - Toggles arrow display
- **Piece-ON/OFF** - Toggles piece selection mode
- **Human-ON/OFF** - Toggles human timing
- **Vary-ON/OFF** - Toggles varied play
- **Ext-OFF/✓/⟳** - Toggles external engine
- **⚙️** - Configure WebSocket URL

### Test 15: Settings Persist

1. Enable various settings (Auto-ON, Human-ON, etc.)
2. Reload the page
3. Verify settings are maintained (localStorage persistence)

## Expected Results Summary

| Test | Expected Result | Status |
|------|----------------|--------|
| Extension loads | Service worker starts, no errors | ✅ |
| Content script loads | Connects to background | ✅ |
| Local engine works | Analysis arrows appear | ✅ |
| External engine connects | WebSocket opens, no CSP errors | ✅ |
| External engine analysis | Engine messages received | ✅ |
| Reconnection works | Auto-reconnects with backoff | ✅ |
| No CSP errors | Console clear of CSP violations | ✅ |
| Message security | Origin validation works | ✅ |
| Multiple tabs | Broadcast works correctly | ✅ |
| Settings persist | LocalStorage works | ✅ |

## Troubleshooting

### Issue: Background service worker not starting

**Solution**: 
1. Go to `chrome://extensions/`
2. Click the reload icon on the extension card
3. Check for errors in the extension card

### Issue: Content script not connecting

**Solution**:
1. Hard refresh the Lichess page (Ctrl+Shift+R)
2. Check console for error messages
3. Verify the extension is enabled

### Issue: External engine won't connect

**Solution**:
1. Verify chesshook-intermediary is running on port 8080
2. Check firewall settings
3. Verify WebSocket URL is `ws://localhost:8080/ws`
4. Check background service worker console for errors

### Issue: "Max reconnection attempts reached"

**Solution**:
1. This is expected if the background worker is unavailable
2. Reload the page to reset the reconnection counter
3. Verify the extension is enabled

## Conclusion

If all tests pass, the background service worker architecture is functioning correctly and has successfully bypassed CSP restrictions for external engine WebSocket connections.

## Reporting Issues

If any test fails, please report:
1. Test number that failed
2. Console messages (from both page and background worker)
3. Chrome version
4. Extension version
5. Any error messages
