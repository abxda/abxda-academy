// Comprueba CADA cifra que la voz, la escena, «por dentro», la lente y el quiz de «Un modelo y su error» afirman.
//   desde app/:  npx tsx src/content/courses/ia-generativa/lessons/modelo-y-error/build-data.ts
// Sale con código 1 si algo no coincide.
//
// DATOS: los diez estudiantes son INVENTADOS (no hay generador ni encuesta): XS (horas) y YS (calificación) están escritos a mano
// en helpers.ts. Reglas de diseño: tendencia clara (≈ 5 puntos por hora y ≈ 40 sin estudiar) con poco ruido y un atípico (6.5 h → 56).
// Este script recalcula todo con implementaciones propias e independientes de helpers.ts (fuerza bruta incluida) y las compara con
// helpers.ts y con lo que dicen los textos; además ejecuta con Python 3 los dos bloques de código de «por dentro» (es y en).
import { execFileSync } from 'node:child_process';
import content from './content';
import { BEST, FLAT, GOAL, LMIN, N, NEAR, OUT, TEACH, XS, YS, YO, ladFit, lsFit, mse, shares } from './helpers';

let bad = 0;
const check = (what: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) bad++;
  console.log(`${ok ? '✓' : '✗'} ${what}: ${JSON.stringify(got)}${ok ? '' : `  (los textos dicen ${JSON.stringify(want)})`}`);
};
const r = (x: number, d = 1) => Math.round(x * 10 ** d) / 10 ** d;
const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);
const mean = (a: number[]) => sum(a) / a.length;

// ── implementaciones propias (independientes de helpers.ts) ──
const sse = (w: number, b: number, ys = YS) => sum(XS.map((x, i) => (ys[i] - w * x - b) ** 2));
const sae = (w: number, b: number, ys = YS) => sum(XS.map((x, i) => Math.abs(ys[i] - w * x - b)));
/** Mínimos cuadrados por las ecuaciones normales (2×2): [n Σx; Σx Σx²]·[b; w] = [Σy; Σxy]. */
function normalEq(ys = YS) {
  const sx = sum(XS), sxx = sum(XS.map((x) => x * x)), sy = sum(ys), sxy = sum(XS.map((x, i) => x * ys[i])), det = N * sxx - sx * sx;
  return { w: (N * sxy - sx * sy) / det, b: (sxx * sy - sx * sxy) / det };
}
/** Mínimo error absoluto por fuerza bruta en una cuadrícula fina (comprueba el método «por pares» de helpers.ts). */
function ladGrid(ys: number[]) {
  let best = { w: 0, b: 0, v: Infinity };
  for (let w = 3; w <= 8; w += 0.01) for (let b = 30; b <= 50; b += 0.02) { const v = sae(w, b, ys); if (v < best.v) best = { w, b, v }; }
  return best;
}

// ── 1. los datos ──
check('10 estudiantes', [XS.length, YS.length], [10, 10]);
check('horas medias 4.55; calificación media 64.4', [r(mean(XS), 2), r(mean(YS), 2)], [4.55, 64.4]);
const sorted = YS.slice().sort((a, b) => a - b);
check('mediana de y = 59.5 (los dos centrales son 57 y 62)', [(sorted[4] + sorted[5]) / 2, sorted[4], sorted[5]], [59.5, 57, 62]);
check('atípico: 6.5 h → 56', [XS[OUT], YO], [6.5, 56]);
check('voz «place»: el estudiante de 5 h sacó 72', [XS[5], YS[5]], [5, 72]);
check('los datos llegan hasta 9 h; el eje horizontal va de 0 a 10', Math.max(...XS) <= 10, true);

// ── 2. la recta de ejemplo: peso 5, sesgo 40 (voz «steps» … «error-sign»; tabla de la escena) ──
check('TEACH es (w, b) = (5, 40)', [TEACH.w, TEACH.b], [5, 40]);
check('tabla «horas → predicción»: 0..5 h → 40, 45, 50, 55, 60, 65 (escalones de +5)', [0, 1, 2, 3, 4, 5].map((x) => 5 * x + 40), [40, 45, 50, 55, 60, 65]);
check('«weight-demo»: con peso 10 sube diez puntos por hora', 10 * 3 + 40 - (10 * 2 + 40), 10);
check('«predict-read»/«predict-calc»: 7 h → 5·7 = 35, + 40 = 75', [5 * 7, 5 * 7 + 40], [35, 75]);
check('«reality»/«error-one»: 5 h: real 72, predicción 65, error 7', [YS[5], 5 * 5 + 40, YS[5] - (5 * 5 + 40)], [72, 65, 7]);
check('«error-sign»: atípico (6.5 h): predicción 72.5, error −16.5', [5 * 6.5 + 40, YO - (5 * 6.5 + 40)], [72.5, -16.5]);
check('la recta (5, 40): pérdida 45.775 ≈ 45.8 (voz «back-line», escena, por dentro)', [r(sse(5, 40) / N, 3), r(sse(5, 40) / N, 1)], [45.775, 45.8]);
check('la recta (5, 40): suma de errores +16.5 (lectura de «sum-flat» antes de aplanar)', r(sum(XS.map((x, i) => YS[i] - 5 * x - 40)), 1), 16.5);

// ── 3. la recta plana y el cuadrado (voz «sum-flat», «square-idea», «square-neg», «loss») ──
const my = mean(YS), errFlat = YS.map((y) => y - my);
check('recta plana: suma de errores = 0', r(sum(errFlat), 6), 0);
check('recta plana: suma de cuadrados 2440.4 y MSE 244.0 (voz, escena y lente)', [r(sse(0, my), 1), r(sse(0, my) / N, 1)], [2440.4, 244.0]);
check('la recta plana (0; 64.4) es FLAT en helpers', [FLAT.w, r(FLAT.b, 1)], [0, 64.4]);
check('cuadrados: 2 → 4, 4 → 16, −3 → 9 (= 3²); el doble de error, cuatro veces', [2 ** 2, 4 ** 2, (-3) ** 2, 3 ** 2, 4 ** 2 / 2 ** 2], [4, 16, 9, 9, 4]);

// ── 4. la mejor recta (voz: «best-line»; escena; por dentro) ──
const ne = normalEq();
check('mínimos cuadrados (ecuaciones normales): w = 5.26, b = 40.45', [r(ne.w, 2), r(ne.b, 2)], [5.26, 40.45]);
check('helpers.lsFit coincide con las ecuaciones normales', [r(BEST.w, 9), r(BEST.b, 9)], [r(ne.w, 9), r(ne.b, 9)]);
let g = { w: 0, b: 0, v: Infinity };
for (let w = 4; w <= 7; w += 0.005) for (let b = 36; b <= 45; b += 0.01) { const v = sse(w, b); if (v < g.v) g = { w, b, v }; }
check('fuerza bruta (cuadrícula) confirma el mínimo: w ≈ 5.26, b ≈ 40.45 (a 0.01 y 0.05)', [Math.abs(g.w - ne.w) < 0.01, Math.abs(g.b - ne.b) < 0.05], [true, true]);
check('pérdida mínima 42.5 (MSE); suma de cuadrados 425.5', [r(sse(ne.w, ne.b) / N, 1), r(sse(ne.w, ne.b), 1)], [42.5, 425.5]);
check('LMIN de helpers = 42.5', r(LMIN, 1), 42.5);
check('raíz del MSE ≈ 6.5 puntos', r(Math.sqrt(LMIN), 1), 6.5);
check('la mejor recta pasa por el punto promedio (4.55; 64.4)', r(ne.w * mean(XS) + ne.b, 6), r(mean(YS), 6));
check('la parábola L(w) = Lmin + mean(x²)·(w − w*)², mean(x²) = 27.975 (≈ 28.0)', [r(mean(XS.map((x) => x * x)), 3), [0.5, 3, 5.2637, 8, 10.4].every((w) => Math.abs(sse(w, ne.b) / N - (LMIN + mean(XS.map((x) => x * x)) * (w - ne.w) ** 2)) < 1e-9)], [27.975, true]);
check('en la gráfica «curve»/«valley» la parábola cabe en 0–1000 para w de 0 a 11', Math.max(mse({ w: 0, b: BEST.b }), mse({ w: 11, b: BEST.b })) < 1000, true);

// ── 5. el atípico (voz: «outlier», «why-big»; escena) ──
const eBest = YS.map((y, i) => y - ne.w * XS[i] - ne.b);
check('el atípico es el error más grande de la mejor recta: −18.7', [eBest.indexOf(eBest.reduce((a, v) => (Math.abs(v) > Math.abs(a) ? v : a), 0)), r(eBest[OUT], 1)], [OUT, -18.7]);
check('aporta el 81.9 % de la pérdida (> tres cuartas partes)', [r((eBest[OUT] ** 2 / sum(eBest.map((e) => e * e))) * 100, 1), eBest[OUT] ** 2 / sum(eBest.map((e) => e * e)) > 0.75], [81.9, true]);
check('con valores absolutos aporta el 49.8 % («casi la mitad»)', r((Math.abs(eBest[OUT]) / sum(eBest.map(Math.abs))) * 100, 1), 49.8);
check('helpers.shares coincide', [r(shares(BEST, 'sq')[OUT] * 100, 1), r(shares(BEST, 'abs')[OUT] * 100, 1)], [81.9, 49.8]);

// ── 6. error absoluto vs cuadrático (voz: «compare», «after-try2»; escena) ──
const lad0 = ladGrid(YS);
check('helpers.ladFit coincide con la cuadrícula (suma de |e| = 29.73; la cuadrícula llega a 0.1)', [r(sae(ladFit(YO).w, ladFit(YO).b), 2), Math.abs(lad0.v - 29.73) < 0.1], [29.73, true]);
check('recta absoluta: w ≈ 5.87 (escena)', r(ladFit(YO).w, 2), 5.87);
check('la absoluta pasa exactamente por dos puntos de los datos', XS.filter((x, i) => Math.abs(YS[i] - ladFit(YO).w * x - ladFit(YO).b) < 1e-9).length >= 2, true);
const withY = (yo: number) => { const ys = YS.slice(); ys[OUT] = yo; return ys; };
const rows = [26, 20, 86, 100].map((yo) => ({ yo, ls: r(lsFit(withY(yo)).w, 2), lad: r(ladFit(yo).w, 2), ladGrid: r(ladGrid(withY(yo)).w, 1) }));
console.log('  (w de cada criterio al mover al atípico)', JSON.stringify(rows));
check('«outlier-demo»: al bajar al atípico a 20: cuadrática 4.30 (cambia −0.97), absoluta no cambia (0.00)', [r(lsFit(withY(20)).w, 2), r(lsFit(withY(20)).w - BEST.w, 2), r(ladFit(20).w - ladFit(YO).w, 2)], [4.3, -0.97, 0]);
check('«try2»: mover 30 puntos (a 26 o a 86): la cuadrática cambia ≈ 0.8; la absoluta ≤ 0.02', [r(Math.abs(lsFit(withY(26)).w - BEST.w), 1), r(Math.abs(lsFit(withY(86)).w - BEST.w), 1), Math.abs(ladFit(26).w - ladFit(YO).w) < 0.02, Math.abs(ladFit(86).w - ladFit(YO).w) < 0.02], [0.8, 0.8, true, true]);
check('la absoluta no cambia mientras el atípico no cruce la recta (de 0 a 56 y hasta 76)', [0, 10, 20, 30, 40, 50, 56, 60, 70, 76].every((yo) => Math.abs(ladFit(yo).w - ladFit(YO).w) < 1e-9 && Math.abs(ladFit(yo).b - ladFit(YO).b) < 1e-9), true);
check('el método por pares coincide con la cuadrícula en los extremos (w a 0.1)', rows.map((x) => Math.abs(x.lad - x.ladGrid) < 0.1), [true, true, true, true]);
// mediana: cualquier valor entre 57 y 62 minimiza la suma de |e| de una constante
const saeC = (c: number) => sum(YS.map((y) => Math.abs(y - c)));
check('predecir una constante: la media (64.4) minimiza el MSE; cualquier valor entre 57 y 62 minimiza |e| (59.5 incluido)', [saeC(57) === saeC(62), saeC(59.5) === saeC(57), saeC(56) > saeC(57), saeC(63) > saeC(62)], [true, true, true, true]);

// ── 7. los límites (voz: «limits») ──
check('con 12 h la mejor recta predice 103.6 (> 100)', [r(ne.w * 12 + ne.b, 1), ne.w * 12 + ne.b > 100], [103.6, true]);
check('los datos llegan hasta 9 h', Math.max(...XS), 9);
const lad0w = ladFit(YO);
check('«compare»: la recta absoluta (5.87; 40.07) se parece a la cuadrática (5.26; 40.45): a lo más 5 puntos de diferencia entre 0 y 9 h', r(Math.max(...[0, 9].map((x) => Math.abs(lad0w.w * x + lad0w.b - (ne.w * x + ne.b)))), 1), 5);

// ── 8. «Tu turno»: umbrales de los gates ──
check('gate fit: la recta (5, 40) de partida NO cumple (45.8 ≥ 43.5)', mse(TEACH) >= GOAL, true);
check('gate fit: la mejor recta sí cumple (42.5 < 43.5)', LMIN < GOAL, true);
const reach = { w: [] as number[], b: [] as number[] };
for (let wi = -20; wi <= 120; wi++) for (let bi = 0; bi <= 200; bi++) { const w = wi / 10, b = bi / 2; if (mse({ w, b }) < GOAL) { reach.w.push(w); reach.b.push(b); } }
console.log(`  (con los deslizadores, pasos de 0.1 y 0.5: ${reach.w.length} combinaciones cumplen el gate; w de ${Math.min(...reach.w)} a ${Math.max(...reach.w)}; b de ${Math.min(...reach.b)} a ${Math.max(...reach.b)})`);
check('gate fit: con los pasos de los deslizadores se puede (al menos 10 combinaciones)', reach.w.length >= 10, true);
check('NEAR (5.3; 40.5) es la mejor combinación de los deslizadores: pérdida 42.6', [NEAR.w, NEAR.b, r(mse(NEAR), 1)], [5.3, 40.5, 42.6]);
let gbest = { w: 0, b: 0, v: Infinity };
for (let wi = -20; wi <= 120; wi++) for (let bi = 0; bi <= 200; bi++) { const w = wi / 10, b = bi / 2, v = mse({ w, b }); if (v < gbest.v) gbest = { w, b, v }; }
check('la retícula de los deslizadores no tiene nada mejor que NEAR', [gbest.w, gbest.b], [NEAR.w, NEAR.b]);
check('«demo-w»: con b = 40, peso 8 y peso 2.5 empeoran (241.0 y 267.7) y 5.3 mejora (42.6)', [r(sse(8, 40) / N, 1), r(sse(2.5, 40) / N, 1), r(sse(5.3, 40) / N, 1)], [241, 267.7, 42.6]);
check('«demo-b»: con w = 5.3, sesgo 55 y 28 empeoran (259.1 y 193.5)', [r(sse(5.3, 55) / N, 1), r(sse(5.3, 28) / N, 1)], [259.1, 193.5]);
check('gate outlier: mover 30 puntos es posible (de 56 a 26 o a 86 dentro de 0–100)', [YO - 30 >= 0, YO + 30 <= 100], [true, true]);

// ── 9. quiz y lente ──
const q3 = (144 + 25) / 2;
check('quiz 3: 12 y −5 → cuadrados 144 y 25; MSE 84.5; suma 169; promedio con signo 3.5; promedio absoluto 8.5', [q3, 144 + 25, (12 - 5) / 2, (12 + 5) / 2], [84.5, 169, 3.5, 8.5]);
check('quiz 1: 4 · horas + 30: con cero horas 30; cada hora +4', [4 * 0 + 30, 4 * 6 + 30 - (4 * 5 + 30)], [30, 4]);
check('lente: línea base 244 frente a 42.5', [r(mse(FLAT), 0), r(LMIN, 1)], [244, 42.5]);

// ── 10. el código de «por dentro» (es y en) se ejecuta con Python 3 y da lo que dice ──
for (const lang of ['es', 'en'] as const) {
  const md = content.deeper[lang];
  const code = /```python\n([\s\S]*?)```/.exec(md)?.[1] ?? '';
  const wantOut = [...code.matchAll(/print\(.*?\)\s*#\s*(\S+(?: \S+)?)/g)].map((m) => m[1].trim());
  const out = execFileSync('python3', ['-c', code], { encoding: 'utf8' }).trim().split('\n').map((l) => l.trim());
  check(`python (${lang}): salida = comentarios del código`, out, wantOut);
}
// cifras de «por dentro» que no salen del código
for (const lang of ['es', 'en'] as const) for (const s of ['4.55', '64.4', '5.26', '40.45', '42.5', '28.0', '59.5', '6.5', '45.775', '244.04']) check(`«por dentro» (${lang}) menciona ${s}`, content.deeper[lang].includes(s), true);
check('«por dentro» (es) no usa coma decimal', /\d\{,\}\d|\d,\d/.test(content.deeper.es.replace(/```[\s\S]*?```/g, '')), false);
check('L(5, 40) exacta = 45.775', r(sse(5, 40) / N, 6), 45.775);
check('L(plana) exacta = 244.04', r(sse(0, my) / N, 6), 244.04);

console.log(bad ? `\n${bad} cifra(s) no coinciden` : '\nTodo coincide.');
process.exit(bad ? 1 : 0);
