NIGHTFALL CHESS - browser version
=================================
One file: index.html. No build step, no libraries, no server.

PUT IT ON 2playertag.com (GitHub Pages)
---------------------------------------
Easiest, no DNS changes: add it to the SAME repo that already serves 2playertag.com.
  1. In that repo make a folder called  chess
  2. Put index.html (and the empty file .nojekyll if you like) inside it
  3. Commit and push. After a minute it is live at  https://2playertag.com/chess/

Own address instead (chess.2playertag.com):
  1. New GitHub repo, put index.html at the top, add a file named CNAME containing:  chess.2playertag.com
  2. Repo Settings > Pages > deploy from the main branch
  3. Namecheap > Advanced DNS > add a CNAME record: Host "chess", Value "<your-github-username>.github.io"

MUSIC
-----
Put a file named music.mp3 (or .ogg/.wav) next to index.html and it plays by itself,
or use Settings > Choose a music file. (Use music you have the right to publish.)

ONLINE PLAY
-----------
Direct browser-to-browser (WebRTC). One player makes an invitation code, sends it to the
other, who sends back a reply code. Works on most home networks; strict corporate or
mobile networks can block it.

CONTROLS
--------
Click a piece then a glowing square. Drag = turn camera, wheel/pinch = zoom, WASD = roam,
V top view, F turn board, U undo, K kill-cam, T storm, M sound, N menu.
Needs a browser with WebGL 2 (any recent Chrome, Edge, Firefox, Safari).
