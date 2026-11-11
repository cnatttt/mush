// ---- trailer + ending ----
function gradFill(g, c1, c2) {
  const gr = g.ctx.createLinearGradient(0, h, 0, idiv(h, 3));
  gr.addColorStop(0, c1.css); gr.addColorStop(1, c2.css);
  g.ctx.fillStyle = gr; g.ctx.fillRect(0, 0, w, h);
}
function paintIntro(g) {
  const T = introTick * 0.03, title = introTick >= TITLE_TICK;
  g.setColor(C(0, 0, 0)); g.fillRect(0, 0, w, h);
  const cx = idiv(w, 2), ground = 840, glowK = Math.min(1, T / 9.5);
  gradFill(g, C(60, 20, 110, Math.trunc(140 * glowK)), C(0, 0, 0, 0));
  const sx = introTick >= 270 && !title ? 1 : 0;
  for (let i = 0; i < starfield.length; i++) {
    const z = starfield[i][2], px = Math.trunc(cx + starfield[i][0] / z * 380), py = Math.trunc(h / 2 + starfield[i][1] / z * 380);
    if (px < 0 || px >= w || py < 0 || py >= h) continue;
    const a = Math.trunc(Math.min(1, T / 1.5) * 255 * (1 - z * 0.6));
    g.setColor(C(235, 245, 255, Math.max(0, Math.min(255, a))));
    if (sx == 1) { const px2 = Math.trunc(cx + starfield[i][0] / (z + 0.12) * 380), py2 = Math.trunc(h / 2 + starfield[i][1] / (z + 0.12) * 380); g.drawLine(px, py, px2, py2); }
    else g.fillRect(idiv(px, 3) * 3, idiv(py, 3) * 3, z < 0.4 ? 6 : 3, z < 0.4 ? 6 : 3);
  }
  for (const s of spore) { g.setColor(C(s.c.r, s.c.g, s.c.b, 120)); g.fillRect(idiv(Math.trunc(s.x), 3) * 3, idiv(Math.trunc(s.y), 3) * 3, s.size, s.size); }
  let caption = "";
  if (!title) {
    let shakeX = 0, shakeY = 0;
    if (T > 8) { const amp = (T - 8) * 2.2; shakeX = Math.trunc((rand.nextDouble() - 0.5) * amp); shakeY = Math.trunc((rand.nextDouble() - 0.5) * amp); }
    g.translate(shakeX, shakeY);
    if (T < 2.0) {
      const pulse = 1 + Math.sin(T * 6) * 0.25, r = Math.trunc(14 * pulse * Math.min(1, T * 1.5));
      g.setColor(C(158, 232, 118, 40));
      g.fillRect(cx - idiv(idiv(r * 3, 6) * 6, 1), 560 - idiv(r * 3, 6) * 6, idiv(r * 6, 6) * 6, idiv(r * 6, 6) * 6);
      g.setColor(C(158, 232, 118));
      g.fillRect(cx - idiv(idiv(r, 2), 3) * 3, 560 - idiv(idiv(r, 2), 3) * 3, Math.max(6, idiv(r, 3) * 3), Math.max(6, idiv(r, 3) * 3));
      g.setColor(C(255, 255, 255)); g.fillRect(cx - 3, 557, 6, 6);
      if (T > 0.5) ring(g, cx, 560, (T - 0.5) * 220, 220 - Math.trunc((T - 0.5) * 140), C(158, 232, 118));
      if (T > 1.0) ring(g, cx, 560, (T - 1.0) * 220, 220 - Math.trunc((T - 1.0) * 140), C(190, 160, 255));
    } else if (T < 4.0) {
      const k = Math.min(6, 1 + Math.trunc((T - 2.0) * 2.8));
      stageAt(g, 0, k, cx, ground); caption = "IT BEGINS WITH A SPORE...";
    } else if (T < 8.0) {
      const s = Math.min(4, 1 + Math.trunc(T - 4.0)), local = (T - 4.0) - (s - 1), k = local < 0.18 ? 7 : 6;
      stageAt(g, s, k, cx, ground);
      if (local < 0.5) ring(g, cx, ground - 220, local * 700, 230 - Math.trunc(local * 450), C(255, 226, 120));
      caption = STAGE_NAME[s];
    } else {
      const k = Math.min(9, 6 + Math.trunc((T - 8.0) * 1.6));
      stageAt(g, 4, k, cx, ground + (k - 6) * 12);
      const b = (T - 8.0) % 0.5;
      ring(g, cx, ground - 250, b * 1600, 230 - Math.trunc(b * 440), C(158, 232, 118));
      caption = "";
    }
    g.translate(-shakeX, -shakeY);
  } else {
    const tt = (introTick - TITLE_TICK) * 0.03, bobv = Math.trunc(Math.trunc(Math.sin(tt * 1.6) * 8) / 2) * 2;
    stageAt(g, 4, 6, cx, 840 + bobv);
    for (let i = 0; i < 20; i++) {
      const a = tt * 0.9 + i * Math.PI * 2 / 20, ox = idiv(Math.trunc(cx + Math.cos(a) * 420), 6) * 6, oy = idiv(Math.trunc(610 + Math.sin(a) * 120), 6) * 6;
      g.setColor(i % 2 == 0 ? C(158, 232, 118) : C(200, 160, 255)); g.fillRect(ox, oy, 6, 6);
    }
    g.setFont(titleFont);
    const letters = Math.min(TITLE.length, Math.trunc(tt / 0.07)), tw = g.stringWidth(TITLE), tx = cx - idiv(tw, 2), ty = 220;
    const sh = tt < 0.7 ? Math.trunc((rand.nextDouble() - 0.5) * 20 * (0.7 - tt)) : 0, shown = TITLE.substring(0, letters);
    g.setColor(C(13, 5, 24)); g.drawString(shown, tx + 8 + sh, ty + 8);
    g.setColor(C(100, 40, 170)); g.drawString(shown, tx + 4 + sh, ty + 4);
    g.setColor(C(255, 242, 208)); g.drawString(shown, tx + sh, ty);
    if (tt > 1.4) {
      g.setFont(midFont);
      if (Math.floor(introTick / 18) % 2 == 0) centered(g, "CLICK TO START", cx, 900, C(158, 232, 118));
      g.setFont(smallFont); centered(g, "M = VOLUME", cx, 936, C(150, 140, 170));
    }
  }
  if (caption.length > 0) {
    g.setFont(midFont);
    const life = T < 4 ? Math.min(1, (T - 2.0) / 0.5) : 1;
    centered(g, caption, cx, 880, C(255, 242, 208, Math.trunc(255 * Math.max(0, life))));
  }
  const bar = Math.trunc(Math.max(0, 90 - T * 45));
  g.setColor(C(0, 0, 0)); g.fillRect(0, 0, w, bar); g.fillRect(0, h - bar, w, bar);
  const fl = T > 9.5 && !title ? (T - 9.5) * 2 : 0, fa = Math.max(Math.trunc(fl * 255), whiteFlash * 20);
  if (fa > 0) { g.setColor(C(255, 255, 255, Math.min(255, fa))); g.fillRect(0, 0, w, h); }
  if (T < 1) { g.setColor(C(0, 0, 0, Math.trunc(255 * (1 - T)))); g.fillRect(0, 0, w, h); }
  if (!title) { g.setFont(smallFont); text(g, "CLICK TO SKIP", w - 250, h - 30, C(255, 242, 208, 110)); }
}
function petX(i) { return signBox.x + 6 + i * 84; }
function paintEnding(g) {
  const t = endTick * 0.03, cx = idiv(w, 2);
  g.setColor(C(0, 0, 0)); g.fillRect(0, 0, w, h);
  gradFill(g, C(90, 30, 150, 150), C(0, 0, 0, 0));
  for (let i = 0; i < starfield.length; i++) {
    const z = starfield[i][2], px = Math.trunc(cx + starfield[i][0] / z * 380), py = Math.trunc(h / 2 + starfield[i][1] / z * 380);
    if (px < 0 || px >= w || py < 0 || py >= h) continue;
    g.setColor(C(235, 245, 255, Math.max(0, Math.min(255, Math.trunc(255 * (1 - z * 0.6))))));
    g.fillRect(idiv(px, 3) * 3, idiv(py, 3) * 3, z < 0.4 ? 6 : 3, z < 0.4 ? 6 : 3);
  }
  const bobv = Math.trunc(Math.trunc(Math.sin(t * 1.4) * 8) / 2) * 2;
  stageAt(g, 4, 8, cx, 930 + bobv);
  for (let i = 0; i < 28; i++) {
    const a = t * 0.7 + i * Math.PI * 2 / 28;
    g.setColor(i % 2 == 0 ? C(158, 232, 118) : C(200, 160, 255));
    g.fillRect(idiv(Math.trunc(cx + Math.cos(a) * 520), 6) * 6, idiv(Math.trunc(560 + Math.sin(a) * 150), 6) * 6, 6, 6);
  }
  const lines = ["YOU DID IT.", "THE SPORES COVER THE WORLD.", "EVERY CORNER BLOOMS.", "THE GREAT MYCELIUM AWAKENS.", "BUT THE BLIGHT WAS NEVER YOUR ENEMY.", "IT WAS THE PART OF YOU THAT REMEMBERED.", "YOU HAVE BEEN FEEDING ON IT ALL ALONG."];
  g.setFont(bigFont);
  for (let i = 0; i < lines.length; i++) {
    const a = t - (2 + i * 3.5);
    if (a > 0 && a < 3.5) {
      const al = Math.min(1, Math.min(a / 0.6, (3.5 - a) / 0.6)), sh = lines[i].substring(0, Math.min(lines[i].length, Math.trunc(a / 0.04)));
      centered(g, sh, cx, 170, C(255, 242, 208, Math.trunc(255 * Math.max(0, al))));
    }
  }
  if (t >= 27.5) {
    g.setFont(titleFont); centered(g, "THE END", cx, 150, C(255, 226, 120));
    g.setFont(midFont); centered(g, "THANK YOU FOR PLAYING", cx, 240, C(255, 242, 208));
    g.setFont(smallFont); centered(g, "THE HOLLOW FORM AWAKENS WITHIN YOU...", cx, 330, C(158, 232, 118));
    const secs = idiv(playTicks * 30, 1000);
    centered(g, "TIME " + idiv(secs, 60) + "M " + (secs % 60) + "S   CLICKS " + fmt(clicks) + "   SPORES " + spores, cx, 290, C(158, 232, 118));
  }
  if (endTick >= 1000 && Math.floor(endTick / 18) % 2 == 0) { g.setFont(midFont); centered(g, "CLICK TO KEEP GROWING", cx, 900, C(158, 232, 118)); }
  if (t < 1.5) { g.setColor(C(0, 0, 0, Math.trunc(255 * (1 - t / 1.5)))); g.fillRect(0, 0, w, h); }
}
