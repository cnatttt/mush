// ---- the POTION ROOM: eerie second shop, animated vendor, potion belt with timed buffs ----
const POT = [
  { n: "HASTE ELIXIR", d: ["CLICKS GIVE X3"], sec: 45, col: [255, 170, 60], base: 4000, k: 50 },
  { n: "BREW OF PLENTY", d: ["ALL INCOME X2"], sec: 90, col: [90, 230, 120], base: 8000, k: 120 },
  { n: "LUCKY TINCTURE", d: ["+25% CRIT CHANCE", "GOLDEN COMES 2X FASTER"], sec: 60, col: [250, 230, 90], base: 6000, k: 80 },
  { n: "FRENZY DRAUGHT", d: ["STARTS A FRENZY NOW", "BIG INCOME BOOST"], sec: 20, col: [255, 90, 90], base: 12000, k: 140 },
  { n: "SPORE SMOKE", d: ["CALLS A SPORE RAIN", "+50% INCOME"], sec: 30, col: [150, 230, 255], base: 5000, k: 60 },
  { n: "BLIGHT BAIT", d: ["CALLS THE BLIGHT", "FIGHT IT FOR DROPS"], sec: 0, col: [170, 90, 220], base: 15000, k: 100 }
];
let inPotion = false, potHand = false, pSignT = 0, potionBg = null, vendorFrames = [], potIcon = [], pBubble = "", pChars = 0, pHold = 0, pNext = 300, hoverCard = -1, hoverBelt = -1, vendorHop = 0;
const potBackBox = () => backBox;
const potionSignBox = R(1180, 560, 190, 130);
const SAY_P_GREET = ["HEHEHE... FRESH BLOOD FOR THE BREW.", "COME CLOSER, LITTLE SPORE...", "THE BOTTLES WHISPER YOUR NAME.", "SHHH. THE POTIONS ARE SLEEPING."];
const SAY_P_BUY = ["DRINK IT BEFORE IT DRINKS YOU.", "A WISE CHOICE. HEHEHE.", "MIND THE AFTERTASTE. IT BITES.", "ONE LESS NIGHTMARE ON MY SHELF."];
const SAY_P_POOR = ["NO SHROOMS, NO SORCERY.", "YOUR POCKETS ARE EMPTY AS A GRAVE.", "PAY THE PRICE OR LEAVE, SPORE."];
const SAY_P_DRINK = ["GLUG GLUG... FEEL IT?", "POWER, BORROWED FROM THE DARK."];
const SAY_P_IDLE = ["THE CAULDRON IS HUNGRY TONIGHT.", "I BREW WITH BLIGHT-DEW. DON'T ASK.", "THE BLOOD MOON MAKES THE BEST BREWS.", "THE ONE IN THE SHOP IS MY COUSIN. HE LIES.", "ONE DAY YOU'LL BE IN A BOTTLE TOO. HEHE.", "BUBBLE... BUBBLE... BLIGHT..."];
const VOICE_P = { f0: 190, fs: 1.28, br: 1.7, rough: 1.9, vib: 7.5 };
function potMult() { return X.buff[1] > 0 ? 2 : 1; }
function potPrice(i) { const st = Math.round(secGain() / (frenzy > 0 ? (owned[27] > 0 ? 7 : 5) : 1) / potMult()); return Math.max(POT[i].base, st * POT[i].k); }
function pSay(s) { pBubble = s; pChars = 0; pHold = 170; pNext = 420 + rand.nextInt(300); Sound.speak(s, -12, VOICE_P); vendorHop = 8; }
function enterPotion() {
  inPotion = true; floats.length = 0; Sound.pop(); Sound.room(true); Sound.droneSet(1);
  pSay(pick(SAY_P_GREET));
}
function leavePotion() { inPotion = false; Sound.stopVoice(); Sound.pop(); Sound.room(false); }
function drinkPotion(i) {
  if (X.pot[i] <= 0) { Sound.pop(); return; }
  X.pot[i]--;
  const P = POT[i], dur = Math.round(P.sec * 1000 / 30);
  if (i <= 2) X.buff[i] = Math.min(dur * 3, X.buff[i] + dur);
  else if (i == 3) frenzy = Math.max(frenzy, 700);
  else if (i == 4) rain = Math.max(rain, 1000);
  else nextBoss = 1;
  Sound.sfx("golden_catch.wav", -3);
  burst(mushBox.x + 330, mushBox.y + 220, 30, 5, C(P.col[0], P.col[1], P.col[2]));
  showBanner(P.n + "!", C(P.col[0], P.col[1], P.col[2]));
  if (inPotion) pSay(pick(SAY_P_DRINK));
  saveGame();
}
function buyPotion(i) {
  const c = potPrice(i);
  if (X.pot[i] >= 99) { Sound.pop(); return; }
  if (count < c) { Sound.pop(); pSay(pick(SAY_P_POOR)); return; }
  count -= c; X.pot[i]++; X.pBought++; Sound.sfx("cash.wav", -3); pSay(pick(SAY_P_BUY)); saveGame();
}
function dropPotion(n) { const i = rand.nextInt(6); X.pot[i] = Math.min(99, X.pot[i] + (n || 1)); return i; }
function potionTick() {
  for (let i = 0; i < 3; i++) if (X.buff[i] > 0) X.buff[i]--;
  if (X.buff[2] > 0 && nextGolden > 1 && !goldenOn) nextGolden--;
  if (!X.pUnlocked && totalEarned >= POT_UNLOCK) {
    X.pUnlocked = true; Sound.sfx("evolve.wav", -4);
    showBanner("A NEW SIGN APPEARS... THE POTION ROOM", C(190, 130, 255));
  }
  if (X.pUnlocked && pSignT < 60) pSignT++;
  if (inPotion) {
    if (pBubble.length > 0) { if (pChars < pBubble.length) pChars++; else if (--pHold <= 0) pBubble = ""; }
    else if (--pNext <= 0) pSay(pick(SAY_P_IDLE));
    if (vendorHop > 0) vendorHop--;
  }
}
// ---------- art, drawn by code ----------
function mulb(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const BOTTLE = ["......cccc......", "......cccc......", ".....oggggo.....", ".....oggggo.....", ".....oggggo.....", "....oggggggo....", "...oggggggggo...", "..oggggggggggo..", ".oggggggggggggo.", ".oggggggggggggo.", ".ollllllllllllo.", ".ohhllllllllllo.", ".ohhllllllllllo.", ".ollllllllllllo.", ".ollllllllllllo.", ".ollllllllllllo.", ".ollllllllllllo.", ".ollllllllllllo.", "..ollllllllllo..", "...oooooooooo..."];
function bottleCanvas(col, empty) {
  const cv = mk(16, 20), x = cv.getContext("2d"), hi = "rgb(" + Math.min(255, col[0] + 90) + "," + Math.min(255, col[1] + 90) + "," + Math.min(255, col[2] + 90) + ")";
  for (let r = 0; r < 20; r++) for (let c = 0; c < 16; c++) {
    const ch = BOTTLE[r][c]; if (ch == ".") continue;
    x.fillStyle = ch == "o" ? "#140c24" : ch == "c" ? "#9a6a3a" : ch == "g" ? "#3a3560" : ch == "h" ? hi : (empty ? "#3a3560" : "rgb(" + col[0] + "," + col[1] + "," + col[2] + ")");
    x.fillRect(c, r, 1, 1);
  }
  if (!empty) { x.fillStyle = "rgba(255,255,255,.9)"; x.fillRect(9, 13, 1, 1); x.fillRect(5, 16, 1, 1); }
  return cv;
}
function buildPotionArt() {
  for (let i = 0; i < 6; i++) potIcon[i] = bottleCanvas(POT[i].col, false);
  // --- room background ---
  const bg2 = mk(1470, 956), x = bg2.getContext("2d"), rnd = mulb(77);
  const gr = x.createLinearGradient(0, 0, 0, 956); gr.addColorStop(0, "#0c0714"); gr.addColorStop(1, "#1b1226"); x.fillStyle = gr; x.fillRect(0, 0, 1470, 956);
  for (let row = 0; row * 36 < 780; row++) for (let c = -1; c * 72 < 1500; c++) {
    const bx = c * 72 + (row % 2 ? 36 : 0), v = Math.floor(rnd() * 16);
    x.fillStyle = "rgb(" + (30 + v) + "," + (24 + v) + "," + (44 + v) + ")"; x.fillRect(bx + 2, row * 36 + 2, 68, 32);
    x.fillStyle = "rgba(255,255,255,.04)"; x.fillRect(bx + 2, row * 36 + 2, 68, 3);
    x.fillStyle = "rgba(0,0,0,.25)"; x.fillRect(bx + 2, row * 36 + 29, 68, 5);
  }
  for (let y = 780; y < 956; y += 22) { x.fillStyle = "rgb(" + (34 + (y / 22 % 3) * 4) + ",22,20)"; x.fillRect(0, y, 1470, 20); x.fillStyle = "#0c0610"; x.fillRect(0, y + 20, 1470, 2); }
  x.fillStyle = "#0c0610"; x.fillRect(0, 776, 1470, 6); x.fillStyle = "#4a2e1c"; x.fillRect(0, 770, 1470, 6);
  for (const sy of [262, 482, 702]) {      // shelves with bottles
    for (let bxp = 6; bxp < 1470; bxp += 46 + Math.floor(rnd() * 40)) {
      const cc = POT[Math.floor(rnd() * 6)].col, s = 2 + Math.floor(rnd() * 2), b = bottleCanvas(cc, rnd() < 0.2);
      x.globalAlpha = 0.9; x.drawImage(b, bxp, sy - 20 * s, 16 * s, 20 * s); x.globalAlpha = 1;
    }
    x.fillStyle = "#5a3a22"; x.fillRect(0, sy, 1470, 14); x.fillStyle = "#7a5230"; x.fillRect(0, sy, 1470, 3); x.fillStyle = "#26140c"; x.fillRect(0, sy + 14, 1470, 6);
  }
  for (let i = 0; i < 9; i++) {            // hanging herbs
    const hx = 60 + i * 165 + Math.floor(rnd() * 50), hl = 40 + Math.floor(rnd() * 50);
    x.fillStyle = "#3a2a1a"; x.fillRect(hx, 0, 3, hl);
    for (let k = 0; k < 14; k++) { x.fillStyle = k % 3 ? "#3d5a2a" : "#2a4220"; x.fillRect(hx - 8 + Math.floor(rnd() * 20), hl + k * 3, 4 + Math.floor(rnd() * 5), 5); }
  }
  x.strokeStyle = "rgba(220,220,235,.18)"; x.lineWidth = 1;   // cobwebs
  for (const [cx0, cy0, sx, sy2] of [[0, 0, 1, 1], [1470, 0, -1, 1]]) for (let k = 0; k < 7; k++) { x.beginPath(); x.moveTo(cx0, cy0); x.lineTo(cx0 + sx * 170, cy0 + sy2 * k * 28); x.stroke(); }
  for (let k = 1; k < 5; k++) for (const [cx0, sx] of [[0, 1], [1470, -1]]) { x.beginPath(); x.moveTo(cx0 + sx * k * 38, 0); for (let j = 1; j < 7; j++) x.lineTo(cx0 + sx * (k * 38 - 6 * (j % 2)), j * 28); x.stroke(); }
  const vg = x.createRadialGradient(735, 478, 250, 735, 478, 900); vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.72)"); x.fillStyle = vg; x.fillRect(0, 0, 1470, 956);
  potionBg = bg2;
  // --- the vendor: a hooded thing stirring a cauldron (4 frames) ---
  for (let f = 0; f < 4; f++) {
    const cv = mk(96, 96), c = cv.getContext("2d"), P = (a, b, w2, h2, col) => { c.fillStyle = col; c.fillRect(a, b, w2, h2); };
    const sway = Math.round(Math.sin(f * Math.PI / 2)), cx = 44;
    for (let y = 6; y < 66; y++) {   // hood + cloak
      const hw = Math.round(y < 30 ? 5 + (y - 6) * 0.5 : y < 50 ? 17 + (y - 30) * 0.2 : 21 + (y - 50) * 0.55), off = y < 24 ? sway : 0;
      P(cx - hw + off, y, hw * 2, 1, "#2a1a40"); P(cx - hw + off, y, 3, 1, "#3e2a5c"); P(cx + hw - 3 + off, y, 3, 1, "#170e26");
    }
    for (let y = 24; y <= 46; y++) { const hw = Math.round(12 * Math.sqrt(Math.max(0, 1 - Math.pow((y - 35) / 12, 2)))); P(cx - hw + sway, y, hw * 2, 1, "#07040d"); }
    const eh = f == 3 ? 1 : 6, ey = f == 3 ? 33 : 30;
    P(cx - 11 + sway, 28, 8, 9, "rgba(120,255,80,.22)"); P(cx + 3 + sway, 28, 8, 9, "rgba(120,255,80,.22)");
    P(cx - 9 + sway, ey, 5, eh, "#aaff66"); P(cx + 4 + sway, ey, 5, eh, "#aaff66");
    if (f != 3) { P(cx - 7 + sway, 32, 2, 3, "#103000"); P(cx + 6 + sway, 32, 2, 3, "#103000"); P(cx - 9 + sway, 30, 2, 2, "#e8ffd0"); P(cx + 4 + sway, 30, 2, 2, "#e8ffd0"); }
    P(cx - 8 + sway, 40, 16, 1, "#2a2a30");
    for (let i = 0; i < 8; i++) P(cx - 8 + i * 2 + sway, 40 + (i % 2), 1, 2, "#e9e2c8");
    const ang = f * Math.PI / 2, hx = 66 + Math.round(Math.cos(ang) * 4), hy = 56 + Math.round(Math.sin(ang) * 2);   // stirring arm
    for (let t = 0; t <= 10; t++) P(Math.round(cx + 16 + (hx - cx - 16) * t / 10), Math.round(48 + (hy - 48) * t / 10), 4, 4, t % 2 ? "#2a1a40" : "#3e2a5c");
    for (let t = 0; t <= 16; t++) P(Math.round(hx - 12 * t / 16), Math.round(hy + 2 + 12 * t / 16), 2, 2, "#7a5230");
    P(hx + 1, hy - 1, 4, 3, "#e9e2c8");
    P(18, 60, 52, 3, "#4a4a5e"); P(18, 60, 52, 1, "#6a6a82");               // cauldron
    for (let y = 63; y < 90; y++) { const hw = Math.round(24 - Math.max(0, (y - 78)) * 0.6); P(44 - hw, y, hw * 2, 1, "#1a1a22"); P(44 - hw, y, 4, 1, "#2c2c3a"); P(44 + hw - 3, y, 3, 1, "#0e0e14"); }
    P(24, 89, 5, 4, "#101018"); P(59, 89, 5, 4, "#101018");
    P(22, 61, 44, 3, "#3fcf55"); P(26 + f * 4, 61, 6, 1, "#98ff9a"); P(48 - f * 3, 62, 5, 1, "#98ff9a");
    for (let i = 0; i < 3; i++) { const by = 58 - ((f * 4 + i * 5) % 14), bxp = 28 + i * 14 + (f % 2) * 2; P(bxp, by, 3, 3, "#b8ffb8"); P(bxp + 1, by + 1, 1, 1, "#3fcf55"); }
    vendorFrames[f] = cv;
  }
}
// ---------- drawing ----------
function potBelt(i) { return R(450 + i * 62, 22, 56, 66); }
function drawBelt(g) {
  if (!potionBg) buildPotionArt();
  hoverBelt = -1;
  for (let i = 0; i < 6; i++) {
    const r = potBelt(i), P = POT[i], on = i < 3 && X.buff[i] > 0, hv = inR(r, mousePt), has = X.pot[i] > 0;
    if (hv && (has)) hoverBelt = i;
    g.setColor(C(13, 5, 24, 200)); g.fillRect(r.x, r.y, r.width, r.height);
    g.setColor(on ? C(P.col[0], P.col[1], P.col[2]) : (hv && has ? C(255, 242, 208) : C(90, 74, 112))); g.fillRect(r.x, r.y, r.width, 3); g.fillRect(r.x, r.y + r.height - 3, r.width, 3); g.fillRect(r.x, r.y, 3, r.height); g.fillRect(r.x + r.width - 3, r.y, 3, r.height);
    const oc = g.getAlpha(); if (!has && !on) g.setAlpha(0.3);
    g.drawImage(potIcon[i], r.x + 8, r.y + 6, 40, 50); g.setAlpha(oc);
    g.setFont(smallFont); text(g, "" + (i + 1), r.x + 6, r.y + 18, C(190, 175, 205));
    if (has) text(g, "" + X.pot[i], r.x + r.width - 8 - g.stringWidth("" + X.pot[i]), r.y + r.height - 8, C(255, 242, 208));
    if (on) { g.setColor(C(P.col[0], P.col[1], P.col[2])); g.fillRect(r.x + 5, r.y + r.height - 5, Math.trunc((r.width - 10) * Math.min(1, X.buff[i] / (P.sec * 1000 / 30))), 3); }
  }
  if (hoverBelt >= 0) { g.setFont(smallFont); const P = POT[hoverBelt]; centered(g, P.n + ": " + P.d[0] + "  (CLICK TO DRINK)", 630, 112, C(255, 242, 208)); }
}
function beltClick(p) { for (let i = 0; i < 6; i++) if (inR(potBelt(i), p)) { drinkPotion(i); return true; } return false; }
function drawPotionSign(g) {
  if (!X.pUnlocked) return;
  if (!potionBg) buildPotionArt();
  const b = potionSignBox, hv = inR(b, mousePt), u = Math.min(1, pSignT / 40), dy = hv ? -6 : 0, oc = g.getAlpha();
  g.setAlpha(u);
  drawFx(g, fxGlow, C(150, 90, 230), b.x + 95, b.y + 80 + dy, 300, 0.35 + Math.sin(tick * 0.07) * 0.1, 0);
  g.setColor(C(13, 5, 24)); g.fillRect(b.x + 30, b.y - 40 + dy, 4, 50); g.fillRect(b.x + 156, b.y - 40 + dy, 4, 50);
  g.fillRect(b.x, b.y + dy, 190, 118); g.setColor(C(94, 60, 38)); g.fillRect(b.x + 4, b.y + 4 + dy, 182, 110); g.setColor(C(122, 82, 48)); g.fillRect(b.x + 4, b.y + 4 + dy, 182, 5);
  g.setColor(C(36, 22, 50)); g.fillRect(b.x + 12, b.y + 14 + dy, 166, 94);
  g.drawImage(potIcon[1 + idiv(tick, 40) % 3], b.x + 20, b.y + 22 + dy, 64, 80);
  g.setFont(smallFont); text(g, "POTIONS", b.x + 88, b.y + 52 + dy, C(150, 255, 150)); text(g, "OPEN LATE", b.x + 92, b.y + 78 + dy, C(190, 175, 205));
  g.setAlpha(oc);
}
function drawPotionRoom(g, cyan, cream, red, gray) {
  if (!potionBg) buildPotionArt();
  g.drawImage(potionBg, 0, 0);
  for (const [cx0, cy0] of [[120, 236], [560, 456], [1010, 676], [1380, 236], [300, 676]]) {   // candle glow
    const fl = 0.45 + Math.sin(tick * 0.31 + cx0) * 0.12 + Math.sin(tick * 0.13 + cy0) * 0.08;
    drawFx(g, fxGlow, C(255, 160, 60), cx0, cy0, 280, fl, 0);
    g.setColor(C(240, 230, 200)); g.fillRect(cx0 - 6, cy0 + 4, 12, 26); g.setColor(C(255, 200, 80)); g.fillRect(cx0 - 3, cy0 - 8 - (tick + cx0) % 3, 6, 12);
  }
  drawFx(g, fxGlow, C(90, 255, 110), 232, 640, 520, 0.25 + Math.sin(tick * 0.09) * 0.06, 0);
  const hop = vendorHop > 0 ? Math.round(Math.sin(vendorHop / 8 * Math.PI) * 14) : 0;
  g.setSmooth(false); g.drawImage(vendorFrames[idiv(tick, 8) % 4], 40, 500 - hop, 384, 384);
  g.setFont(bigFont); centered(g, "THE POTION ROOM", 935, 150, C(190, 150, 255));
  potHand = false;
  for (let i = 0; i < 6; i++) {
    const r = R(450 + (i % 2) * 490, 190 + idiv(i, 2) * 195, 470, 182), hv = inR(r, mousePt), P = POT[i], c = potPrice(i), can = count >= c;
    if (hv) potHand = true;
    g.setColor(C(10, 6, 20, 225)); g.fillRect(r.x, r.y, r.width, r.height);
    const bc = hv ? C(P.col[0], P.col[1], P.col[2]) : C(100, 130, 90);
    g.setColor(bc); g.fillRect(r.x, r.y, r.width, 4); g.fillRect(r.x, r.y + r.height - 4, r.width, 4); g.fillRect(r.x, r.y, 4, r.height); g.fillRect(r.x + r.width - 4, r.y, 4, r.height);
    drawFx(g, fxGlow, C(P.col[0], P.col[1], P.col[2]), r.x + 70, r.y + 91, 220, hv ? 0.5 : 0.25, 0);
    g.drawImage(potIcon[i], r.x + 26, r.y + 31, 96, 120);
    g.setFont(midFont); fitText(g, P.n, r.x + 140, r.y + 40, 310, cream, false);
    g.setFont(smallFont);
    for (let k = 0; k < P.d.length; k++) text(g, P.d[k], r.x + 140, r.y + 76 + k * 24, C(190, 175, 205));
    text(g, P.sec > 0 ? "LASTS " + P.sec + "S" : "INSTANT", r.x + 140, r.y + 130, C(158, 232, 118));
    text(g, fmt(c), r.x + 140, r.y + 160, can ? cyan : red);
    const ow = "OWNED X" + X.pot[i]; text(g, ow, r.x + r.width - 16 - g.stringWidth(ow), r.y + 160, X.pot[i] > 0 ? cream : gray);
  }
  g.drawImage(hoverBack ? backHover : back, backBox.x, backBox.y);
  g.setFont(bigFont); text(g, "BACK", backBox.x + 44, backBox.y + 38, cream);
  drawBelt(g);
  // vendor speech bubble
  if (pBubble.length > 0) {
    g.setFont(smallFont);
    const lines = []; let line = "";
    for (const word of pBubble.split(" ")) { if (line.length > 0 && line.length + 1 + word.length > 17) { lines.push(line); line = word; } else line = line.length == 0 ? word : line + " " + word; }
    lines.push(line);
    const lh = 26, bw = 17 * 16 + 40, bh = lines.length * lh + 28, bx = 60, by = 478 - 22 - bh;
    g.setColor(C(13, 5, 24)); g.fillRect(bx + 4, by, bw - 8, bh); g.fillRect(bx, by + 4, bw, bh - 8);
    g.setColor(C(205, 240, 190)); g.fillRect(bx + 8, by + 4, bw - 16, bh - 8); g.fillRect(bx + 4, by + 8, bw - 8, bh - 16);
    g.setColor(C(13, 5, 24)); g.fillRect(bx + 60, by + bh, 28, 6); g.fillRect(bx + 68, by + bh + 6, 16, 6);
    g.setColor(C(205, 240, 190)); g.fillRect(bx + 64, by + bh - 4, 20, 6);
    g.setColor(C(30, 50, 40)); let shown = pChars;
    for (let i = 0; i < lines.length; i++) { const s = lines[i], n = Math.min(s.length, Math.max(0, shown)); g.drawString(s.substring(0, n), bx + 20, by + 14 + i * lh + 16); shown -= s.length + 1; }
  }
}
function potionClick(p) {
  if (inR(backBox, p)) { leavePotion(); return; }
  if (beltClick(p)) return;
  for (let i = 0; i < 6; i++) if (inR(R(450 + (i % 2) * 490, 190 + idiv(i, 2) * 195, 470, 182), p)) { buyPotion(i); return; }
  if (inR(R(40, 500, 384, 384), p)) pSay(pick(SAY_P_IDLE));
}
