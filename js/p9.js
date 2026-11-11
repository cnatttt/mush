// ---- drawing helpers ----
function text(g, s, x, centerY, c) {
  const asc = g.ascent(), desc = g.descent();
  const y = centerY + Math.trunc((asc - desc) / 2), d = Math.max(1, Math.trunc(g.fontSize() / 8));
  g.setColor(C(13, 5, 24, c.a));
  g.drawString(s, x + d, y + d);
  g.setColor(c);
  g.drawString(s, x, y);
}
function centered(g, s, cx, cy, c) { text(g, s, cx - idiv(g.stringWidth(s), 2), cy, c); }
function elevation() { return Math.sin(2 * Math.PI * (dayTick % DAY_TICKS) / DAY_TICKS - Math.PI / 2); }
function drawSky(g) {
  const el = elevation(), nightA = Math.max(0, Math.min(1, (0.25 - el) / 0.75));
  if (nightA > 0) {
    g.setColor(C(6, 8, 50, Math.trunc(nightA * 135))); g.fillRect(0, 0, w, h);
    for (let i = 0; i < star.length; i++) {
      const tw = (Math.floor(tick / 12) + star[i][2]) % 5, a = Math.trunc(nightA * (tw == 0 ? 90 : 220));
      g.setColor(C(255, 250, 220, a)); g.fillRect(idiv(star[i][0], 6) * 6, idiv(star[i][1], 6) * 6, 6, 6);
    }
  }
  const dayA = Math.max(0, Math.min(1, (el - 0.1) / 0.6));
  if (dayA > 0) { g.setColor(C(255, 236, 190, Math.trunc(dayA * 40))); g.fillRect(0, 0, w, h); }
  const warm = Math.max(0, 1 - Math.abs(el) / 0.25);
  if (warm > 0) { g.setColor(C(255, 140, 60, Math.trunc(warm * 45))); g.fillRect(0, 0, w, h); }
  if (weather == 1) { g.setColor(C(20, 30, 70, 50)); g.fillRect(0, 0, w, h); }
  const prog = (dayTick % DAY_TICKS) / DAY_TICKS, day = prog > 0.25 && prog < 0.75;
  const u = day ? (prog - 0.25) / 0.5 : ((prog + 0.25) % 1.0) / 0.5;
  const cx = Math.trunc(w * (0.08 + 0.84 * u)), cy = Math.trunc(300 - Math.sin(u * Math.PI) * 230);
  for (let yy = -4; yy <= 4; yy++) for (let xx = -4; xx <= 4; xx++)
    if (xx * xx + yy * yy <= 17) {
      if (!day && (xx + 2) * (xx + 2) + (yy - 1) * (yy - 1) <= 11) continue;
      g.setColor(day ? C(255, 226, 120, 200) : C(225, 235, 255, 210));
      g.fillRect(idiv(cx, 6) * 6 + xx * 6, idiv(cy, 6) * 6 + yy * 6, 6, 6);
    }
}
function drawWeather(g) {
  if (weather == 0) return;
  for (let i = 0; i < wx.length; i++) {
    const x = idiv(Math.trunc(wx[i]), 3) * 3, y = idiv(Math.trunc(wy[i]), 3) * 3;
    if (weather == 1 && i < 110) { g.setColor(C(190, 215, 255, 185)); g.fillRect(x, y, 3, 18); }
    else if (weather == 2 && i < 90) { g.setColor(C(245, 250, 255, 220)); g.fillRect(x, y, i % 3 == 0 ? 6 : 3, i % 3 == 0 ? 6 : 3); }
    else if (weather == 3 && i < 28) {
      const a = Math.trunc(60 + 195 * Math.max(0, Math.sin((tick + i * 13) * 0.07)));
      g.setColor(C(255, 230, 110, idiv(a, 4))); g.fillRect(x - 3, y - 3, 12, 12);
      g.setColor(C(255, 240, 150, a)); g.fillRect(x, y, 6, 6);
    }
  }
}
function drawSeasonFx(g) {
  for (let i = 0; i < spx.length; i++) {
    const x = idiv(Math.trunc(spx[i]), 3) * 3, y = idiv(Math.trunc(spy[i]), 3) * 3;
    if (season == 0) { g.setColor(C(255, 170, 205, 220)); g.fillRect(x, y, 6, 3); g.setColor(C(255, 215, 230, 220)); g.fillRect(x + 3, y - 3, 3, 3); }
    else if (season == 1) { const a = Math.trunc(90 + 150 * Math.max(0, Math.sin((tick + i * 17) * 0.06))); g.setColor(C(255, 236, 120, a)); g.fillRect(x, y, 3, 3); }
    else if (season == 2) { g.setColor(i % 2 == 0 ? C(232, 120, 40, 230) : C(200, 70, 30, 230)); g.fillRect(x, y, 6, 6); g.setColor(C(130, 60, 20, 230)); g.fillRect(x + 3, y + 3, 3, 3); }
    else { g.setColor(C(240, 248, 255, 230)); g.fillRect(x, y, i % 3 == 0 ? 6 : 3, i % 3 == 0 ? 6 : 3); }
  }
}
function drawPauseBtn(g) {
  const b = pauseBtn;
  g.setColor(C(13, 5, 24, 210)); g.fillRect(b.x, b.y, b.width, b.height);
  g.setColor(hoverPauseBtn ? C(127, 245, 232) : C(255, 242, 208));
  g.fillRect(b.x, b.y, b.width, 4); g.fillRect(b.x, b.y + b.height - 4, b.width, 4); g.fillRect(b.x, b.y, 4, b.height); g.fillRect(b.x + b.width - 4, b.y, 4, b.height);
  g.fillRect(b.x + 16, b.y + 14, 8, 28); g.fillRect(b.x + 32, b.y + 14, 8, 28);
}
function drawBubble(g) {
  if (bubble.length == 0) return;
  g.setFont(smallFont);
  const lines = []; let line = "";
  for (const word of bubble.split(" ")) {
    if (line.length > 0 && line.length + 1 + word.length > 17) { lines.push(line); line = word; }
    else line = line.length == 0 ? word : line + " " + word;
  }
  lines.push(line);
  const lh = 26, bw = 17 * 16 + 40, bh = lines.length * lh + 28, bx = 60, by = 468 - 22 - bh;
  g.setColor(C(13, 5, 24)); g.fillRect(bx + 4, by, bw - 8, bh); g.fillRect(bx, by + 4, bw, bh - 8);
  g.setColor(C(255, 242, 208)); g.fillRect(bx + 8, by + 4, bw - 16, bh - 8); g.fillRect(bx + 4, by + 8, bw - 8, bh - 16);
  g.setColor(C(13, 5, 24)); g.fillRect(bx + 60, by + bh, 28, 6); g.fillRect(bx + 68, by + bh + 6, 16, 6); g.fillRect(bx + 72, by + bh + 12, 8, 6);
  g.setColor(C(255, 242, 208)); g.fillRect(bx + 64, by + bh - 4, 20, 6); g.fillRect(bx + 72, by + bh + 2, 8, 6);
  g.setColor(C(50, 24, 60));
  let shown = bubbleChars;
  for (let i = 0; i < lines.length; i++) {
    const s = lines[i], n = Math.min(s.length, Math.max(0, shown));
    g.drawString(s.substring(0, n), bx + 20, by + 14 + i * lh + 16);
    shown -= s.length + 1;
  }
}
function tabShown(i) { if (i < 4) return true; if (i == 4) return spores > 0 || runEarned >= 1000000; if (i == 5) return totalEarned >= 2500; return totalEarned >= 400000; }
function baseMult() { return mult() / (frenzy > 0 ? (owned[27] > 0 ? 7 : 5) : 1); }
function tm(secs) {
  const s = Math.ceil(secs);
  if (s < 60) return s + "S"; if (s < 3600) return idiv(s, 60) + "M" + (s % 60) + "S";
  if (s < 360000) return idiv(s, 3600) + "H" + (idiv(s, 60) % 60) + "M"; return "99H+";
}
function tip() {
  if (clicks == 0) return "CLICK THE MUSHROOM OR PRESS SPACE";
  if (owned[0] == 0 && count >= 25) return "CLICK THE SHOP SIGN AND BUY GLOVES!";
  if (owned[4] == 0 && count >= 150) return "BUY A FARM - IT MAKES MUSHROOMS FOR YOU!";
  return null;
}
function info(i) {
  if (i < 4) return "+" + fmt(amount[i]) + " PER CLICK  X" + owned[i];
  if (i < 8) return "+" + fmt(amount[i]) + " PER SEC  X" + owned[i];
  if (i < 12) return skin == i - 8 ? "EQUIPPED" : (skinOwned[i - 8] ? "OWNED - CLICK TO WEAR" : "NEW MUSHROOM COLOR");
  if (i >= 16 && i < 20) { const L = owned[i]; return ["FARMS AT START: " + 10 * L, "FARM INCOME +" + 25 * L + "%", "CRIT CHANCE +" + Math.min(30, 3 * L) + "%", "GOLDEN LASTS " + (1 + L) + "X"][i - 16] + "  LV" + L; }
  return perkInfo[i - 12];
}
function drawMute(g) {
  const b = muteBox;
  g.setColor(C(13, 5, 24, 210)); g.fillRect(b.x, b.y, b.width, b.height);
  g.setColor(hoverMute ? C(127, 245, 232) : C(255, 242, 208));
  g.fillRect(b.x, b.y, b.width, 4); g.fillRect(b.x, b.y + b.height - 4, b.width, 4); g.fillRect(b.x, b.y, 4, b.height); g.fillRect(b.x + b.width - 4, b.y, 4, b.height);
  const lv = Sound.level(), x = b.x + 10, y = b.y + 18;
  g.setColor(C(255, 242, 208)); g.fillRect(x, y + 6, 8, 10); g.fillRect(x + 8, y + 2, 4, 18); g.fillRect(x + 12, y - 2, 4, 26);
  if (lv == 3) { g.setColor(C(255, 107, 107)); for (let k = 0; k < 4; k++) { g.fillRect(x + 22 + k * 4, y + 2 + k * 4, 4, 4); g.fillRect(x + 22 + k * 4, y + 14 - k * 4, 4, 4); } }
  else for (let k = 0; k < 3 - lv; k++) { g.setColor(C(127, 245, 232)); g.fillRect(x + 22 + k * 7, y + 10 - k * 4, 4, 4 + k * 8); }
}
function dark(src) {
  const [cv, x, d] = pixels(src), a = d.data;
  for (let i = 0; i < a.length; i += 4) if (a[i + 3] > 0) { a[i] = 0x2A; a[i + 1] = 0x1A; a[i + 2] = 0x44; a[i + 3] = 255; }
  x.putImageData(d, 0, 0); return cv;
}
