// ---- open several packs at once (book: OPEN AMOUNT 1 / 3 / 5) ----
const OPEN_QTY = [1, 3, 5];
let openQtyI = 0, inBulk = false, bulkGroups = [], bulkCash = 0, bulkN = 0, bulkType = 0, bulkT = 0;
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
  bulkCash = cash; bulkN = n; bulkType = type; bulkT = 0; inBulk = true;
  if (cash > 0) earn(cash);
  let best = 0; for (const g of bulkGroups) best = Math.max(best, SP_RARITY[g.sp]);
  Sound.sfx(best >= 3 ? "evolve.wav" : (best == 2 ? "achieve.wav" : "golden_catch.wav"), -2);
  saveGame();
}
function bulkClick(p) {
  if (inR(bulkDone, p)) { inBulk = false; Sound.pop(); }
  else if (packs[bulkType] > 0 && inR(bulkMore, p)) { inBulk = false; bulkOpen(bulkType, openQty()); Sound.pop(); }
}
function drawBulk(g) {
  bulkT++;
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
