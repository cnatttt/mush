// ---- saving (localStorage, one key per slot) ----
const SAVE_PREFIX = "mush_save_";
function saveKey(k) { return SAVE_PREFIX + (k + 1); }
function saveGame() {
  if (slot < 0) return;
  try {
    const o = {
      count, totalEarned, runEarned, clickPower, perSecond, spores, spentSpores, stage, branch, skin, evo, worn, wornAsc,
      skinOwned: skinOwned.slice(), owned: owned.slice(), cost: cost.slice(), ach: ach.slice(),
      clicks, crits, goldCaught, crowGifts, prestiges, playTicks, dayTick, ended, huntBest, huntTotal, huntCool, buys, bossKills, questsDone,
      dealItem, dealLeft, dealCool, qKind: qKind.slice(), qGoal: qGoal.slice(), qStart: qStart.slice(), seasonTicks: seasonTicks.slice(),
      found: found.slice(), cards: cardCount.slice(), holo: holo.slice(), packs: packs.slice(), mname, volume: Sound.level(), lastSave: Date.now()
    };
    localStorage.setItem(saveKey(slot), JSON.stringify(o));
  } catch (e) { }
}
function readSave(k) {
  try { const s = localStorage.getItem(saveKey(k)); return s ? JSON.parse(s) : null; } catch (e) { return null; }
}
function nn(v, d) { return (typeof v === "number" && isFinite(v)) ? v : d; }
function arrOf(a, n) { const r = new Array(n).fill(0); if (Array.isArray(a)) for (let i = 0; i < n && i < a.length; i++) r[i] = a[i] === true ? 1 : (a[i] === false ? 0 : nn(a[i], 0)); return r; }
function loadGame() {
  const o = readSave(slot);
  if (!o) return;
  try {
    count = nn(o.count, 0); totalEarned = nn(o.totalEarned, 0); runEarned = nn(o.runEarned, 0);
    clickPower = Math.max(1, nn(o.clickPower, 1)); perSecond = nn(o.perSecond, 0);
    spores = nn(o.spores, 0); spentSpores = nn(o.spentSpores, 0);
    stage = Math.max(0, Math.min(4, nn(o.stage, 0))); branch = nn(o.branch, -1);
    if (stage == 4 && branch < 0) branch = 0;
    evo = stage == 4 ? Math.max(0, Math.min(2, nn(o.evo, 0))) : 0; choosing2 = false;
    if (o.worn !== undefined) { worn = evo >= 1 ? Math.max(-1, Math.min(3, nn(o.worn, -1))) : -1; wornAsc = evo == 2 && o.wornAsc === true; }
    else if (evo >= 1) { worn = Math.max(0, branch) * 2 + Math.max(0, Math.min(1, nn(o.form, 0))); wornAsc = evo == 2; } else { worn = -1; wornAsc = false; }
    evo = stage == 4 ? evoCount() : 0;
    if (worn >= 0 && !formOpen(1, worn)) { worn = -1; wornAsc = false; }
    if (wornAsc && !formOpen(2, worn)) wornAsc = false;
    skin = Math.max(0, Math.min(7, nn(o.skin, 0)));
    let a = arrOf(o.skinOwned, 8); for (let i = 0; i < 8; i++) skinOwned[i] = a[i] == 1; skinOwned[0] = true;
    a = arrOf(o.owned, 28); for (let i = 0; i < 28; i++) owned[i] = a[i];
    a = arrOf(o.cost, 28); for (let i = 0; i < 28; i++) cost[i] = a[i] > 0 ? a[i] : baseCost[i];
    a = arrOf(o.ach, ach.length); for (let i = 0; i < ach.length; i++) ach[i] = a[i] == 1;
    clicks = nn(o.clicks, 0); crits = nn(o.crits, 0); goldCaught = nn(o.goldCaught, 0); crowGifts = nn(o.crowGifts, 0);
    prestiges = nn(o.prestiges, 0); playTicks = nn(o.playTicks, 0); dayTick = nn(o.dayTick, 0); ended = o.ended === true;
    huntBest = nn(o.huntBest, 0); huntTotal = nn(o.huntTotal, 0); huntCool = nn(o.huntCool, 0); buys = nn(o.buys, 0);
    bossKills = nn(o.bossKills, 0); questsDone = nn(o.questsDone, 0);
    dealItem = nn(o.dealItem, -1); dealLeft = nn(o.dealLeft, 0); dealCool = nn(o.dealCool, 0);
    if (dealLeft <= 0 || dealItem < 0 || dealItem > 7) { dealItem = -1; dealLeft = 0; }
    a = arrOf(o.found, 16); for (let i = 0; i < 16; i++) found[i] = a[i] == 1;
    a = arrOf(o.cards, 16); for (let i = 0; i < 16; i++) cardCount[i] = a[i];
    a = arrOf(o.holo, 16); for (let i = 0; i < 16; i++) holo[i] = a[i] == 1;
    a = arrOf(o.packs, 3); for (let i = 0; i < 3; i++) packs[i] = a[i];
    for (let i = 0; i < 16; i++) { if (found[i] && cardCount[i] == 0) cardCount[i] = 1; if (cardCount[i] > 0) found[i] = true; }
    mname = typeof o.mname === "string" ? o.mname.substring(0, 12) : "";
    a = arrOf(o.seasonTicks, 4); for (let i = 0; i < 4; i++) seasonTicks[i] = a[i];
    const k = arrOf(o.qKind, 3), g = arrOf(o.qGoal, 3), s = arrOf(o.qStart, 3);
    for (let i = 0; i < 3; i++) {
      if (k[i] >= 0 && k[i] <= 6 && g[i] > 0 && o.qKind) { qKind[i] = k[i]; qGoal[i] = g[i]; qStart[i] = s[i]; } else newQuest(i);
    }
    Sound.setLevel(nn(o.volume, 0));
    season = Math.floor(playTicks / 12000) % 4; lastSeason = season;
    rebuildMush();
    savedAt = nn(o.lastSave, 0);
    const away = savedAt > 0 ? idiv(Date.now() - savedAt, 1000) : 0;
    if (away >= 60 && perSecond > 0) { awaySecs = Math.min(away, 7200); awayGain = idiv(secGain() * awaySecs * 3, 10); }
  } catch (e) { }
}
function applyOffline() {
  if (awayGain > 0) { earn(awayGain); awayLife = 200; awayShown = awayGain; Sound.sfx("golden_catch.wav", -6); }
  awayGain = 0;
}
function wipeSave() {
  if (Date.now() - wipeArmedAt > 4000) { wipeArmedAt = Date.now(); Sound.pop(); return; }
  wipeArmedAt = -10000;
  try { localStorage.removeItem(saveKey(slot)); } catch (e) { }
  resetAll(); paused = false; saveGame();
  Sound.sfx("evolve.wav", -3);
  showBanner("NEW GAME STARTED", C(160, 255, 240));
}
function resetAll() {
  count = 0; totalEarned = 0; runEarned = 0; clickPower = 1; perSecond = 0; spores = 0; spentSpores = 0;
  mname = ""; nameBuf = ""; inPack = false; naming = false; godClicks = false; adminSpeed = false;
  stage = 0; branch = -1; choosing = false; evo = 0; worn = -1; wornAsc = false; form = 0; choosing2 = false; skin = 0;
  skinOwned.fill(false); skinOwned[0] = true; owned.fill(0);
  for (let i = 0; i < 28; i++) cost[i] = baseCost[i];
  ach.fill(false); seasonTicks.fill(0); found.fill(false); cardCount.fill(0); holo.fill(false); packs.fill(0);
  clicks = 0; crits = 0; goldCaught = 0; crowGifts = 0; prestiges = 0; playTicks = 0; dayTick = 0; ended = false;
  huntBest = 0; huntTotal = 0; huntCool = 0; buys = 0; bossKills = 0; questsDone = 0;
  dealItem = -1; dealLeft = 0; dealCool = 0; frenzy = 0; rain = 0; goldenOn = false; bossOn = false;
  nextBoss = 8000 + rand.nextInt(4000); season = 0; lastSeason = 0; awayLife = 0; tab_ = 0;
  for (let i = 0; i < 3; i++) qKind[i] = -1;
  for (let i = 0; i < 3; i++) newQuest(i);
  floats = []; spore = [];
  rebuildMush();
}
