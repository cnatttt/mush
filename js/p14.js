// ---- new forms after the final evolution (two more tiers) ----
const EVO_AT = [300000000, 20000000000], END_AT = 1000000000000;
const FORM_NAME = ["NEBULA", "ECLIPSE", "BLOOMKING", "EMBERHEART"], ASC_NAME = ["ASTRAL NEBULA", "TOTAL ECLIPSE", "BLOOM EMPEROR", "PHOENIX HEART"];
let evo = 0, form = 0, choosing2 = false;
function formIdx() { return Math.max(0, branch) * 2 + form; }
function checkEvo() {
  if (stage != 4 || branch < 0 || choosing || choosing2 || inEnding) return;
  if (evo == 0 && totalEarned >= EVO_AT[0]) { choosing2 = true; Sound.sfx("evolve.wav", -3); }
  else if (evo == 1 && totalEarned >= EVO_AT[1]) {
    evo = 2; rebuildMush(); Sound.sfx("evolve.wav", -3);
    showBanner("ASCENDED! " + ASC_NAME[formIdx()], C(255, 226, 120)); givePack(2);
    burst(mushBox.x + 330, mushBox.y + 250, 50, 6, C(255, 226, 120));
  }
}
function chooseForm(c) {
  form = c; evo = 1; choosing2 = false; rebuildMush(); Sound.sfx("evolve.wav", -3);
  showBanner("YOU BECAME " + FORM_NAME[formIdx()] + "!", C(255, 226, 120)); givePack(2);
  burst(mushBox.x + 330, mushBox.y + 250, 40, 6, C(255, 226, 120));
}
function drawChoose2(g) {
  const cream = C(255, 242, 208), cyan = C(127, 245, 232), gold = C(242, 193, 78);
  g.setColor(C(6, 3, 16, 238)); g.fillRect(0, 0, w, h);
  g.setFont(bigFont); centered(g, "YOUR MUSHROOM EVOLVES AGAIN", w / 2, 110, cream);
  g.setFont(smallFont); centered(g, "PICK ITS NEW FORM. THIS CHOICE IS FOREVER.", w / 2, 160, C(255, 226, 170));
  const b = Math.max(0, branch), nm = [FORM_NAME[b * 2], FORM_NAME[b * 2 + 1]], b1 = ["+30% INCOME", "+40% CLICK POWER"];
  const ds = [["A GLOWING SKY OF", "PINK AND BLUE STARS."], ["A DARK SUN WITH A", "RING OF GOLD FIRE."]];
  const ds2 = [["BLOOMS GROW ALL OVER", "ITS BIG GREEN CAP."], ["BURNING HOT AND", "READY TO FIGHT."]];
  for (let k = 0; k < 2; k++) {
    const r = chooseBox[k], hv = hoverChoose == k, d = (b == 0 ? ds : ds2)[k];
    g.setColor(hv ? cyan : gold); g.fillRect(r.x, r.y, r.width, r.height);
    g.setColor(hv ? C(30, 26, 62) : C(22, 11, 38)); g.fillRect(r.x + 6, r.y + 6, r.width - 12, r.height - 12);
    g.drawImage(fitBox(stageRaw[6 + b * 2 + k]), r.x + 50, r.y + 16 - (hv ? 6 : 0), 320, 320);
    g.setFont(midFont); centered(g, nm[k], r.x + idiv(r.width, 2), r.y + 370, cream);
    g.setFont(smallFont);
    centered(g, b1[k], r.x + idiv(r.width, 2), r.y + 420, cyan); centered(g, "THEN +50% TO ALL AT " + fmt(EVO_AT[1]), r.x + idiv(r.width, 2), r.y + 446, cyan);
    centered(g, d[0], r.x + idiv(r.width, 2), r.y + 490, C(255, 226, 170)); centered(g, d[1], r.x + idiv(r.width, 2), r.y + 512, C(255, 226, 170));
    if (Math.floor(Date.now() / 400) % 2 == 0 || hv) centered(g, "CLICK OR PRESS " + (k + 1), r.x + idiv(r.width, 2), r.y + 560, hv ? cyan : cream);
  }
}
// the big goal on the left: always shows what to reach next
function goalInfo() {
  if (stage < 4) return { goal: STAGE_AT[stage + 1], label: "NEXT FORM", name: STAGE_NAME[stage + 1] };
  if (evo == 0) return { goal: EVO_AT[0], label: "NEW FORM", name: "PICK A NEW FORM" };
  if (evo == 1) return { goal: EVO_AT[1], label: "ASCEND", name: ASC_NAME[formIdx()] };
  return { goal: END_AT, label: "FINAL GOAL", name: "THE END" };
}
