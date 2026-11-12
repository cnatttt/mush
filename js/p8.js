rand.nextGaussian = function () { let u = 0, v = 0; while (u === 0) u = Math.random(); while (v === 0) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
function rIntersects(a, b) { return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height; }
function animate() {
  if (paused || choosing || choosing2 || slotScreen) return;
  tick++;
  if (fade > 0) fade--;
  if (whiteFlash > 0) whiteFlash--;
  if (inEnding) {
    endTick++;
    if (endTick == 533) Sound.sfx("evolve.wav", -2);
    for (let i = 0; i < starfield.length; i++) { starfield[i][2] -= 0.0025 * (0.6 + (i % 5) * 0.2); if (starfield[i][2] <= 0.02) resetStar(i, false); }
    return;
  }
  if (intro) {
    introTick++;
    if (introTick > TITLE_TICK + 60) startMusic();
    const sp = introTick < 270 ? 1 : (introTick < TITLE_TICK ? 12 : 1), spd = sp == 1 ? 0.0025 : 0.03;
    for (let i = 0; i < starfield.length; i++) { starfield[i][2] -= spd * (0.6 + (i % 5) * 0.2); if (starfield[i][2] <= 0.02) resetStar(i, false); }
    for (let i = spore.length - 1; i >= 0; i--) { const s = spore[i]; s.x += s.vx; s.y += s.vy; if (++s.life > s.max) spore.splice(i, 1); }
    const T = introTick;
    if ((T > 60 && T < 330 && T % 4 == 0) || (T >= TITLE_TICK && T % 6 == 0))
      spore.push(new Spore(rand.nextInt(w), h + 10, rand.nextGaussian() * 0.5, -1.5 - rand.nextFloat() * 1.5, 260, 9, C(170, 255, 240)));
    if (T == 132 || T == 167 || T == 200 || T == 234 || T == 267 || T == 320) whiteFlash = 8;
    return;
  }
  playTicks++; dayTick++;
  season = Math.floor(playTicks / 12000) % 4;
  if (season != lastSeason) { lastSeason = season; showBanner(SEASON_NAME[season] + " HAS COME", C(255, 226, 170)); }
  if (++seasonTicks[season] >= 4000 && !skinOwned[4 + season]) {
    skinOwned[4 + season] = true;
    showBanner("NEW SKIN: " + SKIN_NAME[4 + season] + "! WEAR IT IN THE TREE", C(255, 226, 120));
    Sound.sfx("achieve.wav", -3);
  }
  if (!inShop && !inStats)
    for (let i = 0; i < spx.length; i++) {
      if (season == 1) { spx[i] += Math.sin((tick + i * 11) * 0.04) * 0.9; spy[i] += Math.sin((tick + i * 5) * 0.05) * 0.8 - 0.15; }
      else { spx[i] += Math.sin((tick + i * 9) * 0.06) * (season == 2 ? 1.6 : 1.0) + (season == 0 ? 0.6 : 0); spy[i] += spvy[i] * (season == 3 ? 1.2 : 1); }
      if (spy[i] > h + 10 || spy[i] < -20) { spy[i] = season == 1 ? (spy[i] < 0 ? h : 0) : -10; spx[i] = rand.nextInt(w); }
      if (spx[i] > w + 20) spx[i] = -10;
      if (spx[i] < -20) spx[i] = w + 10;
    }
  if (tick % 1000 == 0) saveGame();
  if (tick % 10 == 0) { checkEvo(); journeyTick(); }
  potionTick(); atmoTick();
  if (awayLife > 0) awayLife--;
  if (packPopLife > 0) packPopLife--;
  if (inPack) packTick();
  if (huntCool > 0) huntCool--;
  if (dealLeft > 0 && --dealLeft == 0) dealItem = -1;
  if (dealCool > 0) dealCool--;
  if (inHunt) huntStep();
  if (tick % 10 == 0) checkQuests();
  if (pressHold > 0 && --pressHold == 0) pressedNow = false;
  if (owned[21] > 0 && tick % 11 == 0) { earn(clickGain()); burst(mushBox.x + 330 + rand.nextInt(121) - 60, mushBox.y + 200, 2, 6, C(143, 209, 106)); }
  if (owned[23] > 0 && tick % 600 == 0) {
    const gift = Math.max(20, secGain() * 15); earn(gift);
    const wx0 = petX(3) + 40, wy0 = signY + 20;
    burst(wx0, wy0, 14, 6, C(158, 232, 118));
    if (!inShop && !inStats) floats.push(new FloatText(wx0 - 40, wy0, "WISP +" + fmt(gift), C(158, 232, 118)));
    Sound.sfx("golden_catch.wav", -12);
  }
  econAcc += 30;
  if (econAcc >= 1000) { econAcc -= 1000; earn(secGain()); }
  for (let i = floats.length - 1; i >= 0; i--) { const f = floats[i]; f.y -= 3; f.life++; if (f.life > 30) floats.splice(i, 1); }
  for (let i = spore.length - 1; i >= 0; i--) {
    const s = spore[i]; s.x += s.vx; s.y += s.vy;
    if (!s.free) { s.vx *= 0.94; s.vy = s.vy * 0.94 - (s.size > 6 ? 0.02 : 0); }
    s.life++; if (s.life > s.max) spore.splice(i, 1);
  }
  if (!inShop && !inStats && !inHunt && tick % 8 == 0 && spore.length < 90)
    spore.push(new Spore(rand.nextInt(w), h + 10, rand.nextGaussian() * 0.4, -1.2 - rand.nextFloat(), 200 + rand.nextInt(200), 9, C(170, 255, 240)));
  if (bannerLife > 0) bannerLife--;
  if (toastLife > 0) toastLife--;
  if (frenzy > 0) frenzy--;
  if (tick % 15 == 0) checkAchievements();
  if (!inShop && !inStats && !inHunt) {
    if (bossOn) {
      if (bossHit > 0) bossHit--;
      if (tick % 5 == 0) spore.push(new Spore(bossBox.x + rand.nextInt(240), bossBox.y + 200 + rand.nextInt(60), 0, -1, 25, 6, C(143, 209, 106)));
      if (lobbyView() && --bossLife <= 0) { bossOn = false; nextBoss = 6000 + rand.nextInt(2000); showBanner("THE BLIGHT RETREATS...", C(190, 200, 170)); }
    } else {
      if (nextBoss > 0) nextBoss--;
      if (nextBoss <= 0 && lobbyView()) {
      bossOn = true; bossMax = 45 + Math.min(60, bossKills * 5); bossHp = bossMax; bossLife = 500;
      Sound.sfx("caw.wav", -3); showBanner("THE BLIGHT HAS COME! CLICK!", C(160, 230, 110));
      }
    }
    if (goldenOn) {
      goldenLife--;
      goldBox.x = gx; goldBox.y = gy + bob(); goldBox.width = golden.width; goldBox.height = golden.height;
      if (tick % 6 == 0) spore.push(new Spore(gx + rand.nextInt(156), gy + rand.nextInt(168), 0, -1, 25, 6, C(255, 226, 120)));
      if (goldenLife <= 0) { goldenOn = false; nextGolden = idiv(3000 + rand.nextInt(3000), (owned[13] > 0 ? 2 : 1)); }
    } else if (--nextGolden <= 0) spawnGolden();
    if (crowOn) {
      crowX += 7; crowY += Math.sin(tick * 0.15) * 2.2;
      crowBox.x = Math.trunc(crowX) - 10; crowBox.y = Math.trunc(crowY) - 10; crowBox.width = 110; crowBox.height = 90;
      if (crowX > w + 100) { crowOn = false; nextCrow = idiv(1800 + rand.nextInt(1800), (owned[26] > 0 ? 2 : 1)); }
    } else if (--nextCrow <= 0) { crowOn = true; crowX = -100; crowY = 110 + rand.nextInt(180); Sound.sfx("caw.wav", -4); }
    if (rain > 0) {
      rain--;
      for (let k = 0; k < 2; k++) {
        const s = new Spore(rand.nextInt(w), -10, rand.nextGaussian() * 0.3, 3 + rand.nextFloat() * 3, 260, 9, rand.nextBoolean() ? C(160, 255, 240) : C(200, 160, 255));
        s.free = true; spore.push(s);
      }
    } else if (--nextRain <= 0) {
      rain = 333; nextRain = 2400 + rand.nextInt(2400);
      Sound.sfx("golden_appear.wav", -4); showBanner("SPORE RAIN! +50% FOR 10 SECONDS", C(160, 255, 240));
    }
    if (--weatherLeft <= 0) newWeather(rand.nextInt(100) < 30 ? 0 : rand.nextInt(4));
    if (weather != 0)
      for (let i = 0; i < wx.length; i++) {
        wx[i] += wvx[i]; wy[i] += wvy[i];
        if (weather == 2) wx[i] += Math.sin((tick + i * 7) * 0.08) * 0.8;
        if (weather == 3) {
          wvx[i] += (rand.nextFloat() - 0.5) * 0.3; wvy[i] += (rand.nextFloat() - 0.5) * 0.3;
          wvx[i] = Math.max(-1.5, Math.min(1.5, wvx[i])); wvy[i] = Math.max(-1.5, Math.min(1.5, wvy[i]));
        }
        if (wy[i] > h + 20) { wy[i] = -20; wx[i] = rand.nextInt(w + 100); }
        if (wy[i] < -30) wy[i] = h + 10;
        if (wx[i] < -30) wx[i] = w + 10;
        if (wx[i] > w + 30) wx[i] = -10;
      }
  }
  if (!inShop) Sound.stopVoice();
  if (inShop) {
    if (bubble.length > 0) {
      if (bubbleChars < bubble.length) bubbleChars++; else if (--bubbleHold <= 0) bubble = "";
    } else if (--nextIdle <= 0) say(pick(SAY_IDLE));
  }
}
function spawnGolden() {
  for (let tries = 0; tries < 40; tries++) {
    const x = 60 + rand.nextInt(w - 280), y = 140 + rand.nextInt(h - 400), r = R(x, y, 156, 168 + 20);
    if (!rIntersects(r, mushBox) && !rIntersects(r, signBox) && !(bossOn && rIntersects(r, bossBox))) { gx = x; gy = y; break; }
  }
  goldenOn = true; goldenLife = 400 + 400 * owned[19];
  goldBox.x = gx; goldBox.y = gy; goldBox.width = 156; goldBox.height = 168;
  Sound.sfx("golden_appear.wav", -3);
}
function bob() { return Math.trunc(Math.trunc(Math.sin(tick * 0.12) * 4) / 2) * 2; }
function updateHover(p) {
  hoverMute = inR(muteBox, p); hoverPauseBtn = inR(pauseBtn, p);
  const lob = !intro && !slotScreen && !inShop && !inStats && !inHunt;
  hoverBook = lob && inR(bookBox, p); hoverInfo = lob && inR(infoBox, p); hoverName = lob && inR(nameBox, p);
  hoverAdminBtn = isAdmin() && lob && inR(adminBox, p);
  hoverBtn = -1; mx = p.x; my = p.y;
  if (inStats && page == 2) for (let k = 0; k < 4; k++) if (inR(packBtn[k], p)) hoverBtn = k;
  if (inStats && page == 4) for (let k = 0; k < ADMIN_N; k++) if (inR(adminRect(k), p)) hoverBtn = k;
  hoverSpecies = -1;
  if (inStats && page == 2) for (let i = 0; i < 16; i++) if (inR(spBox[i], p)) hoverSpecies = i;
  hoverSlot = -1; hoverDel = -1;
  if (slotScreen) for (let k = 0; k < 3; k++) { if (slotLines[k] != null && inR(delBox(k), p)) hoverDel = k; else if (inR(slotBox[k], p)) hoverSlot = k; }
  const lob2 = !intro && !inShop && !inStats && !inHunt;
  hoverStats = lob2 && inR(statsBox, p); hoverTree = lob2 && inR(treeBox, p); hoverSign = lob2 && inR(signBox, p);
  hoverCrow = lob2 && crowOn && inR(crowBox, p); hoverGold = lob2 && goldenOn && inR(goldBox, p);
  hoverMush = lob2 && inR(mushBox, p) && !hoverGold && !hoverCrow;
  hoverBack = (inShop || inStats || (inHunt && huntState == 0)) && inR(backBox, p);
  hoverHunt = lob2 && inR(huntBox, p); hoverBoss = lob2 && bossOn && inR(bossBox, p);
  hoverHole = -1;
  if (inHunt && huntState == 1) for (let i = 0; i < 12; i++) if (inR(holeBox[i], p)) hoverHole = i;
  hoverStart = inHunt && huntState == 0 && inR(huntStartBox, p);
  const huntHand = inHunt && ((huntState == 0 && (hoverStart || hoverBack)) || (huntState == 1 && hoverHole >= 0) || huntState == 2);
  hoverChoose = -1;
  if (choosing || choosing2) for (let k = 0; k < 2; k++) if (inR(chooseBox[k], p)) hoverChoose = k;
  hoverPause = -1;
  if (paused) for (let i = 0; i < pauseBox.length; i++) if (inR(pauseBox[i], p)) hoverPause = i;
  hoverItem = -1; hoverTab = -1;
  if (inShop) {
    for (let i = 0; i < itemBox.length; i++) if (inR(itemBox[i], p)) hoverItem = i;
    if (inR(resetBox, p)) hoverItem = 4;
    if (inR(dealBox, p)) hoverItem = 5;
    for (let i = 0; i < tabBox.length; i++) if (tabShown(i) && inR(tabBox[i], p)) hoverTab = i;
  }
  const hand = hoverName || hoverAdminBtn || hoverBtn >= 0 || inPack || inBulk || (inPotion && potHand) || hoverBook || hoverInfo || hoverSpecies >= 0 || hoverSlot >= 0 || hoverDel >= 0 || hoverPauseBtn || huntHand || hoverHunt || hoverBoss || hoverChoose >= 0 || intro || hoverTree || hoverPause >= 0 || hoverMute || hoverStats || hoverSign || hoverMush || hoverBack || hoverGold || hoverCrow || hoverItem >= 0 || hoverTab >= 0;
  cv.style.cursor = hand ? "pointer" : "default";
}
// ---- image helpers ----
function rgb2hsb(r, g, b) {
  let hue, sat; const cmax = Math.max(r, g, b), cmin = Math.min(r, g, b), bri = cmax / 255;
  sat = cmax != 0 ? (cmax - cmin) / cmax : 0;
  if (sat == 0) hue = 0;
  else {
    const rc = (cmax - r) / (cmax - cmin), gc = (cmax - g) / (cmax - cmin), bc = (cmax - b) / (cmax - cmin);
    if (r == cmax) hue = bc - gc; else if (g == cmax) hue = 2 + rc - bc; else hue = 4 + gc - rc;
    hue /= 6; if (hue < 0) hue += 1;
  }
  return [hue, sat, bri];
}
function hsb2rgb(hue, sat, bri) {
  let r = 0, g = 0, b = 0;
  if (sat == 0) { r = g = b = Math.trunc(bri * 255 + 0.5); }
  else {
    const hh = (hue - Math.floor(hue)) * 6, f = hh - Math.floor(hh), p = bri * (1 - sat), q = bri * (1 - sat * f), t = bri * (1 - sat * (1 - f));
    switch (Math.trunc(hh)) {
      case 0: r = bri; g = t; b = p; break; case 1: r = q; g = bri; b = p; break; case 2: r = p; g = bri; b = t; break;
      case 3: r = p; g = q; b = bri; break; case 4: r = t; g = p; b = bri; break; default: r = bri; g = p; b = q; break;
    }
    r = Math.trunc(r * 255 + 0.5); g = Math.trunc(g * 255 + 0.5); b = Math.trunc(b * 255 + 0.5);
  }
  return [r, g, b];
}
function hsbColor(h, s, b) { const c = hsb2rgb(h, s, b); return C(c[0], c[1], c[2]); }
function pixels(img) { const cv = mk(img.width, img.height), x = cv.getContext("2d"); x.drawImage(img, 0, 0); return [cv, x, x.getImageData(0, 0, cv.width, cv.height)]; }
function tint(src, hue) {
  const [cv, x, d] = pixels(src), a = d.data;
  for (let i = 0; i < a.length; i += 4) {
    if (a[i + 3] == 0) continue;
    const hsb = rgb2hsb(a[i], a[i + 1], a[i + 2]);
    if (hsb[1] > 0.12) { const c = hsb2rgb(hue, Math.min(1, hsb[1] * 1.1 + 0.3), hsb[2]); a[i] = c[0]; a[i + 1] = c[1]; a[i + 2] = c[2]; }
  }
  x.putImageData(d, 0, 0); return cv;
}
function brighter(src) {
  const [cv, x, d] = pixels(src), a = d.data;
  for (let i = 0; i < a.length; i += 4) { a[i] = Math.min(255, Math.trunc(a[i] * 1.18 + 18)); a[i + 1] = Math.min(255, Math.trunc(a[i + 1] * 1.18 + 18)); a[i + 2] = Math.min(255, Math.trunc(a[i + 2] * 1.18 + 18)); }
  x.putImageData(d, 0, 0); return cv;
}
function lowest(img) {
  const [cv, x, d] = pixels(img), a = d.data, W2 = cv.width, H2 = cv.height;
  for (let y = H2 - 1; y >= 0; y--) {
    let n = 0;
    for (let xx = 0; xx < W2; xx++) { const i = (y * W2 + xx) * 4; if (a[i + 3] > 128 && Math.max(a[i], a[i + 1], a[i + 2]) > 50) n++; }
    if (n >= 12) return y;
  }
  for (let y = H2 - 1; y >= 0; y--) for (let xx = 0; xx < W2; xx++) if (a[(y * W2 + xx) * 4 + 3] > 0) return y;
  return H2 - 1;
}
function highest(img) {
  const [cv, x, d] = pixels(img), a = d.data, W2 = cv.width, H2 = cv.height;
  for (let y = 0; y < H2; y++) { let n = 0; for (let xx = 0; xx < W2; xx++) if (a[(y * W2 + xx) * 4 + 3] > 128) n++; if (n >= 12) return y; }
  return 0;
}
const FORM_RC = [{ lo: 0.75, hi: 0.92, mc: 0.83, glo: 0.50, ghi: 0.62, gc: 0.58 }, { lo: 0.60, hi: 0.76, mc: 0.67, glo: 0.38, ghi: 0.50, gc: 0.43 }, { lo: 0.20, hi: 0.42, mc: 0.30 }, { wrap: true, mc: 0.0 }];
function recolorForm(src, skin) {
  const f = FORM_RC[(imgIdx() - 6) & 3], [cv, x, d] = pixels(src), a = d.data;
  for (let i = 0; i < a.length; i += 4) {
    if (a[i + 3] == 0) continue;
    const hsb = rgb2hsb(a[i], a[i + 1], a[i + 2]); let hue = hsb[0];
    if (hsb[1] < 0.2) continue;
    if (f.wrap) { if (hue < 0.075 || hue > 0.94) hue = SKIN_HUE[skin] + (hue > 0.5 ? hue - 1 : hue) - f.mc; else continue; }
    else if (hue >= f.lo && hue <= f.hi) hue += SKIN_HUE[skin] - f.mc;
    else if (f.glo !== undefined && hue >= f.glo && hue <= f.ghi) hue += SKIN_GLOW[skin] - f.gc;
    else continue;
    const c = hsb2rgb(hue - Math.floor(hue), hsb[1], hsb[2]); a[i] = c[0]; a[i + 1] = c[1]; a[i + 2] = c[2];
  }
  x.putImageData(d, 0, 0); return cv;
}
function recolor(src, skin) {
  if (skin == 0) return src;
  if (imgIdx() >= 6) return recolorForm(src, skin);
  const [cv, x, d] = pixels(src), a = d.data, wild = imgIdx() == 5;
  for (let i = 0; i < a.length; i += 4) {
    if (a[i + 3] == 0) continue;
    const hsb = rgb2hsb(a[i], a[i + 1], a[i + 2]); let hue = hsb[0];
    if (wild) {
      if (hsb[1] > 0.3 && (hue < 0.09 || hue > 0.94)) hue = SKIN_HUE[skin] + (hue > 0.5 ? hue - 1 : hue) - 0.05; else continue;
    } else if (hsb[1] > 0.15 && hue > 0.68 && hue < 0.90) hue += SKIN_HUE[skin] - 0.77;
    else if (hsb[1] > 0.15 && hue > 0.42 && hue < 0.56) hue += SKIN_GLOW[skin] - 0.49;
    else continue;
    const c = hsb2rgb(hue - Math.floor(hue), hsb[1], hsb[2]); a[i] = c[0]; a[i + 1] = c[1]; a[i + 2] = c[2];
  }
  x.putImageData(d, 0, 0); return cv;
}
function rebuildMush() {
  if (!stageRaw[0]) return;
  let a = recolor(stageRaw[imgIdx()], skin);
  if (X.hollowOn && stage >= 4) a = hollowize(a);
  mushLow = lowest(a); mushTop = highest(a);
  mushY = h - GROUND_GAP - mushLow - 1;
  if (mushBox) mushBox.y = mushY + 30;
  mush = a; mushHover = brighter(mush); pressedNow = false;
  for (let k = 0; k < 8; k++) skinThumb[k] = recolor(stageRaw[imgIdx()], k);
}
function fitBox(src) {
  const [cv, x, d] = pixels(src), a = d.data, W2 = cv.width, H2 = cv.height;
  let x0 = W2, y0 = H2, x1 = -1, y1 = -1;
  for (let y = 0; y < H2; y++) for (let xx = 0; xx < W2; xx++) if (a[(y * W2 + xx) * 4 + 3] > 10) { x0 = Math.min(x0, xx); x1 = Math.max(x1, xx); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  if (x1 < 0) return src;
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1, S = 200, room = 168, k = Math.min(room / bw, room / bh);
  const dw = Math.max(1, Math.trunc(bw * k)), dh = Math.max(1, Math.trunc(bh * k));
  const out = mk(S, S), g2 = out.getContext("2d"); g2.imageSmoothingEnabled = false;
  g2.drawImage(src, x0, y0, bw, bh, idiv(S - dw, 2), S - 14 - dh, dw, dh);
  return out;
}
let fitSrc = null, fitOut = null;
function fitCached(src) { if (src !== fitSrc) { fitSrc = src; fitOut = fitBox(src); } return fitOut; }
function fmt(n) {
  n = Math.trunc(n);
  if (n < 1000) return "" + n;
  const u = ["K", "M", "B", "T", "QA", "QI", "SX", "SP", "OCT", "NON", "DEC", "UDC", "DDC", "TDC"]; let div = 1000, k = 0;
  while (k < u.length - 1 && idiv(n, div) >= 1000) { div *= 1000; k++; }
  const t = idiv(n, idiv(div, 10));
  return idiv(t, 10) + (t % 10 == 0 ? "" : "." + (t % 10)) + u[k];
}
