// ---- collection book, info, bio ----
function foundCount() { let n = 0; for (const b of found) if (b) n++; return n; }
function allOf(rarity) { for (let i = 0; i < 16; i++) if (SP_RARITY[i] == rarity && !found[i]) return false; return true; }
function colBonus(type) {
  let b = 0;
  for (let i = 0; i < 16; i++) if (found[i] && SP_TYPE[i] == type) b += SP_VAL[i] * (holo[i] ? 2 : 1);
  if (allOf(0) && type == 0) b += 3;
  if (allOf(1) && type == 1) b += 3;
  if (foundCount() == 16) b += 10;
  return b;
}
function bigPanel(g) {
  g.setColor(C(6, 3, 16, 215)); g.fillRect(0, 0, w, h);
  g.setColor(C(13, 5, 24)); g.fillRect(110, 90, w - 220, 740);
  g.setColor(C(206, 104, 42));
  g.fillRect(110, 90, w - 220, 6); g.fillRect(110, 824, w - 220, 6); g.fillRect(110, 90, 6, 740); g.fillRect(w - 116, 90, 6, 740);
}
function drawBook(g) {
  bigPanel(g);
  const cream = C(255, 242, 208), cyan = C(158, 232, 118), gray = C(120, 110, 140), gold = C(240, 150, 55);
  g.setFont(bigFont); centered(g, "MUSHROOM BOOK", w / 2, 135, cream);
  g.setFont(smallFont); if (!bookStory) centered(g, "OPEN CARD PACKS TO COLLECT MUSHROOMS. HOLO CARDS GIVE DOUBLE BONUS.", w / 2, 175, C(255, 226, 170));
  smallBtn(g, storyBtn, bookStory ? "< BACK TO CARDS" : "STORY", bookStory);
  if (bookStory) { drawStory(g); g.drawImage(hoverBack ? backHover : back, backBox.x, backBox.y); g.setFont(bigFont); text(g, "BACK", backBox.x + 44, backBox.y + 38, cream); return; }
  smallBtn(g, openQtyBox, "OPEN AMOUNT: X" + openQty(), false);
  for (let i = 0; i < 16; i++) {
    const r = spBox[i], f = found[i];
    g.save(); g.translate(r.x + 70, r.y + 98);
    if (f) drawCard(g, i, holo[i], 2, 0, 0);
    else {
      g.drawImage(cardImg[SP_RARITY[i]], -70, -98, 140, 196);
      g.drawImage(spDark[i], -48, -98 + 38, 96, 96);
      g.setColor(C(10, 5, 24, 120)); g.fillRect(-70, -98, 140, 196);
      g.setFont(smallFont); centered(g, "???", 0, -98 + 20, gray);
    }
    g.restore();
    if (hoverSpecies == i) { g.setColor(C(255, 255, 255, 200)); g.drawRect(r.x - 3, r.y - 1, 146, 198); g.drawRect(r.x - 2, r.y, 144, 196); }
    if (f && cardCount[i] > 1) {
      g.setFont(smallFont);
      const s = "X" + cardCount[i], sw = g.stringWidth(s);
      g.setColor(C(13, 5, 24, 210)); g.fillRect(r.x + r.width - 14 - sw, r.y + 6, sw + 10, 22);
      text(g, s, r.x + r.width - 9 - sw, r.y + 17, cream);
    }
  }
  g.setFont(midFont);
  if (hoverSpecies >= 0) {
    const i = hoverSpecies;
    centered(g, found[i] ? SP_NAME[i] + (holo[i] ? "  HOLO" : "") : "???", w / 2, 655, RARITY_COL[SP_RARITY[i]]);
    g.setFont(smallFont);
    centered(g, RARITY_NAME[SP_RARITY[i]] + " MUSHROOM" + (found[i] ? "   OWNED X" + cardCount[i] : ""), w / 2, 693, cream);
    centered(g, found[i] ? "+" + SP_VAL[i] * (holo[i] ? 2 : 1) + "% " + (SP_TYPE[i] == 0 ? "INCOME" : "CLICK POWER") + " FOREVER" + (holo[i] ? " (HOLO X2)" : "") : "NOT FOUND YET. OPEN CARD PACKS!", w / 2, 727, found[i] ? cyan : gray);
    if (found[i]) { centered(g, LORE[i], w / 2, 752, C(190, 175, 205)); }
  } else {
    centered(g, "COLLECTED " + foundCount() + " / 16", w / 2, 655, gold);
    g.setFont(smallFont);
    centered(g, "BONUS: +" + colBonus(0) + "% INCOME   +" + colBonus(1) + "% CLICK POWER", w / 2, 693, cyan);
    centered(g, "ALL COMMON +3% INCOME   ALL RARE +3% CLICK   ALL 16 +10% BOTH", w / 2, 727, gray);
  }
  for (let k = 0; k < 4; k++) {
    const r = packBtn[k], can = k < 3 ? packs[k] > 0 : count >= packCost(), pc = PACK_COL[k < 3 ? k : 0][0];
    g.setColor(can ? pc : C(70, 56, 92)); g.fillRect(r.x, r.y, r.width, r.height);
    g.setColor(hoverBtn == k ? C(40, 30, 70) : C(13, 5, 24)); g.fillRect(r.x + 4, r.y + 4, r.width - 8, r.height - 8);
    g.setFont(smallFont);
    const lab = k < 3 ? "OPEN " + (openQty() > 1 ? Math.min(openQty(), packs[k]) + " " : "") + PACK_NAME[k] + "  X" + packs[k] : "BUY BASIC " + fmt(packCost());
    centered(g, lab, r.x + idiv(r.width, 2), r.y + idiv(r.height, 2), can ? cream : gray);
  }
  g.drawImage(hoverBack ? backHover : back, backBox.x, backBox.y);
  g.setFont(bigFont); text(g, "BACK", backBox.x + 44, backBox.y + 38, cream);
}
let infoAbout = false;
const aboutBox = R(560, 790, 350, 54);
const BIO = ["HI, I'M CNATT!",
  "I'M THE DEVELOPER, ARTIST AND TESTER OF MUSH, AND YOU'RE PLAYING IT.",
  "I BUILT THIS GAME ONE PIXEL AT A TIME. IT STARTED AS A SINGLE CLICKABLE MUSHROOM AND TURNED INTO FARMS, EVOLUTIONS, PETS, CARD PACKS AND A BOSS.",
  "EVERYTHING YOU SEE IS PIXEL ART, EVEN THE CARDS AND THE PACKS.",
  "THANKS FOR PLAYING. IF YOU FIND A BUG OR HAVE AN IDEA FOR A NEW MUSHROOM, TELL ME!"];
function drawAbout(g) {
  bigPanel(g);
  const cream = C(255, 242, 208), gold = C(240, 150, 55);
  g.setFont(bigFont); centered(g, "ABOUT THE DEVELOPER", w / 2, 135, cream);
  g.drawImage(thumbImg[Math.min(5, stage)], w / 2 - 100, 160, 200, 200);
  g.setFont(midFont); centered(g, "CNATT", w / 2, 410, gold);
  g.setFont(smallFont);
  let y = 470;
  for (let k = 0; k < BIO.length; k++) {
    const ls = wrap(BIO[k], 62);
    for (let li = 0; li < ls.length; li++) { centered(g, ls[li], w / 2, y, k == 0 ? gold : cream); y += 26; }
    y += 14;
  }
  g.drawImage(hoverBack ? backHover : back, backBox.x, backBox.y);
  g.setFont(bigFont); text(g, "BACK", backBox.x + 44, backBox.y + 38, cream);
}
function drawInfo(g) {
  if (infoAbout) {
    drawAbout(g);
    g.setFont(smallFont);
    g.setColor(C(240, 150, 55)); g.fillRect(aboutBox.x, aboutBox.y, aboutBox.width, aboutBox.height);
    g.setColor(C(22, 11, 38)); g.fillRect(aboutBox.x + 4, aboutBox.y + 4, aboutBox.width - 8, aboutBox.height - 8);
    centered(g, "BACK TO HOW TO PLAY", aboutBox.x + aboutBox.width / 2, aboutBox.y + 33, C(255, 242, 208));
    return;
  }
  bigPanel(g);
  const cream = C(255, 242, 208), cyan = C(158, 232, 118), gold = C(240, 150, 55);
  g.setColor(gold); g.fillRect(aboutBox.x, aboutBox.y, aboutBox.width, aboutBox.height);
  g.setColor(C(22, 11, 38)); g.fillRect(aboutBox.x + 4, aboutBox.y + 4, aboutBox.width - 8, aboutBox.height - 8);
  g.setFont(smallFont); centered(g, "ABOUT THE DEVELOPER", aboutBox.x + aboutBox.width / 2, aboutBox.y + 33, cream);
  g.setFont(bigFont); centered(g, "HOW TO PLAY MUSH", w / 2, 135, cream);
  const cols = [
    ["THE BASICS",
      "CLICK THE BIG MUSHROOM (OR PRESS SPACE) TO EARN MUSHROOMS.",
      "CLICK THE SHOP SIGN TO BUY TOOLS (MORE PER CLICK) AND FARMS (MUSHROOMS EVERY SECOND).",
      "EARN ENOUGH AND YOUR MUSHROOM EVOLVES. THE LAST EVOLUTION IS YOUR CHOICE.",
      "PERKS, PETS AND SKINS GIVE EXTRA BONUSES.",
      "PRICES RISE WITH EVERY BUY. THE DAILY DEAL IS HALF PRICE.",
      "SPORE RESET: START OVER FOR A PERMANENT +10% PER SPORE.",
      "YOUR GAME SAVES BY ITSELF IN 3 SLOTS.",
      "PRESS N TO NAME YOUR MUSHROOM. THE NAME SHOWS ABOVE IT."],
    ["EXTRAS",
      "GOLDEN MUSHROOM: CLICK IT FAST FOR A FRENZY OR A LUCKY PILE.",
      "THE CROW FLIES BY: CLICK HIM FOR A GIFT.",
      "HUNT: A 30 SECOND WHACK-A-MOLE. AVOID THE RED ONES!",
      "THE BLIGHT: A BOSS THAT SHOWS UP EVERY FEW MINUTES. CLICK IT BEFORE TIME RUNS OUT.",
      "GOALS: THREE SMALL TASKS ON THE LEFT. DONE = REWARD.",
      "CARD PACKS: EARN PACKS BY PLAYING AND OPEN THEM IN THE BOOK. COLLECT 16 CARDS FOR PERMANENT BONUSES. HOLO CARDS ARE DOUBLE.",
      "SEASONS CHANGE EVERY 6 MINUTES. STAY 2 MINUTES FOR A NEW SKIN.",
      "KEYS: SPACE CLICK, ESC MENU, M SOUND, I INFO, B BOOK, N NAME"]];
  g.setFont(smallFont);
  for (let c = 0; c < 2; c++) {
    const x = 150 + c * 600; let y = 215;
    text(g, cols[c][0], x, y, gold); y += 40;
    for (let k = 1; k < cols[c].length; k++) {
      const ls = wrap(cols[c][k], 33);
      for (let li = 0; li < ls.length; li++) { text(g, (li == 0 ? "- " : "  ") + ls[li], x, y, cream); y += 24; }
      y += 10;
    }
  }
  g.drawImage(hoverBack ? backHover : back, backBox.x, backBox.y);
  g.setFont(bigFont); text(g, "BACK", backBox.x + 44, backBox.y + 38, cream);
}
