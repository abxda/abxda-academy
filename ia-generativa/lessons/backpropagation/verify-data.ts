// Verificación independiente de los números de la lección «Retropropagación».
//   npx tsx src/content/courses/ia-generativa/lessons/backpropagation/verify-data.ts      (desde app/)
// No importa math.ts para calcular lo que comprueba: reimplementa la red con otra forma (vectores y matrices,
// derivadas centrales) y compara con lo que la escena muestra. Sale con código 1 si algo no coincide.
import { spawnSync } from 'node:child_process';
import { W0, backward, clampW, forward, numGrad, stepW } from './math';
import lesson from './content';

let bad = 0;
const ok = (label: string, cond: boolean, extra = '') => { if (!cond) bad++; console.log((cond ? '  ok  ' : ' FALLA ') + label + (extra ? '  → ' + extra : '')); };
const r3 = (v: number) => Number(v.toFixed(3));
const same3 = (a: number, b: number) => Math.abs(a - b) < 5e-4 + 1e-12 && r3(a) === r3(b);

// ── 1 · implementación independiente: vectores y matrices ────────────────────────────────────────
const sig = (z: number) => 1 / (1 + Math.exp(-z));
const X = [1, 0.5], T = 1;
const mat = (w: number[]) => ({ W1: [[w[0], w[1]], [w[2], w[3]]], W2: [[w[4], w[5]]] });
const fwd2 = (w: number[]) => {
  const { W1, W2 } = mat(w);
  const z1 = W1.map((row) => row[0] * X[0] + row[1] * X[1]), a1 = z1.map(sig);
  const z2 = W2[0][0] * a1[0] + W2[0][1] * a1[1], y = sig(z2);
  return { z1, a1, z2, y, L: 0.5 * (y - T) ** 2 };
};
// retropropagación en forma de matriz: δ(l) = (W(l+1)ᵀ δ(l+1)) ⊙ σ'(z(l))
const grad2 = (w: number[]) => {
  const { W2 } = mat(w), f = fwd2(w);
  const d2 = (f.y - T) * f.y * (1 - f.y);                       // δ de la salida
  const d1 = [W2[0][0] * d2 * f.a1[0] * (1 - f.a1[0]), W2[0][1] * d2 * f.a1[1] * (1 - f.a1[1])];
  return [d1[0] * X[0], d1[0] * X[1], d1[1] * X[0], d1[1] * X[1], d2 * f.a1[0], d2 * f.a1[1]];
};
const central = (w: number[], k: number, e = 1e-6) => { const p = w.slice(), m = w.slice(); p[k] += e; m[k] -= e; return (fwd2(p).L - fwd2(m).L) / (2 * e); };

console.log('1 · red 2-2-1: pase hacia delante y gradiente');
const F = forward(W0), B = backward(W0, F), f2 = fwd2(W0), g2 = grad2(W0);
ok('ŷ coincide con la implementación matricial', Math.abs(F.y - f2.y) < 1e-12, `ŷ = ${F.y.toFixed(5)}`);
ok('L coincide', Math.abs(F.L - f2.L) < 1e-12, `L = ${F.L.toFixed(5)}`);
ok('gradiente (math.ts) = gradiente matricial', B.g.every((v, k) => Math.abs(v - g2[k]) < 1e-12), B.g.map((v) => v.toFixed(5)).join(' '));
ok('gradiente = diferencias centrales (eps 1e-6), error < 1e-8', B.g.every((v, k) => Math.abs(v - central(W0, k)) < 1e-8));
ok('tanteo hacia delante (eps 1e-4, como la escena) coincide a 3 decimales', B.g.every((v, k) => same3(v, numGrad(W0, k))), W0.map((_, k) => numGrad(W0, k).toFixed(4)).join(' '));
// en otros puntos de la red también (el gate mueve los pesos)
let worst = 0;
for (let n = 0; n < 2000; n++) {
  const w = W0.map((_, i) => clampW(Math.sin(n * 12.9898 + i * 78.233) * 2.5));
  const b = backward(w);
  b.g.forEach((v, k) => { worst = Math.max(worst, Math.abs(v - central(w, k))); });
}
ok('gradiente = diferencias centrales en 2000 puntos de pesos en [−2.5, 2.5]', worst < 1e-7, `error máximo ${worst.toExponential(2)}`);

// ── 2 · cada línea de la escena se puede repetir a mano con las cifras redondeadas a 3 decimales ─────
console.log('2 · cuentas mostradas con 3 decimales, repetidas con las cifras ya redondeadas');
const z1 = [0.6 * 1 + -0.3 * 0.5, 0.7 * 1 + 0.5 * 0.5];
ok('z₁ = 0.450, z₂ = 0.950', same3(z1[0], 0.45) && same3(z1[1], 0.95));
const a1r = [r3(sig(r3(z1[0]))), r3(sig(r3(z1[1])))];
ok('a₁ = 0.611, a₂ = 0.721', a1r[0] === 0.611 && a1r[1] === 0.721, a1r.join(' '));
const zr = r3(0.8 * a1r[0] + -0.9 * a1r[1]);
ok('z = 0.8·0.611 + (−0.9)·0.721 = −0.160 (igual que exacto)', zr === r3(F.z) && zr === -0.16, `${zr}`);
const yr = r3(sig(zr));
ok('ŷ = σ(−0.160) = 0.460', yr === r3(F.y) && yr === 0.46, `${yr}`);
const Lr = r3(0.5 * (yr - 1) ** 2);
ok('L = ½·(0.460 − 1.0)² = 0.146', Lr === r3(F.L) && Lr === 0.146, `${Lr}`);
const eYr = r3(yr - 1), spYr = r3(yr * (1 - yr)), dYr = r3(eYr * spYr);
ok('ŷ − t = −0.540; σ′ = 0.248; δ_y = −0.540·0.248 = −0.134', eYr === -0.54 && spYr === 0.248 && dYr === -0.134 && dYr === r3(B.dY), `${eYr} ${spYr} ${dYr}`);
const sp1r = r3(a1r[0] * (1 - a1r[0])), sp2r = r3(a1r[1] * (1 - a1r[1]));
ok('pendientes ocultas 0.238 y 0.201', sp1r === 0.238 && sp2r === 0.201, `${sp1r} ${sp2r}`);
const d1r = r3(dYr * 0.8 * sp1r), d2r = r3(dYr * -0.9 * sp2r);
ok('δ₁ = −0.134·0.8·0.238 = −0.026 y δ₂ = −0.134·(−0.9)·0.201 = +0.024 (iguales al exacto)', d1r === -0.026 && d2r === 0.024 && d1r === r3(B.d1) && d2r === r3(B.d2), `${d1r} ${d2r}`);
const gr = [r3(d1r * 1), r3(d1r * 0.5), r3(d2r * 1), r3(d2r * 0.5), r3(dYr * a1r[0]), r3(dYr * a1r[1])];
ok('seis culpas con cifras redondeadas = culpas exactas a 3 decimales', gr.every((v, k) => v === r3(B.g[k])), gr.join(' '));
ok('valores de la tabla: −0.026 −0.013 +0.024 +0.012 −0.082 −0.097', gr.join(' ') === [-0.026, -0.013, 0.024, 0.012, -0.082, -0.097].join(' '));
const W1 = stepW(W0, B.g, 1), F1 = forward(W1);
ok('nuevos pesos (η = 1) = w − culpa redondeada, a 3 decimales', W0.every((w, k) => r3(w - gr[k]) === r3(W1[k])), W1.map(r3).join(' '));
ok('tras un paso: ŷ = 0.493 y L = 0.129 (de 0.146)', r3(F1.y) === 0.493 && r3(F1.L) === 0.129, `ŷ ${F1.y.toFixed(4)}  L ${F1.L.toFixed(4)}`);
ok('la culpa de w₆ tiene el signo contrario al de w₅·… y δ₂ > 0 porque w₆ < 0', B.d2 > 0 && B.d1 < 0 && W0[5] < 0);

// ── 3 · entrenar: la pérdida baja en cada paso para cualquier η de los controles ───────────────────
console.log('3 · el entrenamiento del turno 2 (η de 0.1 a 5.0, 300 pasos, pesos acotados a ±2.5)');
let worstUp = 0, minAfter5 = 0;
for (let e = 1; e <= 50; e++) {
  const eta = e / 10;
  for (const w0 of [W0, W1]) {
    let w = w0.slice(), L = forward(w).L; const L0 = L;
    for (let s = 1; s <= 300; s++) {
      w = stepW(w, backward(w).g, eta);
      const L2 = forward(w).L; worstUp = Math.max(worstUp, L2 - L); L = L2;
      if (s === 5) minAfter5 = Math.max(minAfter5, L2 / L0);
    }
  }
}
ok('la pérdida nunca sube de un paso al siguiente (≤ 1e-12)', worstUp <= 1e-12, `mayor subida ${worstUp.toExponential(2)}`);
ok('tras 5 pasos la pérdida es menor que al empezar, para todo η', minAfter5 < 1, `peor cociente L₅/L₀ = ${minAfter5.toFixed(3)}`);
const traj = (eta: number, n: number) => { let w = W1.slice(); const h = [forward(w).L]; for (let i = 0; i < n; i++) { w = stepW(w, backward(w).g, eta); h.push(forward(w).L); } return h; };
console.log('     η = 1.0 desde los pesos tras el primer paso: L = ' + traj(1, 6).map((v) => v.toFixed(3)).join(' → '));

// ── 4 · turno 1: la meta se alcanza con clics de ±0.1 ──────────────────────────────────────────────
console.log('4 · turno 1: mínimo de clics de ±0.1 para llegar a cada meta');
for (const goal of [0.12, 0.1]) {
  let frontier = [W0.slice()], found = -1; const seen = new Set<string>();
  for (let depth = 1; depth <= 12 && found < 0; depth++) {
    const nx: number[][] = [];
    for (const w of frontier) for (let k = 0; k < 6; k++) for (const sg of [1, -1]) { const v = w.slice(); v[k] = clampW(Math.round((v[k] + sg * 0.1) * 100) / 100); const key = v.join(','); if (!seen.has(key)) { seen.add(key); nx.push(v); } }
    nx.sort((a, b) => forward(a).L - forward(b).L);
    if (forward(nx[0]).L <= goal) found = depth;
    frontier = nx.slice(0, 5000);
  }
  console.log(`     meta ${goal}: mínimo ${found} clics`);
  if (goal === 0.1) ok('la meta 0.10 se alcanza (y no con 1–3 clics)', found >= 4 && found <= 10, `${found} clics`);
}
{ const w = W0.slice(); let n = 0; while (forward(w).L > 0.1 && n < 60) { w[5] = Math.round((w[5] + 0.1) * 100) / 100; n++; } console.log(`     solo con «Subir peso» sobre w₆: ${n} clics (L = ${forward(w).L.toFixed(4)})`); }

// ── 5 · atenuación de la culpa ────────────────────────────────────────────────────────────────────
console.log('5 · pendiente de la sigmoide y atenuación');
let maxSp = 0, argmax = 0;
for (let z = -30; z <= 30; z += 0.001) { const s = sig(z) * (1 - sig(z)); if (s > maxSp) { maxSp = s; argmax = z; } }
ok('σ′(z) ≤ 1/4 con máximo en z = 0', Math.abs(maxSp - 0.25) < 1e-9 && Math.abs(argmax) < 0.01, `máx ${maxSp.toFixed(6)} en z = ${argmax.toFixed(3)}`);
console.log('     |δ_y|, |δ₁|, |δ₂| = ' + [B.dY, B.d1, B.d2].map((v) => Math.abs(v).toFixed(3)).join(', ') + ';  (1/4)^n: ' + [1, 2, 4, 6].map((n) => Math.pow(0.25, n)).join(', '));

// ── 6 · cuentas del quiz y del costo ────────────────────────────────────────────────────────────
console.log('6 · quiz y costo');
ok('quiz: (−0.2)·0.5·0.25 = −0.025; sin pendiente −0.1; sin peso −0.05', Math.abs(-0.2 * 0.5 * 0.25 + 0.025) < 1e-15 && Math.abs(-0.2 * 0.5 + 0.1) < 1e-15 && Math.abs(-0.2 * 0.25 + 0.05) < 1e-15);
ok('tantear = un pase hacia delante extra por peso (6 pesos → 6 pases)', W0.length === 6);
console.log('     (fuentes leídas aparte, no recalculables aquí: GPT-3 = 175 mil millones de parámetros, Brown et al. 2020, arXiv 2005.14165; pase hacia atrás ≈ el doble que el de ida y C ≈ 6N por token, Kaplan et al. 2020, §2.1)');

// ── 7 · el código de «Por dentro»: se ejecuta con Python y se compara con lo que dicen sus comentarios ──
console.log('7 · código de «Por dentro» ejecutado con Python 3');
for (const lang of ['es', 'en'] as const) {
  const md = (lesson.deeper as { es: string; en: string })[lang];
  const code = /```python\n([\s\S]*?)```/.exec(md)![1];
  const run = spawnSync('python3', ['-c', code], { encoding: 'utf8' });
  const out = run.stdout.trim().split('\n');
  const expected = [...code.matchAll(/^# (.*)$/gm)].map((m) => m[1]).filter((l) => /^[\d[]/.test(l));
  ok(`${lang}: la salida de Python = comentarios «# …» del código`, run.status === 0 && out.length === expected.length && out.every((l, i) => l === expected[i]), JSON.stringify(out));
}
console.log(bad ? `\n${bad} comprobación(es) FALLARON` : '\ntodo coincide');
process.exit(bad ? 1 : 0);
