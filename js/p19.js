// ---- extra state (potions, journey, hollow form, blood moons) + the JOURNEY guide ----
const X = { j: 0, pot: [0, 0, 0, 0, 0, 0], buff: [0, 0, 0, 0, 0, 0], pBought: 0, pUnlocked: false, hollow: false, hollowOn: false, moons: 0, twist: false };
const POT_UNLOCK = 150000;
function xReset() { X.j = 0; X.pot = [0, 0, 0, 0, 0, 0]; X.buff = [0, 0, 0, 0, 0, 0]; X.pBought = 0; X.pUnlocked = false; X.hollow = false; X.hollowOn = false; X.moons = 0; X.twist = false; }
function xSave() { return { j: X.j, pot: X.pot.slice(), buff: X.buff.slice(), pb: X.pBought, pu: X.pUnlocked, ho: X.hollow, hw: X.hollowOn, mo: X.moons, tw: X.twist }; }
function xLoad(o) {
  xReset();
  if (o && typeof o === "object") {
    X.j = nn(o.j, 0); X.pot = arrOf(o.pot, 6); X.buff = arrOf(o.buff, 6); X.pBought = nn(o.pb, 0);
    X.pUnlocked = o.pu === true; X.hollow = o.ho === true; X.hollowOn = o.hw === true; X.moons = nn(o.mo, 0); X.twist = o.tw === true;
  }
  if (totalEarned >= POT_UNLOCK) X.pUnlocked = true;
  if (ended || bossKills >= 5) X.hollow = true;
  if (!X.hollow) X.hollowOn = false;
  while (X.j < JOURNEY.length && JOURNEY[X.j].now() >= JOURNEY[X.j].need) X.j++;   // old saves: skip the steps already done
}
// kind: pack(t) | mush(seconds of income) | frenzy | potion(i)
const JOURNEY = [
  { t: "CLICK THE MUSHROOM", how: "CLICK IT, OR PRESS SPACE", need: 25, now: () => clicks, rw: { k: "mush", n: 20 } },
  { t: "BUY GLOVES", how: "CLICK THE SHOP SIGN, THEN GLOVES", need: 1, now: () => owned[0], rw: { k: "mush", n: 30 } },
  { t: "BUY A FARM", how: "FARMS MAKE MUSHROOMS FOR YOU", need: 1, now: () => owned[4], rw: { k: "mush", n: 60 } },
  { t: "EVOLVE YOUR MUSHROOM", how: "KEEP EARNING TO REACH " + fmt(STAGE_AT[1]), need: STAGE_AT[1], now: () => totalEarned, rw: { k: "pack", t: 0 } },
  { t: "OPEN YOUR FIRST PACK", how: "CLICK BOOK, THEN OPEN A PACK", need: 1, now: () => foundCount(), rw: { k: "mush", n: 90 } },
  { t: "CATCH A GOLDEN MUSHROOM", how: "IT APPEARS NOW AND THEN. CLICK IT!", need: 1, now: () => goldCaught, rw: { k: "pack", t: 0 } },
  { t: "OWN 5 FARMS", how: "BUY MORE IN THE SHOP", need: 5, now: () => owned[4], rw: { k: "mush", n: 120 } },
  { t: "REACH THE CLUSTER", how: "EARN " + fmt(STAGE_AT[2]) + " IN TOTAL", need: STAGE_AT[2], now: () => totalEarned, rw: { k: "pack", t: 1 } },
  { t: "FINISH A GOAL", how: "COMPLETE ONE OF THE 3 GOALS UNDER THIS", need: 1, now: () => questsDone, rw: { k: "mush", n: 150 } },
  { t: "TRY THE HUNT", how: "CLICK THE HUNT BUTTON TOP RIGHT", need: 1, now: () => huntBest, rw: { k: "pack", t: 0 } },
  { t: "OPEN THE POTION ROOM", how: "EARN " + fmt(POT_UNLOCK) + ". A NEW SIGN APPEARS", need: POT_UNLOCK, now: () => totalEarned, rw: { k: "potion", i: 1 } },
  { t: "BUY A POTION", how: "VISIT THE POTION SIGN", need: 1, now: () => X.pBought, rw: { k: "potion", i: 0 } },
  { t: "REACH CRYSTAL BLOOM", how: "EARN " + fmt(STAGE_AT[3]) + " IN TOTAL", need: STAGE_AT[3], now: () => totalEarned, rw: { k: "pack", t: 1 } },
  { t: "FIND 8 DIFFERENT CARDS", how: "OPEN PACKS IN THE BOOK", need: 8, now: () => foundCount(), rw: { k: "pack", t: 1 } },
  { t: "DEFEAT THE BLIGHT", how: "IT COMES TO THE LOBBY. CLICK IT FAST!", need: 1, now: () => bossKills, rw: { k: "potion", i: 3 } },
  { t: "DO A SPORE RESET", how: "SHOP > PERKS TAB. IT GIVES SPORES", need: 1, now: () => prestiges, rw: { k: "pack", t: 2 } },
  { t: "REACH COSMIC", how: "EARN " + fmt(STAGE_AT[4]) + " AND PICK A PATH", need: STAGE_AT[4], now: () => totalEarned, rw: { k: "pack", t: 2 } },
  { t: "UNLOCK THE FIRST NEW FORM", how: "EARN " + fmt(EVO_T[0]) + ". SEE TREE > NEW FORMS", need: 1, now: () => evo, rw: { k: "potion", i: 1 } },
  { t: "FIND ALL 16 CARDS", how: "KEEP OPENING PACKS", need: 16, now: () => foundCount(), rw: { k: "pack", t: 2 } },
  { t: "UNLOCK THE HOLLOW FORM", how: "DEFEAT THE BLIGHT 5 TIMES", need: 5, now: () => bossKills, rw: { k: "potion", i: 2 } },
  { t: "COLLECT ALL 4 NEW FORMS", how: "EARN " + fmt(EVO_T[3]) + " TO FINISH THE GAME", need: 4, now: () => evo, rw: { k: "pack", t: 2 } },
  { t: "LEARN THE TRUTH", how: "FINISH THE GAME TO SEE THE ENDING", need: 1, now: () => (ended ? 1 : 0), rw: { k: "pack", t: 2 } }
];
function rewardText(r) { return r.k == "pack" ? "+1 " + PACK_NAME[r.t] + " PACK" : r.k == "mush" ? "+MUSHROOMS" : r.k == "potion" ? "+1 " + POT[r.i].n : ""; }
function journeyTick() {
  storyTick();
  while (X.j < JOURNEY.length) {
    const s = JOURNEY[X.j];
    if (s.now() < s.need) break;
    X.j++;
    const r = s.rw;
    if (r.k == "pack") givePack(r.t);
    else if (r.k == "mush") earn(Math.max(100, secGain() * r.n));
    else if (r.k == "potion") { X.pot[r.i] = Math.min(99, X.pot[r.i] + 1); }
    showBanner("STEP DONE: " + s.t + "  " + rewardText(r), C(158, 232, 118));
    Sound.sfx("achieve.wav", -4);
    if (X.j < JOURNEY.length) pendingJourney = true;
    saveGame();
  }
}
let pendingJourney = false;
function journeyRow(g, y) {   // drawn by the left HUD
  const done = X.j >= JOURNEY.length;
  const s = done ? null : JOURNEY[X.j];
  fitText(g, done ? "JOURNEY COMPLETE!" : "STEP " + (X.j + 1) + "/" + JOURNEY.length + ": " + s.t, 40, y, 300, C(158, 232, 118), false);
  if (done) return;
  const frac = Math.min(1, s.now() / s.need);
  hudBar(g, y + 14, frac, C(158, 232, 118));
  fitText(g, s.how, 40, y + 42, 264, C(190, 175, 205), false);
}
