// ---- constants (ported from MushFrame.java) ----
const W = 1470, H = 956, w = W, h = H;
const TITLE = "MUSH", SHOW_INTRO = true, DAY_NIGHT = true, DAY_TICKS = 4000;
const STAGE_AT = [0, 600, 15000, 500000, 15000000];
const STAGE_NAME = ["A TINY SPORE", "MOSSY ELDER", "THE CLUSTER", "CRYSTAL BLOOM", "COSMIC", "THORNBACK"];
const SKIN_HUE = [0.77, 0.60, 0.99, 0.11, 0.90, 0.17, 0.05, 0.56];
const SKIN_GLOW = [0.49, 0.14, 0.49, 0.56, 0.35, 0.02, 0.12, 0.60];
const SKIN_NAME = ["PURPLE", "BLUE", "RED", "GOLD", "BLOSSOM", "SUNNY", "AUTUMN", "FROST"];
const SEASON_NAME = ["SPRING", "SUMMER", "AUTUMN", "WINTER"];
const STAGE_FX = ["WHERE IT ALL BEGAN", "+5% INCOME", "+15% CLICK POWER", "+5% CRIT CHANCE", "+25% INCOME", "+30% CLICK POWER"];
const TAB_NAME = ["TOOLS", "FARMS", "SKINS", "PERKS", "SPORE", "PETS", "PETS+"];
const WEATHER_NAME = ["CLEAR", "RAIN", "SNOW", "FIREFLIES"];
const TITLE_TICK = 334;
const itemName = ["GLOVES", "GOLD CAP", "SPORE FIST", "MOON CAP", "FARM", "MILL", "GROVE", "TEMPLE", "PURPLE", "BLUE", "RED", "GOLD",
  "LUCKY CAPS", "GOLDEN NOSE", "LONG FRENZY", "BIG CRITS", "HEAD START", "DEEP ROOTS", "SPORE LUCK", "GOLD ROOTS", "SNAIL", "FROG", "OWL", "WISP", "BAT", "BEE", "MOTH", "SPRITE"];
const baseCost = [25, 500, 15000, 400000, 150, 1500, 15000, 170000, 0, 500, 5000, 50000, 3000, 8000, 25000, 90000, 3, 5, 4, 6, 20000, 80000, 300000, 1200000, 2500000, 8000000, 25000000, 80000000];
const unlockAt = [0, 250, 8000, 200000, 0, 500, 6000, 70000, 0, 0, 0, 0, 1000, 4000, 12000, 50000, 0, 0, 0, 0, 5000, 25000, 100000, 400000, 800000, 2500000, 8000000, 25000000];
const amount = [1, 6, 40, 250, 1, 8, 60, 450, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const perkInfo = ["CRIT CHANCE +5%", "GOLDEN APPEARS 2X", "FRENZY LASTS 40S", "CRITS HIT X25", "START RUNS WITH 10 FARMS", "FARMS MAKE +25%", "CRIT CHANCE +3%", "GOLDEN STAYS 2X LONGER", "+10% TO EVERYTHING", "AUTO-CLICKS 3X A SECOND", "+50% INCOME AT NIGHT", "FREE BONUS EVERY 20 SECONDS", "+25% CLICK POWER AT NIGHT", "FARMS MAKE +15%", "CROWS VISIT 2X OFTEN", "FRENZY IS X7 NOT X5"];
const cost = new Array(28).fill(0);
const owned = new Array(28).fill(0);
const ACH_NAME = ["FIRST SPORE", "CLICK HAPPY", "CLICK FIEND", "SMALL HARVEST", "BIG HARVEST", "TYCOON", "FARMER", "MILLER", "TEMPLE KEEPER",
  "LUCKY", "GOLD RUSH", "GOLDEN TOUCH", "FASHIONISTA", "EVOLVED", "FINAL FORM", "REBORN", "CROW FRIEND", "PERK HUNTER", "THE END", "PET LOVER", "HUNTER", "BLIGHT SLAYER", "SEASONED", "ERRAND RUNNER", "COLLECTOR", "FULL BOOK"];
const ACH_DESC = ["CLICK THE MUSHROOM", "CLICK 100 TIMES", "CLICK 1000 TIMES", "EARN 1K", "EARN 1M", "EARN 1B", "OWN 10 FARMS", "OWN 5 MILLS", "OWN A TEMPLE",
  "LAND 10 CRITS", "CATCH A GOLDEN ONE", "CATCH 10 GOLDEN", "BUY A SKIN", "REACH STAGE 3", "PICK A FINAL FORM", "DO A SPORE RESET", "CATCH 3 CROWS", "BUY ALL PERKS", "EARN 1 TRILLION", "ADOPT ALL 8 PETS", "SCORE 30 IN A HUNT", "DEFEAT THE BLIGHT", "OWN 4 SEASON SKINS", "DONE 10 QUESTS", "FIND 8 MUSHROOMS", "FIND ALL 16"];
const ach = new Array(ACH_NAME.length).fill(false);
let huntBest = 0, bossKills = 0, questsDone = 0;

const SP_NAME = ["MOSSCAP", "BUTTON", "PUFFBALL", "OYSTER", "INKCAP", "WISPCAP", "BRACKET", "SHAGGY", "FLAMECAP", "FROSTCAP", "GLOWGILL", "STARCAP", "JADECAP", "VOIDCAP", "SUNBLOOM", "UNDYING"];
const SP_RARITY = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 3];
const SP_TYPE = [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0];
const SP_VAL = [1, 1, 1, 1, 1, 1, 1, 1, 3, 3, 3, 3, 3, 6, 6, 12];
const RARITY_NAME = ["COMMON", "RARE", "EPIC", "LEGENDARY"];
const RARITY_COL = [C(190, 190, 210), C(90, 170, 255), C(200, 110, 255), C(255, 200, 60)];

let bg, mush, mushHover, pressedNow = false, mushLow = 0;
let sign, shopBg, button, buttonPressed, back, tab, tabActive, golden, plaque;
let signHover, buttonHover, backHover, tabHover, goldenHover, plaqueHover;
let tinyFrames = [], wheelFrames = [], crowFrames = [], stageRaw = [], introImg = [], thumbImg = [], thumbSil = [], silhouette = [], skinThumb = [], petFrames = [], shopFrames = null;
let mushBox, signBox, backBox, resetBox, muteBox, statsBox, goldBox = R(0, 0, 0, 0), crowBox = R(0, 0, 0, 0);
const itemBox = [], tabBox = [];
let count = 0, totalEarned = 0, runEarned = 0, clickPower = 1, perSecond = 0;
let spores = 0, spentSpores = 0, stage = 0, skin = 0, tab_ = 0;
const skinOwned = [true, false, false, false, false, false, false, false];
let pressedItem = -1, hoverItem = -1, hoverTab = -1;
let inShop = false, inStats = false, hoverMush = false, hoverSign = false, hoverBack = false, hoverGold = false, hoverStats = false, hoverMute = false, hoverCrow = false;
let bigFont, midFont, smallFont, titleFont;
const rand = { nextInt: n => Math.floor(Math.random() * n), nextFloat: () => Math.random(), nextDouble: () => Math.random(), nextBoolean: () => Math.random() < 0.5 };
let floats = [], spore = [];
let tick = 0, dayTick = 0, econAcc = 0, lastSpace = 0, frac = 0;
const GROUND_GAP = 0;
let mushY = 0, signY = 0, pressHold = 0;
let paused = false, ended = false, inEnding = false, endTick = 0;
const pauseBox = [];
let pauseBtn, bookBox, infoBox, hoverBook = false, hoverInfo = false;
const found = new Array(16).fill(false);
let spImg = [], spDark = [];
const spBox = [];
let hoverSpecies = -1, discoverIdx = -1, discoverLife = 0, hoverPauseBtn = false;
let treeBox; const thumbBox = []; let hoverTree = false;
let page = 0;
let branch = -1, choosing = false; const chooseBox = []; let hoverChoose = -1;
let season = 0, lastSeason = 0; const seasonTicks = [0, 0, 0, 0];
const spx = new Array(60), spy = new Array(60), spvy = new Array(60);
let hoverPause = -1;
// hunt
let hoverStart = false, inHunt = false, hoverHunt = false, huntNewBest = false;
let huntState = 0, huntTime = 0, huntScore = 0, huntStreak = 0, huntBestStreak = 0, huntCaught = 0, huntCool = 0, huntSpawn = 0, hoverHole = -1;
let huntReward = 0, huntTotal = 0, buys = 0;
const holeType = new Array(12).fill(0), holeLife = new Array(12).fill(0), holeMax = new Array(12).fill(0), holeFx = new Array(12).fill(0);
let huntBox, huntStartBox, dealBox; const holeBox = [];
let poisonImg, bossImg, bossHover;
// boss
let bossOn = false, hoverBoss = false, bossHp = 0, bossMax = 0, bossLife = 0, bossHit = 0, nextBoss = 3000 + rand.nextInt(1500);
const bossBox = R(1190, 200, 240, 264);
let dealItem = -1, dealLeft = 0, dealCool = 0;
const qKind = [-1, -1, -1], qGoal = [0, 0, 0], qStart = [0, 0, 0];
// saving
let slot = -1, slotScreen = false, hoverSlot = -1; const slotBox = [];
let delArm = -1, hoverDel = -1, delArmAt = 0;
function delBox(k) { const r = slotBox[k]; return R(r.x + r.width - 126, r.y + 14, 108, 34); }
const slotLines = [null, null, null];
let awayShown = 0, awayGain = 0, awaySecs = 0, wipeArmedAt = -10000, savedAt = 0, awayLife = 0;
let clicks = 0, crits = 0, goldCaught = 0, crowGifts = 0, prestiges = 0, playTicks = 0;
let goldenOn = false, goldenLife = 0, nextGolden = 3000 + rand.nextInt(3000), frenzy = 0, gx = 0, gy = 0;
let banner = "", toast = "", bannerLife = 0, toastLife = 0, bannerColor = Color_WHITE;
let crowOn = false, crowX = 0, crowY = 0, nextCrow = 1500 + rand.nextInt(1500), nextRain = 2400 + rand.nextInt(2400), rain = 0;
let weather = 0, weatherLeft = 900;
const wx = new Array(140).fill(0), wy = new Array(140).fill(0), wvx = new Array(140).fill(0), wvy = new Array(140).fill(0);
let intro = SHOW_INTRO, musicStarted = false, introTick = 0, fade = 0, whiteFlash = 0;
const starfield = []; for (let i = 0; i < 170; i++) starfield.push([0, 0, 0]);
let resetArmedAt = -10000;
let bubble = "", bubbleChars = 0, bubbleHold = 0, nextIdle = 600, pendingSay = null;
const SAY_GREET = ["THE ROOTS REMEMBER YOU...", "WELCOME BACK, LITTLE SPORE.", "EVERYTHING HERE HAS A PRICE.", "CAW... THE DARK IS HUNGRY TONIGHT."];
const SAY_BUY = ["A FAIR TRADE... FOR NOW.", "THE BLIGHT THANKS YOU. CAW.", "ANOTHER SOUL SATISFIED.", "TAKE IT. IT WANTS TO BE YOURS."];
const SAY_POOR = ["YOUR POCKETS ARE EMPTY, LIKE A GRAVE.", "NO SHROOMS, NO SHELTER.", "COME BACK WHEN YOU ARE HEAVIER."];
const SAY_LOCKED = ["NOT YET... THE DARK ISN'T READY.", "THAT ONE SLEEPS. LET IT SLEEP."];
const SAY_IDLE = ["THE TREES LEAN CLOSER AT NIGHT...", "SOMETHING WATCHES FROM THE ROOTS.", "THE BLOOD MOON BRINGS SOMETHING OLD.", "SPORES SPARKLE AFTER A RESET...", "DON'T TOUCH MY SHINY THINGS.", "MY COUSIN BREWS POTIONS DOWN THE PATH. HE LIES.", "THE BLIGHT WAS HERE BEFORE THE FOREST.", "EVERY KILL FEEDS YOU. HAVE YOU NOTICED?"];
const star = []; for (let i = 0; i < 60; i++) star.push([0, 0, 0]);
let nameBox, adminBox;
class FloatText { constructor(x, y, s, c) { this.x = x; this.y = y; this.s = s; this.c = c; this.life = 0; } }
class Spore { constructor(x, y, vx, vy, max, size, c) { this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.max = max; this.size = size; this.c = c; this.life = 0; this.free = false; } }

function idiv(a, b) { return Math.trunc(a / b); }
function pick(a) { return a[rand.nextInt(a.length)]; }

// ---- game logic ----
function mult() {
  const night = (owned[22] > 0 && elevation() < 0) ? 1.5 : 1;
  return (1 + 0.1 * spores) * (frenzy > 0 ? (owned[27] > 0 ? 7 : 5) : 1) * (rain > 0 ? 1.5 : 1) * (1 + colBonus(0) / 100.0) * (owned[20] > 0 ? 1.1 : 1) * night * (stage >= 1 ? 1.05 : 1) * (stage >= 4 && branch == 0 ? 1.25 : 1) * (worn >= 0 && (worn & 1) == 0 ? 1.3 : 1) * (worn >= 0 && wornAsc ? 1.5 : 1) * potMult() * (X.hollowOn ? 1.35 : 1);
}
function spCost(i) { return baseCost[i] * (owned[i] + 1); }
function deepRoots() { return 1 + 0.25 * owned[17]; }
function secGain() { return Math.round(perSecond * deepRoots() * (owned[25] > 0 ? 1.15 : 1) * mult()); }
function clickGain() { return Math.max(1, Math.round((godClicks ? 1000 : 1) * clickPower * mult() * (1 + colBonus(1) / 100.0) * (stage >= 2 ? 1.15 : 1) * (stage >= 4 && branch == 1 ? 1.3 : 1) * (worn >= 0 && (worn & 1) == 1 ? 1.4 : 1) * (worn >= 0 && wornAsc ? 1.5 : 1) * (owned[24] > 0 && elevation() < 0 ? 1.25 : 1) * (X.buff[0] > 0 ? 3 : 1))); }
function critChance() { return 5 + (owned[12] > 0 ? 5 : 0) + Math.min(30, 3 * owned[18]) + (stage >= 3 ? 5 : 0) + (X.buff[2] > 0 ? 25 : 0); }

function earn(n) {
  count += n; totalEarned += n; runEarned += n;
  for (let s = STAGE_AT.length - 1; s > stage; s--)
    if (totalEarned >= STAGE_AT[s]) {
      if (s == 4 && branch < 0) {
        if (stage < 3) continue;
        if (!choosing) { choosing = true; Sound.sfx("evolve.wav", -3); }
        break;
      }
      stage = s; rebuildMush(); Sound.sfx("evolve.wav", -3);
      showBanner("YOUR MUSHROOM EVOLVED!", C(255, 226, 120));
      givePack(1);
      pendingSay = "YOUR MUSHROOM... IT GREW!";
      burst(mushBox.x + 330, mushBox.y + 250, 40, 6, C(255, 226, 120));
      break;
    }
}

function click(p) {
  let gain = clickGain();
  const crit = rand.nextInt(100) < critChance();
  clicks++;
  if (crit) { gain *= (owned[15] > 0 ? 25 : 10); crits++; }
  earn(gain);
  const s = (crit ? "CRIT! +" : "+") + fmt(gain);
  floats.push(new FloatText(p.x + rand.nextInt(61) - 30 - (crit ? 90 : 0), p.y - 20, s, crit ? C(255, 150, 60) : C(255, 226, 120)));
  burst(p.x, p.y, crit ? 14 : 6, 6, crit ? C(255, 180, 80) : C(160, 255, 240));
  if (crit) Sound.sfx("crit.wav", -2); else Sound.pop();
  if (rand.nextInt(3500) == 0) givePack(0);
  if (bossOn) damageBoss(1);
}

function catchGolden() {
  goldenOn = false; goldCaught++;
  if (rand.nextInt(100) < 12) { const pi = dropPotion(1); showBanner("A POTION FELL OUT: " + POT[pi].n, C(190, 130, 255)); }
  if (rand.nextInt(100) < 6) findSpecies(1); else if (rand.nextInt(100) < 12) findSpecies(0);
  nextGolden = idiv(3000 + rand.nextInt(3000), (owned[13] > 0 ? 2 : 1));
  Sound.sfx("golden_catch.wav", -2);
  burst(goldBox.x + 78, goldBox.y + 84, 30, 6, C(255, 215, 80));
  if (rand.nextBoolean()) {
    frenzy = owned[14] > 0 ? 1334 : 667;
    showBanner("FRENZY! X" + (owned[27] > 0 ? 7 : 5) + " FOR " + (owned[14] > 0 ? 40 : 20) + " SECONDS", C(255, 150, 60));
  } else {
    const bonus = Math.max(77, idiv(count, 15) + secGain() * 40);
    earn(bonus);
    showBanner("LUCKY! +" + fmt(bonus), C(255, 226, 120));
  }
}

function chooseBranch(b) {
  branch = b; stage = 4; choosing = false; rebuildMush();
  Sound.sfx("evolve.wav", -3);
  showBanner(b == 0 ? "YOU BECAME COSMIC!" : "YOU BECAME THORNBACK!", C(255, 226, 120));
  givePack(2);
  pendingSay = "YOUR MUSHROOM... IT GREW!";
  burst(mushBox.x + 330, mushBox.y + 250, 40, 6, C(255, 226, 120));
}
function imgIdx() { if (stage == 4 && worn >= 0) return (wornAsc && evo == 2 ? 10 : 6) + worn; return stage == 4 && branch == 1 ? 5 : stage; }

function catchCrow() {
  crowOn = false; crowGifts++;
  if (rand.nextInt(100) < 10) findSpecies(0);
  nextCrow = idiv(1800 + rand.nextInt(1800), (owned[26] > 0 ? 2 : 1));
  const bonus = Math.max(50, idiv(count, 20) + secGain() * 15);
  earn(bonus);
  Sound.sfx("caw.wav", -2); Sound.sfx("golden_catch.wav", -8);
  burst(Math.trunc(crowX) + 45, Math.trunc(crowY) + 35, 24, 6, C(120, 100, 180));
  showBanner("THE CROW DROPPED +" + fmt(bonus), C(190, 160, 255));
}
function showBanner(s, c) { banner = s; bannerColor = c; bannerLife = 120; }
function unlocked(i) { if (i >= 16 && i < 20) return spores > 0; return totalEarned >= unlockAt[i]; }

function buy(i) {
  if (!unlocked(i)) { Sound.pop(); say(i >= 16 && i < 20 ? "SPORES COME FROM A SPORE RESET." : pick(SAY_LOCKED)); return; }
  if (i >= 16 && i < 20) {
    if (spores - spentSpores < spCost(i)) { Sound.pop(); say("NOT ENOUGH SPORES, FRIEND."); }
    else { spentSpores += spCost(i); owned[i]++; Sound.sfx("cash.wav", -2); buys++; say(pick(SAY_BUY)); }
    return;
  }
  if (i >= 12) {
    if (owned[i] > 0) { Sound.pop(); say("YOU ALREADY HAVE THAT ONE."); }
    else if (count < cost[i]) { Sound.pop(); say(pick(SAY_POOR)); }
    else { count -= cost[i]; owned[i] = 1; Sound.sfx("cash.wav", -2); buys++; say(pick(SAY_BUY)); }
    return;
  }
  if (i >= 8) {
    const k = i - 8;
    if (!skinOwned[k]) {
      if (count < cost[i]) { Sound.pop(); say(pick(SAY_POOR)); return; }
      count -= cost[i]; skinOwned[k] = true; Sound.sfx("cash.wav", -2); buys++; say(pick(SAY_BUY));
    } else Sound.pop();
    skin = k; rebuildMush();
    return;
  }
  if (count < price(i)) { Sound.pop(); say(pick(SAY_POOR)); return; }
  const want = buyQty == 0 ? 1000 : BUY_QTY[buyQty];
  let got = 0;
  while (got < want) {
    const pr = price(i);
    if (count < pr) break;
    count -= pr; owned[i]++; got++;
    cost[i] += Math.max(1, idiv(cost[i] * 2, 5));
    if (i < 4) clickPower += amount[i]; else perSecond += amount[i];
  }
  Sound.sfx("cash.wav", -2); buys += got; say(got > 1 ? pick(SAY_BUY) + " X" + got : pick(SAY_BUY));
}

function sporeGain() { return Math.floor(Math.sqrt(runEarned / 1000000.0)); }

function prestige() {
  const gain = sporeGain();
  if (gain < 1) { Sound.pop(); say("EARN 1M IN ONE RUN FIRST."); return; }
  if (Date.now() - resetArmedAt > 4000) { resetArmedAt = Date.now(); Sound.pop(); say("SURE? FARMS AND TOOLS VANISH! CLICK AGAIN."); return; }
  resetArmedAt = -10000;
  spores += gain; prestiges++; count = 0; runEarned = 0; clickPower = 1; perSecond = 0;
  for (let i = 0; i < 8; i++) { owned[i] = 0; cost[i] = baseCost[i]; }
  if (owned[16] > 0) { const hs = 10 * owned[16]; owned[4] = hs; perSecond = 10 * hs; for (let k = 0; k < hs; k++) cost[4] += Math.max(1, idiv(cost[4] * 2, 5)); }
  frenzy = 0; rain = 0; goldenOn = false;
  Sound.sfx("evolve.wav", -3);
  showBanner("+" + gain + " SPORES! NOW +" + (spores * 10) + "% FOREVER", C(160, 255, 240));
  say("THE SPORES REMEMBER YOU.");
}

function achieved(i) {
  const allPerks = owned[12] > 0 && owned[13] > 0 && owned[14] > 0 && owned[15] > 0;
  const anySkin = skinOwned[1] || skinOwned[2] || skinOwned[3];
  switch (i) {
    case 0: return clicks >= 1; case 1: return clicks >= 100; case 2: return clicks >= 1000;
    case 3: return totalEarned >= 1000; case 4: return totalEarned >= 1000000; case 5: return totalEarned >= 1000000000;
    case 6: return owned[4] >= 10; case 7: return owned[5] >= 5; case 8: return owned[7] >= 1;
    case 9: return crits >= 10; case 10: return goldCaught >= 1; case 11: return goldCaught >= 10;
    case 12: return anySkin; case 13: return stage >= 2; case 14: return stage >= 4; case 15: return prestiges >= 1;
    case 16: return crowGifts >= 3; case 17: return allPerks; case 18: return ended;
    case 19: return owned[20] > 0 && owned[21] > 0 && owned[22] > 0 && owned[23] > 0 && owned[24] > 0 && owned[25] > 0 && owned[26] > 0 && owned[27] > 0;
    case 20: return huntBest >= 30; case 21: return bossKills >= 1;
    case 22: return skinOwned[4] && skinOwned[5] && skinOwned[6] && skinOwned[7];
    case 23: return questsDone >= 10; case 24: return foundCount() >= 8;
    default: return foundCount() >= 16;
  }
}
function checkAchievements() {
  for (let i = 0; i < ach.length; i++)
    if (!ach[i] && achieved(i)) { ach[i] = true; toast = ACH_NAME[i]; toastLife = 130; Sound.sfx("achieve.wav", -3); }
}
function spaceClick() {
  const now = performance.now() * 1e6;
  if (now - lastSpace < 70000000) return;
  lastSpace = now; pressedNow = true; pressHold = 4;
  click({ x: mushBox.x + 330 + rand.nextInt(81) - 40, y: mushBox.y + 220 + rand.nextInt(61) - 30 });
}
function startEnding() { ended = true; inEnding = true; endTick = 0; inShop = false; inStats = false; paused = false; Sound.sfx("evolve.wav", -2); }
function leaveEnding() {
  if (endTick < 800) endTick = 800;
  else { inEnding = false; fade = 30; Sound.pop(); showBanner("THE MYCELIUM KEEPS GROWING...", C(160, 255, 240)); }
}
function advanceIntro() {
  if (introTick < TITLE_TICK) { introTick = TITLE_TICK; whiteFlash = 12; Sound.stopIntro(); startMusic(); }
  else if (fade == 0) startGame();
}

// ---- hunt ----
function mmss(ticks) { const s = idiv(ticks * 30, 1000); return idiv(s, 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60); }
function holeX(i) { return w / 2 + Math.trunc((i % 4 - 1.5) * 230); }
function holeY(i) { return 400 + Math.floor(i / 4) * 175; }
function enterHunt() {
  if (huntCool > 0) { Sound.pop(); showBanner("THE HUNT OPENS IN " + mmss(huntCool), C(255, 226, 170)); return; }
  inHunt = true; huntState = 0;
  for (let i = 0; i < 12; i++) { holeType[i] = 0; holeFx[i] = 0; }
  floats = []; Sound.pop();
}
function startHunt() {
  huntState = 1; huntTime = 1000; huntScore = 0; huntStreak = 0; huntBestStreak = 0; huntCaught = 0; huntSpawn = 10;
  for (let i = 0; i < 12; i++) holeType[i] = 0;
  Sound.pop();
}
function leaveHunt() { inHunt = false; huntState = 0; floats = []; Sound.pop(); }
function spawnHole() {
  let active = 0;
  for (let i = 0; i < 12; i++) if (holeType[i] != 0) active++;
  if (active >= 5) return;
  let i = rand.nextInt(12), tries = 0;
  while (holeType[i] != 0 && ++tries < 30) i = rand.nextInt(12);
  if (holeType[i] != 0) return;
  const r = rand.nextInt(100);
  holeType[i] = r < 14 ? 2 : (r < 32 ? 3 : 1);
  holeLife[i] = holeMax[i] = holeType[i] == 2 ? 30 : 40;
}
function huntStep() {
  for (let i = 0; i < 12; i++) if (holeFx[i] > 0) holeFx[i]--;
  if (huntState != 1) return;
  huntTime--;
  if (--huntSpawn <= 0) { spawnHole(); huntSpawn = Math.max(6, 14 - idiv(1000 - huntTime, 110)) + rand.nextInt(6); }
  for (let i = 0; i < 12; i++) if (holeType[i] != 0 && --holeLife[i] <= 0) holeType[i] = 0;
  if (huntTime <= 0) endHunt();
}
function huntClick(p) {
  if (huntState == 0) { if (inR(huntStartBox, p)) startHunt(); else if (inR(backBox, p)) leaveHunt(); return; }
  if (huntState == 2) { leaveHunt(); return; }
  for (let i = 0; i < 12; i++) if (inR(holeBox[i], p)) { whack(i); return; }
}
function whack(i) {
  const hx = holeX(i), hy = holeY(i), t = holeType[i];
  if (t == 0) { huntStreak = 0; return; }
  holeType[i] = 0; holeFx[i] = 8;
  if (t == 3) {
    huntScore = Math.max(0, huntScore - 3); huntStreak = 0;
    floats.push(new FloatText(hx - 30, hy - 90, "-3", C(255, 90, 90)));
    burst(hx, hy - 40, 12, 6, C(255, 80, 80)); Sound.sfx("caw.wav", -8);
    return;
  }
  const pts = (t == 2 ? 5 : 1) + Math.min(5, idiv(huntStreak, 5));
  huntStreak++; huntCaught++; huntBestStreak = Math.max(huntBestStreak, huntStreak); huntScore += pts;
  const gold = C(255, 215, 80);
  floats.push(new FloatText(hx - 30, hy - 90, "+" + pts, t == 2 ? gold : C(255, 242, 208)));
  burst(hx, hy - 40, t == 2 ? 20 : 8, 6, t == 2 ? gold : C(160, 255, 240));
  if (t == 2) Sound.sfx("golden_catch.wav", -6);
  else if (huntStreak % 5 == 0) { Sound.sfx("crit.wav", -4); floats.push(new FloatText(hx - 90, hy - 130, "STREAK " + huntStreak + "!", C(255, 150, 60))); }
  else Sound.pop();
}
function endHunt() {
  huntState = 2;
  for (let i = 0; i < 12; i++) holeType[i] = 0;
  const base = Math.max(80, secGain() * 25 + idiv(count, 60) + clickGain() * 40);
  huntReward = idiv(base * huntScore, 20);
  huntNewBest = huntScore > huntBest;
  if (huntNewBest) huntBest = huntScore;
  huntTotal += huntScore;
  const hr = rand.nextInt(100);
  if (huntScore >= 80 && hr < 4) findSpecies(2);
  else if (huntScore >= 50 && hr < 14) findSpecies(1);
  else if (huntScore >= 30 && hr < 28) findSpecies(0);
  huntCool = 6000;
  if (huntReward > 0) earn(huntReward);
  Sound.sfx("golden_catch.wav", -3);
}
function panel(g, x, y, pw, ph) {
  g.setColor(C(206, 104, 42)); g.fillRect(x, y, pw, ph);
  g.setColor(C(13, 5, 24, 240)); g.fillRect(x + 6, y + 6, pw - 12, ph - 12);
}
function drawHunt(g) {
  const cream = C(255, 242, 208), cyan = C(158, 232, 118), gold = C(240, 150, 55), red = C(255, 107, 107);
  g.drawImage(bg, 0, 0);
  g.setColor(C(8, 4, 20, 110)); g.fillRect(0, 0, w, h);
  for (let i = 0; i < 12; i++) {
    const hx = holeX(i), hy = holeY(i), t = holeType[i];
    g.setColor(C(10, 4, 8)); g.fillOval(hx - 78, hy - 12, 156, 40);
    if (t != 0) {
      const age = holeMax[i] - holeLife[i];
      const pr = Math.min(1.0, Math.min(age / 5.0, holeLife[i] / 5.0));
      const im = t == 2 ? golden : (t == 3 ? poisonImg : tinyFrames[Math.floor(tick / 6) % 3]);
      const iw = t == 2 ? 78 : 90, ih = t == 2 ? 84 : 90;
      const gg = g.create();
      gg.clipRect(hx - 90, hy - 140, 180, 146);
      if (t == 3) { gg.setColor(C(255, 50, 50, 70 + Math.trunc(Math.sin(tick * 0.4) * 30))); gg.fillOval(hx - 56, hy - 100, 112, 100); }
      gg.drawImage(im, hx - idiv(iw, 2), hy + 6 - Math.trunc(ih * pr), iw, ih);
      gg.dispose();
    }
    g.setColor(C(74, 44, 24)); g.fillOval(hx - 86, hy + 2, 172, 34);
    g.setColor(C(112, 72, 40)); g.fillOval(hx - 86, hy + 2, 172, 20);
    if (holeFx[i] > 0) { g.setColor(C(255, 242, 208, holeFx[i] * 25)); g.fillOval(hx - 86 - (8 - holeFx[i]) * 4, hy - 8, 172 + (8 - holeFx[i]) * 8, 12); }
  }
  g.setFont(bigFont); centered(g, "SCORE " + huntScore, w / 2, 70, cream);
  if (huntState == 1) {
    g.setColor(gold); g.fillRect(w / 2 - 304, 106, 608, 26);
    g.setColor(C(13, 5, 24)); g.fillRect(w / 2 - 300, 110, 600, 18);
    g.setColor(huntTime < 250 ? red : cyan); g.fillRect(w / 2 - 300, 110, idiv(600 * Math.max(0, huntTime), 1000), 18);
    g.setFont(smallFont);
    text(g, "TIME " + (idiv(huntTime * 30, 1000) + 1), w / 2 - 300, 154, cream);
    const sk = "STREAK " + huntStreak + (huntStreak >= 5 ? "  +" + Math.min(5, idiv(huntStreak, 5)) : "");
    text(g, sk, w / 2 + 300 - g.stringWidth(sk), 154, huntStreak >= 5 ? C(255, 150, 60) : cream);
  }
  if (huntState == 0) {
    panel(g, w / 2 - 380, 215, 760, 470);
    g.setFont(bigFont); centered(g, "MUSHROOM HUNT", w / 2, 275, cream);
    g.setFont(smallFont);
    centered(g, "30 SECONDS. WHACK THE TINY MUSHROOMS!", w / 2, 350, C(255, 226, 170));
    centered(g, "PURPLE  +1", w / 2, 405, cream); centered(g, "GOLDEN  +5", w / 2, 445, gold); centered(g, "RED = POISON  -3", w / 2, 485, red);
    centered(g, "EVERY 5 IN A ROW ADDS A BONUS POINT", w / 2, 540, cyan);
    centered(g, "CLICKING AN EMPTY HOLE BREAKS YOUR STREAK", w / 2, 575, C(190, 180, 210));
    centered(g, "BEST SCORE: " + huntBest, w / 2, 640, gold);
    g.drawImage(hoverStart ? buttonHover : button, huntStartBox.x, huntStartBox.y);
    g.setFont(bigFont); centered(g, "START", w / 2, huntStartBox.y + 46, cream);
    g.drawImage(hoverBack ? backHover : back, backBox.x, backBox.y);
    g.setFont(bigFont); text(g, "BACK", backBox.x + 44, backBox.y + 38, cream);
  } else if (huntState == 2) {
    panel(g, w / 2 - 380, 230, 760, 470);
    g.setFont(bigFont); centered(g, "TIME'S UP!", w / 2, 295, cream);
    g.setFont(midFont); centered(g, "SCORE " + huntScore, w / 2, 365, cyan);
    g.setFont(smallFont);
    centered(g, "CAUGHT " + huntCaught + "   BEST STREAK " + huntBestStreak, w / 2, 415, C(255, 226, 170));
    if (huntNewBest && Math.floor(Date.now() / 300) % 2 == 0) centered(g, "NEW BEST SCORE!", w / 2, 455, gold);
    g.setFont(midFont);
    centered(g, huntReward > 0 ? "+" + fmt(huntReward) + " MUSHROOMS" : "NO REWARD...", w / 2, 530, huntReward > 0 ? gold : red);
    g.setFont(smallFont);
    centered(g, "NEXT HUNT IN 3 MINUTES", w / 2, 590, C(190, 180, 210));
    centered(g, "CLICK TO CONTINUE", w / 2, 650, cyan);
  }
}
// ---- goals ----
function qNow(kind) {
  switch (kind) { case 0: return clicks; case 1: return crits; case 2: return goldCaught; case 3: return crowGifts; case 4: return totalEarned; case 5: return buys; default: return huntTotal; }
}
function questText(i) {
  const g = qGoal[i];
  switch (qKind[i]) {
    case 0: return "CLICK " + g + " TIMES"; case 1: return "LAND " + g + " CRITS"; case 2: return "CATCH " + g + " GOLDEN";
    case 3: return "CATCH THE CROW"; case 4: return "EARN " + fmt(g); case 5: return "BUY " + g + " THINGS"; default: return "SCORE " + g + " IN HUNTS";
  }
}
