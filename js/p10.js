function wrap(s, max) {
  const lines = []; let line = "";
  for (const word of s.split(" ")) {
    if (line.length > 0 && line.length + 1 + word.length > max) { lines.push(line); line = word; }
    else line = line.length == 0 ? word : line + " " + word;
  }
  lines.push(line); return lines;
}
function drawTree(g) {
  bigPanel(g);
  const cream = C(255, 242, 208), cyan = C(127, 245, 232), gray = C(120, 110, 140), gold = C(242, 193, 78), orange = C(255, 150, 60);
  g.setFont(bigFont); centered(g, "MUSHROOM TREE", w / 2, 135, cream);
  g.setFont(smallFont); centered(g, "EVERY STAGE GIVES A BONUS. CLICK A SKIN BELOW TO WEAR IT.", w / 2, 172, C(255, 226, 170));
  const cw = 190, gap = 14, x0 = idiv(w - (6 * cw + 5 * gap), 2), cy0 = 205, ch = 430, cur = stage < 4 ? stage : 4 + Math.max(0, branch);
  for (let c = 0; c < 6; c++) {
    const s = Math.min(c, 4), x = x0 + c * (cw + gap), cx = x + idiv(cw, 2);
    let reached, here, next, lost = false;
    if (c < 4) { reached = stage >= c; here = stage == c; next = stage + 1 == c; }
    else { reached = stage >= 4 && branch == c - 4; here = reached; next = stage == 3; lost = stage >= 4 && branch != c - 4; }
    if (c >= 1 && c <= 4) { g.setColor(reached || (c == 4 && stage >= 4) ? gold : C(70, 56, 92)); for (let xx = x - gap; xx < x; xx += 8) g.fillRect(xx, cy0 + 96, 4, 6); }
    const border = here ? cyan : (reached ? gold : (next ? orange : C(70, 56, 92)));
    g.setColor(border); g.fillRect(x, cy0, cw, ch);
    g.setColor(here ? C(24, 20, 52) : C(22, 11, 38)); g.fillRect(x + 4, cy0 + 4, cw - 8, ch - 8);
    g.drawImage(reached ? (here ? fitCached(mush) : thumbImg[c == 5 ? 5 : s]) : thumbSil[c == 5 ? 5 : s], x + 15, cy0 + 14, 160, 160);
    g.setFont(smallFont);
    const nm = wrap(STAGE_NAME[c], 10);
    for (let li = 0; li < 2 && li < nm.length; li++) centered(g, nm[li], cx, cy0 + 198 + li * 22, reached ? cream : C(190, 180, 210));
    const st = lost ? "NOT CHOSEN" : (here ? "CURRENT" : (reached ? "EVOLVED" : (next ? (c >= 4 ? "CHOOSE ONE" : "NEXT UP") : "LOCKED")));
    centered(g, st, cx, cy0 + 252, lost ? gray : (here ? cyan : (reached ? gold : (next ? orange : gray))));
    text(g, "NEEDS", x + 15, cy0 + 288, gray);
    centered(g, c == 0 ? "NOTHING" : fmt(STAGE_AT[s]) + " TOTAL", cx, cy0 + 310, reached ? cream : C(255, 226, 170));
    if (next && c < 4) {
      g.setColor(C(70, 56, 92)); g.fillRect(x + 15, cy0 + 332, cw - 30, 14);
      g.setColor(orange); g.fillRect(x + 15, cy0 + 332, Math.trunc((cw - 30) * Math.min(1.0, totalEarned / STAGE_AT[s])), 14);
    }
    text(g, "BONUS", x + 15, cy0 + 366, gray);
    const fx = wrap(STAGE_FX[c], 10);
    for (let li = 0; li < fx.length && li < 2; li++) text(g, fx[li], x + 15, cy0 + 390 + li * 20, reached ? cyan : gray);
  }
  const fl = x0 + 4 * (cw + gap) + idiv(cw, 2), fr = x0 + 5 * (cw + gap) + idiv(cw, 2), fy = cy0 - 10;
  g.setColor(stage >= 4 ? gold : (stage == 3 ? orange : C(70, 56, 92)));
  g.fillRect(fl, fy, 60, 4); g.fillRect(fr - 60, fy, 64, 4); g.fillRect(fl, fy, 4, 10); g.fillRect(fr, fy, 4, 10);
  g.setFont(smallFont); centered(g, "OR", idiv(fl + fr, 2) + 2, fy + 2, stage >= 4 ? gold : (stage == 3 ? orange : gray));
  const cxHere = x0 + cur * (cw + gap) + idiv(cw, 2), barL = Math.min(cxHere, thumbBox[0].x + 50), barR = Math.max(cxHere, thumbBox[7].x + 50);
  g.setColor(C(194, 138, 66)); g.fillRect(cxHere - 3, cy0 + ch, 6, 663 - cy0 - ch + 3); g.fillRect(barL, 660, barR - barL, 6);
  g.setFont(smallFont);
  for (let k = 0; k < 8; k++) {
    const tx = thumbBox[k].x + 50;
    g.setColor(C(194, 138, 66)); g.fillRect(tx - 3, 660, 6, 14);
    g.setColor(skin == k ? cyan : (skinOwned[k] ? gold : C(70, 56, 92))); g.fillRect(thumbBox[k].x, thumbBox[k].y + 6, 100, 100);
    g.setColor(C(22, 11, 38)); g.fillRect(thumbBox[k].x + 4, thumbBox[k].y + 10, 92, 92);
    if (!skinOwned[k]) g.setAlpha(0.4);
    g.drawImage(skinThumbFit(k), tx - 40, thumbBox[k].y + 16, 80, 80);
    g.setAlpha(1);
    const st = skin == k ? "ON" : (skinOwned[k] ? "OWNED" : (k < 4 ? fmt(baseCost[8 + k]) : SEASON_NAME[k - 4].substring(0, 3) + " 2M"));
    centered(g, SKIN_NAME[k], tx, 790, skin == k ? cyan : (skinOwned[k] ? gold : gray));
    centered(g, st, tx, 810, skin == k ? cyan : (skinOwned[k] ? gold : gray));
  }
  g.drawImage(hoverBack ? backHover : back, backBox.x, backBox.y);
  g.setFont(bigFont); text(g, "BACK", backBox.x + 44, backBox.y + 38, cream);
}
let skinFit = {};
function skinThumbSrc(k) { return skinThumb[k]; }
function skinThumbFit(k) { const key = k + ":" + imgIdx() + ":" + skin; if (!skinFit[key]) { if (Object.keys(skinFit).length > 40) skinFit = {}; skinFit[key] = fitBox(skinThumbSrc(k)); } return skinFit[key]; }
function drawChoose(g) {
  const cream = C(255, 242, 208), cyan = C(127, 245, 232), gold = C(242, 193, 78);
  g.setColor(C(6, 3, 16, 238)); g.fillRect(0, 0, w, h);
  g.setFont(bigFont); centered(g, "CHOOSE YOUR FINAL FORM", w / 2, 110, cream);
  g.setFont(smallFont); centered(g, "THIS CHOICE IS FOREVER", w / 2, 160, C(255, 226, 170));
  const nm = ["COSMIC", "THORNBACK"], b1 = ["+25% INCOME", "+30% CLICK POWER"], b2 = ["FOREVER", "FOREVER"], ds = ["A SKY OF STARS.", "WILD AND FIERCE."];
  for (let k = 0; k < 2; k++) {
    const r = chooseBox[k], hv = hoverChoose == k;
    g.setColor(hv ? cyan : gold); g.fillRect(r.x, r.y, r.width, r.height);
    g.setColor(hv ? C(30, 26, 62) : C(22, 11, 38)); g.fillRect(r.x + 6, r.y + 6, r.width - 12, r.height - 12);
    g.drawImage(thumbImg[4 + k], r.x + 50, r.y + 16 - (hv ? 6 : 0), 320, 320);
    g.setFont(midFont); centered(g, nm[k], r.x + idiv(r.width, 2), r.y + 370, cream);
    g.setFont(smallFont);
    centered(g, b1[k], r.x + idiv(r.width, 2), r.y + 420, cyan); centered(g, b2[k], r.x + idiv(r.width, 2), r.y + 446, cyan);
    centered(g, ds[k], r.x + idiv(r.width, 2), r.y + 490, C(255, 226, 170));
    if (Math.floor(Date.now() / 400) % 2 == 0 || hv) centered(g, "CLICK OR PRESS " + (k + 1), r.x + idiv(r.width, 2), r.y + 550, hv ? cyan : cream);
  }
}
function drawStats(g) {
  if (page == 1) { drawTree(g); drawFormsBtn(g, "NEW FORMS >"); return; }
  if (page == 5) { drawForms(g); return; }
  if (page == 2) { drawBook(g); return; }
  if (page == 3) { drawInfo(g); return; }
  if (page == 4) { drawAdmin(g); return; }
  bigPanel(g);
  const cream = C(255, 242, 208), cyan = C(127, 245, 232), gray = C(120, 110, 140);
  g.setFont(bigFont); centered(g, "STATS & TROPHIES", w / 2, 140, cream);
  g.setFont(smallFont);
  const secs = idiv(playTicks * 30, 1000);
  const rows = [["CLICKS", fmt(clicks)], ["CRITS", fmt(crits)], ["GOLDEN CAUGHT", "" + goldCaught], ["CROW GIFTS", "" + crowGifts],
    ["ALL TIME", fmt(totalEarned)], ["THIS RUN", fmt(runEarned)], ["PER CLICK", fmt(clickPower)], ["PER SECOND", fmt(secGain())],
    ["SPORES", spores + " (" + (spores - spentSpores) + " LEFT)"], ["RESETS", "" + prestiges], ["STAGE", STAGE_NAME[stage]],
    ["SEASON", SEASON_NAME[season] + " / " + WEATHER_NAME[weather]], ["BLIGHTS / HUNT BEST", bossKills + " / " + huntBest], ["PLAY TIME", idiv(secs, 60) + "M " + (secs % 60) + "S"]];
  for (let i = 0; i < rows.length; i++) { text(g, rows[i][0], 150, 206 + i * 41, C(255, 226, 170)); text(g, rows[i][1], 150, 230 + i * 41, cyan); }
  let done = 0; for (const b of ach) if (b) done++;
  g.setFont(midFont); text(g, "TROPHIES " + done + "/" + ach.length, 620, 210, cream);
  g.setFont(smallFont);
  for (let i = 0; i < ach.length; i++) {
    const col = Math.floor(i / 13), row = i % 13, x = 620 + col * 380, y = 262 + row * 42;
    g.setColor(ach[i] ? C(242, 193, 78) : C(60, 48, 80)); g.fillRect(x, y - 14, 28, 28);
    g.setColor(C(13, 5, 24)); g.fillRect(x + 4, y - 10, 20, 20);
    if (ach[i]) { g.setColor(C(242, 193, 78)); g.fillRect(x + 8, y - 2, 4, 4); g.fillRect(x + 12, y + 2, 4, 4); g.fillRect(x + 16, y - 6, 4, 8); }
    text(g, ach[i] ? ACH_NAME[i] : "???", x + 44, y - 10, ach[i] ? cream : gray);
    text(g, ACH_DESC[i], x + 44, y + 12, ach[i] ? C(255, 226, 170) : gray);
  }
  g.drawImage(hoverBack ? backHover : back, backBox.x, backBox.y);
  g.setFont(bigFont); text(g, "BACK", backBox.x + 44, backBox.y + 38, cream);
}
function stageAt(g, s, k, cx, ground) {
  const size = idiv(introImg[s].width * k, 9);
  g.drawImage(introImg[s], cx - idiv(size, 2), ground - idiv(size * 74, 80), size, size);
}
function ring(g, cx, cy, r, alpha, c) {
  g.setColor(C(c.r, c.g, c.b, Math.max(0, Math.min(255, alpha))));
  for (let a = 0; a < 360; a += 4) {
    const x = idiv(Math.trunc(cx + Math.cos(a * Math.PI / 180) * r), 6) * 6, y = idiv(Math.trunc(cy + Math.sin(a * Math.PI / 180) * r * 0.55), 6) * 6;
    g.fillRect(x, y, 6, 6);
  }
}
