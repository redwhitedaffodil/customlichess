# Lichess External Engine CSP Bypass Extension

This Chrome extension removes Content Security Policy (CSP) headers from Lichess.org to allow WebSocket connections to `ws://localhost` for external chess engine support.

## Purpose

Lichess's CSP normally blocks WebSocket connections to localhost, which prevents the Custom Lichess UserScript from connecting to external engines via the chesshook-intermediary. This extension removes those CSP restrictions specifically for Lichess.org.

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `extension` folder from this repository
5. The extension should now appear in your extensions list
6. Refresh any open Lichess.org tabs

**Note**: If you're updating the extension, click the refresh icon (🔄) on the extension card in `chrome://extensions/` after pulling the latest changes, then reload any open Lichess.org tabs.

## Usage

Once installed, the extension automatically:
- Removes CSP headers from all Lichess.org pages
- Allows WebSocket connections to `ws://localhost:8080/ws`
- Works silently in the background (no UI)

You can now use the Custom Lichess UserScript's external engine feature without CSP errors.

## Security Warning

⚠️ **Important**: This extension disables an important security feature (CSP) for Lichess.org. Only use it when you need external engine support.

**Recommendations**:
- Only enable this extension when using the external engine feature
- Disable or remove the extension when not needed
- Never install similar extensions from untrusted sources
- Review the extension code before installation

## Verification

To verify the extension is working:

1. Open Lichess.org
2. Open Chrome DevTools (F12)
3. Go to the **Console** tab
4. You should see a message like `[CSP Bypass] Removed CSP meta tag`
5. Go to the **Elements** tab and inspect the `<head>` section
6. Verify there is no `<meta http-equiv="Content-Security-Policy">` tag present
7. Alternatively, check the **Network** tab:
   - Reload the page
   - Click on the main document request
   - Check the **Headers** section
   - The `Content-Security-Policy` header should not be present (if it was being sent via HTTP)

## Troubleshooting

### Extension not working

1. Ensure Developer mode is enabled in `chrome://extensions/`
2. Check that the extension is enabled (toggle switch is on)
3. Verify the extension has host permissions for `*://lichess.org/*`
4. Reload the extension: click the refresh icon on the extension card
5. Hard refresh Lichess.org (Ctrl+Shift+R or Cmd+Shift+R)

### WebSocket still blocked

1. Open the browser console and check for CSP errors
2. Verify the CSP header is actually removed (see Verification section)
3. Ensure the chesshook-intermediary server is running
4. Check that the WebSocket URL is correct (default: `ws://localhost:8080/ws`)

## Technical Details

This extension uses two approaches to bypass CSP:

1. **Content Script** (Primary method):
   - Runs at `document_start` to execute before the page loads
   - Removes CSP `<meta>` tags from the HTML before the browser parses them
   - Uses a MutationObserver to catch dynamically added CSP meta tags
   - Runs in all frames to handle iframes

2. **declarativeNetRequest API** (Fallback):
   - Removes CSP headers from HTTP responses (if any)
   - Applies to main frames and sub-frames

The extension targets only Lichess.org domains (`lichess.org` and `www.lichess.org`).

The extension requires these permissions:
- `declarativeNetRequest` - To modify HTTP headers
- `declarativeNetRequestWithHostAccess` - To use host permissions with declarativeNetRequest
- `host_permissions` for `*://lichess.org/*` - To access and modify Lichess.org pages

## Uninstallation

To remove the extension:

1. Go to `chrome://extensions/`
2. Find "Lichess External Engine CSP Bypass"
3. Click **Remove**
4. Confirm the removal

## License

This extension is provided as-is for use with the Custom Lichess UserScript. Use responsibly and in accordance with Lichess.org's Terms of Service.
