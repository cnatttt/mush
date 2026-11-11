// ---- tree page 2: the new forms ----
const formsBtn = R(1080, 104, 250, 42);
const formFit = {};
function formImg(idx, reached) {
  const key = idx + (reached ? "c" : "s");
  if (!formFit[key]) formFit[key] = fitBox(reached ? stageRaw[idx] : dark(stageRaw[idx]));
  return formFit[key];
}
function drawFormsBtn(g, label) {
  const hv = inR(formsBtn, mousePt), gold = C(242, 193, 78);
  g.setColor(hv ? C(127, 245, 232) : gold); g.fillRect(formsBtn.x, formsBtn.y, formsBtn.width, formsBtn.height);
  g.setColor(C(22, 11, 38)); g.fillRect(formsBtn.x + 4, formsBtn.y + 4, formsBtn.width - 8, formsBtn.height - 8);
  g.setFont(smallFont); centered(g, label, formsBtn.x + idiv(formsBtn.width, 2), formsBtn.y + 22, hv ? C(127, 245, 232) : C(255, 242, 208));
}
function drawForms(g) {
  bigPanel(g);
  const cream = C(255, 242, 208), cyan = C(127, 245, 232), gray = C(120, 110, 140), gold = C(242, 193, 78), orange = C(255, 150, 60);
  g.setFont(bigFont); centered(g, "NEW FORMS", w / 2, 135, cream);
  g.setFont(smallFont); centered(g, "AFTER YOUR FINAL FORM: PICK A NEW FORM, THEN IT ASCENDS.", w / 2, 172, C(255, 226, 170));
  drawFormsBtn(g, "< BACK TO TREE");
  const cw = 250, gap = 20, x0 = idiv(w - (4 * cw + 3 * gap), 2), ch = 282;
  const done4 = stage >= 4;
  for (let b = 0; b < 2; b++) {
    const y0 = 203 + b * 296;
    for (let c = 0; c < 4; c++) {
      const pick = c >> 1, tier = c & 1 ? 2 : 1, idx = (tier == 1 ? 6 : 10) + b * 2 + pick, x = x0 + c * (cw + gap), cx = x + idiv(cw, 2);
      const mine = done4 && branch == b;
      const same = mine && evo >= 1 && form == pick;
      let reached = false, here = false, next = false, lost = false;
      if (tier == 1) { reached = same; here = same && evo == 1; next = mine && evo == 0; lost = (done4 && !mine) || (mine && evo >= 1 && form != pick); }
      else { reached = same && evo == 2; here = reached; next = same && evo == 1; lost = (done4 && !mine) || (mine && evo >= 1 && form != pick); }
      const border = here ? cyan : (reached ? gold : (next ? orange : C(70, 56, 92)));
      g.setColor(border); g.fillRect(x, y0, cw, ch);
      g.setColor(here ? C(24, 20, 52) : C(22, 11, 38)); g.fillRect(x + 4, y0 + 4, cw - 8, ch - 8);
      g.drawImage(formImg(idx, reached), x + 45, y0 + 10, 160, 160);
      g.setFont(smallFont);
      const nm = reached || next || (!lost) ? (tier == 1 ? FORM_NAME[b * 2 + pick] : ASC_NAME[b * 2 + pick]) : (tier == 1 ? FORM_NAME[b * 2 + pick] : ASC_NAME[b * 2 + pick]);
      const words = nm.split(" ");
      for (let i = 0; i < words.length; i++) centered(g, words[i], cx, y0 + 188 + i * 20, reached ? cream : C(190, 180, 210));
      const st = lost ? "NOT CHOSEN" : (here ? "CURRENT" : (reached ? "EVOLVED" : (next ? "NEXT UP" : "LOCKED")));
      centered(g, st, cx, y0 + 232, lost ? gray : (here ? cyan : (reached ? gold : (next ? orange : gray))));
      centered(g, tier == 1 ? "AT " + fmt(EVO_AT[0]) + "  " + (pick == 0 ? "+30% INCOME" : "+40% CLICK") : "AT " + fmt(EVO_AT[1]) + "  +50% ALL", cx, y0 + 262, reached ? cyan : gray);
    }
    g.setFont(midFont); 
  }
  g.setFont(smallFont);
  g.setColor(C(194, 138, 66));
  centered(g, mineLine(), w / 2, 808, C(255, 226, 170));
  g.drawImage(hoverBack ? backHover : back, backBox.x, backBox.y);
  g.setFont(bigFont); text(g, "BACK", backBox.x + 44, backBox.y + 38, cream);
}
function mineLine() {
  if (stage < 4) return "REACH YOUR FINAL FORM FIRST (" + fmt(STAGE_AT[4]) + " TOTAL).";
  return "TOP ROW: COSMIC.  BOTTOM ROW: THORNBACK.  YOU CHOOSE ONCE.";
}
