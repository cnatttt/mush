// ---- left HUD: one tidy panel, rows flow with no gaps ----
function hudBar(g, y, frac, col) {
  g.setColor(C(13, 5, 24)); g.fillRect(40, y, 264, 12);
  g.setColor(C(70, 56, 92)); g.fillRect(43, y + 3, 258, 6);
  g.setColor(col); g.fillRect(43, y + 3, Math.trunc(258.0 * Math.max(0, Math.min(1, frac))), 6);
}
function drawHud(g, cyan, cream) {
  const lobby = !inShop && !inStats && !inHunt && !inPotion;
  const rows = [];   // each: {h, draw(y)}
  const gi = goalInfo();
  if (perSecond > 0) rows.push({ h: 30, draw: y => text(g, "+" + fmt(secGain()) + " PER SEC", 40, y, cream) });
  if (bloodMoon) rows.push({ h: 30, draw: y => text(g, "BLOOD MOON", 40, y, C(255, 80, 80)) });
  if (spores > 0) rows.push({ h: 30, draw: y => text(g, "SPORES: " + spores + "  (+" + (spores * 10) + "%)", 40, y, C(190, 160, 255)) });
  if (lobby) rows.push({ h: 74, draw: y => journeyRow(g, y) });
  const gfrac = Math.min(1, totalEarned / gi.goal), pct = Math.min(99, Math.trunc(gfrac * 100));
  rows.push({ h: stage >= 4 ? 70 : 46, draw: y => {
    text(g, gi.label + "  " + pct + "%", 40, y, C(255, 226, 170));
    hudBar(g, y + 14, gfrac, stage < 4 ? C(255, 150, 60) : C(240, 150, 55));
    if (stage >= 4) fitText(g, (evo < 4 ? "AT " + fmt(gi.goal) + ": " : "") + gi.name, 40, y + 42, 264, C(190, 160, 255), false);
  } });
  if (frenzy > 0) rows.push({ h: 30, draw: y => text(g, "FRENZY X" + (owned[27] > 0 ? 7 : 5) + "  " + (idiv(frenzy * 30, 1000) + 1) + "S", 40, y, C(255, 150, 60)) });
  if (rain > 0) rows.push({ h: 30, draw: y => text(g, "SPORE RAIN +50%  " + (idiv(rain * 30, 1000) + 1) + "S", 40, y, C(160, 255, 240)) });
  if (lobby) {
    rows.push({ h: 36, draw: y => text(g, "SEASON: " + SEASON_NAME[season], 40, y, C(255, 226, 170)) });
    rows.push({ h: 30, draw: y => text(g, "GOALS", 40, y, C(240, 150, 55)) });
    for (let i = 0; i < 3; i++) if (qKind[i] >= 0) rows.push({ h: 46, draw: y => {
      const prog = Math.max(0, Math.min(qGoal[i], qNow(qKind[i]) - qStart[i]));
      text(g, questText(i), 40, y, cream);
      hudBar(g, y + 14, prog / Math.max(1, qGoal[i]), cyan);
    } });
  }
  g.setFont(bigFont);
  const head = "MUSHROOMS: " + fmt(count), pw = 380;   // fixed width: the box never resizes as the number grows
  let total = 0; for (const r of rows) total += r.h;
  const ph = 100 + total - 16;
  g.setColor(C(13, 5, 24, 150)); g.fillRect(20, 20, pw, ph);
  g.setColor(C(255, 226, 170, 70)); g.fillRect(20, 20, pw, 3); g.fillRect(20, 20 + ph - 3, pw, 3); g.fillRect(20, 20, 3, ph); g.fillRect(20 + pw - 3, 20, 3, ph);
  fitText(g, head, 40, 62, pw - 40, cyan, false);
  g.setFont(smallFont);
  let y = 108;
  for (const r of rows) { r.draw(y); y += r.h; }
}
