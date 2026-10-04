// Comprueba CADA cifra que la voz, la escena, «por dentro», la lente y el quiz de «Capas y activaciones» afirman sobre datos propios.
//   desde app/:  npx tsx src/content/courses/ia-generativa/lessons/capas-y-activaciones/build-data.ts
// Sale con código 1 si algo no coincide. Tarda ~1 minuto (entrena redes con las mismas recetas y semillas que la escena).
//
// DATOS: los puntos (círculos y espiral) los genera mlp.ts → makeData con rng() del kit y semillas fijas (11 y 23): son siempre los
// mismos 180 puntos por conjunto, no hay datos de terceros. La curva objetivo de la aproximación es una fórmula (mlp.ts → target).
// Las redes del patio son las de mlp.ts (Adam, lote completo, tasa 0,03, mismas semillas que la escena: playground.ts → seedFor).
// Aquí las cuentas de la red 2-2-1, la recta óptima (fuerza bruta, 7 200 ángulos), la cota de interpolación y la sierra se
// recalculan con código propio, independiente de la escena; y se ejecutan con Python 3 los dos bloques de código de «por dentro».
import { execFileSync } from 'node:child_process';
import content from './content';
import { approxError, collapseLinear, evaluate, makeData, makeNet, paramCount, sizesOf, target, tentK, trainStep, AX, type Act, type Pt } from './mlp';
import { seedFor } from './playground';

let bad = 0;
const check = (what: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) bad++;
  console.log(`${ok ? '✓' : '✗'} ${what}: ${JSON.stringify(got)}${ok ? '' : `  (los textos dicen ${JSON.stringify(want)})`}`);
};
const r = (x: number, d = 3) => Math.round(x * 10 ** d) / 10 ** d;
const circles = makeData('circles'), spiral = makeData('spiral');

// ── 1. la red 2-2-1 de la lección (sin sesgos): pase hacia delante, colapso, ReLU ──
const W1 = [[1, 2], [3, -1]], W2 = [2, 1];
const net = (x: number[], act: (z: number) => number) => { const h = W1.map((row) => act(row[0] * x[0] + row[1] * x[1])); return { h, y: W2[0] * h[0] + W2[1] * h[1] }; };
const lin = (z: number) => z, rl = (z: number) => Math.max(0, z);
check('entrada (2, 1): oculta (4, 5), salida 13', [net([2, 1], lin).h, net([2, 1], lin).y], [[4, 5], 13]);
const fused = [W2[0] * W1[0][0] + W2[1] * W1[1][0], W2[0] * W1[0][1] + W2[1] * W1[1][1]];
check('pesos combinados (5, 3)', fused, [5, 3]);
check('(2, 1) y (1, 0): dos capas = una neurona', [[2, 1], [1, 0]].map((x) => [net(x, lin).y, fused[0] * x[0] + fused[1] * x[1]]), [[13, 13], [5, 5]]);
check('con ReLU y entrada (0, 1): oculta (2, −1) → (2, 0), salida 4 (sin ReLU, 3)', [net([0, 1], lin).h, net([0, 1], rl).h, net([0, 1], rl).y, net([0, 1], lin).y], [[2, -1], [2, 0], 4, 3]);
check('quiz 3: sumas 2 y −1, pesos 2 y 1 → 4 con ReLU, 3 sin ella', [2 * rl(2) + 1 * rl(-1), 2 * 2 + 1 * -1], [4, 3]);

// ── 2. la mejor recta sobre los círculos (fuerza bruta, independiente de lineSweep) ──
{
  let best = 0; const n = circles.length, ones = circles.filter((p) => p.c === 1).length;
  for (let k = 0; k < 7200; k++) {
    const a = (k / 7200) * Math.PI, c = Math.cos(a), s = Math.sin(a);
    const pr = circles.map((p) => ({ v: p.x * c + p.y * s, c: p.c })).sort((p, q) => p.v - q.v);
    let b1 = 0, b0 = 0;
    for (let i = 0; i <= n; i++) { best = Math.max(best, (b0 + ones - b1) / n, (b1 + n - ones - b0) / n); if (i < n) { if (pr[i].c) b1++; else b0++; } }
  }
  check('plane / pg-one: la mejor recta acierta 70 % de 180 puntos', [Math.round(best * 100), n], [70, 180]);
}

// ── 3. las demos del patio (mismas recetas que playground.ts → DEMOS), 1 500 pasos ──
function train(data: Pt[], hidden: number, width: number, act: Act, seed: number, steps: number) {
  const nt = makeNet(hidden, width, act, seed); for (let i = 0; i < steps; i++) trainStep(nt, data); evaluate(nt, data); return nt;
}
const one = train(circles, 0, 1, 'relu', 1, 1500), lw = train(circles, 3, 6, 'linear', 2, 1500), r6 = train(circles, 1, 6, 'relu', 2, 1500);
const shT = train(circles, 1, 6, 'tanh', 8, 1500), sp1 = train(spiral, 1, 8, 'tanh', 3, 1500), sp3 = train(spiral, 3, 8, 'tanh', 1, 1500);
check('pg-one: una neurona se queda en poco más de la mitad (52 %), pérdida 0,69', [Math.round(one.acc * 100), r(one.loss, 2)], [52, 0.69]);
check('pg-linear: tres capas lineales, mismo 52 %', Math.round(lw.acc * 100), 52);
const f1 = collapseLinear(one), f3 = collapseLinear(lw);
check('pg-linear: la neurona equivalente coincide con la de pg-one (|Δw|, |Δb| < 0,02)', [0, 1, 2].every((i) => Math.abs(f1[i] - f3[i]) < 0.02), true);
check('pg-relu: ReLU 1×6 → 100 % (voz: «casi el cien por ciento»), 25 parámetros', [Math.round(r6.acc * 100), paramCount(r6.sizes)], [100, 25]);
check('shapes: tanh 1×6 → 100 %', Math.round(shT.acc * 100), 100);
check('spiral-intro: 1×8 tanh → 78 % («cerca del ochenta»); 3×8 → 100 %', [Math.round(sp1.acc * 100), Math.round(sp3.acc * 100)], [78, 100]);
check('parámetros: 2-8-8-8-1 = 177, 3×6 lineal = 109', [paramCount(sizesOf(3, 8)), paramCount(sizesOf(3, 6))], [177, 109]);

// ── 4. los gates se pueden completar (y no son triviales): mejor exactitud en ≤ 6 000 pasos, con las semillas de la escena ──
function best(g: 'B' | 'C', hidden: number, width: number, act: Act, bump = 0) {
  const data = g === 'B' ? circles : spiral, goal = g === 'B' ? 0.95 : 0.9, nt = makeNet(hidden, width, act, seedFor(g, hidden, width, act, bump));
  let mx = 0, hit = -1;
  for (let k = 1; k <= 6000 && hit < 0; k++) { trainStep(nt, data); if (k % 5 === 0) { evaluate(nt, data); mx = Math.max(mx, nt.acc); if (k >= 12 && nt.acc >= goal) hit = k; } }
  return { hit, mx: r(mx, 2) };
}
const B = (h: number, w: number, a: Act) => best('B', h, w, a), C = (h: number, w: number, a: Act) => best('C', h, w, a);
check('gate circles: salida por defecto (1×2 lineal) no llega: máx < 0,75', B(1, 2, 'linear').mx < 0.75, true);
check('gate circles: lineal 4×8 tampoco (máx < 0,75)', B(4, 8, 'linear').mx < 0.75, true);
check('gate circles: ReLU 1×2 no llega (máx < 0,95)', B(1, 2, 'relu').hit < 0, true);
check('gate circles: ReLU 1×6, tanh 1×4 y sigmoide 1×4 llegan', [B(1, 6, 'relu').hit > 0, B(1, 4, 'tanh').hit > 0, B(1, 4, 'sigmoid').hit > 0], [true, true, true]);
check('gate spiral: salida por defecto (1×8 tanh) no llega: máx < 0,85', C(1, 8, 'tanh').mx < 0.85, true);
check('gate spiral: lineal 3×8 no llega (máx < 0,65)', C(3, 8, 'linear').mx < 0.65, true);
check('gate spiral: tanh 3×8 llega', C(3, 8, 'tanh').hit > 0, true);
console.log('  (tabla completa de configuraciones: ver docs/v2/verificacion/capas-y-activaciones.md)');

// ── 5. aproximación con esquinas ReLU ──
const errs = Array.from({ length: 49 }, (_, n) => (n ? approxError(n) : NaN));
const first = errs.findIndex((e, n) => n > 0 && e < 0.05);
check('try1: el primer n con error máximo < 0,05 es 17 (0,047; con 16, 0,057)', [first, r(errs[17]), r(errs[16])], [17, 0.047, 0.057]);
check('error con 3 y con 24 neuronas (0,742 y 0,025)', [r(errs[3]), r(errs[24])], [0.742, 0.025]);
const M = 0.55 * 1.35 ** 2 + 0.28 * 2.9 ** 2;     // |f''| ≤ 0,55·1,35² + 0,28·2,9²
check('cota (b−a)²M/(8n²): M ≤ 3,36; con n = 24 vale 0,026 y el error medido (0,025) no la supera', [r(M, 2), r(36 * M / (8 * 24 * 24)), errs[24] <= 36 * M / (8 * 24 * 24)], [3.36, 0.026, true]);
check('razones de error al duplicar: 3→6, 6→12, 12→24, 24→48 (2,5; 3,0; 4,1; 3,8)', [3, 6, 12, 24].map((n) => r(errs[n] / errs[2 * n], 1)), [2.5, 3.0, 4.1, 3.8]);
const up: string[] = []; for (let n = 2; n <= 24; n++) if (errs[n] > errs[n - 1]) up.push(`${n - 1}→${n}`);
check('el error sube (no baja) solo en 1→2, 4→5 y 7→8', up, ['1→2', '4→5', '7→8']);
// el modelo f̂ de la fórmula de «por dentro» coincide con el de mlp.ts: se evalúa la fórmula con pendientes propias
{
  const nn = 12, h = (AX[1] - AX[0]) / nn, s = (k: number) => (k < 0 ? 0 : (target(AX[0] + (k + 1) * h) - target(AX[0] + k * h)) / h);
  const fhat = (x: number) => target(AX[0]) + Array.from({ length: nn }, (_, k) => (s(k) - s(k - 1)) * Math.max(0, x - (AX[0] + k * h))).reduce((a, b) => a + b, 0);
  let e = 0; for (let i = 0; i <= 600; i++) { const x = AX[0] + ((AX[1] - AX[0]) * i) / 600; e = Math.max(e, Math.abs(fhat(x) - target(x))); }
  check('fórmula de «por dentro» con n = 12: error máximo = approxError(12) (0,101)', [r(e), r(approxError(12))], [0.101, 0.101]);
}

// ── 6. la sierra: 2^k tramos, 2k neuronas; una capa necesita ≥ 2^k − 1 ──
for (const k of [1, 2, 3, 4, 5, 6]) {
  const N = 1 << 14; let changes = 0, prev = 0;
  for (let i = 0; i < N; i++) { const d = tentK((i + 1) / N, k) - tentK(i / N, k), sg = Math.abs(d) < 1e-12 ? 0 : Math.sign(d); if (sg !== 0) { if (prev !== 0 && sg !== prev) changes++; prev = sg; } }
  if (k === 5) check('depth-cost: con 5 capas hay 32 tramos con 10 neuronas; una capa necesita al menos 31', [changes + 1, 2 * k, 2 ** k - 1], [32, 10, 31]);
  else check(`sierra k = ${k}: 2^k = ${2 ** k} tramos`, changes + 1, 2 ** k);
}

// ── 7. el código de «por dentro» (es y en) se ejecuta con Python 3 y da lo que dice ──
for (const lang of ['es', 'en'] as const) {
  const md = content.deeper[lang].replace(/\\`/g, '`');
  const blocks = [...md.matchAll(/```python\n([\s\S]*?)```/g)].map((m) => m[1]), expected = /```text\n([\s\S]*?)```/.exec(md)?.[1].trim().split('\n') ?? [];
  const out1 = execFileSync('python3', ['-c', blocks[0]], { encoding: 'utf8' }).trim().split('\n');
  check(`python 1 (${lang}): salida = «salida esperada»`, out1, expected);
  const out2 = execFileSync('python3', ['-c', blocks[1]], { encoding: 'utf8' }).trim();
  check(`python 2 (${lang}): círculos con 6 neuronas`, out2, lang === 'es' ? 'aciertos: 1.0' : 'accuracy: 1.0');
}

console.log(bad ? `\n${bad} cifra(s) no coinciden` : '\nTodo coincide.');
process.exit(bad ? 1 : 0);
