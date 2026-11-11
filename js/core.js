// ---- core: colors, rects, canvas wrapper, images, sound, loop, input ----
let _imgId = 0;
function C(r, g, b, a) { if (a === undefined) a = 255; a = Math.max(0, Math.min(255, Math.trunc(a))); return { r, g, b, a, css: "rgba(" + r + "," + g + "," + b + "," + (a / 255).toFixed(3) + ")" }; }
const Color_WHITE = C(255, 255, 255);
function R(x, y, width, height) { return { x, y, width, height }; }
function inR(r, p) { return p.x >= r.x && p.y >= r.y && p.x < r.x + r.width && p.y < r.y + r.height; }
function mk(wd, ht) { const c = document.createElement("canvas"); c.width = Math.max(1, wd); c.height = Math.max(1, ht); return c; }
function sub(img, x, y, wd, ht) { const c = mk(wd, ht); c.getContext("2d").drawImage(img, x, y, wd, ht, 0, 0, wd, ht); return c; }
function compat(x) { return x; }
function readImage(n) { return IMG[n]; }

class G {
  constructor(ctx) { this.ctx = ctx; this.font = { size: 16, css: "16px monospace" }; }
  setColor(c) { this.ctx.fillStyle = c.css; this.ctx.strokeStyle = c.css; }
  fillRect(x, y, wd, ht) { this.ctx.fillRect(x, y, wd, ht); }
  drawRect(x, y, wd, ht) { this.ctx.strokeRect(x + 0.5, y + 0.5, wd, ht); }
  drawLine(x1, y1, x2, y2) { const c = this.ctx; c.lineWidth = 1; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }
  fillOval(x, y, wd, ht) { const c = this.ctx; c.beginPath(); c.ellipse(x + wd / 2, y + ht / 2, wd / 2, ht / 2, 0, 0, Math.PI * 2); c.fill(); }
  fillPolygon(xs, ys) { const c = this.ctx; c.beginPath(); c.moveTo(xs[0], ys[0]); for (let i = 1; i < xs.length; i++) c.lineTo(xs[i], ys[i]); c.closePath(); c.fill(); }
  drawImage(img, x, y, wd, ht) { if (!img) return; if (wd === undefined) this.ctx.drawImage(img, x, y); else this.ctx.drawImage(img, x, y, wd, ht); }
  setAlpha(a) { this.ctx.globalAlpha = Math.max(0, Math.min(1, a)); }
  getAlpha() { return this.ctx.globalAlpha; }
  translate(x, y) { this.ctx.translate(x, y); }
  scale(x, y) { this.ctx.scale(x, y); }
  rotate(a) { this.ctx.rotate(a); }
  shear(sx, sy) { this.ctx.transform(1, sy, sx, 1, 0, 0); }
  getTransform() { return this.ctx.getTransform(); }
  setTransform(m) { this.ctx.setTransform(m); }
  clipRect(x, y, wd, ht) { this.ctx.beginPath(); this.ctx.rect(x, y, wd, ht); this.ctx.clip(); }
  save() { this.ctx.save(); }
  restore() { this.ctx.restore(); }
  create() { this.ctx.save(); return this; }
  dispose() { this.ctx.restore(); }
  setSmooth(b) { this.ctx.imageSmoothingEnabled = b; }
  setFont(f) { this.font = f; this.ctx.font = f.css; }
  fontSize() { return this.font.size; }
  stringWidth(s) { this.ctx.font = this.font.css; return Math.round(this.ctx.measureText(s).width); }
  ascent() { this.ctx.font = this.font.css; const m = this.ctx.measureText("Mg"); return Math.round(m.fontBoundingBoxAscent || this.font.size * 0.9); }
  descent() { this.ctx.font = this.font.css; const m = this.ctx.measureText("Mg"); return Math.round(m.fontBoundingBoxDescent || this.font.size * 0.2); }
  drawString(s, x, y) { this.ctx.font = this.font.css; this.ctx.textBaseline = "alphabetic"; this.ctx.fillText(s, x, y); }
}
const FONT_FAMILY = '"Press Start 2P", "Courier New", monospace';
function pixelFont(size) { size = Math.round(size * 10) / 10; return { size, css: size + "px " + FONT_FAMILY, deriveFont(s) { return pixelFont(s); } }; }

// ---- images ----
const IMG = {};
const IMG_NAMES = ["MushLobby.png", "mu_sign.png", "mu_shop_bg.png", "mu_shopkeeper_sheet.png", "mu_plank.png", "mu_plank_pressed.png", "mu_back.png", "mu_tab.png", "mu_tab_active.png", "mu_plaque.png",
  "mu_golden.png", "mu_tiny.png", "mu_pinwheel.png", "mu_crow_fly.png", "mu_pets.png", "mu_mush0.png", "mu_mush1.png", "mu_mush2.png", "mu_mush3.png", "mu_mush4.png", "mu_mush5.png",
  "mu_boss.png", "mu_icons.png", "mu_species.png", "mu_cards.png", "mu_card_back.png", "mu_packs.png", "mu_fx_stars.png", "mu_fx_glow.png", "mu_fx_rays.png", "mu_fx_ring.png", "mu_fx_holo.png", "mu_form0.png", "mu_form1.png", "mu_form2.png", "mu_form3.png", "mu_asc0.png", "mu_asc1.png", "mu_asc2.png", "mu_asc3.png"];
function loadImages(onProgress) {
  let done = 0;
  return Promise.all(IMG_NAMES.map(n => new Promise(res => {
    const im = new Image();
    im.onload = () => { IMG[n] = im; onProgress && onProgress(++done / IMG_NAMES.length); res(); };
    im.onerror = () => { console.error("MISSING FILE: " + n); const c = mk(n == "MushLobby.png" ? 1470 : 64, n == "MushLobby.png" ? 956 : 64); const x = c.getContext("2d"); x.fillStyle = "#1a0f2e"; x.fillRect(0, 0, c.width, c.height); IMG[n] = c; onProgress && onProgress(++done / IMG_NAMES.length); res(); };
    im.src = n;
  })));
}

// ---- sound (WebAudio) ----
const Sound = (() => {
  let drone = null, droneV = 0, ac = null, master = null, level = 0, shopNow = false, started = false, voice = null;
  const bufs = {}, OFFSET = [0, -6, -14, 0];
  const music = { lobby: null, shop: null, intro: null };
  const DB = { lobby: -8, shop: -8, intro: -4 };
  const files = { lobby: "lobby_music.wav", shop: "shop_music.wav", intro: "intro.wav" };
  const SFX = ["pop1.wav", "pop2.wav", "pop3.wav", "cash.wav", "caw.wav", "crit.wav", "evolve.wav", "golden_appear.wav", "golden_catch.wav", "achieve.wav"];
  function db2g(db) { return Math.pow(10, db / 20); }
  function ctx() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } } return ac; }
  async function loadBuf(f) {
    if (bufs[f]) return bufs[f];
    try { const r = await fetch(f); const a = await r.arrayBuffer(); bufs[f] = await new Promise((ok, no) => ctx().decodeAudioData(a, ok, no)); } catch (e) { bufs[f] = null; }
    return bufs[f];
  }
  function mgain(key) { return level == 3 ? 0 : db2g(DB[key] + OFFSET[level]); }
  function droneApply() { if (drone && ac) drone.g.gain.setTargetAtTime(level == 3 ? 0 : droneV * 0.11 * db2g(OFFSET[level]), ac.currentTime, 0.8); }
  function applyLevel() { for (const k in music) if (music[k]) music[k].g.gain.value = mgain(k); droneApply(); }
  async function startLoop(key, loop) {
    if (!ctx()) return;
    if (music[key]) return;
    const b = await loadBuf(files[key]); if (!b) return;
    if (music[key]) return;
    const src = ac.createBufferSource(), g = ac.createGain(); src.buffer = b; src.loop = loop; g.gain.value = mgain(key);
    src.connect(g); g.connect(ac.destination); src.start(); music[key] = { src, g };
    if (!loop) src.onended = () => { if (music[key] && music[key].src === src) music[key] = null; };
  }
  function stopKey(key) { if (music[key]) { try { music[key].src.stop(); } catch (e) { } music[key] = null; } }
  return {
    unlock() { if (ctx() && ac.state === "suspended") ac.resume(); started = true; },
    load() { if (!ctx()) return; for (const f of SFX.concat(Object.values(files))) loadBuf(f); },
    level() { return level; },
    setLevel(l) { level = Math.max(0, Math.min(3, l)); applyLevel(); },
    cycle() { level = (level + 1) % 4; applyLevel(); return level; },
    sfx(file, db) { if (level == 3 || !started || !ac) return; const b = bufs[file]; if (!b) { loadBuf(file); return; } const s = ac.createBufferSource(), g = ac.createGain(); s.buffer = b; g.gain.value = db2g(db + OFFSET[level]); s.connect(g); g.connect(ac.destination); s.start(); },
    // creature mumble: ONE continuous gravelly voice for the whole line (not separate beeps).
    // Its pitch glides, its mouth shape (formants) slides vowel to vowel, consonants squeeze it shut, and it breathes.
    // low dark drone under everything (v = 0..1)
    droneSet(v) {
      if (!ctx() || !started) return;
      droneV = v;
      if (!drone) {
        const g = ac.createGain(), lp = ac.createBiquadFilter(), lfo = ac.createOscillator(), lg = ac.createGain();
        g.gain.value = 0.0001; lp.type = "lowpass"; lp.frequency.value = 260; lp.connect(g); g.connect(ac.destination);
        for (const [f, d, t] of [[55, 0, "sine"], [82.4, 5, "triangle"], [110.7, -7, "sine"], [41.2, 3, "sine"]]) { const o = ac.createOscillator(); o.type = t; o.frequency.value = f; o.detune.value = d; o.connect(lp); o.start(); }
        lfo.frequency.value = 0.09; lg.gain.value = 70; lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
        drone = { g };
      }
      droneApply();
    },
    room(on) { if (!ctx()) return; if (on) { stopKey("lobby"); stopKey("shop"); } else this.music(false); },
    thump() {
      if (level == 3 || !started || !ac || ac.state !== "running") return;
      const t0 = ac.currentTime;
      for (const [dt, a] of [[0, 1], [0.22, 0.7]]) {
        const o = ac.createOscillator(), g = ac.createGain(); o.type = "sine";
        o.frequency.setValueAtTime(70, t0 + dt); o.frequency.exponentialRampToValueAtTime(34, t0 + dt + 0.14);
        g.gain.setValueAtTime(0.0001, t0 + dt); g.gain.exponentialRampToValueAtTime(0.5 * a * db2g(OFFSET[level]), t0 + dt + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 0.2);
        o.connect(g); g.connect(ac.destination); o.start(t0 + dt); o.stop(t0 + dt + 0.22);
      }
    },
    stopVoice() {
      if (!voice) return;
      const v = voice; voice = null;
      try { v.out.gain.cancelScheduledValues(ac.currentTime); v.out.gain.setTargetAtTime(0.0001, ac.currentTime, 0.03); for (const x of v.stops) x.stop(ac.currentTime + 0.2); } catch (e) { }
    },
    speak(text, db, op) {
      if (level == 3 || !started || !ac || ac.state !== "running") return;
      this.stopVoice();
      op = op || {}; const base0 = op.f0 || 112, fs = op.fs || 1, br = op.br || 1, rough = op.rough || 1, R = Math.random, T = text.toUpperCase().slice(0, 90), step = 0.03, t0 = ac.currentTime + 0.04, end = t0 + T.length * step;
      const V = { A: [760, 1180, 2500], E: [520, 1750, 2500], I: [380, 2000, 2700], O: [500, 880, 2400], U: [360, 760, 2300], Y: [400, 1900, 2600] };
      const NASAL = [300, 1000, 2300], vol = db2g((db == null ? -13 : db) + OFFSET[level]);
      if (!ac._nz) { const n = ac.createBuffer(1, ac.sampleRate, ac.sampleRate), d = n.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = R() * 2 - 1; ac._nz = n; }
      const out = ac.createGain(); out.gain.value = 0.0001; out.connect(ac.destination);
      const src = ac.createGain(), stops = [], oscs = [];
      const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = op.vib || 5.5; lg.gain.value = 4; lfo.connect(lg); lfo.start(t0); stops.push(lfo);
      const jit = ac.createOscillator(), jg = ac.createGain(); jit.type = "sawtooth"; jit.frequency.value = 37; jg.gain.value = 5 * rough; jit.connect(jg); jit.start(t0); stops.push(jit);  // creaky roughness
      for (const det of [0, 11]) {
        const o = ac.createOscillator(); o.type = "sawtooth"; o.detune.value = det; o.frequency.value = 120;
        lg.connect(o.frequency); jg.connect(o.frequency); o.connect(src); o.start(t0); stops.push(o); oscs.push(o);
      }
      const fl = [];
      [[1.0, 7], [0.55, 9], [0.12, 5]].forEach(([gn, q]) => {
        const bp = ac.createBiquadFilter(), bg = ac.createGain(); bp.type = "bandpass"; bp.Q.value = q; bp.frequency.value = 600;
        bg.gain.value = gn * 2.4; src.connect(bp); bp.connect(bg); bg.connect(out); fl.push(bp);
      });
      const nz = ac.createBufferSource(), nb = ac.createBiquadFilter(), ng = ac.createGain(); nz.buffer = ac._nz; nz.loop = true;
      nb.type = "bandpass"; nb.frequency.value = 2200; nb.Q.value = 0.9; ng.gain.value = 0.0001; nz.connect(nb); nb.connect(ng); ng.connect(out); nz.start(t0); stops.push(nz);
      let f0 = base0 + R() * 18, wordStart = true;
      out.gain.setValueAtTime(0.0001, t0);
      for (let i = 0; i < T.length; i++) {
        const t = t0 + i * step + (R() - 0.5) * 0.008, c = T[i];
        const isV = "AEIOUY".includes(c) && c !== " ";
        if (c === " " || ",.!?'-".includes(c)) { out.gain.setTargetAtTime(vol * 0.1, t, 0.03); ng.gain.setTargetAtTime(0.0001, t, 0.02); wordStart = true; continue; }
        if (isV) {
          const fm = V[c];
          for (let k = 0; k < 3; k++) fl[k].frequency.setTargetAtTime(fm[k] * fs * (0.95 + R() * 0.1), t, 0.035);
          f0 = Math.max(base0 * 0.78, Math.min(base0 * 1.47, f0 * (wordStart ? 1.1 : (R() < 0.6 ? 0.96 : 1.05)) + (R() - 0.5) * 6)); wordStart = false;
          for (const o of oscs) o.frequency.setTargetAtTime(f0, t, 0.04);
          out.gain.setTargetAtTime(vol * (0.75 + R() * 0.35), t, 0.02); ng.gain.setTargetAtTime(0.05 * br, t, 0.02);
        } else if ("MNL".includes(c)) {                       // nasal hum
          for (let k = 0; k < 3; k++) fl[k].frequency.setTargetAtTime(NASAL[k] * fs, t, 0.03);
          out.gain.setTargetAtTime(vol * 0.55, t, 0.02); ng.gain.setTargetAtTime(0.0001, t, 0.02);
        } else if ("SFHZXCJ".includes(c)) {                   // breathy hiss
          out.gain.setTargetAtTime(vol * 0.32, t, 0.015); ng.gain.setTargetAtTime(0.5 * br, t, 0.012); ng.gain.setTargetAtTime(0.05 * br, t + 0.03, 0.02);
        } else {                                              // plosive: close the mouth, then a little pop
          out.gain.setTargetAtTime(vol * 0.06, t, 0.01); ng.gain.setTargetAtTime(0.7, t + 0.02, 0.006); ng.gain.setTargetAtTime(0.05, t + 0.045, 0.015);
          out.gain.setTargetAtTime(vol * 0.6, t + 0.04, 0.012);
        }
      }
      out.gain.setTargetAtTime(0.0001, end, 0.05);
      for (const x of stops) x.stop(end + 0.4);
      voice = { out, stops };
    },
    pop() { this.sfx("pop" + (1 + Math.floor(Math.random() * 3)) + ".wav", -4); },
    music(inShop) { shopNow = inShop; if (!started) return; stopKey(inShop ? "lobby" : "shop"); startLoop(inShop ? "shop" : "lobby", true); },
    playIntro() { if (started) { stopKey("intro"); startLoop("intro", false); } },
    stopIntro() { stopKey("intro"); }
  };
})();

// ---- setup (the old constructor) ----
function initGame() {
  bigFont = pixelFont(32); midFont = pixelFont(24); smallFont = pixelFont(16); titleFont = pixelFont(64);
  bg = IMG["MushLobby.png"]; sign = IMG["mu_sign.png"]; shopBg = IMG["mu_shop_bg.png"];
  const sheet = IMG["mu_shopkeeper_sheet.png"], fw = 468, fh = 444;
  shopFrames = []; for (let i = 0; i < Math.floor(sheet.width / fw); i++) shopFrames.push(sub(sheet, i * fw, 0, fw, fh));
  button = IMG["mu_plank.png"]; buttonPressed = IMG["mu_plank_pressed.png"]; back = IMG["mu_back.png"];
  tab = IMG["mu_tab.png"]; tabActive = IMG["mu_tab_active.png"]; golden = IMG["mu_golden.png"]; plaque = IMG["mu_plaque.png"];
  const t = IMG["mu_tiny.png"], pw = IMG["mu_pinwheel.png"], cr = IMG["mu_crow_fly.png"];
  for (let i = 0; i < 3; i++) tinyFrames[i] = sub(t, i * 45, 0, 45, 45);
  for (let i = 0; i < 4; i++) { wheelFrames[i] = sub(pw, i * 78, 0, 78, 132); crowFrames[i] = sub(cr, i * 90, 0, 90, 70); }
  poisonImg = tint(tinyFrames[0], 0.0);
  bossImg = IMG["mu_boss.png"]; bossHover = brighter(bossImg);
  const pe = IMG["mu_pets.png"];
  for (let i = 0; i < 16; i++) petFrames[i] = sub(pe, i * 80, 0, 80, 64);
  for (let i = 0; i < 6; i++) {
    stageRaw[i] = IMG["mu_mush" + i + ".png"]; introImg[i] = stageRaw[i];
    silhouette[i] = dark(stageRaw[i]); thumbImg[i] = fitBox(introImg[i]); thumbSil[i] = fitBox(silhouette[i]);
  }
  for (let i = 0; i < 4; i++) { stageRaw[6 + i] = IMG["mu_form" + i + ".png"]; stageRaw[10 + i] = IMG["mu_asc" + i + ".png"]; }
  signHover = brighter(sign); buttonHover = brighter(button); backHover = brighter(back); tabHover = brighter(tab); goldenHover = brighter(golden); plaqueHover = brighter(plaque);
  loadCardArt(); rebuildMush();
  for (let i = 0; i < 28; i++) cost[i] = baseCost[i];
  for (let i = 0; i < spx.length; i++) { spx[i] = rand.nextInt(w); spy[i] = rand.nextInt(h); spvy[i] = 1.2 + rand.nextFloat() * 1.4; }
  for (let i = 0; i < star.length; i++) { star[i][0] = rand.nextInt(w); star[i][1] = 20 + rand.nextInt(330); star[i][2] = rand.nextInt(200); }
  for (let i = 0; i < starfield.length; i++) resetStar(i, true);
  newWeather(0);
  mushBox = R(idiv(w, 2) - 330, 0, 660, 660); mushBox.y = mushY + 30;
  signY = h - GROUND_GAP - lowest(sign) - 1;
  signBox = R(40, signY, sign.width, sign.height);
  for (let i = 0; i < 5; i++) pauseBox[i] = R(idiv(w, 2) - 300, 290 + i * 100, 600, 84);
  backBox = R(1442 - back.width, 856, back.width, back.height);
  resetBox = R(560, 852, button.width, button.height);
  muteBox = R(w - 80, 20, 56, 56);
  statsBox = R(w - 80 - 20 - plaque.width, 20, plaque.width, plaque.height);
  treeBox = R(statsBox.x - 16 - plaque.width, 20, plaque.width, plaque.height);
  huntBox = R(treeBox.x - 16 - plaque.width, 20, plaque.width, plaque.height);
  huntStartBox = R(idiv(w, 2) - idiv(button.width, 2), 730, button.width, button.height);
  dealBox = R(748, 756, button.width, button.height);
  for (let i = 0; i < 12; i++) holeBox[i] = R(holeX(i) - 85, holeY(i) - 125, 170, 150);
  for (let i = 0; i < 3; i++) newQuest(i);
  for (let k = 0; k < 8; k++) thumbBox[k] = R(idiv(w, 2) + Math.trunc((k - 3.5) * 140) - 50, 668, 100, 100);
  for (let k = 0; k < 2; k++) chooseBox[k] = R(idiv(w, 2) - 440 + k * 460, 200, 420, 600);
  for (let i = 0; i < 4; i++) itemBox[i] = R(748, 320 + i * 96, button.width, button.height);
  for (let i = 0; i < 7; i++) tabBox[i] = R(748 + i * 84, 240, 84, 56);
  for (let k = 0; k < 3; k++) slotBox[k] = R(idiv(w, 2) - 660 + k * 460, 230, 420, 520);
  pauseBtn = R(w - 80, 86, 56, 56);
  bookBox = R(statsBox.x, 90, plaque.width, plaque.height);
  infoBox = R(treeBox.x, 90, plaque.width, plaque.height);
  nameBox = R(huntBox.x, 90, plaque.width, plaque.height);
  adminBox = R(huntBox.x - 176, 20, plaque.width, plaque.height);
  const spSheet = IMG["mu_species.png"];
  for (let i = 0; i < 16; i++) { spBox[i] = R(idiv(w - 1218, 2) + (i % 8) * 154, 205 + idiv(i, 8) * 220, 140, 200); const sp = sub(spSheet, i * 48, 0, 48, 48); spImg[i] = sp; spDark[i] = dark(sp); }
}

// ---- canvas, loop, input ----
let cv, g0, scl = 1, offX = 0, offY = 0, dpr = 1, started = false, accMs = 0, lastMs = 0, loadFrac = 0, loaded = false;
function fitCanvas() {
  dpr = window.devicePixelRatio || 1;
  const cw = window.innerWidth, ch = window.innerHeight;
  cv.style.width = cw + "px"; cv.style.height = ch + "px";
  cv.width = Math.round(cw * dpr); cv.height = Math.round(ch * dpr);
  scl = Math.min(cw / W, ch / H); offX = Math.trunc((cw - W * scl) / 2); offY = Math.trunc(ch - H * scl);
}
function mapPt(e) { const r = cv.getBoundingClientRect(); return { x: Math.trunc((e.clientX - r.left - offX) / scl), y: Math.trunc((e.clientY - r.top - offY) / scl) }; }
function frame(now) {
  requestAnimationFrame(frame);
  const ctx = g0.ctx;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = "#000"; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.setTransform(dpr * scl, 0, 0, dpr * scl, dpr * offX, dpr * offY);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  g0.setSmooth(false);
  if (!loaded || !started) {
    g0.setColor(C(0, 0, 0)); g0.fillRect(0, 0, W, H);
    g0.setFont(loaded ? midFont || pixelFont(24) : pixelFont(24));
    const msg = loaded ? "CLICK TO START" : "LOADING " + Math.trunc(loadFrac * 100) + "%";
    g0.setColor(C(158, 232, 118)); g0.drawString(msg, idiv(W - g0.stringWidth(msg), 2), 480);
    ctx.restore(); return;
  }
  if (!lastMs) lastMs = now;
  accMs += now - lastMs; lastMs = now; if (accMs > 200) accMs = 200;
  while (accMs >= 30) { for (let s = 0; s < (adminSpeed ? 5 : 1); s++) animate(); accMs -= 30; }
  frac = accMs / 30;
  try { paintComponent(g0); } catch (e) { console.error(e); }
  ctx.restore();
}

function press(p) {
  if (intro) {
    if (introTick < TITLE_TICK) { introTick = TITLE_TICK; whiteFlash = 12; Sound.stopIntro(); startMusic(); }
    else if (fade == 0) startGame();
    return;
  }
  if (slotScreen) {
    for (let k = 0; k < 3; k++) if (slotLines[k] != null && inR(delBox(k), p)) {
      Sound.pop();
      if (delArm == k && Date.now() - delArmAt < 4000) { try { localStorage.removeItem(saveKey(k)); } catch (e) { } delArm = -1; refreshSlots(); }
      else { delArm = k; delArmAt = Date.now(); }
      return;
    }
    for (let k = 0; k < 3; k++) if (inR(slotBox[k], p)) pickSlot(k);
    return;
  }
  if (inInbox) { if (p.x < 185 || p.x > 1285 || p.y < 90 || p.y > 870) { closeInbox(); Sound.pop(); } return; }
  if (inPotion) { potionClick(p); return; }
  if (inBulk) { bulkClick(p); return; }
  if (inPack) { packClick(p); return; }
  if (naming) return;
  if (inEnding) { leaveEnding(); return; }
  if (choosing) { for (let k = 0; k < 2; k++) if (inR(chooseBox[k], p)) chooseBranch(k); return; }
  if (choosing2) { for (let k = 0; k < 2; k++) if (inR(chooseBox[k], p)) chooseForm(k); return; }
  if (paused) {
    if (inR(pauseBox[0], p)) paused = false;
    else if (inR(pauseBox[1], p)) Sound.cycle();
    else if (inR(pauseBox[2], p)) { saveGame(); paused = false; slotScreen = true; refreshSlots(); }
    else if (inR(pauseBox[3], p)) { saveGame(); paused = false; slotScreen = true; refreshSlots(); }
    else if (inR(pauseBox[4], p)) wipeSave();
    else if (inR(pauseBtn, p)) paused = false;
    if (inR(pauseBox[0], p) || inR(pauseBox[1], p)) Sound.pop();
    return;
  }
  if (inR(pauseBtn, p)) { paused = true; Sound.pop(); }
  else if (inR(muteBox, p)) { Sound.cycle(); Sound.pop(); }
  else if (inStats) {
    if (inR(backBox, p)) { inStats = false; Sound.pop(); }
    else if (page == 2) bookClick(p);
    else if (page == 4) adminClick(p);
    else if (page == 3 && inR(aboutBox, p)) { infoAbout = !infoAbout; Sound.pop(); }
    else if ((page == 1 || page == 5) && inR(formsBtn, p)) { page = page == 1 ? 5 : 1; Sound.pop(); }
    else if (page == 5 && formsClick(p)) { }
    else if (page == 1) for (let k = 0; k < 8; k++) if (inR(thumbBox[k], p)) {
      Sound.pop();
      if (skinOwned[k]) { skin = k; rebuildMush(); }
      else showBanner(k < 4 ? "BUY THAT SKIN IN THE SKINS TAB" : "SPEND 2 MINUTES IN " + SEASON_NAME[k - 4] + " TO EARN IT", C(255, 226, 170));
    }
  } else if (inHunt) huntClick(p);
  else if (!inShop) {
    if (crowOn && inR(crowBox, p)) catchCrow();
    else if (goldenOn && inR(goldBox, p)) catchGolden();
    else if (bossOn && inR(bossBox, p)) hitBoss(p);
    else if (inR(huntBox, p)) enterHunt();
    else if (inR(nameBox, p)) openNaming();
    else if (isAdmin() && inR(adminBox, p)) { inStats = true; page = 4; Sound.pop(); }
    else if (inR(bookBox, p)) { inStats = true; page = 2; bookStory = false; Sound.pop(); }
    else if (inR(infoBox, p)) { inStats = true; page = 3; Sound.pop(); }
    else if (inR(statsBox, p)) { inStats = true; page = 0; Sound.pop(); }
    else if (inR(treeBox, p)) { inStats = true; page = 1; Sound.pop(); }
    else if (inboxBox && inR(inboxBox, p)) openInbox();
    else if (X.pUnlocked && pSignT > 20 && inR(potionSignBox, p)) enterPotion();
    else if (X.pUnlocked && beltClick(p)) { }
    else if (inR(signBox, p)) {
      inShop = true; floats.length = 0; Sound.pop(); Sound.music(inShop);
      if (pendingSay != null) { say(pendingSay); pendingSay = null; } else say(pick(SAY_GREET));
    } else if (inR(mushBox, p)) { pressedNow = true; click(p); }
  } else if (inR(qtyBox, p)) cycleBuyQty();
  else if (inR(backBox, p)) { inShop = false; Sound.pop(); Sound.music(inShop); }
  else if (inR(resetBox, p)) { pressedItem = 4; prestige(); }
  else if (inR(dealBox, p)) { pressedItem = 5; deal(); }
  else {
    for (let i = 0; i < tabBox.length; i++) if (tabShown(i) && inR(tabBox[i], p) && tab_ != i) { tab_ = i; Sound.pop(); }
    for (let i = 0; i < itemBox.length; i++) if (inR(itemBox[i], p)) { pressedItem = i; buy(tab_ * 4 + i); }
  }
  updateHover(p);
}
function keyDown(e) {
  const k = e.key, K = k.length == 1 ? k.toUpperCase() : k;
  const go = K == " " || K == "Enter" || K == "Escape";
  if (naming) { nameKey(e); return; }
  if (inInbox) { if (K == "Escape" || K == " " || K == "Enter") closeInbox(); return; }
  if (inPotion) { if (K == "Escape" || K == " ") leavePotion(); else if (K >= "1" && K <= "6") drinkPotion(+K - 1); return; }
  if (inBulk) { if (go) bulkAdvance(); return; }
  if (inPack) { if (go) packAdvance(K == "Escape"); return; }
  if (K == "M") Sound.cycle();
  else if (intro) { if (go) advanceIntro(); }
  else if (slotScreen) { if (K == "1") pickSlot(0); else if (K == "2") pickSlot(1); else if (K == "3") pickSlot(2); }
  else if (inEnding) { if (go) leaveEnding(); }
  else if (choosing) { if (K == "1") chooseBranch(0); else if (K == "2") chooseBranch(1); }
  else if (choosing2) { if (K == "1") chooseForm(0); else if (K == "2") chooseForm(1); }
  else if (!paused && !inHunt && !inShop && !inStats && K == "N") openNaming();
  else if (!paused && !inHunt && (K == "I" || K == "B")) {
    const want = K == "I" ? 3 : 2;
    if (inStats && page == want) inStats = false; else { inStats = true; page = want; }
    Sound.pop();
  } else if (inHunt && !paused && K == " ") { if (huntState == 0) startHunt(); else if (huntState == 2) leaveHunt(); }
  else if (K >= "1" && K <= "6" && X.pUnlocked && lobbyView()) drinkPotion(+K - 1);
  else if (K == " ") { if (!inShop && !inStats && !paused && !inHunt) spaceClick(); }
  else if (K == "Escape") {
    if (paused) paused = false;
    else if (inHunt) { if (huntState == 1) paused = true; else leaveHunt(); }
    else if (inStats) inStats = false;
    else if (inShop) { inShop = false; Sound.music(inShop); }
    else paused = true;
  }
}
async function boot() {
  cv = document.getElementById("game"); g0 = new G(cv.getContext("2d"));
  bigFont = pixelFont(32); midFont = pixelFont(24); smallFont = pixelFont(16); titleFont = pixelFont(64);
  fitCanvas(); window.addEventListener("resize", fitCanvas);
  requestAnimationFrame(frame);
  try { await document.fonts.load('16px "Press Start 2P"'); } catch (e) { }
  await loadImages(f => loadFrac = f);
  try { initGame(); } catch (e) { document.title = "MUSH - error"; console.error(e); const d = document.getElementById("err"); if (d) d.textContent = "COULD NOT START: " + e; return; }
  loaded = true;
  cv.addEventListener("mousedown", e => {
    e.preventDefault();
    if (!started) { started = true; Sound.unlock(); Sound.load(); if (intro) Sound.playIntro(); else { Sound.music(inShop); } return; }
    Sound.unlock(); press(mapPt(e));
  });
  window.addEventListener("wheel", e => { if (inInbox) inboxScroll = Math.max(0, Math.min(inboxMax, inboxScroll + Math.sign(e.deltaY) * 60)); }, { passive: true });
  window.addEventListener("mouseup", () => { pressedNow = false; pressedItem = -1; });
  cv.addEventListener("mousemove", e => { mousePt = mapPt(e); if (started && loaded) updateHover(mousePt); });
  cv.addEventListener("mouseleave", () => { if (started && loaded) updateHover({ x: -1, y: -1 }); });
  window.addEventListener("keydown", e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!started) { if (e.key == " " || e.key == "Enter") { started = true; Sound.unlock(); Sound.load(); if (intro) Sound.playIntro(); } e.preventDefault(); return; }
    if ([" ", "Escape", "Backspace"].includes(e.key)) e.preventDefault();
    keyDown(e);
  });
  window.addEventListener("pagehide", () => { try { if (slot >= 0) saveGame(); } catch (e) { } });
  document.addEventListener("visibilitychange", () => { if (document.hidden) { try { if (slot >= 0) saveGame(); } catch (e) { } if (!paused && !slotScreen && !intro) paused = true; } });
  if (!intro) { slotScreen = true; refreshSlots(); }
}
window.addEventListener("load", boot);
