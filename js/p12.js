// ---- main paint ----
const SEA_TN = [[255, 170, 200, 22], [255, 230, 100, 24], [255, 120, 40, 30], [170, 210, 255, 34]];
function paintComponent(g) {
  g.setSmooth(false);
  if (intro) { paintIntro(g); drawMute(g); return; }
  if (slotScreen) { drawSlots(g); drawMute(g); return; }
  if (inEnding) { paintEnding(g); drawMute(g); return; }
  const cyan = C(127, 245, 232), cream = C(255, 242, 208), red = C(255, 107, 107), gray = C(150, 140, 160);
  const dk = C(45, 24, 12);
  if (inHunt) drawHunt(g);
  else if (!inShop) {
    g.drawImage(bg, 0, 0);
    if (DAY_NIGHT) drawSky(g);
    const tn = SEA_TN[season];
    g.setColor(C(tn[0], tn[1], tn[2], tn[3])); g.fillRect(0, 0, w, h);
    const mi = hoverMush && !pressedNow ? mushHover : mush;
    if (pressedNow) {
      const gg = g.create();
      gg.translate(idiv(w, 2), mushY + mushLow + 1); gg.scale(1.012, 0.97);
      gg.drawImage(mi, -360, -(mushLow + 1)); gg.dispose();
    } else g.drawImage(mi, idiv(w, 2) - 360, mushY);
    const order = [3, 0, 4, 1, 5, 2, 6, 7, 8, 9, 10, 11];
    for (let i = 0; i < Math.min(24, owned[4]); i++) {
      const col = order[i % 12], x = col < 3 ? 410 + col * 56 : 905 + (col - 3) * 56, y = h - GROUND_GAP - (i < 12 ? 45 : 90);
      g.drawImage(tinyFrames[i % 3], x, y);
    }
    const wheels = Math.min(8, owned[5]);
    for (let i = 0; i < wheels; i++) g.drawImage(wheelFrames[(idiv(tick, 4) + i) % 4], 1075 + i * 44, h - GROUND_GAP - 134 - (i % 2) * 14);
    g.drawImage(hoverSign ? signHover : sign, signBox.x, signBox.y + (hoverSign ? -6 : 0));
    const plq = (box, hv, label, col) => {
      g.drawImage(hv ? plaqueHover : plaque, box.x, box.y + (hv ? -3 : 0));
      centered(g, label, box.x + idiv(box.width, 2), box.y + 28 + (hv ? -3 : 0), col);
    };
    g.setFont(smallFont);
    plq(statsBox, hoverStats, "STATS", dk);
    plq(treeBox, hoverTree, "TREE", dk);
    plq(huntBox, hoverHunt, huntCool > 0 ? mmss(huntCool) : "HUNT", huntCool > 0 ? C(120, 90, 60) : dk);
    plq(bookBox, hoverBook, packTotal() > 0 ? "BOOK +" + packTotal() : "BOOK", packTotal() > 0 ? C(150, 20, 20) : dk);
    plq(infoBox, hoverInfo, "INFO", dk);
    plq(nameBox, hoverName, "NAME", dk);
    if (isAdmin()) plq(adminBox, hoverAdminBtn, "ADMIN", C(150, 20, 90));
    drawStuff(g);
    for (let k = 0; k < 4; k++) if (owned[24 + k] > 0) {   // flying pets roam the whole lobby
      const sp = [0.0071, 0.0094, 0.0058, 0.0083][k], sp2 = [0.0113, 0.0067, 0.0089, 0.0101][k];
      const px = Math.trunc(idiv(w, 2) - 40 + Math.sin(tick * sp + k * 1.9) * 620 + Math.sin(tick * sp * 3.1 + k) * 40);
      const py = Math.trunc(430 + Math.sin(tick * sp2 + k * 2.6) * 270 + Math.sin(tick * 0.09 + k * 2.1) * 8);
      g.drawImage(petFrames[(4 + k) * 2 + idiv(tick, k == 2 ? 9 : 5) % 2], px, py);
    }
    for (let i = 0; i < 4; i++) if (owned[20 + i] > 0) {
      let px = petX(i), py = signY + 73 - Math.trunc((petX(i) + 40 - 50) * 0.15) - 60, fr = 0;
      if (i == 0) { px += Math.trunc(Math.sin(tick * 0.03) * 8); fr = idiv(tick, 15) % 2; }
      else if (i == 1) { const hp = tick % 100; if (hp < 14) { fr = 1; py -= Math.trunc(Math.sin(hp / 14.0 * Math.PI) * 26); } }
      else if (i == 2) { fr = tick % 110 < 6 ? 1 : 0; }
      else { fr = idiv(tick, 6) % 2; py += idiv(Math.trunc(Math.sin(tick * 0.1) * 6), 2) * 2; }
      g.drawImage(petFrames[i * 2 + fr], px, py);
    }
    if (goldenOn && (goldenLife > 30 || tick % 6 < 3)) g.drawImage(hoverGold ? goldenHover : golden, gx, gy + bob());
    if (bossOn) drawBoss(g);
    if (crowOn) { const cf = crowFrames[idiv(tick, 3) % 4]; g.drawImage(hoverCrow ? brighter(cf) : cf, Math.trunc(crowX + 7 * frac), Math.trunc(crowY)); }
  } else drawShop(g, cyan, cream, red, gray);

  for (const s of spore) {
    const a = Math.max(0, Math.min(255, Math.trunc(255 * (1 - s.life / s.max))));
    g.setColor(C(s.c.r, s.c.g, s.c.b, Math.min(a, s.size > 6 ? 150 : 255)));
    const ix = s.x + (paused ? 0 : s.vx * frac), iy = s.y + (paused ? 0 : s.vy * frac);
    g.fillRect(idiv(Math.trunc(ix), 3) * 3, idiv(Math.trunc(iy), 3) * 3, s.size, s.size);
  }
  if (!inShop && !inStats && !inHunt) { drawWeather(g); drawSeasonFx(g); }
  const tp = tip();
  if (tp != null && playTicks > 20 && !inShop && !inStats && !inHunt && !paused) {
    g.setFont(midFont); centered(g, tp, idiv(w, 2), 210, C(255, 242, 208, Math.max(0, Math.min(255, 150 + Math.trunc(Math.sin(tick * 0.12) * 90)))));
  }
  g.setFont(bigFont);
  text(g, "MUSHROOMS: " + fmt(count), 40, 70, cyan);
  g.setFont(smallFont);
  let ly = 116;
  if (perSecond > 0) { text(g, "+" + fmt(secGain()) + " PER SEC", 40, ly, cream); ly += 30; }
  if (spores > 0) { text(g, "SPORES: " + spores + "  (+" + (spores * 10) + "%)", 40, ly, C(190, 160, 255)); ly += 30; }
  {
    const gi = goalInfo(), pct = Math.min(99, Math.trunc(Math.min(1, totalEarned / gi.goal) * 100));
    text(g, gi.label + "  " + pct + "%", 40, ly, C(255, 226, 170));
    g.setColor(C(13, 5, 24)); g.fillRect(40, ly + 14, 264, 12);
    g.setColor(C(70, 56, 92)); g.fillRect(43, ly + 17, 258, 6);
    g.setColor(stage < 4 ? C(255, 150, 60) : C(242, 193, 78)); g.fillRect(43, ly + 17, Math.trunc(258.0 * Math.min(1.0, totalEarned / gi.goal)), 6);
    if (stage >= 4) { fitText(g, (evo < 4 ? "AT " + fmt(gi.goal) + ": " : "") + gi.name, 40, ly + 44, 264, C(190, 160, 255), false); ly += 72; } else ly += 42;
  }
  if (frenzy > 0) { text(g, "FRENZY X" + (owned[27] > 0 ? 7 : 5) + "  " + (idiv(frenzy * 30, 1000) + 1) + "S", 40, ly, C(255, 150, 60)); ly += 30; }
  if (rain > 0) text(g, "SPORE RAIN +50%  " + (idiv(rain * 30, 1000) + 1) + "S", 40, ly, C(160, 255, 240));
  if (!inShop && !inStats && !inHunt) {
    text(g, "SEASON: " + SEASON_NAME[season], 40, 286, C(255, 226, 170));
    text(g, "GOALS", 40, 316, C(242, 193, 78));
    for (let i = 0; i < 3; i++) if (qKind[i] >= 0) {
      const qy = 346 + i * 54, prog = Math.max(0, Math.min(qGoal[i], qNow(qKind[i]) - qStart[i]));
      text(g, questText(i), 40, qy, cream);
      g.setColor(C(13, 5, 24)); g.fillRect(40, qy + 14, 264, 12);
      g.setColor(C(70, 56, 92)); g.fillRect(43, qy + 17, 258, 6);
      g.setColor(cyan); g.fillRect(43, qy + 17, Math.trunc(258.0 * prog / Math.max(1, qGoal[i])), 6);
    }
  }
  if (bannerLife > 0) {
    g.setFont(bigFont);
    const a = Math.min(255, bannerLife * 12);
    centered(g, banner, idiv(w, 2), 150 - (bannerLife > 100 ? bannerLife - 100 : 0), C(bannerColor.r, bannerColor.g, bannerColor.b, a));
  }
  g.setFont(bigFont);
  for (const f of floats) {
    const a = Math.max(0, 255 - f.life * 8);
    text(g, f.s, f.x, f.y - (paused ? 0 : Math.trunc(3 * frac)), C(f.c.r, f.c.g, f.c.b, a));
  }
  if (!inShop && !inStats && !inHunt) drawName(g);
  if (inStats) drawStats(g);
  if (toastLife > 0) {
    g.setFont(smallFont);
    const t1 = "TROPHY!", t2 = toast, bw = Math.max(g.stringWidth(t2), g.stringWidth(t1)) + 40;
    const slide = toastLife > 110 ? (toastLife - 110) * 14 : (toastLife < 20 ? (20 - toastLife) * 14 : 0);
    const bx = w - 24 - bw + slide, by = 156, gold = C(242, 193, 78);
    g.setColor(C(13, 5, 24)); g.fillRect(bx, by, bw, 76);
    g.setColor(gold); g.fillRect(bx, by, bw, 4); g.fillRect(bx, by + 72, bw, 4); g.fillRect(bx, by, 4, 76); g.fillRect(bx + bw - 4, by, 4, 76);
    text(g, t1, bx + 20, by + 26, gold); text(g, t2, bx + 20, by + 52, cream);
  }
  if (packPopLife > 0) {
    const dy = 196 - Math.max(0, packPopLife - 190) * 6;
    panel(g, idiv(w, 2) - 230, dy, 460, 116);
    g.drawImage(packBody[packPopType], idiv(w, 2) - 210, dy + 14, 60, 86);
    g.drawImage(packTop[packPopType], idiv(w, 2) - 210, dy + 14, 60, 86);
    g.setFont(smallFont); text(g, "NEW CARD PACK!", idiv(w, 2) - 120, dy + 32, PACK_COL[packPopType][0]);
    g.setFont(midFont); text(g, PACK_NAME[packPopType] + " PACK", idiv(w, 2) - 120, dy + 66, cream);
    g.setFont(smallFont); text(g, "OPEN IT IN THE BOOK", idiv(w, 2) - 120, dy + 96, cyan);
  }
  if (awayLife > 0 && !inEnding) {
    panel(g, idiv(w, 2) - 380, 300, 760, 210);
    g.setFont(bigFont); centered(g, "WHILE YOU WERE AWAY", idiv(w, 2), 360, cream);
    g.setFont(midFont); centered(g, "+" + fmt(awayShown) + " MUSHROOMS", idiv(w, 2), 425, cyan);
    g.setFont(smallFont);
    const hh = idiv(awaySecs, 3600), mm = idiv(awaySecs, 60) % 60;
    centered(g, "YOUR FARMS WORKED FOR " + (hh > 0 ? hh + "H " : "") + mm + "M", idiv(w, 2), 475, C(255, 226, 170));
  }
  if (!inShop && !inStats && !inHunt && !inPack && !naming && !choosing && !paused) drawInboxBtn(g);
  if (inInbox) drawInbox(g);
  if (choosing) drawChoose(g);
  if (choosing2) drawChoose2(g);
  if (inPack) drawPack(g);
  if (naming) drawNaming(g);
  if (paused) {
    g.setColor(C(6, 3, 16, 200)); g.fillRect(0, 0, w, h);
    g.setFont(bigFont); centered(g, "PAUSED", idiv(w, 2), 250, cream);
    const wipeArmed = Date.now() - wipeArmedAt < 4000;
    const pl = ["RESUME", "SOUND: " + ["FULL", "MEDIUM", "QUIET", "OFF"][Sound.level()], "SWITCH SLOT", "SAVE AND QUIT", wipeArmed ? "CLICK AGAIN TO ERASE!" : "ERASE THIS SLOT"];
    g.setFont(midFont);
    for (let i = 0; i < 5; i++) {
      g.drawImage(hoverPause == i ? buttonHover : button, pauseBox[i].x, pauseBox[i].y);
      centered(g, pl[i], idiv(w, 2), pauseBox[i].y + 46, i == 4 && wipeArmed ? red : cream);
    }
    g.setFont(smallFont); centered(g, "ESC = RESUME   YOUR GAME SAVES BY ITSELF", idiv(w, 2), 830, C(150, 140, 170));
  }
  drawMute(g); drawPauseBtn(g);
  if (fade > 0) { g.setColor(C(0, 0, 0, Math.min(255, fade * 9))); g.fillRect(0, 0, w, h); }
}

function drawShop(g, cyan, cream, red, gray) {
  g.drawImage(shopBg, 0, 0);
  if (shopFrames && shopFrames.length > 0) g.drawImage(shopFrames[idiv(tick, 5) % shopFrames.length], 40, 436);
  drawBubble(g);
  for (let i = 0; i < tabBox.length; i++) {
    if (!tabShown(i)) continue;
    g.drawImage(tab_ == i ? tabActive : (hoverTab == i ? tabHover : tab), tabBox[i].x, tabBox[i].y);
    g.setFont(smallFont);
    centered(g, TAB_NAME[i], tabBox[i].x + 42, tabBox[i].y + 28 + (tab_ == i ? 0 : 3), tab_ == i ? cyan : cream);
  }
  for (let i = 0; i < itemBox.length; i++) {
    const idx = tab_ * 4 + i, open = unlocked(idx), bx = itemBox[i].x, by = itemBox[i].y, dy = pressedItem == i ? 4 : 0;
    g.drawImage(pressedItem == i ? buttonPressed : (hoverItem == i ? buttonHover : button), bx, by);
    g.setFont(midFont);
    text(g, open ? itemName[idx] : "???", bx + 28, by + 34 + dy, open ? cream : gray);
    let c, cc;
    if (!open) { c = "???"; cc = gray; }
    else if (idx >= 12) {
      const sp = idx >= 16 && idx < 20;
      c = owned[idx] > 0 ? "OWN" : (sp ? baseCost[idx] + " SP" : fmt(cost[idx]));
      cc = owned[idx] > 0 || (sp ? spores - spentSpores >= baseCost[idx] : count >= cost[idx]) ? cyan : red;
    } else if (idx >= 8 && skinOwned[idx - 8]) { c = skin == idx - 8 ? "ON" : "OWN"; cc = cyan; }
    else {
      const sale = idx == dealItem && dealLeft > 0;
      if (idx < 8 && buyQty != 1) {
        const bk = bulk(idx, BUY_QTY[buyQty]);
        if (buyQty == 0) { c = bk.k > 1 ? "X" + bk.k + " " + fmt(bk.total) : fmt(price(idx)); cc = count >= price(idx) ? cyan : red; }
        else { c = "X" + BUY_QTY[buyQty] + " " + fmt(bk.totalAll); cc = bk.k >= BUY_QTY[buyQty] ? (sale ? C(255, 215, 80) : cyan) : red; }
      } else { c = fmt(price(idx)); cc = count >= price(idx) ? (sale ? C(255, 215, 80) : cyan) : red; }
    }
    text(g, c, bx + 520 - g.stringWidth(c), by + 34 + dy, cc);
    drawItemIcon(g, idx, bx + 538, by + 22 + dy, open);
    g.setFont(smallFont);
    text(g, open ? info(idx) : (idx >= 16 && idx < 20 ? "EARN SPORES FIRST..." : "KEEP GROWING..."), bx + 28, by + 70 + dy, open ? C(255, 226, 170) : gray);
    if (idx == dealItem && dealLeft > 0) {
      g.setColor(C(13, 5, 24)); g.fillRect(bx + 396, by + 52 + dy, 132, 28);
      g.setColor(C(255, 80, 80)); g.fillRect(bx + 400, by + 56 + dy, 124, 20);
      text(g, "50% OFF", bx + 412, by + 66 + dy, cream);
    }
  }
  const ddy = pressedItem == 5 ? 4 : 0;
  g.drawImage(pressedItem == 5 ? buttonPressed : (hoverItem == 5 ? buttonHover : button), dealBox.x, dealBox.y);
  g.setFont(midFont);
  text(g, "DAILY DEAL", dealBox.x + 28, dealBox.y + 34 + ddy, cream);
  const dr = dealLeft > 0 ? "-50%" : (dealCool > 0 ? mmss(dealCool) : "READY");
  text(g, dr, dealBox.x + 520 - g.stringWidth(dr), dealBox.y + 34 + ddy, dealLeft > 0 ? C(255, 215, 80) : (dealCool > 0 ? gray : cyan));
  g.setFont(smallFont);
  text(g, dealLeft > 0 ? itemName[dealItem] + " HALF PRICE  " + mmss(dealLeft) : (dealCool > 0 ? "A NEW DEAL IS COMING..." : "TAP FOR A HALF PRICE DEAL!"), dealBox.x + 28, dealBox.y + 70 + ddy, C(255, 226, 170));
  const armed = Date.now() - resetArmedAt < 4000, rg = sporeGain(), rdy = pressedItem == 4 ? 4 : 0;
  g.drawImage(pressedItem == 4 ? buttonPressed : (hoverItem == 4 ? buttonHover : button), resetBox.x, resetBox.y);
  g.setFont(midFont);
  text(g, "SPORE RESET", resetBox.x + 28, resetBox.y + 34 + rdy, rg >= 1 ? cream : gray);
  const rs = rg >= 1 ? "+" + rg : "---";
  text(g, rs, resetBox.x + 520 - g.stringWidth(rs), resetBox.y + 34 + rdy, rg >= 1 ? cyan : gray);
  g.setFont(smallFont);
  text(g, armed && rg >= 1 ? "CLICK AGAIN TO CONFIRM!" : "+10% TO EVERYTHING PER SPORE", resetBox.x + 28, resetBox.y + 70 + rdy, armed ? red : C(255, 226, 170));
  g.drawImage(hoverBack ? backHover : back, backBox.x, backBox.y);
  g.setFont(bigFont); text(g, "BACK", backBox.x + 44, backBox.y + 38, cream);
  drawQtyBtn(g);
}
