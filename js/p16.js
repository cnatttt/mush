// ---- buy more than one at a time ----
const BUY_QTY = [0, 1, 10, 100], BUY_LABEL = ["MAX", "X1", "X10", "X100"];
let buyQty = 1; const qtyBox = R(40, 892, 330, 48);
function cycleBuyQty() { buyQty = (buyQty + 1) % 4; Sound.pop(); }
// what buying n of item i would cost and how many you can really afford (n = 0 means MAX)
function bulk(i, n) {
  const lim = n == 0 ? 1000 : n; let c = cost[i], total = 0, k = 0, totalAll = 0;
  const sale = i == dealItem && dealLeft > 0;
  for (let j = 0; j < lim; j++) {
    const pr = sale ? Math.max(1, idiv(c, 2)) : c;
    if (total + pr <= count) { total += pr; k++; }
    else if (n != 0) { /* keep adding up the full price below */ }
    totalAll += pr; c += Math.max(1, idiv(c * 2, 5));
    if (n == 0 && k == j) break;
  }
  return { k, total, totalAll };
}
function drawQtyBtn(g) {
  const hv = inR(qtyBox, mousePt), gold = C(242, 193, 78);
  g.setColor(hv ? C(127, 245, 232) : gold); g.fillRect(qtyBox.x, qtyBox.y, qtyBox.width, qtyBox.height);
  g.setColor(C(22, 11, 38)); g.fillRect(qtyBox.x + 4, qtyBox.y + 4, qtyBox.width - 8, qtyBox.height - 8);
  g.setFont(smallFont);
  fitText(g, "BUY AMOUNT: " + BUY_LABEL[buyQty], qtyBox.x + idiv(qtyBox.width, 2), qtyBox.y + 25, qtyBox.width - 20, hv ? C(127, 245, 232) : C(255, 242, 208));
}
