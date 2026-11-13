# Nightfall Chess — Web Edition

A browser-based 3D rebuild of the Java Swing Nightfall Chess project.

## Play locally
Because this project uses JavaScript modules, open it through a local web server rather than double-clicking `index.html`.

With Python installed:
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000`.

## Publish on GitHub Pages
1. Create a GitHub repository (for example `nightfall-chess`).
2. Upload **all three files**: `index.html`, `style.css`, and `game.js`.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select `main` and `/ (root)`, then Save.
6. Wait for GitHub Pages to publish the site.

To use your Namecheap domain, add the custom domain in GitHub Pages settings, then add the DNS records GitHub specifies in Namecheap. Enable HTTPS after DNS verification.

## Controls
- Click a piece, then a highlighted square to move.
- Drag to orbit the camera; scroll to zoom.
- V resets the camera.
- The top buttons toggle sound, rain, and camera reset.
- Choose AI or local two-player mode from the left panel.
- Select the Warden difficulty before starting a new game.

## Notes
- Three.js and chess.js are loaded from public CDNs, so the browser needs internet access.
- This is a fresh browser implementation inspired by the source game's mechanics and visual direction, not a line-for-line translation of Swing's custom software renderer.
- The original TCP socket multiplayer has not been carried over. Local two-player is supported; online multiplayer would require a separate WebSocket/backend service.
- Promotion currently defaults to a queen.
