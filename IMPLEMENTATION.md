# External Engine Support - Implementation Summary

## Requirements Checklist

### ✅ 1. Add External Engine WebSocket Connection
- [x] Created `connectExternalEngine()` function
- [x] Default URL: `ws://localhost:8080/ws`
- [x] URL configurable via localStorage (`externalEngineUrl`)
- [x] Used native WebSocket (not the Lichess proxy)

### ✅ 2. Implement chesshook-intermediary Protocol
- [x] **Subscription**: Sends `sub` command on connect
- [x] **Version check**: Sends `whoareyou` → receives `iam <name>v<version>`
- [x] **Engine info**: Sends `whatengine` → receives `engine <name>`
- [x] **Authentication**: Handles `auth <passkey>` → `authok`/`autherr` (ready for future use)
- [x] **UCI commands**: Routes all standard UCI commands via `sendToEngine()`

### ✅ 3. Create Engine Abstraction Layer
- [x] Created `sendToEngine(cmd)` wrapper function
- [x] Routes to external WebSocket when `useExternalEngine && externalEngineConnected`
- [x] Routes to local WASM Stockfish otherwise
- [x] Modified `configureEngine()` to support both engines
- [x] Created `configureLocalEngine()` helper
- [x] Updated `getMultiPV()` to use `sendToEngine()`

### ✅ 4. Add UI Toggle
- [x] "Ext-OFF/✓/⟳" button to toggle between engines
- [x] Shows connection status with color coding:
  - Green (✓) = Connected
  - Orange (⟳) = Reconnecting
  - Gray (OFF) = Disabled
- [x] "⚙️" button to configure WebSocket URL
- [x] Keyboard shortcut: 'e' key

### ✅ 5. Handle Connection States
- [x] Auto-reconnect on disconnect (3-second delay)
- [x] Visual indicator via button color
- [x] Graceful fallback to local engine on timeout (5 seconds)
- [x] Connection state tracking (`externalEngineConnected`, `externalEngineReady`)

## Implementation Details

### Key Functions

1. **`sendToEngine(cmd)`**
   - Routes commands to active engine
   - Checks `useExternalEngine && externalEngineConnected && externalEngineWs`
   - Falls back to `stockfish.postMessage(cmd)`

2. **`connectExternalEngine()`**
   - Creates WebSocket connection using `NativeWebSocket`
   - Handles onopen, onmessage, onerror, onclose events
   - Subscribes to engine output (`sub`)
   - Configures engine with UCI commands
   - Implements auto-reconnect logic

3. **`disconnectExternalEngine()`**
   - Clears reconnect timer
   - Closes WebSocket connection
   - Resets state flags

4. **`configureEngine()`**
   - Checks `useExternalEngine` flag
   - Connects external engine or configures local
   - Implements 5-second timeout with fallback

5. **`configureLocalEngine()`**
   - Directly configures local Stockfish
   - Independent from `sendToEngine()` to avoid routing issues

### State Variables

- `useExternalEngine` - User preference (localStorage)
- `externalEngineUrl` - WebSocket URL (localStorage)
- `externalEngineWs` - WebSocket connection object
- `externalEngineReady` - Engine configured and ready
- `externalEngineConnected` - WebSocket connected
- `externalEngineReconnectTimer` - Auto-reconnect timer

### UI Elements

1. **External Engine Toggle Button**
   - Text: "Ext-OFF", "Ext-✓", or "Ext-⟳"
   - Background color indicates status
   - Updates every second via `setInterval`

2. **Configuration Button**
   - Icon: ⚙️
   - Opens prompt for URL input
   - Validates WebSocket URL format (ws:// or wss://)
   - Reconnects if currently using external engine

## Protocol Flow

```
1. User enables external engine → connectExternalEngine()
2. WebSocket connects → onopen
3. Send "sub" → subscribe to output
4. Send "whoareyou" → identify server
5. Send "whatengine" → identify engine
6. Send UCI commands → configure engine
7. Send "isready" → wait for "readyok"
8. Receive "readyok" → set engineReady = true
9. Game starts → send position/go commands via sendToEngine()
10. Receive "info" and "bestmove" → route to sfListeners
```

## Testing Recommendations

### Manual Testing

1. **Without External Server**
   - Verify local engine works by default
   - Toggle external engine → should show orange (reconnecting)
   - Verify auto-reconnect attempts every 3 seconds
   - Console should show connection errors

2. **With External Server**
   ```bash
   # Start chesshook-intermediary
   ./chesshook-intermediary -engine /path/to/stockfish
   ```
   - Enable external engine → should show green (connected)
   - Check console for:
     - "✅ Connected"
     - Server identification messages
     - "✅ Ready!"
   - Start a game and verify moves work
   - Arrows should display correctly
   - Kill server → verify auto-reconnect

3. **URL Configuration**
   - Click ⚙️ button
   - Try invalid URL (e.g., "http://...") → should reject
   - Try valid URL (e.g., "ws://localhost:9999/ws")
   - Verify localStorage updated
   - If connected, verify reconnection

4. **Engine Switching**
   - Start with local engine
   - Make a move
   - Switch to external → verify continues working
   - Switch back to local → verify continues working

### Browser Console Tests

```javascript
// Check state
localStorage.getItem('useExternalEngine')
localStorage.getItem('externalEngineUrl')

// Force values
localStorage.setItem('externalEngineUrl', 'ws://localhost:8080/ws')
localStorage.setItem('useExternalEngine', '1')

// Then reload page
```

## Known Limitations

1. **CORS Requirement**
   - chesshook-intermediary must allow lichess.org origin
   - May require server modification
   - Documented in README

2. **No Authentication UI**
   - Protocol supports `auth` command
   - Not implemented in UI (can be added if needed)
   - Server can be run without auth for local use

3. **Prompt-based URL Config**
   - Simple but not ideal UX
   - Could be enhanced with modal dialog
   - Sufficient for technical users

4. **Connection Status Polling**
   - Updates button every 1 second
   - Could use event-driven approach
   - Current approach is simple and reliable

## Files Modified

1. **lj.js**
   - Added external engine support (~150 lines)
   - Created abstraction layer
   - Added UI buttons
   - Preserved all existing functionality

2. **README.md**
   - Added comprehensive documentation
   - Architecture diagram
   - Setup instructions
   - Troubleshooting guide

3. **.gitignore**
   - Excluded test files
   - Standard patterns for editors/OS files

## Backward Compatibility

✅ **Fully backward compatible**
- Default behavior unchanged (local engine)
- All existing features work
- No breaking changes
- External engine is opt-in via UI

## Security Considerations

- Only connects to user-configured URL
- Default is localhost (safe)
- No credentials stored in code
- WebSocket URL validated before use
- User must explicitly enable external engine

## Performance Impact

- Minimal when using local engine (no change)
- External engine may be faster (depends on hardware)
- WebSocket overhead is negligible
- No impact on non-engine features
