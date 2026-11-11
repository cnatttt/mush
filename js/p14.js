// ---- new forms after the final evolution (two more tiers) ----
const EVO_AT = [300000000, 20000000000], END_AT = 1000000000000;
const FORM_NAME = ["NEBULA", "ECLIPSE", "BLOOMKING", "EMBERHEART"], ASC_NAME = ["ASTRAL NEBULA", "TOTAL ECLIPSE", "BLOOM EMPEROR", "PHOENIX HEART"];
let evo = 0, worn = -1, wornAsc = false, form = 0, choosing2 = false;
function checkEvo() {
  if (stage != 4 || choosing || inEnding) return;
  if (evo == 0 && totalEarned >= EVO_AT[0]) {
    evo = 1; worn = Math.max(0, branch) * 2; wornAsc = false; rebuildMush(); Sound.sfx("evolve.wav", -3);
    showBanner("4 NEW FORMS UNLOCKED! SEE THE TREE", C(255, 226, 120)); givePack(2);
    burst(mushBox.x + 330, mushBox.y + 250, 40, 6, C(255, 226, 120));
  } else if (evo == 1 && totalEarned >= EVO_AT[1]) {
    evo = 2; if (worn >= 0) wornAsc = true; rebuildMush(); Sound.sfx("evolve.wav", -3);
    showBanner("ASCENDED FORMS UNLOCKED!", C(255, 226, 120)); givePack(2);
    burst(mushBox.x + 330, mushBox.y + 250, 50, 6, C(255, 226, 120));
  }
}
function wearForm(idx, asc) { worn = idx; wornAsc = asc; rebuildMush(); Sound.pop(); showBanner("NOW WEARING " + (asc ? ASC_NAME[idx] : FORM_NAME[idx]), C(160, 255, 240)); }
function wearNormal() { worn = -1; wornAsc = false; rebuildMush(); Sound.pop(); showBanner("NOW WEARING YOUR NORMAL FORM", C(160, 255, 240)); }
function chooseForm() { }
function drawChoose2() { }
// the big goal on the left: always shows what to reach next
function goalInfo() {
  if (stage < 4) return { goal: STAGE_AT[stage + 1], label: "NEXT FORM", name: STAGE_NAME[stage + 1] };
  if (evo == 0) return { goal: EVO_AT[0], label: "NEW FORMS", name: "4 NEW FORMS" };
  if (evo == 1) return { goal: EVO_AT[1], label: "ASCEND", name: "4 ASCENDED FORMS" };
  return { goal: END_AT, label: "FINAL GOAL", name: "THE END" };
}
