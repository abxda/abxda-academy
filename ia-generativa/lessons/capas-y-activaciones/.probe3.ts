import { makeData, approxError, tentK, paramCount, sizesOf, target, AX } from './mlp';
const circ = makeData('circles');
// barrido fino de rectas
let best = 0, bestA = 0;
const n = circ.length; let ones = 0; for (const q of circ) ones += q.c;
for (let k = 0; k < 7200; k++) {
  const a = (k / 7200) * Math.PI, nx = Math.cos(a), ny = Math.sin(a);
  const proj = circ.map((q) => ({ s: q.x * nx + q.y * ny, c: q.c })).sort((p, q) => p.s - q.s);
  let b1 = 0, b0 = 0;
  for (let i = 0; i <= n; i++) { const hit = Math.max(b0 + (ones - b1), b1 + (n - ones - b0)) / n; if (hit > best) { best = hit; bestA = a; } if (i < n) { if (proj[i].c) b1++; else b0++; } }
}
console.log('fine sweep best line acc', best, 'angle', bestA);
// aproximación
let prev = 0;
for (const n of [1,2,3,4,5,6,8,10,12,14,16,17,18,20,24,32,48,64]) { const e = approxError(n); console.log('n', n, 'err', e.toFixed(4), 'ratio prev/this', (prev && n%2===0 ? '' : ''), ''); }
for (const n of [3,6,12,24]) console.log('doubling', n, '->', 2*n, (approxError(n)/approxError(2*n)).toFixed(2));
const M = 0.55*1.35**2 + 0.28*2.9**2; console.log('M bound', M, 'bound n=24', (6*6*M/(8*24*24)).toFixed(4), 'n=17', (36*M/(8*17*17)).toFixed(4));
// primer n con error<0.05
for (let n = 1; n <= 40; n++) if (approxError(n) < 0.05) { console.log('first n with err<0.05:', n, approxError(n)); break; }
// tienda: tramos
for (let k = 1; k <= 6; k++) { let pieces = 1, prevSlope = NaN; const N = 1<<16; let cnt = 0; let ps = 0;
  for (let i = 0; i < N; i++) { const x0 = i/N, x1 = (i+1)/N; const s = Math.sign(Math.round((tentK(x1,k)-tentK(x0,k))*N*1e6)); if (!isNaN(prevSlope) && s !== prevSlope && s !== 0) cnt++; if (s !== 0) prevSlope = s; }
  console.log('k', k, 'peaks/valleys changes', cnt, '=> pieces', cnt + 1, 'expected', 2**k); }
console.log('params 2-8-8-8-1', paramCount(sizesOf(3, 8)), ' 2-6-1', paramCount(sizesOf(1,6)));
console.log('target range', Math.min(...Array.from({length:601},(_,i)=>target(-3+i/100))), Math.max(...Array.from({length:601},(_,i)=>target(-3+i/100))));
