// ---- story: card lore, the story of the Blight, the HOLLOW form, ending twist ----
const LORE = ["IT GREW OVER THE FIRST GRAVE AND NEVER ASKED WHOSE.", "SMALL AND POLITE. IT ONLY BITES WHEN YOU TURN AWAY.", "BREATHE ITS DUST AND DREAM OF THE ROOTS.", "IT LISTENS. IT REMEMBERS EVERY WORD YOU WHISPER.",
  "IT WRITES NAMES ON THE WIND. THEN IT ERASES THEM.", "A LOST LANTERN. FOLLOW IT AND YOU WON'T COME BACK.", "IT CLIMBS THE DEAD TREES TO GET CLOSER TO THE SKY.", "IT MELTS INTO INK BY MORNING. NO ONE MOURNS IT.",
  "BORN FROM A FIRE NO ONE LIT.", "COLD ENOUGH TO STOP A HEART. GENTLE ENOUGH TO LET IT.", "ITS LIGHT GUIDES THE DEAD HOME. SOMETIMES THE WRONG ONES.", "A FALLEN STAR THAT CHOSE TO ROT INSTEAD OF DIE.",
  "ANCIENT AND PATIENT. IT HAS OUTLIVED THREE FORESTS.", "THE DARK BETWEEN STARS, WITH A TASTE FOR SPORES.", "THE LAST WARM THING IN THE WORLD. GUARD IT.", "IT SMILES AT THE BLIGHT. THE BLIGHT LOOKS AWAY."];
const CHAPTERS = [
  { need: 4, t: "I. THE FIRST SPORE", l: ["LONG AGO THE FOREST WAS BRIGHT AND QUIET.", "THEN ONE SPORE FELL FROM A DYING SKY AND TOOK ROOT.", "IT WAS HUNGRY. IT HAS ALWAYS BEEN HUNGRY."] },
  { need: 8, t: "II. THE GROWING DARK", l: ["THE SPORE FED, AND THE TREES LEANED CLOSER.", "THE OLD ONES CALLED IT A BLESSING.", "THEY WERE WRONG. THEY WERE ALL VERY WRONG."] },
  { need: 12, t: "III. THE BLIGHT", l: ["SOMETHING ELSE WAS FEEDING TOO. SOMETHING OLDER.", "THE BLIGHT ROSE FROM THE ROOTS EVERY BLOOD MOON.", "IT WANTED WHAT THE SPORE HAD BECOME."] },
  { need: 16, t: "IV. THE TRUTH", l: ["THE BLIGHT IS NOT A MONSTER. IT IS A MEMORY.", "IT IS WHAT YOUR MUSHROOM WAS, BEFORE IT GREW.", "EVERY TIME YOU BEAT IT, YOU FEED ON IT."] }
];
let bookStory = false;
const storyBtn = R(130, 104, 250, 42), hollowBtn = R(1080, 184, 250, 38);
function drawStory(g) {
  const cream = C(255, 242, 208), gray = C(120, 110, 140);
  g.setFont(smallFont); centered(g, "FIND MORE CARDS TO LEARN THE STORY OF THE BLIGHT.", w / 2, 175, C(255, 226, 170));
  const fc = foundCount();
  for (let i = 0; i < 4; i++) {
    const c = CHAPTERS[i], y = 215 + i * 150, open = fc >= c.need;
    g.setColor(C(255, 255, 255, open ? 10 : 4)); g.fillRect(150, y - 8, w - 300, 134);
    g.setColor(open ? C(240, 150, 55) : C(70, 56, 92)); g.fillRect(150, y - 8, 4, 134);
    g.setFont(midFont); text(g, open ? c.t : "??? CHAPTER " + (i + 1), 176, y + 22, open ? C(240, 150, 55) : gray);
    g.setFont(smallFont);
    if (open) for (let k = 0; k < 3; k++) text(g, c.l[k], 176, y + 56 + k * 26, cream);
    else text(g, "FIND " + c.need + " DIFFERENT CARDS TO UNLOCK  (" + Math.min(fc, c.need) + "/" + c.need + ")", 176, y + 70, gray);
  }
}
function hollowize(src) {
  const [cv, x, d] = pixels(src), a = d.data, W = cv.width, H = cv.height, al = (px, py) => (px < 0 || py < 0 || px >= W || py >= H) ? 0 : a[(py * W + px) * 4 + 3];
  const copy = new Uint8ClampedArray(a);
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    const i = (py * W + px) * 4; if (copy[i + 3] == 0) continue;
    const gr = copy[i] * 0.3 + copy[i + 1] * 0.59 + copy[i + 2] * 0.11, hs = (px * 73856093 ^ py * 19349663) >>> 0;
    let r = gr * 0.5 + 16, g2 = gr * 0.46 + 10, b = gr * 0.6 + 30;
    const edge = al(px - 1, py) == 0 || al(px + 1, py) == 0 || al(px, py - 1) == 0 || al(px, py + 1) == 0;
    if (edge) { r = 90; g2 = 215; b = 95; }
    else if (hs % 61 == 0) { r = 150; g2 = 255; b = 120; }
    else if (hs % 89 == 0) { r = 6; g2 = 2; b = 12; }
    a[i] = r; a[i + 1] = g2; a[i + 2] = b;
  }
  x.putImageData(d, 0, 0); return cv;
}
function storyTick() {
  if (!X.hollow && (bossKills >= 5 || ended)) { X.hollow = true; showBanner("THE HOLLOW FORM AWAKENS! SEE TREE > NEW FORMS", C(158, 232, 118)); Sound.sfx("evolve.wav", -4); }
}
