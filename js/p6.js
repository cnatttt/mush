function packTick() {
  packT++;
  if (packFlash > 0) packFlash--;
  if (shakeT > 0) shakeT--;
  if (flyT > 0) flyT--;
  if (ringT > 0 && ++ringT > 30) ringT = 0;
  if (packPhase == 0 && tick % 9 == 0) {
    const a = rand.nextDouble() * Math.PI * 2, c = PACK_COL[packType][0];
    pp.push([w / 2 + Math.cos(a) * 190, 470 + Math.sin(a) * 230, 0, -0.6, 0, 40, 2, c.r, c.g, c.b, rand.nextInt(4)]);
  }
  if (packPhase == 1) {
    if (packT > 14 && packT < 40 && packT % 3 == 0) packSpark(w / 2 + rand.nextInt(160) - 80, 280, 2, PACK_COL[packType][0], 3);
    if (packT == 40) {
      packFlash = 8; ringT = 1; ringCol = PACK_COL[packType][0]; shakeT = 8;
      packSpark(w / 2, 290, 60, PACK_COL[packType][0], 11); packSpark(w / 2, 290, 26, C(255, 255, 255), 14);
      Sound.sfx("golden_catch.wav", -3);
    }
    if (packT >= 74) { packPhase = 2; packT = 0; cardT = 0; ringT = 0; }
  }
  if (packPhase == 2 && cardT > 0 && cardT < ant() + FLIP) {
    cardT++;
    const i = Math.min(packIdx, packN - 1), a = ant();
    if (cardT <= a && cardT % 2 == 0) {
      const rc = RARITY_COL[SP_RARITY[packCard[i]]], an = rand.nextDouble() * Math.PI * 2;
      pp.push([w / 2 + Math.cos(an) * 210, 450 + Math.sin(an) * 250, -Math.cos(an) * 3.5, -Math.sin(an) * 3.5, 0, 40, 2, rc.r, rc.g, rc.b, rand.nextInt(4)]);
    }
    if (cardT == a + idiv(FLIP, 2) && !revealed) revealFx();
  }
  for (let i = pp.length - 1; i >= 0; i--) {
    const s = pp[i];
    s[0] += s[2]; s[1] += s[3];
    if (s[6] > 0 && Math.abs(s[2]) > 2.5) s[3] += 0; else s[3] += 0.12;
    if (++s[4] > s[5]) pp.splice(i, 1);
  }
}
function drawCard(g, sp, hl, sc, nw, sheen) {
  const rar = SP_RARITY[sp], cw = 70 * sc, ch = 98 * sc, x = -idiv(cw, 2), y = -idiv(ch, 2);
  const rc = RARITY_COL[rar], cyan = C(158, 232, 118), cream = C(255, 242, 208);
  const oc = g.getAlpha();
  if (rar >= 2) {
    g.setAlpha(0.45 + Math.sin(tick * 0.1) * 0.12);
    g.drawImage(tinted(fxGlow, rc), -cw, -idiv(ch * 4, 5), cw * 2, idiv(ch * 8, 5));
    g.setAlpha(oc);
  }
  g.drawImage(cardImg[rar], x, y, cw, ch);
  const bob = Math.round(Math.sin(tick * 0.07 + sp) * sc * 0.7);
  g.drawImage(spImg[sp], x + 11 * sc, y + 19 * sc + bob, 48 * sc, 48 * sc);
  if (rar >= 1)
    for (let k = 0; k < 2 + rar; k++) {
      const ph = tick * 0.05 + k * 2.1, a = Math.max(0, Math.sin(ph));
      if (a < 0.05) continue;
      const sx = x + Math.trunc((12 + (k * 23) % 44) * sc), sy = y + Math.trunc((22 + (k * 17) % 34) * sc), ss = idiv((6 + k % 2 * 3) * sc, 2);
      g.setAlpha(a);
      g.drawImage(fxStar[k % 3], sx - ss, sy - ss, ss * 2, ss * 2);
      g.setAlpha(oc);
    }
  if (sc >= 2) {
    const fs = Math.max(9, 4.3 * sc);
    g.setFont(smallFont.deriveFont(fs)); centered(g, SP_NAME[sp], 0, y + 10 * sc, cream);
    g.setFont(smallFont.deriveFont(fs * 0.8)); centered(g, RARITY_NAME[rar], 0, y + 75 * sc, rc);
    for (let k = 0; k <= rar; k++) {
      const cx = x + Math.trunc((22.5 + k * 8) * sc), cy = y + Math.trunc(83.5 * sc), u = sc;
      g.setColor(rc); g.fillRect(cx - u, cy - u * 2, u * 2, u * 4); g.fillRect(cx - u * 2, cy - u, u * 4, u * 2);
    }
    const val = SP_VAL[sp] * (hl ? 2 : 1);
    g.setFont(smallFont.deriveFont(fs * 0.72));
    centered(g, "+" + val + "% " + (SP_TYPE[sp] == 0 ? "INCOME" : "CLICK POWER"), 0, y + 90 * sc, cyan);
  }
  if (hl) {
    g.save();
    g.clipRect(x + 3 * sc, y + 3 * sc, cw - 6 * sc, ch - 6 * sc);
    const ts = 64 * sc;
    const ox0 = Math.trunc((((tick * 0.45 * sc + sheen * 60 * sc) % ts) + ts) % ts), oy0 = Math.trunc((((tick * 0.2 * sc) % ts) + ts) % ts);
    g.setAlpha(0.2);
    for (let tx = x - ts + ox0; tx < x + cw; tx += ts) for (let ty = y - ts + oy0; ty < y + ch; ty += ts) g.drawImage(holoTex, tx, ty, ts, ts);
    g.setAlpha(0.22);
    const span = cw + ch, gp = Math.trunc(((tick * 5 + sheen * 180) % (span + 200)) - 100);
    g.setColor(C(255, 255, 255));
    g.fillPolygon([x + gp, x + gp + idiv(26 * sc, 2), x + gp + idiv(26 * sc, 2) + ch, x + gp + ch], [y + ch, y + ch, y, y]);
    g.restore();
    g.setAlpha(oc);
    if (sc >= 2) {
      g.setFont(smallFont.deriveFont(Math.max(9, 3.4 * sc)));
      const t = "HOLO";
      text(g, t, x + 63 * sc - g.stringWidth(t), y + 21 * sc, hsbColor((tick % 60) / 60, 0.45, 1));
    }
  }
  if (nw > 0 && sc >= 2) {
    g.setColor(C(255, 200, 60)); g.fillRect(x + 6 * sc, y + 17 * sc, Math.trunc(nw == 2 ? 30 * sc : 17 * sc), 6 * sc);
    g.setFont(smallFont.deriveFont(Math.max(8, 3.3 * sc)));
    text(g, nw == 2 ? "NEW HOLO" : "NEW", x + 8 * sc, y + 20 * sc, C(60, 30, 5));
  }
}
function drawBack(g, sc, glow, pulse) {
  const cw = 70 * sc, ch = 98 * sc;
  if (glow) {
    const oc = g.getAlpha();
    g.setAlpha(clamp01(0.35 + pulse * 0.4));
    g.drawImage(tinted(fxGlow, glow), -cw, -idiv(ch * 4, 5), cw * 2, idiv(ch * 8, 5));
    g.setAlpha(oc);
  }
  g.drawImage(cardBack, -idiv(cw, 2), -idiv(ch, 2), cw, ch);
}
function drawFx(g, img, c, cx, cy, size, alpha, rot) {
  const at = g.getTransform(), oc = g.getAlpha();
  g.setSmooth(true);
  g.setAlpha(clamp01(alpha));
  g.translate(cx, cy); g.rotate(rot);
  g.drawImage(c == null ? img : tinted(img, c), -idiv(size, 2), -idiv(size, 2), size, size);
  g.setTransform(at); g.setAlpha(oc);
  g.setSmooth(false);
}
function drawDeck(g, cx, cy, count, lift) {
  for (let k = count - 1; k >= 0; k--) { const at = g.getTransform(); g.translate(cx + k * 7, cy - k * 6 + lift); drawBack(g, 4, null, 0); g.setTransform(at); }
}
function drawPack(g) {
  const orig = g.getTransform();
  const cream = C(255, 242, 208), gold = C(240, 150, 55);
  g.setColor(C(6, 3, 16, 244)); g.fillRect(0, 0, w, h);
  if (shakeT > 0) g.translate(rand.nextInt(shakeT + 1) - shakeT / 2.0, rand.nextInt(shakeT + 1) - shakeT / 2.0);
  const base = g.getTransform();
  const cx = w / 2, cy = 460;
  const cur = Math.min(packIdx, packN - 1), rar = SP_RARITY[packCard[cur]];
  const rc = RARITY_COL[rar], pc = PACK_COL[packType][0];
  const mxn = Math.max(-1, Math.min(1, (mx - cx) / 500.0)), myn = Math.max(-1, Math.min(1, (my - cy) / 400.0));
  if (packPhase == 0) {
    drawFx(g, fxGlow, pc, cx, cy, 760, 0.5 + Math.sin(tick * 0.08) * 0.12, 0);
    drawFx(g, fxRays, pc, cx, cy, 900, 0.22, tick * 0.004);
    const bob = Math.sin(tick * 0.07) * 8;
    g.translate(cx, cy + bob); g.rotate(mxn * 0.1 + Math.sin(tick * 0.05) * 0.02); g.scale(1 - Math.abs(mxn) * 0.04, 1);
    g.drawImage(packBody[packType], -140, -200, 280, 400); g.drawImage(packTop[packType], -140, -200, 280, 400);
    g.setTransform(base);
    g.setFont(bigFont); centered(g, PACK_NAME[packType] + " PACK", cx, 110, cream);
    g.setFont(smallFont); centered(g, packs[packType] + " MORE " + PACK_NAME[packType] + " PACKS AFTER THIS ONE", cx, 155, C(150, 140, 170));
    if (Math.floor(tick / 20) % 2 == 0) centered(g, "CLICK THE PACK TO OPEN IT", cx, 760, gold);
  } else if (packPhase == 1) {
    const t = packT;
    if (t < 40) {
      const u = easeOut(t / 14.0), amp = t < 14 ? 0 : Math.min(10, (t - 14) * 0.4);
      drawFx(g, fxGlow, pc, cx, cy, Math.trunc(700 + t * 14), 0.4 + t / 40.0 * 0.55, 0);
      if (t > 18) drawFx(g, fxRays, pc, cx, cy - 170, 520, (t - 18) / 22.0 * 0.8, tick * 0.03);
      const sx = 1 + 0.06 * u - (t > 14 ? 0.03 : 0), sy = 1 - 0.08 * u;
      g.translate(cx + (rand.nextDouble() - 0.5) * amp * 2, cy + 20 * u + (rand.nextDouble() - 0.5) * amp * 2);
      g.rotate((rand.nextDouble() - 0.5) * amp * 0.012); g.scale(sx, sy);
      g.drawImage(packBody[packType], -140, -200, 280, 400); g.drawImage(packTop[packType], -140, -200, 280, 400);
      g.setTransform(base);
    } else {
      const tt = t - 40;
      drawFx(g, fxRays, C(255, 255, 255), cx, cy, 1500, Math.max(0, 0.85 - tt * 0.02), tt * 0.02);
      drawFx(g, fxGlow, pc, cx, cy, 900, Math.max(0.15, 0.9 - tt * 0.015), 0);
      if (tt < 20) {
        g.translate(cx, cy + 20 + tt * tt * 0.5);
        const oc = g.getAlpha(); g.setAlpha(clamp01(1 - tt / 20.0));
        g.drawImage(packBody[packType], -140, -200, 280, 400);
        g.setAlpha(oc); g.setTransform(base);
      }
      for (let k = packN - 1; k >= 0; k--) {
        const u = easeBack((t - 38 - k * 2) / 24.0);
        if (u <= 0) continue;
        g.translate(cx + k * 7 * clamp01(u), cy + (1 - u) * 190 - k * 6 * clamp01(u));
        drawBack(g, 4, null, 0); g.setTransform(base);
      }
      g.translate(cx + tt * 9, cy - 200 + (-17 * tt + 0.32 * tt * tt) + 20);
      g.rotate(tt * 0.15);
      const oc = g.getAlpha(); g.setAlpha(clamp01(1 - tt / 30.0));
      g.drawImage(packTop[packType], -140, 0, 280, 400);
      g.setAlpha(oc); g.setTransform(base);
    }
  } else if (packPhase == 2) {
    const a = ant(), left = packN - packIdx, charging = cardT > 0 && cardT <= a, chargeU = charging ? cardT / a : 0;
    if (cardT > 0 && rar >= 1) drawFx(g, fxRays, rc, cx, cy, 1300, charging ? 0.15 + chargeU * 0.4 : (cardT >= a + idiv(FLIP, 2) ? 0.5 : 0.3), tick * 0.012);
    if (cardT >= a + idiv(FLIP, 2) || cardT == 0) drawFx(g, fxGlow, rar >= 1 ? rc : C(160, 140, 220), cx, cy, 720, rar >= 1 ? 0.5 : 0.25, 0);
    for (let k = left - 1; k >= 1; k--) { g.translate(cx + k * 7, cy - k * 6); drawBack(g, 4, null, 0); g.setTransform(base); }
    let sxs = 1, lift = 0, pop = 1, face = false;
    if (cardT > a) {
      const u = (cardT - a) / FLIP, e = easeInOut(u), ang = e * Math.PI;
      sxs = Math.max(0.02, Math.abs(Math.cos(ang))); face = ang > Math.PI / 2;
      lift = -Math.sin(u * Math.PI) * 40; pop = 1 + Math.sin(u * Math.PI) * 0.14;
    }
    const tx = (cardT == 0 || cardT >= a + FLIP) ? mxn : 0;
    const idle = cardT == 0 || cardT >= a + FLIP ? Math.sin(tick * 0.07) * 5 : 0;
    const trem = charging ? (rand.nextDouble() - 0.5) * chargeU * 9 : 0;
    g.translate(cx + trem, cy + lift + idle + (charging ? (rand.nextDouble() - 0.5) * chargeU * 9 : 0));
    g.scale(pop, pop);
    if (cardT >= a + FLIP || (cardT > a && face)) {
      g.scale(sxs, 1); g.shear(face && cardT >= a + FLIP ? -tx * 0.05 : 0, 0);
      drawCard(g, packCard[cur], packHolo[cur], 4, packNew[cur], tx);
    } else {
      g.scale(sxs, 1); g.rotate(cardT == 0 ? tx * 0.05 : 0);
      drawBack(g, 4, rar >= 1 ? rc : null, Math.sin(tick * 0.15) * 0.4 + 0.4 + chargeU);
    }
    g.setTransform(base);
    if (flyT > 0) {
      const u = easeInOut(1 - flyT / 16.0), j = flyIdx, tx2 = cx - (packN - 1) * 45 + j * 90, ty2 = 885;
      g.translate(cx + (tx2 - cx) * u, cy + (ty2 - cy) * u);
      const s = 1 - 0.78 * u; g.scale(s, s);
      drawCard(g, packCard[j], packHolo[j], 4, 0, 0); g.setTransform(base);
    }
    for (let j = 0; j < packIdx; j++) {
      if (j == flyIdx && flyT > 0) continue;
      g.translate(cx - (packN - 1) * 45 + j * 90, 885); drawCard(g, packCard[j], packHolo[j], 1, 0, 0); g.setTransform(base);
    }
    g.setFont(smallFont); centered(g, "CARD " + (packIdx + 1) + " OF " + packN, cx, 100, C(150, 140, 170));
    if (cardT == 0) { if (Math.floor(tick / 20) % 2 == 0) centered(g, "CLICK TO FLIP", cx, 770, gold); }
    else if (cardT >= a + FLIP) {
      const pu = easeBack((cardT - a - FLIP + 1) / 10.0);
      const label = (rar >= 3 ? "LEGENDARY!" : (rar == 2 ? "EPIC!" : (rar == 1 ? "RARE!" : ""))) + (packHolo[cur] ? (rar >= 1 ? " HOLO!" : "HOLO!") : "");
      if (label.length > 0) {
        g.translate(cx, 150); g.scale(Math.max(0.01, pu), Math.max(0.01, pu));
        g.setFont(bigFont.deriveFont(44));
        centered(g, label, 0, 0, packHolo[cur] ? hsbColor((tick % 60) / 60, 0.45, 1) : rc);
        g.setTransform(base);
      }
      g.setFont(smallFont);
      if (packNew[cur] == 0) centered(g, "DUPLICATE: BONUS MUSHROOMS", cx, 745, C(150, 140, 170));
      if (Math.floor(tick / 20) % 2 == 0) centered(g, packIdx + 1 >= packN ? "CLICK TO FINISH" : "CLICK FOR THE NEXT CARD", cx, 790, gold);
    }
  } else {
    drawFx(g, fxRays, gold, cx, 400, 1500, 0.2, tick * 0.006);
    const tpop = easeBack(packT / 14.0);
    g.translate(cx, 105); g.scale(Math.max(0.01, tpop), Math.max(0.01, tpop));
    g.setFont(bigFont.deriveFont(44)); centered(g, "PACK OPENED!", 0, 0, cream);
    g.setTransform(base);
    const sc = 3, cw = 70 * sc, ch = 98 * sc, gap = 22, total = packN * cw + (packN - 1) * gap;
    for (let j = 0; j < packN; j++) {
      const pu = easeBack((packT - j * 6) / 18.0);
      if (pu <= 0) continue;
      const px0 = cx - idiv(total, 2) + idiv(cw, 2) + j * (cw + gap), py0 = 430;
      const hov = Math.abs(mx - px0) < cw / 2 && Math.abs(my - py0) < ch / 2 && packT > 40;
      const sh = hov ? Math.max(-1, Math.min(1, (mx - px0) / (cw / 2.0))) : 0;
      g.translate(px0, py0 + (1 - Math.min(1, pu)) * 220 - (hov ? 10 : 0));
      const s = Math.max(0.05, pu) * (hov ? 1.07 : 1); g.scale(s, s);
      drawCard(g, packCard[j], packHolo[j], sc, packNew[j], sh); g.setTransform(base);
    }
    g.setFont(smallFont);
    if (packDupeCash > 0) centered(g, "DUPLICATES GAVE +" + fmt(packDupeCash) + " MUSHROOMS", cx, 640, C(158, 232, 118));
    centered(g, "COLLECTED " + foundCount() + " OF 16", cx, 686, gold);
    centered(g, "BONUS: +" + colBonus(0) + "% INCOME   +" + colBonus(1) + "% CLICK POWER", cx, 726, C(158, 232, 118));
    const done = R(w / 2 - 300, 830, 280, 70), again = R(w / 2 + 20, 830, 280, 70), can = packs[packType] > 0;
    const hd = inR(done, { x: mx, y: my }), ha = can && inR(again, { x: mx, y: my });
    g.drawImage(hd ? buttonHover : button, done.x, done.y, done.width, done.height);
    g.setFont(midFont); centered(g, "DONE", done.x + idiv(done.width, 2), done.y + 34, cream);
    const oc = g.getAlpha();
    if (!can) g.setAlpha(0.4);
    g.drawImage(ha ? buttonHover : button, again.x, again.y, again.width, again.height);
    g.setAlpha(oc);
    g.setFont(smallFont);
    centered(g, can ? "OPEN ANOTHER (" + packs[packType] + ")" : "NO MORE PACKS", again.x + idiv(again.width, 2), again.y + 34, can ? cream : C(150, 140, 170));
  }
  if (ringT > 0) { const u = ringT / 30.0; drawFx(g, fxRing, ringCol, cx, packPhase == 1 ? 290 : cy, Math.trunc(160 + easeOut(u) * 1500), 1 - u, 0); }
  for (const s of pp) {
    const life = 1 - s[4] / s[5], sz = Math.trunc(10 + s[6] * 8), oc = g.getAlpha();
    g.setAlpha(Math.max(0, Math.min(1, life * 1.4)));
    g.drawImage(tinted(fxStar[Math.trunc(s[10]) % 4], C(Math.trunc(s[7]), Math.trunc(s[8]), Math.trunc(s[9]))), Math.trunc(s[0]) - idiv(sz, 2), Math.trunc(s[1]) - idiv(sz, 2), sz, sz);
    g.setAlpha(oc);
  }
  if (packPhase >= 1 && packPhase < 3) {
    const hs = inR(R(50, 856, 170, 60), { x: mx, y: my });
    g.drawImage(hs ? backHover : back, 50, 856, 170, 60);
    g.setFont(smallFont); centered(g, "SKIP ALL", 50 + 92, 886, cream);
  }
  g.setTransform(orig);
  if (packFlash > 0) { g.setColor(C(255, 255, 255, Math.min(255, packFlash * 20))); g.fillRect(0, 0, w, h); }
}
function bookClick(p) {
  if (inR(storyBtn, p)) { bookStory = !bookStory; Sound.pop(); return; }
  if (bookStory) return;
  if (inR(openQtyBox, p)) { cycleOpenQty(); return; }
  for (let k = 0; k < 3; k++)
    if (inR(packBtn[k], p)) {
      if (packs[k] > 0) { if (openQty() == 1) openPack(k); else bulkOpen(k, openQty()); } else showBanner("NO " + PACK_NAME[k] + " PACKS. KEEP PLAYING TO EARN THEM!", C(255, 226, 170));
      return;
    }
  if (inR(packBtn[3], p)) {
    const c = packCost();
    if (count >= c) { count -= c; packs[0]++; Sound.sfx("cash.wav", -3); showBanner("BOUGHT A BASIC PACK", PACK_COL[0][0]); }
    else showBanner("YOU NEED " + fmt(c) + " MUSHROOMS", C(255, 150, 120));
  }
}
// ---- naming ----
function openNaming() { naming = true; nameBuf = mname; Sound.pop(); }
function nameKey(e) {
  const k = e.key;
  if (k === "Escape") naming = false;
  else if (k === "Enter") {
    mname = nameBuf.trim(); naming = false;
    if (isAdmin()) { showBanner("ADMIN PANEL UNLOCKED!", C(255, 120, 200)); Sound.sfx("evolve.wav", -3); }
    else showBanner(mname.length == 0 ? "NAME CLEARED" : "YOUR MUSHROOM IS " + mname, C(160, 255, 240));
    saveGame();
  } else if (k === "Backspace") { if (nameBuf.length > 0) nameBuf = nameBuf.substring(0, nameBuf.length - 1); }
  else if (k.length === 1 && /[A-Za-z0-9 \-_.]/.test(k) && nameBuf.length < 12) nameBuf += k.toUpperCase();
}
function drawNaming(g) {
  const cream = C(255, 242, 208), gold = C(240, 150, 55);
  g.setColor(C(6, 3, 16, 215)); g.fillRect(0, 0, w, h);
  panel(g, w / 2 - 380, 280, 760, 300);
  g.setFont(bigFont); centered(g, "NAME YOUR MUSHROOM", w / 2, 340, cream);
  g.setColor(gold); g.fillRect(w / 2 - 290, 390, 580, 80);
  g.setColor(C(13, 5, 24)); g.fillRect(w / 2 - 285, 395, 570, 70);
  g.setFont(midFont);
  centered(g, nameBuf + (Math.floor(tick / 15) % 2 == 0 ? "_" : " "), w / 2, 432, C(158, 232, 118));
  g.setFont(smallFont);
  centered(g, "UP TO 12 LETTERS.  IT SHOWS ABOVE YOUR MUSHROOM.", w / 2, 505, C(255, 226, 170));
  centered(g, "ENTER = OK     ESC = CANCEL", w / 2, 545, C(150, 140, 170));
}
function drawName(g) {
  if (mname.length == 0) return;
  g.setFont(midFont);
  const tw = g.stringWidth(mname), cx = mushBox.x + 330, y = Math.max(190, mushY + mushTop - 40), t2 = idiv(tw, 2);
  g.setColor(C(13, 5, 24, 200)); g.fillRect(cx - t2 - 20, y - 26, tw + 40, 52);
  g.setColor(isAdmin() ? hsbColor((tick % 120) / 120, 0.6, 1) : C(240, 150, 55));
  g.fillRect(cx - t2 - 20, y - 26, tw + 40, 4); g.fillRect(cx - t2 - 20, y + 22, tw + 40, 4);
  g.fillRect(cx - t2 - 20, y - 26, 4, 52); g.fillRect(cx + t2 + 16, y - 26, 4, 52);
  centered(g, mname, cx, y, isAdmin() ? hsbColor(((tick % 120) / 120 + 0.3) % 1, 0.5, 1) : C(255, 242, 208));
}
// ---- admin ----
const ADMIN_N = 31;
function adminRect(i) { return R(150 + (i % 5) * 236, 205 + Math.floor(i / 5) * 72, 220, 58); }
function adminLabel(i) {
  const L = ["+1K MUSHROOMS", "+1M MUSHROOMS", "+1B MUSHROOMS", "+100B MUSHROOMS", "X10 MUSHROOMS", "STAGE 0", "STAGE 1", "STAGE 2", "STAGE 3", "COSMIC FORM",
    "THORNBACK FORM", "+5 BASIC PACKS", "+5 SHINY PACKS", "+5 GRAND PACKS", "ALL CARDS", "ALL HOLOS", "CLEAR CARDS", "+10 SPORES", "SPAWN GOLDEN", "SPAWN CROW",
    "SPAWN BOSS", "FRENZY 60S", "NEXT SEASON", "SKIP 1 HOUR", "ALL SKINS", "", "", "ALL TROPHIES", "NEW GOALS", "NO HUNT WAIT", "SPORE RAIN"];
  if (i == 25) return "GOD CLICKS: " + (godClicks ? "ON" : "OFF");
  if (i == 26) return "SPEED X5: " + (adminSpeed ? "ON" : "OFF");
  return L[i];
}
function adminClick(p) { for (let i = 0; i < ADMIN_N; i++) if (inR(adminRect(i), p)) { adminDo(i); Sound.pop(); return; } }
function setStage(s, br) {
  stage = s; branch = br; evo = 0; worn = -1; wornAsc = false; form = 0; choosing2 = false;
  if (s < 4) totalEarned = Math.min(totalEarned, STAGE_AT[s + 1] - 1);
  if (totalEarned < STAGE_AT[s]) totalEarned = STAGE_AT[s];
  choosing = false; rebuildMush();
}
function adminDo(i) {
  switch (i) {
    case 0: earn(1000); break; case 1: earn(1000000); break; case 2: earn(1000000000); break; case 3: earn(100000000000); break;
    case 4: earn(Math.max(1000, count * 9)); break;
    case 5: case 6: case 7: case 8: setStage(i - 5, -1); break;
    case 9: setStage(4, 0); break; case 10: setStage(4, 1); break;
    case 11: packs[0] += 5; break; case 12: packs[1] += 5; break; case 13: packs[2] += 5; break;
    case 14: for (let k = 0; k < 16; k++) { found[k] = true; cardCount[k] = Math.max(1, cardCount[k]); } break;
    case 15: for (let k = 0; k < 16; k++) { found[k] = true; holo[k] = true; cardCount[k] = Math.max(1, cardCount[k]); } break;
    case 16: found.fill(false); holo.fill(false); cardCount.fill(0); break;
    case 17: spores += 10; break;
    case 18: nextGolden = 1; inStats = false; break; case 19: nextCrow = 1; inStats = false; break; case 20: nextBoss = 1; inStats = false; break;
    case 21: frenzy = 2000; break;
    case 22: playTicks += 12000 - (playTicks % 12000); break;
    case 23: earn(secGain() * 3600); break;
    case 24: skinOwned.fill(true); break;
    case 25: godClicks = !godClicks; break; case 26: adminSpeed = !adminSpeed; break;
    case 27: ach.fill(true); break;
    case 28: for (let k = 0; k < qKind.length; k++) newQuest(k); break;
    case 29: huntCool = 0; break;
    default: rain = 900; break;
  }
  showBanner("ADMIN: " + adminLabel(i), C(255, 120, 200));
}
function drawAdmin(g) {
  if (!isAdmin()) { inStats = false; return; }
  bigPanel(g);
  const cream = C(255, 242, 208), pink = C(255, 120, 200);
  g.setFont(bigFont); centered(g, "ADMIN PANEL", w / 2, 135, pink);
  g.setFont(smallFont); centered(g, "YOUR MUSHROOM IS NAMED MUSHMUSH. RENAME IT TO TURN THIS OFF.", w / 2, 175, C(255, 226, 170));
  for (let i = 0; i < ADMIN_N; i++) {
    const r = adminRect(i), on = (i == 25 && godClicks) || (i == 26 && adminSpeed);
    g.setColor(on ? C(120, 230, 150) : pink); g.fillRect(r.x, r.y, r.width, r.height);
    g.setColor(hoverBtn == i ? C(70, 30, 80) : C(26, 12, 40)); g.fillRect(r.x + 4, r.y + 4, r.width - 8, r.height - 8);
    g.setFont(smallFont); centered(g, adminLabel(i), r.x + idiv(r.width, 2), r.y + idiv(r.height, 2), cream);
  }
  g.drawImage(hoverBack ? backHover : back, backBox.x, backBox.y);
  g.setFont(bigFont); text(g, "BACK", backBox.x + 44, backBox.y + 38, cream);
}
