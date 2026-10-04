import { makeData, makeNet, trainStep, evaluate } from './mlp';
const ACTS = ['linear','relu','tanh','sigmoid'] as const;
const seedFor = (g: 'B'|'C', hidden: number, width: number, act: string, bump: number) => (g === 'B' ? 1000 : 2000) + hidden * 97 + width * 13 + ACTS.indexOf(act as any) * 7 + bump * 1009;
const circ = makeData('circles'), spir = makeData('spiral');
function first(g: 'B'|'C', hidden: number, width: number, act: any, bump: number) {
  const data = g === 'B' ? circ : spir, goal = g === 'B' ? 0.95 : 0.9;
  const net = makeNet(hidden, width, act, seedFor(g, hidden, width, act, bump));
  let hit = -1, mx = 0;
  for (let k = 1; k <= 6000; k++) { trainStep(net, data); if (k % 5 === 0 || k < 40) { evaluate(net, data); mx = Math.max(mx, net.acc); if (hit < 0 && k >= 12 && net.acc >= goal) { hit = k; break; } } }
  evaluate(net, data);
  return { hit, fin: net.acc, mx };
}
const g = (process.argv[2] ?? 'B') as 'B'|'C';
const bumps = [0, 1, 2];
for (const act of ACTS) {
  console.log(`== gate ${g} act=${act}`);
  for (let h = 0; h <= 4; h++) {
    if (h === 0 && act !== 'relu') continue;
    const row: string[] = [];
    for (let w = 1; w <= 8; w++) {
      if (h === 0 && w > 1) break;
      const r = bumps.map((b) => first(g, h, w, act, b));
      row.push(`w${w}:` + r.map((x) => (x.hit >= 0 ? `✓${x.hit}` : `${(x.mx*100).toFixed(0)}`)).join('/'));
    }
    console.log(`  layers=${h}  ` + row.join('  '));
  }
}
