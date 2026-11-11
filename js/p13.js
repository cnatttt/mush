// ---- inbox: update notes. ADD NEW UPDATES AT THE TOP OF THIS LIST (bigger id = newer) ----
const INBOX = [
  { id: 14, date: "NOV 10", title: "SPORE PERKS LEVEL UP", lines: ["THE 4 SPORE PERKS CAN NOW BE BOUGHT OVER AND OVER.", "EACH LEVEL MAKES THEM STRONGER BUT COSTS MORE SPORES.", "HEAD START +10 FARMS, DEEP ROOTS +25%,", "SPORE LUCK +3% CRIT (MAX 30%), GOLD ROOTS +1X LONGER."] },
  { id: 13, date: "NOV 10", title: "THE BLIGHT COMES SOONER", lines: ["THE BOSS NOW SHOWS UP ABOUT EVERY 3 TO 4 MINUTES,", "AND THE FIRST ONE COMES AFTER ABOUT 2 MINUTES.", "IT ONLY APPEARS WHEN YOU ARE LOOKING AT THE LOBBY,", "AND ITS TIMER WAITS WHILE YOU ARE IN THE SHOP."] },
  { id: 12, date: "NOV 10", title: "BUY MORE AT ONCE", lines: ["THE SHOP HAS A BUY AMOUNT BUTTON AT THE BOTTOM LEFT.", "CLICK IT TO SWITCH BETWEEN X1, X10, X100 AND MAX.", "TOOLS AND FARMS BUY THAT MANY AT ONCE."] },
  { id: 11, date: "NOV 10", title: "NEW ENDING", lines: ["THE 1T ENDING IS GONE. FORMS UNLOCK ONE AT A TIME:", "300M, 2B, 20B AND 100B. COLLECT ALL 4 OF YOUR TREE", "AND THE GAME ENDS. TEXT NOW FITS INSIDE ITS BOXES."] },
  { id: 10, date: "NOV 10", title: "COLLECT ALL FORMS, WEAR ANY", lines: ["ALL 8 NEW FORMS ARE NOW EARNED, NOT PICKED:", "4 NEW FORMS AT 300M AND 4 ASCENDED AT 20B.", "OPEN THE TREE, PRESS NEW FORMS, AND CLICK ANY", "UNLOCKED FORM TO WEAR IT. THE WORN FORM GIVES THE BONUS."] },
  { id: 9, date: "NOV 10", title: "TREE SHOWS NEW FORMS", lines: ["THE TREE HAS A NEW FORMS BUTTON WITH ALL 8 NEW", "MUSHROOMS. SKIN COLORS NOW WORK ON THEM TOO."] },
  { id: 8, date: "NOV 10", title: "NEW FORMS AND A CLEAR GOAL", lines: ["AFTER YOUR FINAL FORM THERE ARE TWO MORE EVOLUTIONS:", "AT 300M PICK 1 OF 2 NEW FORMS, AT 20B IT ASCENDS.", "8 NEW MUSHROOMS IN ALL. THE LEFT SIDE NOW ALWAYS", "SHOWS YOUR NEXT GOAL."] },
  { id: 7, date: "NOV 10", title: "FLYING PETS ROAM FREE", lines: ["THE PETS+ NOW FLY AROUND THE WHOLE LOBBY", "INSTEAD OF COVERING YOUR STUFF AT THE SIGN."] },
  { id: 6, date: "NOV 10", title: "PACK PRICE FIX", lines: ["BUYING A BASIC PACK NO LONGER GETS MORE EXPENSIVE", "DURING A FRENZY. THE PRICE ONLY GROWS WITH YOUR FARMS."] },
  { id: 5, date: "NOV 10", title: "NEW LOBBY BACKGROUND", lines: ["THE LOBBY NOW HAS THE MOONLIT MUSHROOM FOREST", "WITH THE WATERFALL."] },
  { id: 4, date: "NOV 10", title: "TREE SKINS FIXED", lines: ["THE SKINS UNDER THE MUSHROOM TREE SHOW AGAIN."] },
  { id: 3, date: "NOV 10", title: "MUSH IS NOW A WEBSITE", lines: ["YOU CAN PLAY IN YOUR BROWSER. SAVES STAY IN THIS", "BROWSER, SO USE THE SAME ONE TO KEEP YOUR GAME."] },
  { id: 2, date: "NOV 9", title: "SAVES, BIO AND HARDER PACKS", lines: ["DELETE A SAVE SLOT AND IT GOES BACK TO BLANK.", "EACH SLOT KEEPS ITS OWN MUSHROOM NAME.", "CARD PACKS AND HOLOS ARE MUCH HARDER TO GET.", "NEW: ABOUT THE DEVELOPER PAGE IN INFO."] },
  { id: 1, date: "NOV 9", title: "SHOP PICTURES", lines: ["EVERY SHOP ITEM HAS ITS OWN PICTURE, AND THE", "STUFF YOU BUY GROWS BELOW YOUR MUSHROOM."] }
];
let inboxMax = 0, inboxScroll = 0, inInbox = false, inboxBox = null, mousePt = { x: -1, y: -1 };
function inboxSeen() { try { return parseInt(localStorage.getItem("mush_inbox_seen") || "0") || 0; } catch (e) { return 0; } }
function inboxUnread() { const s = inboxSeen(); let n = 0; for (const e of INBOX) if (e.id > s) n++; return n; }
function openInbox() { inInbox = true; inboxScroll = 0; Sound.pop(); }
function closeInbox() { inInbox = false; try { localStorage.setItem("mush_inbox_seen", String(Math.max(...INBOX.map(e => e.id)))); } catch (e) { } }
function drawInboxBtn(g) {
  if (!inboxBox) inboxBox = R(w - 80, h - 150, 56, 56);
  const r = inboxBox, hv = inR(r, mousePt), cream = C(255, 242, 208), n = inboxUnread();
  g.setColor(cream); g.fillRect(r.x, r.y - (hv ? 3 : 0), 56, 56);
  g.setColor(C(13, 5, 24)); g.fillRect(r.x + 4, r.y + 4 - (hv ? 3 : 0), 48, 48);
  const y0 = r.y - (hv ? 3 : 0);
  g.setColor(hv ? C(127, 245, 232) : cream); g.fillRect(r.x + 10, y0 + 16, 36, 26);
  g.setColor(C(13, 5, 24)); g.fillRect(r.x + 13, y0 + 19, 30, 20);
  g.setColor(hv ? C(127, 245, 232) : cream);
  for (let i = 0; i < 14; i++) g.fillRect(r.x + 13 + i * 2, y0 + 19 + Math.min(i, 13 - i) * 1, 4, 3);
  if (n > 0) {
    g.setColor(C(13, 5, 24)); g.fillRect(r.x + 32, y0 - 10, 30, 28);
    g.setColor(C(255, 80, 80)); g.fillRect(r.x + 35, y0 - 7, 24, 22);
    g.setFont(smallFont); centered(g, "" + n, r.x + 47, y0 + 4, cream);
  }
}
function drawInbox(g) {
  const cream = C(255, 242, 208), gold = C(242, 193, 78), cyan = C(127, 245, 232), seen = inboxSeen();
  g.setColor(C(6, 3, 16, 200)); g.fillRect(0, 0, w, h);
  panel(g, 185, 90, 1100, 780);
  g.setFont(bigFont); centered(g, "INBOX", idiv(w, 2), 150, cream);
  g.setFont(smallFont); centered(g, "WHAT'S NEW IN MUSH", idiv(w, 2), 190, C(255, 226, 170));
  let y = 235 - inboxScroll;
  g.save(); g.clipRect(190, 215, 1090, 600);
  for (const e of INBOX) {
    const fresh = e.id > seen;
    g.setFont(midFont); text(g, e.title, 225, y, fresh ? cyan : gold);
    g.setFont(smallFont); text(g, (fresh ? "NEW  " : "") + e.date, 1250 - g.stringWidth((fresh ? "NEW  " : "") + e.date), y, fresh ? C(255, 120, 120) : C(150, 140, 160));
    for (let i = 0; i < e.lines.length; i++) text(g, e.lines[i], 225, y + 34 + i * 24, cream);
    y += 34 + e.lines.length * 24 + 34;
  }
  g.restore();
  inboxMax = Math.max(0, y + inboxScroll - 800);
  g.setFont(smallFont); centered(g, (inboxMax > 0 ? "SCROLL FOR MORE.  " : "") + "CLICK OUTSIDE OR PRESS ESC TO CLOSE", idiv(w, 2), 850, C(150, 140, 170));
}
