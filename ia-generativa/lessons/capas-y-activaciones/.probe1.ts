import { makeData, lineSweep, makeNet, trainStep, evaluate, paramCount, approxError, hingesFor, hingeEval, target, AX, tentK } from './mlp';
const circ = makeData('circles'), spir = makeData('spiral');
const sw = lineSweep(circ); let best = sw[0]; for (const s of sw) if (s.acc > best.acc) best = s;
console.log('best line circles', best.acc, 'n=', circ.length);
const swS = lineSweep(spir); let bs = swS[0]; for (const s of swS) if (s.acc > bs.acc) bs = s;
console.log('best line spiral', bs.acc);
function run(data: any, hidden: number, width: number, act: any, seed: number, steps: number, marks: number[]) {
  const net = makeNet(hidden, width, act, seed); const out: string[] = [];
  for (let k = 1; k <= steps; k++) { trainStep(net, data); if (marks.includes(k)) { evaluate(net, data); out.push(`${k}:${(net.acc*100).toFixed(1)}%/${net.loss.toFixed(3)}`); } }
  return out.join('  ');
}
const M = [100, 300, 700, 1500, 3000, 6000];
const D: Record<string, [any, number, number, string, number]> = {
  intro: [circ, 1, 6, 'relu', 2], one: [circ, 0, 1, 'relu', 1], lin: [circ, 3, 6, 'linear', 2], relu6: [circ, 1, 6, 'relu', 2],
  'sh-relu': [circ, 1, 6, 'relu', 2], 'sh-tanh': [circ, 1, 6, 'tanh', 8], 'sp-1': [spir, 1, 8, 'tanh', 3], 'sp-3': [spir, 3, 8, 'tanh', 1],
};
for (const [k, [d, h, w, a, s]] of Object.entries(D)) console.log(k, h, w, a, s, '→', run(d, h, w, a, s, 1500, [100, 300, 700, 1500]));
