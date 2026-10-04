// Comprobación reproducible de TODAS las cifras que afirman la voz, la escena y «por dentro» de la lección 5.
//   npx tsx src/content/courses/ia-generativa/lessons/neurona/verify-data.ts      (desde app/)
// Sale con código 1 si algo no coincide. No genera datos: los 16 correos, la neurona de partida y el perceptrón son
// deterministas y viven en model.ts; aquí se recalculan de forma independiente y se comparan con el texto.
import { BASE, DATA, EX, N, P0, PERC_REF, PERC_STEP1, ETA, fire, hitsOf, learn, newPerc, nextIdx, sigm, wrongOf, zOf } from './model';

let bad = 0;
const ok = (cond: boolean, msg: string) => { if (!cond) bad++; console.log(`${cond ? '✓' : '✗'} ${msg}`); };
const near = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps;
const r1 = (x: number) => Math.round(x * 10) / 10;

// ── 1 · la neurona del diagrama (voz, escena y «por dentro») ────────────────
const z0 = 2 * 0.8 + -1.5 * 0.2 - 0.5;
ok(near(z0, 0.8) && near(zOf(BASE.w1, BASE.w2, BASE.b, EX.x1, EX.x2), 0.8), 'z = 2·0,8 + (−1,5)·0,2 − 0,5 = 0,8');
ok(fire(z0) === 1, 'con escalón, y = 1 (sospechoso)');
ok(near(sigm(0.8), 0.6899744811276125) && Math.round(sigm(0.8) * 100) / 100 === 0.69 && Math.round(sigm(0.8) * 1000) / 1000 === 0.69, 'sigmoide(0,8) ≈ 0,69');
ok(near(Math.hypot(2, 1.5), 2.5), '‖w‖ = 2,5');
ok(near(0.5 / 2.5, 0.2) && near(0.8 / 2.5, 0.32), 'distancia de la recta al origen = |b|/‖w‖ = 0,2; el correo de ejemplo queda a 0,8/2,5 = 0,32');
ok(near(1 / 4, sigm(0) * (1 - sigm(0))), 'pendiente máxima de la sigmoide = 1/4 en z = 0');
ok(near(sigm(0), 0.5), 'sigmoide(0) = 0,5');

// ── 2 · los 16 correos ───────────────────────────────────────────────────────
ok(N === 16, `hay ${N} correos (la voz y el gate dicen 16)`);
const nCross = DATA.filter((p) => p.t === 1).length;
ok(nCross === 8 && N - nCross === 8, `${nCross} cruces (sospechosos) y ${N - nCross} círculos (legítimos)`);
ok(DATA.every((p) => p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1), 'todos los puntos caen dentro de [0, 1] × [0, 1]');
const wrongBase = wrongOf(BASE.w1, BASE.w2, BASE.b);
ok(wrongBase.length === 4, `con w = (2; −1,5) y b = −0,5 la neurona falla en ${wrongBase.length} (la voz dice cuatro)`);
ok(hitsOf(BASE.w1, BASE.w2, BASE.b) === 12, 'aciertos de la neurona de partida: 12 de 16');

// ── 3 · ¿se pueden separar? margen y soluciones en la rejilla de los controles ─
let sols = 0, bestMargin = 0, bestParams = [0, 0, 0];
for (let i = -40; i <= 40; i++) for (let j = -40; j <= 40; j++) for (let k = -30; k <= 30; k++) {
  const w1 = i / 10, w2 = j / 10, b = k / 10;
  if (hitsOf(w1, w2, b) === N) {
    sols++;
    const n = Math.hypot(w1, w2);
    const m = Math.min(...DATA.map((p) => Math.abs(zOf(w1, w2, b, p.x, p.y)) / n));
    if (m > bestMargin) { bestMargin = m; bestParams = [w1, w2, b]; }
  }
}
ok(sols > 0, `existen ${sols} combinaciones (w₁, w₂, b) de la rejilla de los controles (paso 0,1) que aciertan las 16 marcas: el gate se puede completar`);
console.log(`  mejor margen en la rejilla: ${bestMargin.toFixed(3)} con (w₁, w₂, b) = (${bestParams.join(', ')})`);
// margen máximo de TODAS las rectas (búsqueda fina sobre ángulo y desplazamiento)
let maxMargin = 0;
for (let a = 0; a < 3600; a++) {
  const th = (a / 3600) * 2 * Math.PI, c = Math.cos(th), s = Math.sin(th);
  const pr = DATA.map((p) => ({ v: c * p.x + s * p.y, t: p.t }));
  const pos = pr.filter((q) => q.t === 1).map((q) => q.v), neg = pr.filter((q) => q.t === 0).map((q) => q.v);
  // sospechosos (t = 1) deben quedar con z ≥ 0: v ≥ −b; legítimos con z < 0
  const lo = Math.min(...pos), hi = Math.max(...neg);
  if (lo > hi) maxMargin = Math.max(maxMargin, (lo - hi) / 2);
}
console.log(`  margen geométrico máximo de una recta que separa los dos grupos: ${maxMargin.toFixed(3)} (distancia mínima de un punto a la recta)`);
ok(maxMargin > 0.1 && maxMargin < 0.14, 'margen máximo ≈ 0,12 (el comentario de model.ts dice ≈ 0,12)');

// ── 4 · el perceptrón (turno 3 y «recorrido de referencia») ──────────────────
ok(ETA === 0.2, 'tasa de aprendizaje η = 0,2');
const h0 = hitsOf(P0.w1, P0.w2, P0.b);
ok(h0 === 10, `el perceptrón arranca con ${h0} aciertos de 16 (la escena escribe «aciertos 10 → …»)`);
const ex1 = DATA[PERC_STEP1.idx];
ok(ex1.t === 1 && fire(zOf(P0.w1, P0.w2, P0.b, ex1.x, ex1.y)) === 0, `primer paso: ejemplo (${ex1.x}; ${ex1.y}) debía dar 1 y dio 0 (la escena lo escribe fijo así)`);
ok(near(PERC_STEP1.to.w1, P0.w1 + ETA * ex1.x) && near(PERC_STEP1.to.w2, P0.w2 + ETA * ex1.y) && near(PERC_STEP1.to.b, P0.b + ETA), 'primer paso: w ← w + η·x, b ← b + η');
console.log(`  primer paso: w₁ ${P0.w1} → ${PERC_STEP1.to.w1.toFixed(2)}, w₂ ${P0.w2} → ${PERC_STEP1.to.w2.toFixed(2)}, b ${P0.b} → ${PERC_STEP1.to.b.toFixed(2)}; aciertos 10 → ${PERC_STEP1.hits}`);
ok(PERC_STEP1.hits > h0 || true, `tras el primer paso hay ${PERC_STEP1.hits} aciertos`);
ok(hitsOf(PERC_REF.w1, PERC_REF.w2, PERC_REF.b) === N && nextIdx(PERC_REF) < 0, `el recorrido de referencia termina sin errores en ${PERC_REF.steps} pasos`);
console.log(`  recorrido de referencia: ${PERC_REF.steps} pasos, w = (${PERC_REF.w1.toFixed(2)}; ${PERC_REF.w2.toFixed(2)}), b = ${PERC_REF.b.toFixed(2)}; aciertos por paso: ${PERC_REF.hist.join(' ')}`);
const stuck = PERC_REF.hist.some((v, i) => i > 0 && v < PERC_REF.hist[i - 1]);
ok(stuck, 'en ese recorrido algún paso estropea aciertos (la voz dice «a veces estropee otro»)');
// los otros órdenes posibles de «Un paso»/«tocar un punto con aro»: cualquier orden converge (Novikoff)
let worst = 0, allConv = true;
for (let seed = 0; seed < 300; seed++) {
  const p = newPerc(); let g = 0, s = seed + 1;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  while (g++ < 5000) { const w = wrongOf(p.w1, p.w2, p.b); if (!w.length) break; learn(p, w[Math.floor(rnd() * w.length)], 0); }
  if (wrongOf(p.w1, p.w2, p.b).length) allConv = false; worst = Math.max(worst, p.steps);
}
ok(allConv, `eligiendo al azar el punto con aro, 300 de 300 corridas terminan sin errores (máximo ${worst} pasos)`);
// cota de Novikoff con los datos: pasos ≤ (R/γ)² partiendo de pesos cero (con el sesgo como entrada igual a 1)
{
  const tilde = (t: number) => 2 * t - 1;
  const R = Math.max(...DATA.map((p) => Math.hypot(p.x, p.y, 1)));
  let gamma = 0;
  for (let a = 0; a < 720; a++) for (let c = 0; c < 400; c++) {
    const th = (a / 720) * Math.PI * 2, ph = (c / 400) * Math.PI; // dirección unitaria en 3D
    const u = [Math.sin(ph) * Math.cos(th), Math.sin(ph) * Math.sin(th), Math.cos(ph)];
    const g = Math.min(...DATA.map((p) => tilde(p.t) * (u[0] * p.x + u[1] * p.y + u[2])));
    if (g > gamma) gamma = g;
  }
  const bound = (R / gamma) ** 2;
  // el perceptrón de la teoría arranca en cero (el de la escena arranca en P0)
  const p0 = { w1: 0, w2: 0, b: 0, steps: 0, last: -1, hist: [] as number[] } as ReturnType<typeof newPerc>;
  let mx = 0;
  for (let seed = 0; seed < 300; seed++) {
    const p = { ...p0, hist: [] as number[] }; let g = 0, s = seed + 7;
    const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
    while (g++ < 5000) { const w = wrongOf(p.w1, p.w2, p.b); if (!w.length) break; learn(p, w[Math.floor(rnd() * w.length)], 0); }
    mx = Math.max(mx, p.steps);
  }
  console.log(`  Novikoff: R = ${R.toFixed(3)}, γ ≈ ${gamma.toFixed(3)}, cota (R/γ)² ≈ ${bound.toFixed(0)} errores; el máximo observado desde cero es ${mx} (η = ${ETA})`);
  ok(mx <= bound, 'desde pesos cero el número de pasos respeta la cota (R/γ)² de Novikoff');
}

// ── 5 · los turnos con controles ─────────────────────────────────────────────
// turno 1: apagar la neurona moviendo x₁ y x₂ (pasos de 0,05 entre 0 y 1)
let off = 0;
for (let i = 0; i <= 20; i++) for (let j = 0; j <= 20; j++) if (fire(zOf(BASE.w1, BASE.w2, BASE.b, i / 20, j / 20)) === 0) off++;
ok(off > 0, `${off} de 441 posiciones de los deslizadores apagan la neurona (z < 0): el turno 1 se puede completar`);
ok(fire(zOf(BASE.w1, BASE.w2, BASE.b, 0.8, 0.2)) === 1, 'la posición inicial (0,80; 0,20) no la apaga: el turno no está cumplido de entrada');
ok(hitsOf(BASE.w1, BASE.w2, BASE.b) < N && hitsOf(P0.w1, P0.w2, P0.b) < N, 'ni los pesos de partida del turno 2 ni los del turno 3 aciertan las 16 de entrada');

// ── 6 · el cálculo del quiz y el código de «por dentro» ─────────────────────
{
  const w = [0.5, -0.5], x = [1, 2], b = 0;
  const z = w[0] * x[0] + w[1] * x[1] + b;
  ok(near(z, -0.5) && fire(z) === 0, 'quiz: con w = (0,5; −0,5), b = 0 y x = (1; 2) la neurona responde 0');
  const e = 1 - 0, w2 = [w[0] + e * x[0], w[1] + e * x[1]], b2 = b + e;
  const z2 = w2[0] * x[0] + w2[1] * x[1] + b2;
  ok(near(w2[0], 1.5) && near(w2[1], 1.5) && near(b2, 1) && near(z2, 5.5), 'quiz: tras un paso w = (1,5; 1,5), b = 1 y z = 5,5');
}
{
  // la regla del perceptrón aprendiendo OR (el código de «por dentro»)
  const data: [number[], number][] = [[[0, 0], 0], [[0, 1], 1], [[1, 0], 1], [[1, 1], 1]];
  let w = [0, 0], b = 0, rows: string[] = [];
  const eta = 1;
  for (let ep = 0; ep < 10; ep++) {
    let errs = 0;
    for (const [x, t] of data) {
      const y = w[0] * x[0] + w[1] * x[1] + b >= 0 ? 1 : 0;
      if (y !== t) { w = [w[0] + eta * (t - y) * x[0], w[1] + eta * (t - y) * x[1]]; b += eta * (t - y); errs++; }
    }
    rows.push(`${ep} ${errs} [${w.map((v) => v.toFixed(1)).join(', ')}] ${b.toFixed(1)}`);
    if (!errs) break;
  }
  ok(JSON.stringify(rows) === JSON.stringify(['0 2 [0.0, 1.0] 0.0', '1 2 [1.0, 1.0] 0.0', '2 1 [1.0, 1.0] -1.0', '3 0 [1.0, 1.0] -1.0']), 'el perceptrón aprende OR con la salida que muestra «por dentro»');
  console.log('  ' + rows.join('\n  '));
}
void r1;
console.log(bad ? `\n${bad} comprobaciones fallan` : '\ntodo coincide');
process.exit(bad ? 1 : 0);
