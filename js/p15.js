// ---- tree page 2: the new forms (collect them all, wear any) ----
const formsBtn = R(1080, 104, 250, 42), normalBtn = R(130, 104, 300, 42);
const formFit = {};
function formImg(idx, reached) {
  const key = idx + (reached ? "c" : "s");
  if (!formFit[key]) formFit[key] = fitBox(reached ? stageRaw[idx] : dark(stageRaw[idx]));
  return formFit[key];
}
function smallBtn(g, r, label, on) {
  const hv = inR(r, mousePt), gold = C(242, 193, 78);
  g.setColor(hv ? C(127, 245, 232) : (on ? C(127, 245, 232) : gold)); g.fillRect(r.x, r.y, r.width, r.height);
  g.setColor(C(22, 11, 38)); g.fillRect(r.x + 4, r.y + 4, r.width - 8, r.height - 8);
  g.setFont(smallFont); centered(g, label, r.x + idiv(r.width, 2), r.y + 22, hv || on ? C(127, 245, 232) : C(255, 242, 208));
}
function drawFormsBtn(g, label) { smallBtn(g, formsBtn, label, false); }
const CW = 250, CGAP = 20, CH = 270;
function formRect(tier, f) { const x0 = idiv(w - (4 * CW + 3 * CGAP), 2); return R(x0 + f * (CW + CGAP), tier == 1 ? 222 : 526, CW, CH); }
function formUnlocked(tier, f) { return formOpen(tier, f); }
function formsClick(p) {
  if (inR(normalBtn, p)) { if (stage >= 4 && worn >= 0) wearNormal(); else Sound.pop(); return true; }
  for (let tier = 1; tier <= 2; tier++) for (let f = 0; f < 4; f++) if (inR(formRect(tier, f), p)) {
    if (formUnlocked(tier, f)) wearForm(f, tier == 2); else Sound.pop();
    return true;
  }
  return false;
}
function drawForms(g) {
  bigPanel(g);
  const cream = C(255, 242, 208), cyan = C(127, 245, 232), gray = C(120, 110, 140), gold = C(242, 193, 78), orange = C(255, 150, 60);
  g.setFont(bigFont); centered(g, "NEW FORMS", w / 2, 135, cream);
  g.setFont(smallFont);
  fitText(g, stage < 4 ? "REACH YOUR FINAL FORM FIRST (" + fmt(STAGE_AT[4]) + " TOTAL)." : "CLICK AN UNLOCKED FORM TO WEAR IT. COLLECT ALL 4 OF YOUR TREE TO FINISH THE GAME.", w / 2, 176, 1100, C(255, 226, 170));
  drawFormsBtn(g, "< BACK TO TREE");
  smallBtn(g, normalBtn, "WEAR NORMAL FORM", stage >= 4 && worn < 0);
  g.setFont(smallFont);
  text(g, "NEW FORMS", 205, 205, gold);
  text(g, "ASCENDED FORMS", 205, 508, gold);
  for (let tier = 1; tier <= 2; tier++) for (let f = 0; f < 4; f++) {
    const r = formRect(tier, f), cx = r.x + idiv(r.width, 2), idx = (tier == 1 ? 6 : 10) + f, open = formUnlocked(tier, f);
    const wearing = open && worn == f && (tier == 2) == wornAsc, hv = open && inR(r, mousePt);
    g.setColor(wearing ? cyan : (open ? (hv ? cream : gold) : C(70, 56, 92))); g.fillRect(r.x, r.y, r.width, r.height);
    g.setColor(wearing ? C(24, 20, 52) : C(22, 11, 38)); g.fillRect(r.x + 4, r.y + 4, r.width - 8, r.height - 8);
    g.drawImage(formImg(idx, open), r.x + 45, r.y + 8, 160, 160);
    g.setFont(smallFont);
    const inc = (f & 1) == 0, mw = r.width - 24, tc = open ? cyan : gray, u = (tier - 1) * 2 + (f & 1);
    fitText(g, tier == 1 ? FORM_NAME[f] : ASC_NAME[f], cx, r.y + 186, mw, open ? cream : C(190, 180, 210));
    if (tier == 1) fitText(g, inc ? "+30% INCOME" : "+40% CLICKS", cx, r.y + 224, mw, tc);
    else { fitText(g, inc ? "+95% INCOME" : "+110% CLICKS", cx, r.y + 208, mw, tc); fitText(g, inc ? "+50% CLICKS" : "+50% INCOME", cx, r.y + 229, mw, tc); }
    fitText(g, open ? (wearing ? "WEARING" : "CLICK TO WEAR") : "UNLOCKS AT " + fmt(EVO_T[u]), cx, r.y + 256, mw, wearing ? cyan : (open ? orange : gray));
  }
  g.drawImage(hoverBack ? backHover : back, backBox.x, backBox.y);
  g.setFont(bigFont); text(g, "BACK", backBox.x + 44, backBox.y + 38, cream);
}
