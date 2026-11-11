function newQuest(i) {
  let k, dup;
  qGoal[i] = 0;
  do { k = rand.nextInt(7); dup = false; for (let j = 0; j < 3; j++) if (j != i && qKind[j] == k) dup = true; } while (dup);
  qKind[i] = k; qStart[i] = qNow(k);
  switch (k) {
    case 0: qGoal[i] = 60 + rand.nextInt(90); break;
    case 1: qGoal[i] = 3 + rand.nextInt(4); break;
    case 2: qGoal[i] = 1 + rand.nextInt(2); break;
    case 3: qGoal[i] = 1; break;
    case 4: qGoal[i] = Math.max(1000, secGain() * 150 + clickGain() * 80); break;
    case 5: qGoal[i] = 3 + rand.nextInt(4); break;
    default: qGoal[i] = 20 + rand.nextInt(25); break;
  }
}
function checkQuests() {
  for (let i = 0; i < 3; i++)
    if (qKind[i] >= 0 && qNow(qKind[i]) - qStart[i] >= qGoal[i]) {
      const reward = Math.max(60, secGain() * 30 + idiv(count, 40) + clickGain() * 50);
      questsDone++;
      if (rand.nextInt(100) < 5) findSpecies(1);
      earn(reward);
      Sound.sfx("achieve.wav", -3);
      showBanner("GOAL DONE! +" + fmt(reward), C(255, 226, 120));
      newQuest(i);
    }
}
function price(i) { return (i == dealItem && dealLeft > 0) ? Math.max(1, idiv(cost[i], 2)) : cost[i]; }
function deal() {
  Sound.pop();
  if (dealLeft > 0) { say("THE " + itemName[dealItem] + " DEAL IS STILL ON!"); return; }
  if (dealCool > 0) { say("NEW DEAL IN " + mmss(dealCool) + ", FRIEND."); return; }
  const list = [];
  for (let i = 0; i < 8; i++) if (unlocked(i)) list.push(i);
  dealItem = list[rand.nextInt(list.length)];
  dealLeft = 3000; dealCool = 6000;
  Sound.sfx("cash.wav", -2);
  say(itemName[dealItem] + " IS HALF PRICE FOR 90 SECONDS!");
}
function hitBoss(p) { floats.push(new FloatText(p.x - 40, p.y - 20, "HIT!", C(160, 230, 110))); damageBoss(1); }
function damageBoss(d) {
  if (!bossOn) return;
  bossHp -= d; bossHit = 5;
  if (bossHp > 0) return;
  bossOn = false; bossKills++;
  if (rand.nextInt(100) < 8) givePack(2);
  if (rand.nextInt(100) < 25) givePack(1);
  nextBoss = 8000 + rand.nextInt(4000);
  const reward = Math.max(1500, secGain() * 240 + idiv(count, 10));
  earn(reward);
  Sound.sfx("evolve.wav", -4);
  burst(bossBox.x + 120, bossBox.y + 140, 50, 6, C(143, 209, 106));
  burst(bossBox.x + 120, bossBox.y + 140, 30, 6, C(255, 226, 120));
  showBanner("THE BLIGHT IS GONE! +" + fmt(reward), C(160, 230, 110));
  pendingSay = "YOU BEAT THE BLIGHT! CAW CAW!";
}
function drawBoss(g) {
  const dx = bossHit > 0 ? (bossHit % 2 == 0 ? 5 : -5) : 0, dy = Math.trunc(Math.sin(tick * 0.1) * 5);
  g.drawImage(hoverBoss && bossHit == 0 ? bossHover : bossImg, bossBox.x + dx, bossBox.y + dy);
  const bx = bossBox.x, by = bossBox.y - 26;
  g.setColor(C(13, 5, 24)); g.fillRect(bx - 4, by - 4, 248, 26);
  g.setColor(C(70, 24, 24)); g.fillRect(bx, by, 240, 18);
  g.setColor(C(143, 209, 106)); g.fillRect(bx, by, Math.trunc(240.0 * Math.max(0, bossHp) / Math.max(1, bossMax)), 18);
  g.setFont(smallFont);
  text(g, "THE BLIGHT  " + (idiv(bossLife * 30, 1000) + 1) + "S", bx, by - 18, C(200, 240, 160));
}
