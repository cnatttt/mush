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
// ---------- art: real pixel-art PNGs (mu_potion_*.png, mu_cauldron.png) ----------
function mulb(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let cauldronFrames = [];
function sliceSheet(img, fw, fh, n) { const out = []; for (let i = 0; i < n; i++) { const c = mk(fw, fh); c.getContext("2d").drawImage(img, i * fw, 0, fw, fh, 0, 0, fw, fh); out.push(c); } return out; }
function buildPotionArt() {
  potIcon = sliceSheet(IMG["mu_potion_bottles.png"], 24, 30, 6);
  vendorFrames = sliceSheet(IMG["mu_potion_vendor.png"], 96, 144, 4);
  cauldronFrames = sliceSheet(IMG["mu_cauldron.png"], 72, 60, 4);
  potionBg = IMG["mu_potion_room.png"];
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
    g.setSmooth(false); g.drawImage(potIcon[i], r.x + 8, r.y + 6, 40, 50); g.setAlpha(oc);
    g.setFont(smallFont); text(g, "" + (i + 1), r.x + 6, r.y + 18, C(190, 175, 205));
    if (has) text(g, "" + X.pot[i], r.x + r.width - 8 - g.stringWidth("" + X.pot[i]), r.y + r.height - 8, C(255, 242, 208));
    if (on) { g.setColor(C(P.col[0], P.col[1], P.col[2])); g.fillRect(r.x + 5, r.y + r.height - 5, Math.trunc((r.width - 10) * Math.min(1, X.buff[i] / (P.sec * 1000 / 30))), 3); }
  }
  if (hoverBelt >= 0) { g.setFont(smallFont); const P = POT[hoverBelt]; fitText(g, P.n + ": " + P.d[0] + " - CLICK TO DRINK", 630, 112, 560, C(255, 242, 208), true); }
}
function beltClick(p) { for (let i = 0; i < 6; i++) if (inR(potBelt(i), p)) { drinkPotion(i); return true; } return false; }
function drawPotionSign(g) {
  if (!X.pUnlocked) return;
  if (!potionBg) buildPotionArt();
  const b = potionSignBox, hv = inR(b, mousePt), u = Math.min(1, pSignT / 40), dy = hv ? -6 : 0, oc = g.getAlpha();
  g.setAlpha(u);
  drawFx(g, fxGlow, C(150, 90, 230), b.x + 95, b.y + 80 + dy, 300, 0.35 + Math.sin(tick * 0.07) * 0.1, 0);
  g.setSmooth(false); g.drawImage(IMG["mu_potion_sign.png"], b.x, b.y + dy, 192, 120);
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
  drawFx(g, fxGlow, C(90, 255, 110), 380, 840, 420, 0.25 + Math.sin(tick * 0.09) * 0.06, 0);
  const hop = vendorHop > 0 ? Math.round(Math.sin(vendorHop / 8 * Math.PI) * 14) : 0;
  g.setSmooth(false); g.drawImage(vendorFrames[idiv(tick, 9) % 4], 60, 470 - hop, 288, 432);
  g.drawImage(cauldronFrames[idiv(tick, 6) % 4], 310, 790, 144, 120);
  g.setFont(bigFont); centered(g, "THE POTION ROOM", 935, 150, C(190, 150, 255));
  potHand = false;
  for (let i = 0; i < 6; i++) {
    const r = R(450 + (i % 2) * 490, 190 + idiv(i, 2) * 195, 470, 182), hv = inR(r, mousePt), P = POT[i], c = potPrice(i), can = count >= c;
    if (hv) potHand = true;
    g.setColor(C(10, 6, 20, 242)); g.fillRect(r.x, r.y, r.width, r.height);
    const bc = hv ? C(P.col[0], P.col[1], P.col[2]) : C(100, 130, 90);
    g.setColor(bc); g.fillRect(r.x, r.y, r.width, 4); g.fillRect(r.x, r.y + r.height - 4, r.width, 4); g.fillRect(r.x, r.y, 4, r.height); g.fillRect(r.x + r.width - 4, r.y, 4, r.height);
    drawFx(g, fxGlow, C(P.col[0], P.col[1], P.col[2]), r.x + 70, r.y + 91, 220, hv ? 0.5 : 0.25, 0);
    g.setSmooth(false); g.drawImage(potIcon[i], r.x + 26, r.y + 31, 96, 120);
    g.setFont(midFont); fitText(g, P.n, r.x + 140, r.y + 40, 310, cream, false);
    g.setFont(smallFont);
    for (let k = 0; k < P.d.length; k++) fitText(g, P.d[k], r.x + 140, r.y + 76 + k * 24, 314, C(190, 175, 205), false);
    text(g, P.sec > 0 ? "LASTS " + P.sec + "S" : "INSTANT", r.x + 140, r.y + 130, C(158, 232, 118));
    fitText(g, fmt(c), r.x + 140, r.y + 160, 190, can ? cyan : red, false);
    const ow = "HAVE " + X.pot[i]; text(g, ow, r.x + r.width - 16 - g.stringWidth(ow), r.y + 160, X.pot[i] > 0 ? cream : gray);
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
  if (inR(R(60, 470, 288, 432), p)) pSay(pick(SAY_P_IDLE));
}
