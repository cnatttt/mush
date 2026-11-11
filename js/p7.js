// ---- shop icons, your stuff, crow, slots ----
const STUFF_INFO = ["MORE PER CLICK", "MORE PER CLICK", "MORE PER CLICK", "MORE PER CLICK", "TINY MUSHROOMS BELOW", "PINWHEELS BELOW", "BIG INCOME", "HUGE INCOME"];
function drawItemIcon(g, idx, x, y, open) {
  const oc = g.getAlpha();
  if (!open) g.setAlpha(0.28);
  if (idx < 20) g.drawImage(itemIcon[idx], x, y, 48, 48); else g.drawImage(petFrames[(idx - 20) * 2], x + 4, y + 8, 40, 32);
  g.setAlpha(oc);
}
function drawStuff(g) {
  let any = 0; for (let i = 0; i < 8; i++) any += owned[i];
  if (any == 0) return;
  const px = 40, py = 488; let hov = -1;
  g.setColor(C(13, 5, 24, 175)); g.fillRect(px - 8, py - 8, 304, 82);
  g.setColor(C(194, 138, 66)); g.fillRect(px - 8, py - 8, 304, 3); g.fillRect(px - 8, py + 71, 304, 3);
  g.setFont(smallFont);
  for (let i = 0; i < 8; i++) {
    const cx = px + (i % 4) * 72, cy = py + 18 + Math.floor(i / 4) * 27, has = owned[i] > 0;
    if (inR(R(cx - 2, cy - 3, 70, 30), { x: mx, y: my })) hov = i;
    const oc = g.getAlpha();
    if (!has) g.setAlpha(0.3);
    g.drawImage(itemIcon[i], cx, cy, 24, 24);
    text(g, "X" + owned[i], cx + 27, cy + 12, has ? C(255, 242, 208) : C(150, 140, 170));
    g.setAlpha(oc);
  }
  text(g, hov >= 0 ? itemName[hov] + ": " + STUFF_INFO[hov] : "YOUR STUFF", px, py + 6, C(242, 193, 78));
}
function say(s) { bubble = s; bubbleChars = 0; bubbleHold = 160; nextIdle = 450 + rand.nextInt(350); Sound.sfx("caw.wav", -14); }
function startMusic() { if (!musicStarted) { musicStarted = true; Sound.music(false); } }
function startGame() { intro = false; Sound.stopIntro(); startMusic(); Sound.pop(); slotScreen = true; refreshSlots(); }
function refreshSlots() {
  for (let k = 0; k < 3; k++) {
    slotLines[k] = null;
    const o = readSave(k);
    if (!o) continue;
    const st = nn(o.stage, 0), br = nn(o.branch, -1);
    const nm = st == 4 && br == 1 ? STAGE_NAME[5] : STAGE_NAME[Math.max(0, Math.min(4, st))];
    const secs = idiv(nn(o.playTicks, 0) * 30, 1000);
    slotLines[k] = [nm, "ALL TIME " + fmt(nn(o.totalEarned, 0)), "PLAYED " + idiv(secs, 3600) + "H " + (idiv(secs, 60) % 60) + "M", "SPORES " + nn(o.spores, 0), "" + Math.max(0, Math.min(4, st)) + (st == 4 && br == 1 ? "w" : "")];
  }
}
function pickSlot(k) {
  slot = k; resetAll();
  const had = readSave(k) != null;
  if (had) loadGame();
  slotScreen = false; paused = false; inShop = false; inStats = false; inHunt = false; fade = 30;
  Sound.pop(); Sound.music(false);
  if (had) applyOffline(); else showBanner("A NEW GAME BEGINS", C(160, 255, 240));
  if (!had) { inStats = true; page = 3; }
  saveGame();
}
function drawSlots(g) {
  const cream = C(255, 242, 208), cyan = C(127, 245, 232), gold = C(242, 193, 78), gray = C(120, 110, 140);
  g.drawImage(bg, 0, 0);
  g.setColor(C(6, 3, 16, 215)); g.fillRect(0, 0, w, h);
  g.setFont(bigFont); centered(g, "CHOOSE A SAVE SLOT", w / 2, 120, cream);
  g.setFont(smallFont); centered(g, "EACH SLOT IS ITS OWN GAME, WITH ITS OWN NAME. DELETE CLEARS A SLOT.", w / 2, 175, C(255, 226, 170));
  for (let k = 0; k < 3; k++) {
    const r = slotBox[k], hv = hoverSlot == k;
    g.setColor(hv ? cyan : gold); g.fillRect(r.x, r.y - (hv ? 6 : 0), r.width, r.height);
    g.setColor(hv ? C(30, 26, 62) : C(22, 11, 38)); g.fillRect(r.x + 6, r.y + 6 - (hv ? 6 : 0), r.width - 12, r.height - 12);
    const top = r.y - (hv ? 6 : 0), sl = slotLines[k];
    g.setFont(midFont); centered(g, "SLOT " + (k + 1), r.x + idiv(r.width, 2), top + 50, cream);
    if (sl == null) {
      g.drawImage(thumbSil[0], r.x + 110, top + 90, 200, 200);
      g.setFont(midFont); centered(g, "NEW GAME", r.x + idiv(r.width, 2), top + 350, gray);
    } else {
      const si = parseInt(sl[4].substring(0, 1)) + (sl[4].endsWith("w") ? 1 : 0);
      g.drawImage(thumbImg[Math.min(5, si)], r.x + 110, top + 90, 200, 200);
      g.setFont(midFont); centered(g, sl[0], r.x + idiv(r.width, 2), top + 330, cyan);
      g.setFont(smallFont);
      centered(g, sl[1], r.x + idiv(r.width, 2), top + 380, cream);
      centered(g, sl[2], r.x + idiv(r.width, 2), top + 410, cream);
      centered(g, sl[3], r.x + idiv(r.width, 2), top + 440, C(190, 160, 255));
    }
    if (sl != null) {
      const d = delBox(k), armed = delArm == k && Date.now() - delArmAt < 4000;
      g.setColor(armed ? C(220, 60, 60) : (hoverDel == k ? C(150, 60, 70) : C(70, 30, 50))); g.fillRect(d.x, d.y, d.width, d.height);
      g.setFont(smallFont); centered(g, armed ? "SURE?" : "DELETE", d.x + idiv(d.width, 2), d.y + 25, cream);
    }
    g.setFont(smallFont);
    if (Math.floor(Date.now() / 400) % 2 == 0 || hv) centered(g, "CLICK OR PRESS " + (k + 1), r.x + idiv(r.width, 2), top + 490, hv ? cyan : gray);
  }
}
function resetStar(i, anywhere) {
  starfield[i][0] = Math.random() * 2 - 1; starfield[i][1] = Math.random() * 2 - 1; starfield[i][2] = anywhere ? Math.random() * 0.98 + 0.02 : 1;
}
function burst(x, y, n, size, c) {
  for (let i = 0; i < n; i++) {
    const a = rand.nextDouble() * Math.PI * 2, v = 2 + rand.nextDouble() * 4;
    spore.push(new Spore(x, y, Math.cos(a) * v, Math.sin(a) * v - 2, 20 + rand.nextInt(14), size, c));
  }
}
function newWeather(type) {
  weather = type; weatherLeft = 1000 + rand.nextInt(900);
  for (let i = 0; i < wx.length; i++) {
    wx[i] = rand.nextInt(w); wy[i] = rand.nextInt(h);
    wvx[i] = type == 1 ? -3 : (rand.nextFloat() - 0.5);
    wvy[i] = type == 1 ? 22 + rand.nextFloat() * 8 : (type == 2 ? 1.5 + rand.nextFloat() * 2 : 0);
  }
}
