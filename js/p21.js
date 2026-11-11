// ---- dark atmosphere: gloom that grows with progress, fog, watching eyes, ash, blood moons, ominous sound ----
let bloodMoon = false, lastBM = false, vigCv = null, edgeCv = null, eyeList = null;
function gloom() { return Math.max(0, Math.min(1, (Math.log10(totalEarned + 1) - 2.6) / 7)); }
function nightIdx() { return Math.floor((dayTick + DAY_TICKS * 0.25) / DAY_TICKS); }
function atmoTick() {
  const bm = elevation() < 0 && nightIdx() >= 3 && nightIdx() % 4 == 3;
  if (bm && !lastBM) { X.moons++; showBanner("THE BLOOD MOON RISES...", C(255, 70, 70)); Sound.sfx("caw.wav", -4); }
  if (!bm && lastBM) showBanner("THE BLOOD MOON FADES", C(255, 170, 150));
  lastBM = bm; bloodMoon = bm;
  if (bm) {      // the Blight and the golden mushrooms come twice as fast
    if (!bossOn && nextBoss > 1) nextBoss--;
    if (!goldenOn && nextGolden > 1) nextGolden--;
  }
  const g = gloom(), night = elevation() < 0;
  if (tick % 60 == 0 && !inPotion) Sound.droneSet(Math.min(1, 0.1 + g * 0.55 + (night ? 0.15 : 0) + (bm ? 0.2 : 0) + (bossOn ? 0.25 : 0)));
  if (g > 0.2 && night && lobbyViewDraw() && rand.nextInt(1100) == 0) Sound.sfx("caw.wav", -26);
  if (bossOn && lobbyViewDraw() && tick % 28 == 0) Sound.thump();
}
function buildAtmo() {
  const v = mk(1470, 956), x = v.getContext("2d"), gr = x.createRadialGradient(735, 478, 240, 735, 478, 900);
  gr.addColorStop(0, "rgba(10,0,24,0)"); gr.addColorStop(0.6, "rgba(18,6,34,.55)"); gr.addColorStop(1, "rgba(4,0,10,.95)");
  x.fillStyle = gr; x.fillRect(0, 0, 1470, 956); vigCv = v;
  const e = mk(1470, 956), y2 = e.getContext("2d"), rnd = mulb(311);
  for (let i = 0; i < 240; i++) {   // thorny corruption creeping in from every edge
    const side = i % 4, len = 60 + rnd() * 230;
    let px = side == 0 ? rnd() * 1470 : side == 1 ? rnd() * 1470 : side == 2 ? 0 : 1470, py = side == 0 ? 0 : side == 1 ? 956 : rnd() * 956;
    const dx = side == 2 ? 1 : side == 3 ? -1 : 0, dy = side == 0 ? 1 : side == 1 ? -1 : 0;
    for (let s = 0; s < len; s += 6) {
      px += dx * 6 + (dy != 0 ? (rnd() - 0.5) * 14 : 0); py += dy * 6 + (dx != 0 ? (rnd() - 0.5) * 14 : 0);
      const th = Math.max(3, 21 - s / 10);
      y2.fillStyle = "#0a0412"; y2.fillRect(Math.round(px / 3) * 3, Math.round(py / 3) * 3, th, th);
      if (s % 18 == 0) { y2.fillStyle = "rgba(120,220,90,.55)"; y2.fillRect(Math.round(px / 3) * 3 + 3, Math.round(py / 3) * 3, 3, 3); }
    }
  }
  edgeCv = e;
  eyeList = []; const r2 = mulb(909);
  for (let i = 0; i < 14; i++) {
    const left = r2() < 0.5;
    eyeList.push({ x: left ? 20 + r2() * 320 : 1120 + r2() * 300, y: 170 + r2() * 480, gap: 12 + r2() * 8, per: 500 + Math.floor(r2() * 900), off: Math.floor(r2() * 1500), hue: Math.floor(r2() * 3) });
  }
}
function drawUnder(g) {
  if (!vigCv) buildAtmo();
  const gl = gloom(), oc = g.getAlpha();
  if (bloodMoon) {
    g.setColor(C(130, 8, 18, 70 + Math.trunc(Math.sin(tick * 0.05) * 10))); g.fillRect(0, 0, w, h);
    drawFx(g, fxGlow, C(255, 40, 40), 600, 290, 420, 0.55 + Math.sin(tick * 0.04) * 0.08, 0);
    g.setColor(C(205, 30, 36)); for (let r = -46; r <= 46; r += 2) { const hw = Math.trunc(Math.sqrt(46 * 46 - r * r)); g.fillRect(600 - hw, 290 + r, hw * 2, 2); }
    g.setColor(C(150, 14, 24)); g.fillRect(582, 276, 14, 10); g.fillRect(612, 304, 18, 12); g.fillRect(590, 314, 8, 6);
  }
  if (gl > 0.02) {
    g.setAlpha(Math.min(1, gl * 1.3)); g.drawImage(vigCv, 0, 0);
    g.setAlpha(Math.min(1, gl * 1.4)); g.drawImage(edgeCv, 0, 0);
    g.setAlpha(oc);
    g.setColor(C(30, 8, 50, Math.trunc(gl * 85))); g.fillRect(0, 0, w, h);
  }
  const fa = 0.05 + gl * 0.16 + (elevation() < 0 ? 0.06 : 0);
  for (let i = 0; i < 7; i++) {   // low drifting fog
    const fx = ((i * 331 + tick * (0.2 + i * 0.05)) % (w + 800)) - 400, fy = 620 + (i % 3) * 110 + Math.sin(tick * 0.01 + i) * 14;
    drawFx(g, fxGlow, bloodMoon ? C(150, 60, 70) : C(120, 150, 140), fx, fy, 760, fa, 0);
  }
  const n = gl > 0.08 ? Math.min(14, 1 + Math.floor(gl * 11) + (elevation() < 0 ? 3 : 0)) : 0;
  for (let i = 0; i < n; i++) {   // eyes in the dark that blink and vanish
    const e = eyeList[i], ph = (tick + e.off) % e.per;
    if (ph > 240) continue;
    const a = Math.min(1, Math.min(ph / 30, (240 - ph) / 40)), blink = (ph % 80) < 5;
    const col = bloodMoon ? C(255, 50, 50) : [C(170, 255, 90), C(255, 190, 60), C(255, 70, 70)][e.hue];
    g.setAlpha(a * 0.9); drawFx(g, fxGlow, col, e.x + e.gap / 2, e.y, 70, 0.7, 0);
    g.setAlpha(a); g.setColor(col);
    if (!blink) { g.fillRect(Math.trunc(e.x), Math.trunc(e.y) - 3, 9, 6); g.fillRect(Math.trunc(e.x + e.gap + 9), Math.trunc(e.y) - 3, 9, 6); g.setColor(C(10, 0, 14)); g.fillRect(Math.trunc(e.x) + 3, Math.trunc(e.y) - 3, 3, 6); g.fillRect(Math.trunc(e.x + e.gap + 12), Math.trunc(e.y) - 3, 3, 6); }
    else g.fillRect(Math.trunc(e.x), Math.trunc(e.y), 9, 2), g.fillRect(Math.trunc(e.x + e.gap + 9), Math.trunc(e.y), 9, 2);
    g.setAlpha(oc);
  }
}
function drawAsh(g) {
  const n = 8 + Math.floor(gloom() * 34), up = bloodMoon;
  for (let i = 0; i < n; i++) {
    const sp = 0.4 + (i % 5) * 0.18, x = (((i * 83 + tick * (0.25 + (i % 4) * 0.12) + Math.sin(tick * 0.02 + i) * 24) % w) + w) % w;
    const y = up ? h - ((i * 131 + tick * sp) % h) : (i * 131 + tick * sp) % h;
    g.setColor(up ? C(255, 120 + (i % 3) * 30, 40, 190) : C(80, 70, 92, 170));
    const s = i % 3 == 0 ? 6 : 3; g.fillRect(Math.trunc(x / 3) * 3, Math.trunc(y / 3) * 3, s, s);
  }
}
