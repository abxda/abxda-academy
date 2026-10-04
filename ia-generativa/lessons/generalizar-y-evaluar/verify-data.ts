// Comprobación reproducible de las cifras y afirmaciones calculables de la lección 10 (voz, escena, «por dentro», quiz).
//   npx tsx src/content/courses/ia-generativa/lessons/generalizar-y-evaluar/verify-data.ts      (desde app/)
// Sale con código 1 si algo no coincide. No genera datos nuevos: recalcula lo que muestra math.ts (los 12 puntos de
// entrenamiento y los 80 de validación, el ajuste por grado, la regularización, el descenso del gradiente, la matriz de
// confusión y los costos), repite por simulación la descomposición sesgo-varianza, y ejecuta con Python 3 el código de «por dentro».
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import content from './content';
import {
  BEST_DEG, BY_DEGREE, CURVES, MU_NEG, MU_POS, N_POP, PREV, TRAIN, VAL, cdf, confusion, evalPoly, f, fitPoly, pdf, rmse, trainingCurves,
} from './math';
import { gauss, rng } from '../../../../../theme/kit';

let bad = 0;
const ok = (cond: boolean, msg: string) => { if (!cond) bad++; console.log(`${cond ? '✓' : '✗'} ${msg}`); };
const near = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps;
const r = (x: number, d = 3) => Math.round(x * 10 ** d) / 10 ** d;
const SIGMA = 0.2;
const S2 = SIGMA * SIGMA;

// ── 1 · los datos de la escena: 12 de entrenamiento, 80 de validación, ruido σ = 0.2 ──
{
  ok(TRAIN.x.length === 12 && VAL.x.length === 80, 'voz «doce mediciones» y «ochenta mediciones nuevas»: 12 de entrenamiento y 80 de validación');
  const rm = (d: { x: number[]; y: number[] }) => Math.sqrt(d.x.reduce((s, x, i) => s + (f(x) - d.y[i]) ** 2, 0) / d.x.length);
  ok(Math.abs(rm(VAL) - SIGMA) < 0.02 && Math.abs(rm(TRAIN) - SIGMA) < 0.03, `el ruido real de las muestras es ≈ 0.2 (RMSE de la señal verdadera: entrenamiento ${r(rm(TRAIN))}, validación ${r(rm(VAL))}); con la validación ${r(rm(VAL))} es el mejor error posible de esa muestra`);
}

// ── 2 · error por grado: subajuste, buen ajuste, sobreajuste, la brecha ──
{
  const B = BY_DEGREE;
  ok(B.every((b, i) => i === 0 || b.train <= B[i - 1].train + 1e-9), `voz «el de entrenamiento baja siempre al complicar el modelo»: error de entrenamiento no creciente de grado 1 a 10 (${B.map((b) => r(b.train, 3)).join(', ')})`);
  ok(B[0].train > 0.25 && B[0].train > B[3].train * 1.5, `voz «la recta falla incluso con los datos que ya vio»: error de entrenamiento del grado 1 = ${r(B[0].train)} (mayor que el ruido 0.2 y que el del grado 4 = ${r(B[3].train)})`);
  ok(BEST_DEG === 4, `el mejor grado por error de validación es ${BEST_DEG} (voz y escena dicen 4)`);
  ok(near(B[3].val, 0.22, 0.005), `«por dentro»: el grado 4 llega a ≈ 0.22 en validación (${r(B[3].val, 4)})`);
  ok(B[9].train < 0.01, `voz «error de entrenamiento casi cero» con grado 10: ${r(B[9].train, 4)}`);
  ok(B[9].val > B[3].val * 1.4, `grado 10: error de validación ${r(B[9].val)} frente a ${r(B[3].val)} del grado 4 (brecha de ${r(B[9].val - B[9].train)})`);
  ok(B[3].val < B[0].val && B[9].val > B[3].val && B.slice(3).every((b) => b.val >= B[3].val), 'el error de validación baja hasta el grado 4 y desde ahí nunca vuelve a bajar de ese mínimo');
  const wig = B.map((b, i) => (i > 0 && b.val < B[i - 1].val ? i + 1 : 0)).filter(Boolean);
  const up = B.map((b, i) => (i > 0 && b.val > B[i - 1].val ? i + 1 : 0)).filter(Boolean);
  console.log(`  (nota) la curva de validación no es monótona: baja en los grados ${wig.join(', ')} y sube en ${up.join(', ')}; la forma general es «baja y luego sube»`);
  // gate degree: haber probado ≥ 4 grados y quedar en ≤ 1.03 × el mejor error
  const bestVal = Math.min(...B.map((b) => b.val));
  const ok1 = B.filter((b) => b.val <= bestVal * 1.03).map((b) => b.deg);
  ok(ok1.join() === '3,4', `gate «degree»: los grados que lo cumplen son ${ok1.join(', ')}`);
}

// ── 3 · regularización ridge con grado 10 (gate «reg» y «por dentro») ──
{
  const lams = [0, ...Array.from({ length: 27 }, (_, i) => 10 ** (-5.5 + i * 0.25))];   // las posiciones del control de la escena (λ = 0 y de 10^-5.5 a 10^1)
  const rows = lams.map((l) => { const w = fitPoly(10, l); return { l, tr: rmse(w, TRAIN), va: rmse(w, VAL), nw: Math.hypot(...w.slice(1)) }; });
  const best = rows.reduce((a, b) => (b.va < a.va ? b : a));
  ok(rows.every((q, i) => i < 2 || q.nw < rows[i - 1].nw) && near(rows[0].nw, 327, 1) && near(rows[rows.length - 1].nw, 0.19, 0.01), `al subir λ la norma de los pesos baja siempre (de ${r(rows[0].nw, 0)} con λ = 0 a ${r(rows[rows.length - 1].nw, 3)} con λ = ${r(rows[rows.length - 1].l, 1)}; «por dentro» cita 327 y 0.19)`);
  ok(rows.every((q, i) => i === 0 || q.tr >= rows[i - 1].tr - 1e-9), 'el error de entrenamiento sube al subir λ (el modelo se ajusta menos a esos puntos)');
  ok(rows[0].va > best.va * 1.25 && near(best.va, 0.24, 0.005) && best.l > 0.01 && best.l < 0.03, `voz «baja el error de validación»: de ${r(rows[0].va)} (λ = 0) a ${r(best.va)} con λ ≈ ${r(best.l, 3)} («por dentro» dice ≈ 0.24 hacia λ ≈ 0.02)`);
  const big = rows[rows.length - 1];
  ok(big.va > BY_DEGREE[0].val && near(big.l, 10, 1e-9), `con λ demasiado grande (la mayor del control, λ = ${r(big.l, 1)}) el modelo vuelve a subajustar: ${r(big.va)} de error de validación, peor que la recta (${r(BY_DEGREE[0].val)}); «por dentro» lo dice`);
  const lamOk = rows.filter((q) => q.va <= 0.262).map((q) => q.l);
  ok(!lamOk.includes(0) && lamOk.length > 3 && Math.max(...lamOk) >= 0.1, `gate «reg» (validación ≤ 0.262): λ = 0 no lo cumple (${r(rows[0].va)}) y sí ${lamOk.length} de las posiciones del control, la mayor λ = ${r(Math.max(...lamOk), 3)} (el control llega a λ = 10; con λ = 10 el error es ${r(rows[rows.length - 1].va)})`);
  console.log(`  (nota) error de validación con grado 10 por λ: ${rows.map((q) => `${q.l === 0 ? '0' : q.l.toExponential(1)}→${r(q.va, 3)}`).join(', ')}`);
  // la solución de math.ts es la del ridge sin penalizar el término constante: el gradiente del criterio es ≈ 0
  const lam = 0.03, w = fitPoly(10, lam);
  const z = (x: number) => 2 * x - 1;
  const g = new Array(11).fill(0);
  TRAIN.x.forEach((x, i) => { const res = evalPoly(w, x) - TRAIN.y[i]; for (let k = 0; k <= 10; k++) g[k] += 2 * res * z(x) ** k; });
  for (let k = 1; k <= 10; k++) g[k] += 2 * lam * w[k];
  ok(Math.max(...g.map(Math.abs)) < 1e-4, `fitPoly(10, 0.03) minimiza ‖y − Xw‖² + λ‖w‖² (sin penalizar el término constante, como scikit-learn): gradiente máximo ${Math.max(...g.map(Math.abs)).toExponential(1)}`);
}

// ── 4 · parada temprana: descenso del gradiente de un polinomio de grado 9 ──
{
  const c = CURVES.curves, last = c[c.length - 1], best = CURVES.best;
  ok(best.e > 0 && best.e < last.e / 10, `el mínimo de validación está en la época ${best.e} (de ${last.e}): hay mucho recorrido después para ver cómo sube`);
  const after = c.filter((q) => q.e >= best.e);
  ok(after.every((q) => q.val >= best.val - 1e-12) && last.val > best.val * 1.1, `voz «el de validación llega a un mínimo y luego sube»: mínimo ${r(best.val)} en la época ${best.e}; en la época ${last.e} vale ${r(last.val)} (+${r((last.val / best.val - 1) * 100, 0)} %)`);
  ok(c.every((q, i) => i === 0 || q.train <= c[i - 1].train + 1e-12) && last.train < best.train * 0.6, `voz «mientras el de entrenamiento sigue bajando»: de ${r(best.train)} en la época ${best.e} a ${r(last.train)} en la ${last.e}, sin subir nunca`);
  ok(last.e >= 10000, `la escena dibuja el eje hasta 20 000 épocas y las curvas llegan a la época ${last.e}`);
  const short = trainingCurves(9, 600);
  ok(short.curves[short.curves.length - 1].val < best.val * 1.03, 'con solo 600 épocas (antes) el mínimo apenas se notaba: validación final solo ' + r((short.curves[short.curves.length - 1].val / best.val - 1) * 100, 1) + ' % sobre el mínimo');
  // «detener antes limita cuánto crecen los pesos»: la norma de w crece con las iteraciones (descenso desde w = 0)
  const deg = 9, n = TRAIN.x.length, z = (x: number) => 2 * x - 1;
  const F = TRAIN.x.map((x) => Array.from({ length: deg + 1 }, (_, k) => z(x) ** k));
  let v = new Array(deg + 1).fill(1), lam = 1;
  for (let it = 0; it < 60; it++) { const u = new Array(deg + 1).fill(0); F.forEach((a) => { const d = a.reduce((s, q, k) => s + q * v[k], 0); a.forEach((q, k) => (u[k] += (q * d) / n)); }); lam = Math.hypot(...u); v = u.map((q) => q / lam); }
  const lr = 0.5 / lam, w = new Array(deg + 1).fill(0), norms: number[] = [];
  for (let e = 0; e <= 20000; e++) {
    if (e % 500 === 0) norms.push(Math.hypot(...w));
    const gr = new Array(deg + 1).fill(0);
    F.forEach((a, i) => { const res = a.reduce((s, q, k) => s + q * w[k], 0) - TRAIN.y[i]; a.forEach((q, k) => (gr[k] += (2 * res * q) / n)); });
    for (let k = 0; k <= deg; k++) w[k] -= lr * gr[k];
  }
  ok(norms.every((q, i) => i === 0 || q >= norms[i - 1] - 1e-12), `‖w‖ crece con las iteraciones (de ${r(norms[0], 1)} a ${r(norms[norms.length - 1], 1)} en 20 000): parar antes limita el tamaño de los pesos`);
  const wLate = fitPoly(9, 0), wStop = (() => { const q = new Array(deg + 1).fill(0); for (let e = 0; e < best.e; e++) { const gr = new Array(deg + 1).fill(0); F.forEach((a, i) => { const res = a.reduce((s, qq, k) => s + qq * q[k], 0) - TRAIN.y[i]; a.forEach((qq, k) => (gr[k] += (2 * res * qq) / n)); }); for (let k = 0; k <= deg; k++) q[k] -= lr * gr[k]; } return q; })();
  ok(rmse(wStop, VAL) < rmse(wLate, VAL), `el modelo parado en la época ${best.e} (validación ${r(rmse(wStop, VAL))}) es mejor que el ajuste completo de grado 9 (${r(rmse(wLate, VAL))})`);
}

// ── 5 · el clasificador de juguete: matriz de confusión, gate del umbral, costos ──
{
  ok(near(PREV, 0.1) && N_POP === 1000 && MU_POS === 3 && MU_NEG === 0, 'el clasificador de juguete usa 1 000 personas con 10 % de enfermas (NO el 1 % del gancho): la escena lo rotula');
  const c = confusion(1.7);
  ok(Math.round(c.tp) === 90 && Math.round(c.fp) === 40 && Math.round(c.fn) === 10 && Math.round(c.tn) === 860, `con el umbral 1.7: VP ${r(c.tp, 1)}, FP ${r(c.fp, 1)}, FN ${r(c.fn, 1)}, VN ${r(c.tn, 1)} (la escena muestra 90 / 40 / 10 / 860)`);
  ok(Math.round(c.precision * 100) === 69 && Math.round(c.recall * 100) === 90, `precisión ${r(c.precision * 100, 1)} % y recall ${r(c.recall * 100, 1)} % (la escena muestra 69 % y 90 %)`);
  // la aproximación de la función de distribución normal (Abramowitz y Stegun 26.2.17) frente al valor exacto (erf de Python)
  const xs = Array.from({ length: 321 }, (_, i) => -8 + i * 0.05);
  const exact = execFileSync('python3', ['-c', `import math,sys\nxs=${JSON.stringify(xs)}\nprint(' '.join(repr(0.5*(1+math.erf(x/math.sqrt(2)))) for x in xs))`], { encoding: 'utf8' }).trim().split(' ').map(Number);
  const err = Math.max(...xs.map((x, i) => Math.abs(cdf(x) - exact[i])));
  ok(err < 3e-7, `cdf(x) (A&S 26.2.17 con 7 cifras) difiere del valor exacto a lo sumo ${err.toExponential(1)}`);
  // gate «threshold»: recall ≥ 85 % y precisión ≥ 60 %
  const feasible: number[] = []; for (let t = -1; t <= 5.0001; t += 0.05) { const q = confusion(t); if (q.recall >= 0.85 && q.precision >= 0.6) feasible.push(t); }
  ok(feasible.length > 5, `gate «threshold»: se cumple con umbrales de ${r(Math.min(...feasible), 2)} a ${r(Math.max(...feasible), 2)}`);
  // el valor inicial del control (scene.ts: THR0) NO debe cumplir ya el gate; con el 1.7 de antes el gate se cumplía sin tocar nada
  const thr0 = Number(/const THR0 = ([\d.]+)/.exec(readFileSync(new URL('./scene.ts', import.meta.url), 'utf8'))?.[1]);
  const q0 = confusion(thr0), q17 = confusion(1.7);
  console.log(`  (nota) valor inicial del control = ${thr0}: recall ${r(q0.recall * 100, 0)} %, precisión ${r(q0.precision * 100, 0)} %`);
  ok(!(q0.recall >= 0.85 && q0.precision >= 0.6), `con el valor inicial ${thr0} el gate «threshold» NO se cumple (hay que mover el control)`);
  ok(q17.recall >= 0.85 && q17.precision >= 0.6, 'con 1.7 (el inicial de antes) el gate ya se cumplía sin tocar nada; sigue siendo una respuesta válida');
  // costos: umbral óptimo por fuerza bruta frente a la regla de Elkan (2001): se marca positivo si P(enfermo | puntuación) ≥ p*, con p* = cFP/(cFP + cFN)
  const postLogit = (t: number) => Math.log(PREV / (1 - PREV)) + 0.5 * (t ** 2 - (t - MU_POS) ** 2);   // log-verosimilitud de las dos gaussianas de varianza 1
  const brute = (cFN: number, cFP: number) => { let bt = -1, bc = Infinity; for (let i = 0; i <= 600; i++) { const t = -1 + i * 0.01, q = confusion(t), cc = cFN * q.fn + cFP * q.fp; if (cc < bc) { bc = cc; bt = t; } } return bt; };
  const analytic = (cFN: number, cFP: number) => { const pstar = cFP / (cFP + cFN); for (let t = -1; t <= 5; t += 0.0005) if (postLogit(t) >= Math.log(pstar / (1 - pstar))) return t; return NaN; };
  for (const [name, cFN, cFP] of [['igual', 1, 1], ['perder un caso (FN cuesta 10)', 10, 1], ['falsa alarma (FP cuesta 10)', 1, 10]] as [string, number, number][]) {
    const a = analytic(cFN, cFP), b = brute(cFN, cFP);
    ok(Math.abs(a - b) < 0.011, `costos «${name}»: umbral óptimo por fuerza bruta ${r(b, 2)} = regla de Elkan ${r(a, 3)}`);
  }
  const opt = [brute(1, 1), brute(10, 1), brute(1, 10)];
  ok(opt[1] < opt[0] && opt[0] < opt[2], `voz «el umbral correcto depende del costo»: si perder un caso cuesta más, el umbral baja (${r(opt[1], 2)} < ${r(opt[0], 2)}); si la falsa alarma cuesta más, sube (${r(opt[2], 2)})`);
  // la escena con paso de 0.05 marcaba 2.3 para costos iguales; el óptimo real es 2.23
  const coarse = (() => { let bt = -1, bc = Infinity; for (let t = -1; t <= 5; t += 0.05) { const q = confusion(t); if (q.fn + q.fp < bc) { bc = q.fn + q.fp; bt = t; } } return bt; })();
  console.log(`  (nota) con paso 0.05 el rótulo «umbral óptimo» mostraba ≈ ${r(coarse, 1)}; el óptimo exacto es ${r(analytic(1, 1), 2)} (≈ ${r(analytic(1, 1), 1)}); la escena ahora usa paso 0.01`);
  void pdf;
}

// ── 6 · la trampa de la exactitud, la tasa base y el quiz ──
{
  // 1 de cada 100: el clasificador que siempre dice «sano»
  const n = 1000, sick = 10, tp = 0, fn = sick, fp = 0, tn = n - sick;
  ok(near((tp + tn) / n, 0.99) && tp / (tp + fn) === 0, 'voz «acierta el 99 %» y escena «recall 0 %»: siempre «sano» con 10 enfermas de 1 000 → exactitud 99 %, recall 0 %');
  // 2 000 personas, 20 enfermas, sensibilidad = especificidad = 95 %
  const N = 2000, S = 20, sens = 0.95, spec = 0.95;
  const TP = S * sens, FP = (N - S) * (1 - spec);
  ok(near(TP, 19) && near(FP, 99), `voz «detecta a diecinueve enfermos, pero marca por error a noventa y nueve sanos»: ${TP} y ${r(FP, 1)}`);
  const ppv = TP / (TP + FP);
  ok(near(ppv, 19 / 118) && Math.round(ppv * 100) === 16 && 1 / ppv > 6 && 1 / ppv < 6.3, `precisión = 19/118 = ${r(ppv, 4)} ≈ 16 % ≈ uno de cada ${r(1 / ppv, 1)} (la voz dice «uno de cada seis»; la escena, «16 %»)`);
  // fórmula de Bayes de «por dentro»
  const bayes = (p: number, s: number, c: number) => (s * p) / (s * p + (1 - c) * (1 - p));
  ok(near(bayes(0.01, 0.95, 0.95), 0.0095 / (0.0095 + 0.0495), 1e-12) && near(bayes(0.01, 0.95, 0.95), ppv, 1e-12) && Math.round(bayes(0.01, 0.95, 0.95) * 100) === 16, '«por dentro»: 0.0095 / (0.0095 + 0.0495) ≈ 0.16 = el mismo 19/118');
  // quiz: 1 %, sensibilidad 90 %, especificidad 90 %
  const q = bayes(0.01, 0.9, 0.9);
  ok(Math.round(q * 100) === 8 && near(9 / (9 + 99), q, 1e-12), `quiz: 9 / (9 + 99) = ${r(q, 4)} ≈ 8 %`);
  // «incluso una prueba buena da más falsas alarmas que aciertos»: ocurre cuando la prevalencia es baja
  let thr = 0; for (let p = 0.0001; p < 0.5; p += 0.0001) if (bayes(p, 0.95, 0.95) < 0.5) thr = p;
  ok(near(thr, 0.05, 0.0005), `con sensibilidad = especificidad = 95 %, hay más falsas alarmas que aciertos mientras la prevalencia sea menor que ${r(thr * 100, 2)} % (1 % es «rara»)`);
  // quiz del proveedor: 98 % de exactitud con 1 % de fraude no dice nada (un sistema que no detecta nada tiene 99 %)
  ok(near(1 - 0.01, 0.99), 'quiz del proveedor: sin detectar nada se tiene 99 % de exactitud con 1 % de fraude');
}

// ── 7 · sesgo, varianza y ruido por simulación (misma receta de datos que math.ts) ──
{
  const R = 4000, TEST = Array.from({ length: 41 }, (_, i) => 0.02 + (0.96 * i) / 40);
  const draw = (seed: number) => { const rr = rng(seed), x: number[] = [], y: number[] = []; for (let i = 0; i < 12; i++) { const xi = Math.min(0.99, Math.max(0.01, (i + 0.5) / 12 + (rr() - 0.5) * 0.04)); x.push(xi); y.push(f(xi) + SIGMA * gauss(rr)); } return { x, y }; };
  const eps = rng(99);
  const results: { deg: number; lam: number; bias2: number; vr: number; total: number; mse: number; cross: number; se: number }[] = [];
  for (const [deg, lam] of [[1, 0], [4, 0], [10, 0], [10, 0.03]] as [number, number][]) {
    const preds: number[][] = TEST.map(() => []);
    let mseSum = 0, diffs: number[] = [];
    for (let k = 0; k < R; k++) {
      const w = fitPoly(deg, lam, draw(1000 + k)); let dRep = 0, mRep = 0;
      TEST.forEach((x, j) => { const fh = evalPoly(w, x); preds[j].push(fh); const yNew = f(x) + SIGMA * gauss(eps); mRep += (yNew - fh) ** 2; dRep += (yNew - fh) ** 2 - (SIGMA ** 2 + (fh - f(x)) ** 2); });
      mseSum += mRep / TEST.length; diffs.push(dRep / TEST.length);
    }
    let bias2 = 0, vr = 0;
    TEST.forEach((x, j) => { const m = preds[j].reduce((a, b) => a + b, 0) / R, v = preds[j].reduce((a, b) => a + (b - m) ** 2, 0) / R; bias2 += (m - f(x)) ** 2 / TEST.length; vr += v / TEST.length; });
    const mean = diffs.reduce((a, b) => a + b, 0) / R, sd = Math.sqrt(diffs.reduce((a, b) => a + (b - mean) ** 2, 0) / (R - 1));
    results.push({ deg, lam, bias2, vr, total: SIGMA ** 2 + bias2 + vr, mse: mseSum / R, cross: mean, se: sd / Math.sqrt(R) });
  }
  for (const q of results) console.log(`  grado ${q.deg}${q.lam ? ` (λ = ${q.lam})` : ''}: σ² = ${r(S2, 2)}, sesgo² = ${r(q.bias2, 4)}, varianza = ${r(q.vr, 4)} → suma ${r(q.total, 4)}; error esperado simulado ${r(q.mse, 4)}`);
  ok(results.every((q) => Math.abs(q.cross) < 4 * q.se), 'el error esperado en puntos nuevos = σ² + sesgo² + varianza (la diferencia simulada es ruido de Monte Carlo: < 4 errores estándar en cada modelo)');
  const [m1, m4, m10, m10r] = results;
  ok(m1.bias2 > m1.vr * 5, `el subajuste es sesgo alto: grado 1, sesgo² ${r(m1.bias2, 3)} ≫ varianza ${r(m1.vr, 3)}`);
  ok(m10.vr > m10.bias2 * 5, `el sobreajuste es varianza alta: grado 10, varianza ${r(m10.vr, 3)} ≫ sesgo² ${r(m10.bias2, 3)}`);
  ok(m4.total < m1.total && m4.total < m10.total && m10r.vr < m10.vr, `el grado 4 tiene menor error esperado (${r(m4.total, 3)}) que el 1 (${r(m1.total, 3)}) y el 10 (${r(m10.total, 3)}); λ = 0.03 baja la varianza del grado 10 de ${r(m10.vr, 3)} a ${r(m10r.vr, 3)}`);
  ok(m4.total > SIGMA ** 2 && m4.mse > SIGMA ** 2, `ningún modelo baja de σ² = ${r(S2, 2)} en esperanza (el mejor, grado 4: ${r(m4.total, 4)}); en una muestra concreta de 80 puntos sí puede quedar un poco por debajo o por encima`);
}

// ── 8 · el código de «por dentro» (es y en) ──
{
  const py = (md: string) => /```python\n([\s\S]*?)```/.exec(md)?.[1] ?? '';
  const outs: string[] = [];
  for (const lang of ['es', 'en'] as const) {
    const code = py(content.deeper[lang]);
    outs.push(execFileSync('python3', ['-c', code], { encoding: 'utf8' }).trim());
  }
  ok(outs[0] === outs[1], 'el código en español y el de inglés imprimen lo mismo');
  const rows = outs[0].split('\n').map((l) => l.trim().split(/\s+/).map(Number));
  const get = (deg: number, lam: number) => rows.find((q) => q.length === 4 && q[0] === deg && Math.abs(q[1] - lam) < 1e-12)!;
  const g1 = get(1, 1e-9), g4 = get(4, 1e-9), g10 = get(10, 1e-9), g10r = get(10, 0.03);
  ok(!!g1 && !!g4 && !!g10 && !!g10r, `el código imprime las cuatro filas (grado, λ, entrenamiento, validación):\n    ${outs[0].replace(/\n/g, '\n    ')}`);
  ok(g1[2] > 0.25 && g4[3] < g1[3] && g10[2] < 0.01 && g10[3] > g4[3] && g10r[3] < g10[3], 'con esos datos: el grado 1 subajusta, el 4 es el mejor en validación, el 10 casi no tiene error de entrenamiento pero valida peor, y λ = 0.03 lo mejora');
  ok(Number(outs[0].split('\n').pop()) === 0.161, 'ppv(0.01, 0.95, 0.95) imprime 0.161 como dice el comentario');
}

// ── 9 · números de la lección que dependen de los datos ──
{
  // los números que cita la voz en try3 / try1 coinciden con los gates del texto
  const t3 = content.segments.find((s) => s.id === 'try3')!, t1 = content.segments.find((s) => s.id === 'try1')!;
  ok(/ochenta y cinco/.test(t3.es) && /sesenta/.test(t3.es), 'voz try3: «ochenta y cinco por ciento» y «sesenta por ciento» = gate recall ≥ 85 %, precisión ≥ 60 %');
  ok(!!t1.gate, 'try1 tiene gate (el del grado)');
}

console.log(bad ? `\n✗ ${bad} comprobación(es) fallan` : '\n✓ todo coincide');
process.exit(bad ? 1 : 0);
