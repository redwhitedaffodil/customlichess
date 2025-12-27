# Custom Lichess - Enhanced Chess Engine UserScript

A powerful Lichess.org UserScript that adds advanced features including support for external chess engines via WebSocket.

## Features

- **Local Stockfish WASM Engine**: Built-in chess engine for immediate use
- **External Engine Support**: Connect to remote/more powerful engines via WebSocket
- **Multiple Game Modes**: Auto-play, hint mode, piece selection mode
- **Human-like Timing**: Configurable delays and move timing patterns
- **Varied Play**: Multi-PV analysis with weighted move selection
- **Arrow Visualization**: Color-coded arrows showing multiple lines
- **Floating Control Dock**: Easy-to-use UI for toggling features

## Installation

1. Install a UserScript manager (Tampermonkey, Violentmonkey, etc.)
2. Install the script from `lj.js`
3. Navigate to lichess.org to use

## External Engine Setup

### Using chesshook-intermediary

The script supports external engines via the [chesshook-intermediary](https://github.com/0mlml/chesshook-intermediary) WebSocket protocol.

#### 1. Setup the intermediary server

```bash
# Clone and build chesshook-intermediary
git clone https://github.com/0mlml/chesshook-intermediary
cd chesshook-intermediary
go build

# Run with your engine
./chesshook-intermediary -engine /path/to/stockfish
```

#### 2. Configure CORS (Required for lichess.org)

The chesshook-intermediary server needs to accept connections from `https://lichess.org`. 

You may need to modify the server to add CORS headers:
- Add `Access-Control-Allow-Origin: https://lichess.org` header
- Or use `Access-Control-Allow-Origin: *` for testing (not recommended for production)

**Note**: Check the chesshook-intermediary documentation for current CORS configuration options.

#### 3. Enable External Engine in lj.js

1. Click the **Ext-OFF** button in the floating dock to toggle external engine mode
2. Click the **⚙️** button to configure the WebSocket URL (default: `ws://localhost:8080/ws`)
3. The button will show:
   - **Ext-✓** (green) when connected
   - **Ext-⟳** (orange) when reconnecting
   - **Ext-OFF** (gray) when disabled

#### 4. Connection Status

The script will:
- Auto-connect when external engine is enabled
- Auto-reconnect on disconnection (every 3 seconds)
- Gracefully fallback to local WASM engine if external connection fails
- Display connection status via the button color

### Protocol Details

The chesshook-intermediary protocol uses these commands:

- **`sub`** - Subscribe to engine output (info and bestmove messages)
- **`whoareyou`** - Get server version (response: `iam <name>v<version>`)
- **`whatengine`** - Get engine info (response: `engine <name>`)
- **`auth <passkey>`** - Authenticate (responses: `authok` or `autherr`)
- **UCI commands** - Standard UCI commands are sent directly (e.g., `position fen ...`, `go movetime ...`)

## Controls

### UI Buttons

- **Hint** - Show engine analysis arrows for current position
- **Auto-ON/OFF** - Toggle auto-move mode
- **Cfg: X** - Cycle through timing presets (7.5s, 15s, 30s)
- **Arr-ON/OFF** - Toggle arrow display
- **Piece-ON/OFF** - Toggle piece selection mode
- **Human-ON/OFF** - Toggle human-like timing
- **Vary-ON/OFF** - Toggle varied move selection
- **Ext-OFF/✓/⟳** - Toggle external engine (green=connected, orange=reconnecting)
- **⚙️** - Configure external engine WebSocket URL

### Keyboard Shortcuts

- **w** - Toggle hint + auto mode
- **p** - Toggle piece selection mode
- **h** - Toggle human mode
- **v** - Toggle varied mode
- **e** - Toggle external engine

## Configuration Presets

### 7.5s Mode (Blunder Mode)
- Very fast engine analysis (12ms)
- High blunder chance (45%)
- Allows large CP losses (up to 900)
- Minimum delays

### 15s Mode (Balanced)
- Moderate engine analysis (20ms)
- Moderate blunder chance (16%)
- Allows CP losses up to 300
- Balanced timing

### 30s Mode (Careful)
- Longer engine analysis (60ms)
- Low blunder chance (8%)
- Strict CP loss limit (200)
- Longer thinking times

## Advanced Features

### Multi-PV Analysis
The engine analyzes the top 4 moves simultaneously, with color-coded arrows:
- **Green** - Top move (PV1)
- **Orange** - Second best (PV2)
- **Blue** - Third best (PV3)
- **Purple** - Fourth best (PV4)

### Varied Move Selection
When enabled, the script uses weighted random selection across multiple PVs:
- Intentionally plays sub-optimal moves to simulate human play
- Configurable blunder frequency and severity
- Dynamic weighting based on evaluation difference

### Human-like Timing
When enabled, the script adds realistic delays:
- Faster in low-piece endgames
- Instant captures
- Panic mode in time trouble
- Random variance in move times
- Occasional "tanks" (long thinks)

## Benefits of External Engines

Using an external engine provides:

1. **More Computing Power**: Use all CPU cores with high thread count
2. **Larger Hash Tables**: Configure multi-GB hash tables for stronger play
3. **Remote Engines**: Run the engine on a powerful server while using the script on any device
4. **Custom Engines**: Use engines beyond Stockfish (Leela, Komodo, etc.)
5. **Better Performance**: Avoid browser WASM limitations

## Troubleshooting

### External engine not connecting

1. Verify chesshook-intermediary is running: `ps aux | grep chesshook`
2. Check the WebSocket URL is correct (default: `ws://localhost:8080/ws`)
3. Ensure CORS headers are configured for `https://lichess.org`
4. Check browser console for connection errors
5. Verify no firewall is blocking WebSocket connections

### Engine not responding

1. Check the console for `[ExtEngine]` messages
2. Verify the engine sends `readyok` after initialization
3. Try reconnecting by toggling the external engine off and on
4. Fall back to local engine if external is not working

### Performance issues

1. Reduce MultiPV count in engine configuration
2. Lower the engine analysis time in preset configuration
3. Use a more powerful machine for the external engine
4. Check network latency if using remote engine

## Development

### File Structure

- `lj.js` - Main UserScript file containing all functionality

### Key Functions

- `configureEngine()` - Initialize engine (local or external)
- `sendToEngine(cmd)` - Engine abstraction layer
- `connectExternalEngine()` - WebSocket connection handler
- `getMultiPV(fen)` - Get multi-PV analysis for position
- `processTurn()` - Main turn processing logic

## Security Notes

- The script only connects to localhost by default
- External engine URL is configurable via localStorage
- No data is sent to external servers except the configured engine
- CORS must be properly configured on the intermediary server

## License

This is a UserScript for educational and personal use. Use responsibly and in accordance with Lichess.org's Terms of Service.

## Credits

- Original script by Michael and Ian
- External engine support added for chesshook-intermediary compatibility
- Built on Stockfish WASM and chess.js libraries
