// ---- open several packs at once (book: OPEN AMOUNT 1 / 3 / 5) ----
const OPEN_QTY = [1, 3, 5];
let openQtyI = 0, inBulk = false, bulkGroups = [], bulkCash = 0, bulkN = 0, bulkType = 0, bulkT = 0, bulkStart = 0, bulkBurst = false, bulkBest = 0;
const openQtyBox = R(1080, 104, 250, 42), bulkDone = R(w / 2 - 300, 830, 280, 70), bulkMore = R(w / 2 + 20, 830, 280, 70);
function openQty() { return OPEN_QTY[openQtyI]; }
function cycleOpenQty() { openQtyI = (openQtyI + 1) % OPEN_QTY.length; Sound.pop(); }
function bulkOpen(type, n) {
  n = Math.min(n, packs[type]);
  if (n <= 0 || inPack) return;
  const Wt = [[940, 54, 6, 0], [820, 140, 35, 5], [600, 270, 105, 25]], N = [3, 4, 5], HP = [1, 3, 6];
  const dupe = Math.max(40, secGain() * 20 + clickGain() * 30), map = new Map();
  let cash = 0;
  packs[type] -= n;
  for (let pk = 0; pk < n; pk++) for (let c = 0; c < N[type]; c++) {
    const rar = pickRarity(Wt[type]), sp = pickSpecies(rar), hl = rand.nextInt(100) < HP[type];
    let nw = 0;
    if (!found[sp]) nw = 1; else if (hl && !holo[sp]) nw = 2; else cash += dupe;
    found[sp] = true; cardCount[sp]++; if (hl) holo[sp] = true;
    const key = sp * 2 + (hl ? 1 : 0), gr = map.get(key);
    if (gr) { gr.n++; gr.nw = Math.max(gr.nw, nw); } else map.set(key, { sp, hl, n: 1, nw });
  }
  bulkGroups = [...map.values()].sort((a, b) => (SP_RARITY[b.sp] * 2 + (b.hl ? 1 : 0)) - (SP_RARITY[a.sp] * 2 + (a.hl ? 1 : 0)) || a.sp - b.sp);
  bulkCash = cash; bulkN = n; bulkType = type; bulkT = 0; inBulk = true; bulkStart = tick; bulkBurst = false;
  if (cash > 0) earn(cash);
  let best = 0; for (const g of bulkGroups) best = Math.max(best, SP_RARITY[g.sp]);
  bulkBest = best; Sound.sfx("crit.wav", -4);
  saveGame();
}
const BULK_ANIM = 95;
function bulkAdvance() {
  if (tick - bulkStart < BULK_ANIM) { bulkStart = tick - BULK_ANIM; if (!bulkBurst) { bulkBurst = true; Sound.pop(); } }
  else { inBulk = false; Sound.pop(); }
}
function drawBulkPacks(g, t) {
  const cx = w / 2, cy = 470, n = bulkN, sp = n >= 5 ? 250 : 300, pc = PACK_COL[bulkType][0], base = g.getTransform();
  drawFx(g, fxGlow, pc, cx, cy, 1000, Math.min(0.55, 0.15 + t / 60.0), 0);
  drawFx(g, fxRays, pc, cx, cy, 1300, Math.min(0.25, t / 150.0), tick * 0.004);
  g.setFont(bigFont.deriveFont(40)); centered(g, "OPENING " + n + " " + PACK_NAME[bulkType] + " PACKS...", cx, 110, C(255, 242, 208));
  for (let i = 0; i < n; i++) {
    const px = cx - (n - 1) * sp / 2 + i * sp, u = easeBack((t - i * 3) / 14.0);
    if (u <= 0) continue;
    if (t < 52) {
      const amp = t < 22 ? 0 : Math.min(9, (t - 22) * 0.35), sc2 = Math.min(1, u);
      g.translate(px + (rand.nextDouble() - 0.5) * amp * 2, cy + Math.sin(tick * 0.08 + i) * 6 * (t < 22 ? 1 : 0) + (rand.nextDouble() - 0.5) * amp * 2);
      g.rotate((rand.nextDouble() - 0.5) * amp * 0.012); g.scale(sc2, sc2);
      g.drawImage(packBody[bulkType], -100, -143, 200, 286); g.drawImage(packTop[bulkType], -100, -143, 200, 286);
      g.setTransform(base);
    } else {
      const tt = t - 52;
      if (tt < 16) {
        g.translate(px, cy + 14 + tt * tt * 0.4);
        const oc = g.getAlpha(); g.setAlpha(clamp01(1 - tt / 16.0));
        g.drawImage(packBody[bulkType], -100, -143, 200, 286);
        g.setAlpha(oc); g.setTransform(base);
      }
      drawFx(g, fxRing, pc, px, cy, Math.trunc(100 + easeOut(tt / 22.0) * 300), (1 - tt / 22.0) * 0.8, 0);
      g.translate(px + tt * (i % 2 ? 8 : -8), cy - 140 + (-15 * tt + 0.3 * tt * tt));
      g.rotate(tt * 0.14 * (i % 2 ? 1 : -1));
      const oc2 = g.getAlpha(); g.setAlpha(clamp01(1 - tt / 24.0));
      g.drawImage(packTop[bulkType], -100, 0, 200, 286);
      g.setAlpha(oc2); g.setTransform(base);
      const m = bulkN >= 5 ? 3 : 4;
      for (let k = 0; k < m; k++) {   // a fan of cards shoots out of each pack and gathers in the middle
        const u2 = easeOut((tt - k * 2) / 18.0), v = easeInOut((tt - 18 - k * 2) / 20.0);
        if (u2 <= 0) continue;
        const fx = px + (k - (m - 1) / 2) * 52, fy = cy - 120 * u2;
        g.translate(fx + (cx - fx) * v, fy + (cy - 60 - fy) * v);
        g.rotate((k - (m - 1) / 2) * 0.18 * (1 - v)); const s2 = 1 - 0.35 * v; g.scale(s2, s2);
        const oc3 = g.getAlpha(); g.setAlpha(clamp01(1 - (tt - 38) / 8.0));
        drawBack(g, 2, null, 0.4); g.setAlpha(oc3); g.setTransform(base);
      }
    }
  }
  if (t >= 52 && t < 62) { g.setColor(C(255, 255, 255, Math.min(255, (62 - t) * 18))); g.fillRect(0, 0, w, h); }
  g.setFont(smallFont); if (t >= 8 && Math.floor(tick / 15) % 2 == 0) centered(g, "CLICK TO SKIP", cx, 860, C(150, 140, 170));
}
function bulkClick(p) {
  if (tick - bulkStart < BULK_ANIM) { bulkAdvance(); return; }
  if (inR(bulkDone, p)) { inBulk = false; Sound.pop(); }
  else if (packs[bulkType] > 0 && inR(bulkMore, p)) { inBulk = false; bulkOpen(bulkType, openQty()); Sound.pop(); }
}
function drawBulk(g) {
  const t = tick - bulkStart;
  if (t >= 52 && !bulkBurst) { bulkBurst = true; Sound.sfx(bulkBest >= 3 ? "evolve.wav" : (bulkBest == 2 ? "achieve.wav" : "golden_catch.wav"), -2); }
  if (t < BULK_ANIM) {
    g.setColor(C(6, 3, 16)); g.fillRect(0, 0, w, h);
    drawBulkPacks(g, t);
    return;
  }
  bulkT = t - BULK_ANIM;
  const cream = C(255, 242, 208), gold = C(242, 193, 78), cyan = C(127, 245, 232), cx = w / 2;
  g.setColor(C(6, 3, 16)); g.fillRect(0, 0, w, h);
  drawFx(g, fxRays, gold, cx, 420, 1500, 0.15, tick * 0.006);
  g.setFont(bigFont.deriveFont(40)); centered(g, bulkN + " " + PACK_NAME[bulkType] + (bulkN > 1 ? " PACKS" : " PACK") + " OPENED!", cx, 120, cream);
  const n = bulkGroups.length, cols = n <= 8 ? n : (n <= 16 ? 8 : 13), sc = n <= 16 ? 2 : 1;
  const cw = 70 * sc, ch = 98 * sc, gap = 16, rowsN = Math.ceil(n / cols), rowH = ch + 44;
  const top = 200 + Math.max(0, (2 - rowsN) * 40);
  const base = g.getTransform();
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols), inRow = Math.min(cols, n - r * cols), c = i % cols;
    const px = cx - (inRow * cw + (inRow - 1) * gap) / 2 + cw / 2 + c * (cw + gap), py = top + ch / 2 + r * rowH;
    const u = easeBack((bulkT - i * 3) / 16.0);
    if (u <= 0) continue;
    const gr = bulkGroups[i];
    g.translate(px, py); g.scale(Math.max(0.05, u), Math.max(0.05, u));
    drawCard(g, gr.sp, gr.hl, sc, gr.nw, 0); g.setTransform(base);
    g.setFont(smallFont);
    centered(g, "X" + gr.n + (gr.nw > 0 ? "  NEW" : ""), px, py + ch / 2 + 20, gr.nw > 0 ? gold : cream);
  }
  g.setFont(smallFont);
  const sy = top + rowsN * rowH + 12;
  if (bulkCash > 0) centered(g, "DUPLICATES GAVE +" + fmt(bulkCash) + " MUSHROOMS", cx, sy, cyan);
  centered(g, "COLLECTED " + foundCount() + " OF 16", cx, sy + 40, gold);
  centered(g, "BONUS: +" + colBonus(0) + "% INCOME   +" + colBonus(1) + "% CLICK POWER", cx, sy + 80, cyan);
  const can = packs[bulkType] > 0, hd = inR(bulkDone, mousePt), ha = can && inR(bulkMore, mousePt);
  g.drawImage(hd ? buttonHover : button, bulkDone.x, bulkDone.y, bulkDone.width, bulkDone.height);
  g.setFont(midFont); centered(g, "DONE", bulkDone.x + 140, bulkDone.y + 34, cream);
  const oc = g.getAlpha(); if (!can) g.setAlpha(0.4);
  g.drawImage(ha ? buttonHover : button, bulkMore.x, bulkMore.y, bulkMore.width, bulkMore.height);
  g.setAlpha(oc); g.setFont(smallFont);
  centered(g, can ? "OPEN " + Math.min(openQty(), packs[bulkType]) + " MORE (" + packs[bulkType] + ")" : "NO MORE PACKS", bulkMore.x + 140, bulkMore.y + 34, can ? cream : C(150, 140, 170));
}
