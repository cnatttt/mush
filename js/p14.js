// ---- new forms after the final evolution (two more tiers) ----
const EVO_T = [300000000, 2000000000, 20000000000, 100000000000];
const FORM_NAME = ["NEBULA", "ECLIPSE", "BLOOMKING", "EMBERHEART"], ASC_NAME = ["ASTRAL NEBULA", "TOTAL ECLIPSE", "BLOOM EMPEROR", "PHOENIX HEART"];
let evo = 0, worn = -1, wornAsc = false, form = 0, choosing2 = false;
function evoCount() { let n = 0; for (const t of EVO_T) if (totalEarned >= t) n++; return n; }
function formOpen(tier, f) { return stage >= 4 && evo > (tier - 1) * 2 + (f & 1); }
let endAt = 0;
function checkEvo() {
  if (stage != 4 || choosing || inEnding) return;
  const target = evoCount();
  while (evo < target) {
    const u = evo; evo++;
    const tier = (u >> 1) + 1, f = u & 1, nm = (tier == 1 ? FORM_NAME : ASC_NAME);
    if (u == 0) { worn = Math.max(0, branch) * 2; wornAsc = false; }
    if (worn >= 0 && !wornAsc && formOpen(2, worn)) wornAsc = true;
    rebuildMush(); Sound.sfx("evolve.wav", -3);
    showBanner((tier == 1 ? "NEW FORM: " : "ASCENDED: ") + nm[Math.max(0, branch) * 2 + f] + "!", C(255, 226, 120)); givePack(2);
    burst(mushBox.x + 330, mushBox.y + 250, 40, 6, C(255, 226, 120));
    if (evo >= 4 && !ended) endAt = Date.now() + 4500;
  }
  if (endAt && Date.now() >= endAt) { endAt = 0; if (!ended) startEnding(); }
}
function wearForm(idx, asc) { worn = idx; wornAsc = asc; rebuildMush(); Sound.pop(); showBanner("NOW WEARING " + (asc ? ASC_NAME[idx] : FORM_NAME[idx]), C(160, 255, 240)); }
function wearNormal() { worn = -1; wornAsc = false; rebuildMush(); Sound.pop(); showBanner("NOW WEARING YOUR NORMAL FORM", C(160, 255, 240)); }
function chooseForm() { }
function drawChoose2() { }
// the big goal on the left: always shows what to reach next
function goalInfo() {
  if (stage < 4) return { goal: STAGE_AT[stage + 1], label: "NEXT FORM", name: STAGE_NAME[stage + 1] };
  if (evo < 4) { const b = Math.max(0, branch) * 2 + (evo & 1); return { goal: EVO_T[evo], label: evo < 2 ? "NEW FORM" : "ASCEND", name: evo < 2 ? FORM_NAME[b] : ASC_NAME[b] }; }
  return { goal: EVO_T[3], label: "ALL FORMS", name: "COLLECTED!" };
}
// draws text and shrinks it if it would not fit in maxW pixels
function fitText(g, s, cx, cy, maxW, col, centerIt) {
  const f0 = g.font; let sz = f0.size;
  while (sz > 8 && g.stringWidth(s) > maxW) { sz -= 1; g.setFont(pixelFont(sz)); }
  if (centerIt === false) text(g, s, cx, cy, col); else centered(g, s, cx, cy, col);
  g.setFont(f0);
}
