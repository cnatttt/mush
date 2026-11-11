// ---- card packs ----
const PACK_NAME = ["BASIC", "SHINY", "GRAND"];
const PACK_COL = [[C(70, 200, 180), C(20, 90, 110)], [C(150, 130, 255), C(55, 35, 150)], [C(255, 205, 80), C(170, 80, 20)]];
const packs = [0, 0, 0], cardCount = new Array(16).fill(0), holo = new Array(16).fill(false);
let packPopType = 0, packPopLife = 0;
let inPack = false, naming = false, godClicks = false, adminSpeed = false, hoverName = false, hoverAdminBtn = false;
let packType = 0, packPhase = 0, packT = 0, packIdx = 0, cardT = 0, packN = 0, packFlash = 0, hoverBtn = -1, mushTop = 0;
const packCard = [0, 0, 0, 0, 0], packNew = [0, 0, 0, 0, 0], packHolo = [false, false, false, false, false];
let packDupeCash = 0, pp = [];
const packBtn = []; for (let k = 0; k < 4; k++) packBtn[k] = R(131 + k * 306, 768, 290, 50);
let mname = "", nameBuf = "";
function isAdmin() { return mname.replace(/ /g, "").toUpperCase() === "MUSHMUSH"; }
function packTotal() { return packs[0] + packs[1] + packs[2]; }
function packCost() { const steady = Math.round(perSecond * (owned[17] > 0 ? 1.25 : 1) * (owned[25] > 0 ? 1.15 : 1) * baseMult() / (rain > 0 ? 1.5 : 1)); return Math.max(250000, steady * 6000); }
function givePack(type) { packs[type]++; packPopType = type; packPopLife = 220; Sound.sfx("achieve.wav", -3); }
function findSpecies(rarity) { givePack(rarity <= 0 ? 0 : (rarity == 1 ? 1 : 2)); return true; }
function pickRarity(wt) {
  let t = 0; for (const x of wt) t += x;
  let r = rand.nextInt(t);
  for (let i = 0; i < wt.length; i++) { if (r < wt[i]) return i; r -= wt[i]; }
  return 0;
}
function pickSpecies(rar) { const l = []; for (let i = 0; i < 16; i++) if (SP_RARITY[i] == rar) l.push(i); return l[rand.nextInt(l.length)]; }
function openPack(type) {
  if (packs[type] <= 0 || inPack) return;
  packs[type]--;
  const Wt = [[940, 54, 6, 0], [820, 140, 35, 5], [600, 270, 105, 25]], N = [3, 4, 5], HP = [1, 3, 6];
  packType = type; packN = N[type]; packDupeCash = 0;
  const dupe = Math.max(40, secGain() * 20 + clickGain() * 30);
  for (let c = 0; c < packN; c++) {
    const rar = pickRarity(Wt[type]), sp = pickSpecies(rar), hl = rand.nextInt(100) < HP[type];
    let nw = 0;
    if (!found[sp]) nw = 1; else if (hl && !holo[sp]) nw = 2; else packDupeCash += dupe;
    found[sp] = true; cardCount[sp]++;
    if (hl) holo[sp] = true;
    packCard[c] = sp; packHolo[c] = hl; packNew[c] = nw;
  }
  for (let i = 0; i < packN; i++)
    for (let j = i + 1; j < packN; j++)
      if (SP_RARITY[packCard[j]] * 2 + (packHolo[j] ? 1 : 0) < SP_RARITY[packCard[i]] * 2 + (packHolo[i] ? 1 : 0)) {
        let t = packCard[i]; packCard[i] = packCard[j]; packCard[j] = t;
        const b = packHolo[i]; packHolo[i] = packHolo[j]; packHolo[j] = b;
        t = packNew[i]; packNew[i] = packNew[j]; packNew[j] = t;
      }
  if (packDupeCash > 0) earn(packDupeCash);
  inPack = true; packPhase = 0; packT = 0; packIdx = 0; cardT = 0; packFlash = 0; pp = [];
  saveGame();
}
const FLIP = 22;
let shakeT = 0, flyT = 0, flyIdx = 0, mx = 0, my = 0, ringT = 0, revealed = false, ringCol = C(255, 255, 255);
let cardImg = [], packBody = [], packTop = [], fxStar = [], itemIcon = [], cardBack, fxGlow, fxRays, fxRing, holoTex, spSheet;
function loadCardArt() {
  const cs = IMG["mu_cards.png"];
  for (let r = 0; r < 4; r++) cardImg[r] = sub(cs, r * 70, 0, 70, 98);
  cardBack = IMG["mu_card_back.png"];
  const pk = IMG["mu_packs.png"];
  for (let t = 0; t < 3; t++) { packBody[t] = sub(pk, t * 70, 0, 70, 100); packTop[t] = sub(pk, (t + 3) * 70, 0, 70, 100); }
  const st = IMG["mu_fx_stars.png"];
  for (let k = 0; k < 4; k++) fxStar[k] = sub(st, k * 16, 0, 16, 16);
  fxGlow = IMG["mu_fx_glow.png"]; fxRays = IMG["mu_fx_rays.png"]; fxRing = IMG["mu_fx_ring.png"]; holoTex = IMG["mu_fx_holo.png"];
  const ic = IMG["mu_icons.png"];
  for (let i = 0; i < 20; i++) itemIcon[i] = sub(ic, i * 24, 0, 24, 24);
}
const tintCache = new Map();
function tinted(src, c) {
  if (!src._id) src._id = ++_imgId;
  const key = src._id + ":" + c.r + "," + c.g + "," + c.b;
  let r = tintCache.get(key);
  if (r) return r;
  const cv = mk(src.width, src.height), x = cv.getContext("2d");
  x.drawImage(src, 0, 0);
  const d = x.getImageData(0, 0, cv.width, cv.height), a = d.data;
  for (let i = 0; i < a.length; i += 4) { if (a[i + 3] == 0) continue; a[i] = idiv(a[i] * c.r, 255); a[i + 1] = idiv(a[i + 1] * c.g, 255); a[i + 2] = idiv(a[i + 2] * c.b, 255); }
  x.putImageData(d, 0, 0);
  tintCache.set(key, cv);
  return cv;
}
function clamp01(u) { return Math.max(0, Math.min(1, u)); }
function easeOut(u) { u = clamp01(u); return 1 - Math.pow(1 - u, 3); }
function easeBack(u) { u = clamp01(u); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); }
function easeInOut(u) { u = clamp01(u); return u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }
function ant() { const i = Math.min(packIdx, packN - 1), r = SP_RARITY[packCard[i]]; return r >= 3 ? 44 : (r == 2 ? 28 : (packHolo[i] ? 16 : 0)); }
function packClick(p) {
  if (packPhase == 3) {
    if (inR(R(w / 2 - 300, 830, 280, 70), p)) { inPack = false; Sound.pop(); }
    else if (inR(R(w / 2 + 20, 830, 280, 70), p) && packs[packType] > 0) { inPack = false; openPack(packType); Sound.pop(); }
    return;
  }
  if (packPhase >= 1 && inR(R(50, 856, 170, 60), p)) { packAdvance(true); return; }
  packAdvance(false);
}
function packAdvance(esc) {
  if (esc) { if (packPhase == 3) inPack = false; else { packPhase = 3; packT = 0; ringT = 0; } return; }
  if (packPhase == 3) { inPack = false; return; }
  if (packPhase == 0) { packPhase = 1; packT = 0; Sound.sfx("crit.wav", -4); }
  else if (packPhase == 2) {
    if (cardT == 0) { cardT = 1; revealed = false; Sound.pop(); }
    else if (cardT < ant() + FLIP) { if (!revealed) revealFx(); cardT = ant() + FLIP; }
    else {
      flyIdx = packIdx; flyT = 16; packIdx++; cardT = 0; revealed = false; ringT = 0;
      if (packIdx >= packN) { packPhase = 3; packT = 0; Sound.sfx("achieve.wav", -3); }
    }
  }
}
function packSpark(x, y, n, c, speed) {
  for (let i = 0; i < n; i++) {
    const a = rand.nextDouble() * Math.PI * 2, v = (0.25 + rand.nextDouble()) * speed;
    pp.push([x, y, Math.cos(a) * v, Math.sin(a) * v - speed * 0.25, 0, 36 + rand.nextInt(40), 1 + rand.nextInt(3), c.r, c.g, c.b, rand.nextInt(4)]);
  }
}
function revealFx() {
  revealed = true;
  const i = Math.min(packIdx, packN - 1), sp = packCard[i], rar = SP_RARITY[sp], rc = RARITY_COL[rar];
  packSpark(w / 2, 450, 10 + rar * 20 + (packHolo[i] ? 24 : 0), packHolo[i] ? hsbColor(rand.nextFloat(), 0.45, 1) : rc, 6 + rar * 2);
  if (rar >= 1) { ringT = 1; ringCol = rc; }
  shakeT = rar >= 3 ? 18 : (rar == 2 ? 11 : (rar == 1 ? 5 : 0));
  if (rar >= 2) packFlash = rar >= 3 ? 12 : 5;
  Sound.sfx(rar >= 3 ? "evolve.wav" : (rar == 2 ? "achieve.wav" : (rar == 1 ? "golden_catch.wav" : "pop2.wav")), -2);
  if (packHolo[i]) Sound.sfx("golden_appear.wav", -4);
}
