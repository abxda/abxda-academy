// Comprobación reproducible de las cifras y afirmaciones calculables de la lección 4 (voz, escena, «por dentro», quiz).
//   npx tsx src/content/courses/ia-generativa/lessons/descenso-del-gradiente/verify-data.ts      (desde app/)
// Sale con código 1 si algo no coincide. Recalcula de forma independiente las curvas (parábola L(w) = ½(w − 3)² + 1,
// cuenco 2D girado, paisaje con dos valles), las compara con curves.ts (lo que dibuja la escena) y ejecuta con Python 3
// el código de «por dentro».
import { execFileSync } from 'node:child_process';
import content from './content';
import * as C from './curves';

let bad = 0;
const ok = (cond: boolean, msg: string) => { if (!cond) bad++; console.log(`${cond ? '✓' : '✗'} ${msg}`); };
const near = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps;
const r = (x: number, d = 2) => Math.round(x * 10 ** d) / 10 ** d;
const seg = (id: string) => content.segments.find((s) => s.id === id)!;

// ── 1 · la curva de un peso: L(w) = ½(w − 3)² + 1 (curvatura h = 1) ──
const WS = 3, W0 = -1;
const L = (w: number) => 0.5 * (w - WS) ** 2 + 1;
const dL = (w: number) => w - WS;
const traj = (w0: number, eta: number, n: number) => { const a = [w0]; for (let i = 0; i < n; i++) a.push(a[i] - eta * dL(a[i])); return a; };
ok([-3, -1, 0, 3, 6, 8].every((w) => near(L(w), C.L(w)) && near(dL(w), C.dL(w))) && C.WS === WS && C.W0 === W0, 'curves.ts dibuja la misma curva, con el mismo fondo y el mismo punto de partida');
// la curva, pieza por pieza (segmentos curve y goal)
ok(C.SAMPLES.map(L).join() === '9,5.5,3,1.5,1,1.5,3,5.5,9', 'puntos de muestra: con −1, 9; con 0, 5.5; … con 7, 9 (tabla «peso → error»)');
ok(L(WS) === 1 && C.SAMPLES.every((w) => L(w) >= 1), 'el fondo está en el peso 3, con error 1 (goal)');
ok(near(L(W0), 9), 'el punto de partida, −1, tiene error 9 (start)');
// la pendiente desde cero: un movimiento de una décima (slope-nudge, slope-value)
const e1 = 0.1, q1 = (L(W0 + e1) - L(W0)) / e1, q2 = (L(W0 + 0.01) - L(W0)) / 0.01;
ok(near(L(W0 + e1), 8.605) && near(L(W0 + e1) - L(W0), -0.395), `moviendo el peso una décima (a −0.9), el error baja de 9 a ${r(L(W0 + e1), 3)} (unos ocho punto seis): casi cuatro décimas`);
ok(near(q1, -3.95) && near(q2, -3.995) && near(dL(W0), -4), `cociente con 0.1: ${r(q1, 3)}; con 0.01: ${r(q2, 4)}; en el límite, la derivada: ${dL(W0)} («unas cuatro veces»; la pendiente vale menos cuatro)`);
ok([0.1, 0.01, 0.5, 2].every((e) => near((L(W0 + e) - L(W0)) / e, dL(W0) + e / 2, 1e-12)), 'en esta curva el cociente vale exactamente (w − 3) + ε/2 («por dentro»)');
// tangente y escalón (slope-tangent, slope-sign, slope-zero)
ok(near(L(W0) + dL(W0) * 1, 5) && L(0) > 5, 'tangente en −1: un paso a la derecha baja cuatro (de 9 a 5); la curva queda por encima (5.5)');
ok(near(dL(6), 3) && near(L(6), 5.5) && dL(C.WR) === 3, 'del otro lado, en el peso 6, la pendiente es +3 (sube tres por cada paso a la derecha)');
ok(dL(WS) === 0, 'en el fondo, el 3, la pendiente es 0');
// la regla y el signo menos (rule-eta, rule-minus)
ok(near(-0.5 * -4, 2) && near(-0.5 * 3, -1.5), 'el menos a cada lado: −0.5 × (−4) = +2 (avanza); −0.5 × (+3) = −1.5 (retrocede)');
// los pasos con tasa ½ (first-step, second-step, repeat, bottom)
const main = traj(W0, 0.5, 8);
ok(main.every((w, i) => near(w, C.MAIN[i])) && C.ETA === 0.5, 'curves.ts recorre el mismo camino con tasa ½');
ok(near(main[1], 1) && near(L(main[1]), 3), 'primer paso: −1 − ½ × (−4) = −1 + 2 = 1; el error baja de 9 a 3');
ok(near(dL(main[1]), -2) && near(main[2], 2) && near(L(main[2]), 1.5), 'segundo paso: en 1 la pendiente es −2; el paso es de 1; el peso llega a 2 y el error a 1.5');
ok(main.slice(1).every((w, i) => near(Math.abs(w - WS), Math.abs(main[i] - WS) / 2, 1e-12)), 'cada paso recorre la mitad de lo que falta: pasos 2, 1, 0.5, 0.25… (se acortan solos)');
ok(main.slice(1).every((w, i) => L(w) < L(main[i]) && Math.abs(dL(w)) < Math.abs(dL(main[i]))), 'en cada paso el error baja y la pendiente se aplana');
ok(Math.abs(dL(main[8])) < 0.02 && r(L(main[8])) === 1, `tras 8 pasos: peso ${r(main[8], 3)}, pendiente ${r(dL(main[8]), 3)} (casi cero), error ${r(L(main[8]))} (bottom)`);
ok(near(traj(W0, 0.5, 3)[3], 2.5), 'turno 1: tres pasos desde −1 llevan a 2.5 (gate steps)');

// ── 2 · la tasa: cuatro demostraciones y los cinco regímenes ──
const cross = (p: number[]) => p.slice(1).filter((w, i) => (w - WS) * (p[i] - WS) < 0).length;
const dist = (p: number[]) => p.map((w) => Math.abs(w - WS));
{
  const D = C.DEMOS;
  const small = traj(W0, D.small.eta, D.small.n), osc = traj(W0, D.osc.eta, D.osc.n), div = traj(W0, D.div.eta, D.div.n), good = traj(W0, D.good.eta, D.good.n);
  ok(D.small.eta === 0.05 && D.osc.eta === 1.7 && D.div.eta === 2.05 && D.good.eta === 0.8, 'tasas narradas: cinco centésimas, uno punto siete, más de dos (2.05) y cero punto ocho');
  ok(cross(small) === 0 && r(dist(small)[12]) === 2.16, `η = 0.05: no cruza; tras 12 pasos sigue a ${r(dist(small)[12])} del fondo (estaba a 4): «sigue lejos»`);
  ok(cross(osc) === 8 && dist(osc).every((v, i) => i === 0 || v < dist(osc)[i - 1]), 'η = 1.7: cruza el fondo en los 8 pasos, pero la distancia baja (rebota y se acerca)');
  ok(cross(div) === 4 && dist(div).every((v, i) => i === 0 || v > dist(div)[i - 1]) && L(div[4]) > L(div[0]), `η = 2.05: cruza y la distancia crece; el error pasa de ${r(L(div[0]))} a ${r(L(div[4]))}: diverge`);
  ok(r(L(div[4])) === 12.82 && content.deeper.es.includes('de 9 a 12.82') && content.deeper.en.includes('from 9 to 12.82'), 'el error final del caso que diverge, 12.82, es el que dice «por dentro»');
  ok(div.every((w) => w > -2.3 && w < 8.3 && L(w) < 14.6), 'los cuatro saltos del caso que diverge caben en la gráfica (peso de −2.3 a 8.3, error hasta 14.6)');
  ok(cross(good) === 0 && dist(good).findIndex((v) => v < C.TOL) === 3 && r(dist(good)[3], 3) === 0.032, 'η = 0.8: no cruza y llega a 0.032 del fondo en 3 pasos («pocos pasos»)');
  ok(near(traj(W0, 1, 1)[1], WS), 'η = 1: llega de un salto');
  ok(traj(W0, 2, 6).every((w) => near(Math.abs(w - WS), 4, 1e-12)), 'η = 2 exacto: rebota a la misma distancia, sin acercarse');
}
// el gate de la tasa: llegar a menos de 0.08 del fondo en ≤ 10 pasos sin cruzarlo (η ≤ 1); deslizador de 0.01 a 2.2 en pasos de 0.01
{
  const passes = (eta: number) => { if (eta > 1) return false; const p = traj(W0, eta, 40), k = p.findIndex((w) => Math.abs(w - WS) < 0.08); return k > 0 && k <= 10; };
  const okE: number[] = [];
  for (let i = 1; i <= 220; i++) { const e = i / 100; if (passes(e)) okE.push(e); }
  ok(okE[0] === 0.33 && okE[okE.length - 1] === 1 && okE.length === 68 && content.deeper.es.includes('de 0.33 a 1') && content.deeper.en.includes('from 0.33 to 1'), `gate lr: lo cumplen las tasas de ${okE[0]} a ${okE[okE.length - 1]} («por dentro»)`);
  let same = true;
  for (let i = 1; i <= 220; i++) { const e = i / 100; if ((C.verdictOf(e).v === 'ok') !== passes(e)) same = false; }
  ok(same, 'el veredicto de la escena (verdictOf) da «llega» exactamente para esas tasas');
  ok(C.verdictOf(0.3).v === 'slow' && C.verdictOf(0.3).k === 11 && C.verdictOf(1.7).v === 'osc' && C.verdictOf(2).v === 'bounce' && C.verdictOf(2.05).v === 'div', 'veredictos: 0.3 lenta (11 pasos), 1.7 rebota, 2 rebota sin acercarse, 2.05 diverge');
}

// ── 3 · «por dentro»: código y quiz ──
{
  const py = (md: string) => /```python\n([\s\S]*?)```/.exec(md)?.[1] ?? '';
  for (const lang of ['es', 'en'] as const) {
    const code = py(content.deeper[lang]);
    const want = /# (\[.*\])\s*$/m.exec(code)?.[1] ?? '';
    const out = execFileSync('python3', ['-c', code], { encoding: 'utf8' }).trim();
    ok(out === want && out === '[-1.0, 1.0, 2.0, 2.5, 2.75, 2.875]', `python (${lang}): salida ${out} = comentario del código`);
  }
  ok(near(2 - 0.1 * 4, 1.6) && near(2 + 0.1 * 4, 2.4), 'quiz: 2 − 0.1 × 4 = 1.6 (y el distractor de sumar, 2.4)');
}

// ── 4 · varias dimensiones: umbral 2/λmax, mejor tasa 2/(λmax + λmin) y factor (κ − 1)/(κ + 1) ──
{
  const lam = [1, 7];
  const factor = (eta: number) => Math.max(...lam.map((l) => Math.abs(1 - eta * l)));
  const lmax = 7, lmin = 1, kappa = 7;
  ok(factor(2 / lmax - 1e-9) < 1 && near(factor(2 / lmax), 1) && factor(2 / lmax + 1e-3) > 1, `converge si y solo si η < 2/λmax = ${r(2 / lmax, 4)}`);
  let best = { eta: 0, f: Infinity };
  for (let e = 0.0001; e < 2 / lmax; e += 0.0001) if (factor(e) < best.f) best = { eta: e, f: factor(e) };
  ok(near(best.eta, 2 / (lmax + lmin), 2e-4) && near(best.f, (kappa - 1) / (kappa + 1), 1e-3), `mejor tasa fija: η = ${r(best.eta, 4)} ≈ 0.25; factor ${r(best.f, 4)} ≈ 0.75`);
  ok(near(1 - 0.2 * 7, -0.4) && near(1 - 0.2 * 1, 0.8), 'η = 0.2 en la figura: factor −0.4 (zigzag) en la dirección empinada y 0.8 en la plana');
  let allOk = true;
  for (const [a, b] of [[0.5, 3], [1, 100], [2, 2.5], [0.1, 10]]) {
    const f = (e: number) => Math.max(Math.abs(1 - e * a), Math.abs(1 - e * b));
    let bf = Infinity, be = 0; for (let e = 1e-5; e < 2 / b; e += 1e-5) if (f(e) < bf) { bf = f(e); be = e; }
    const k = b / a; if (!(near(be, 2 / (a + b), 1e-4) && near(bf, (k - 1) / (k + 1), 1e-3))) allOk = false;
  }
  ok(allOk, 'la fórmula del mejor η y de (κ−1)/(κ+1) se cumple también con otras cuatro parejas');
}

// ── 5 · el paisaje 2D: las dos pendientes, el gradiente y el zigzag ──
{
  const C2 = [1.2, -0.4], ANG = 0.5, H2 = [1, 7];
  const rot = (x: number, y: number) => { const dx = x - C2[0], dy = y - C2[1]; return [dx * Math.cos(ANG) + dy * Math.sin(ANG), -dx * Math.sin(ANG) + dy * Math.cos(ANG)]; };
  const L2 = (x: number, y: number) => { const [u, v] = rot(x, y); return 0.5 * (H2[0] * u * u + H2[1] * v * v); };
  const e = 1e-6;
  const num = (x: number, y: number): [number, number] => [(L2(x + e, y) - L2(x - e, y)) / (2 * e), (L2(x, y + e) - L2(x, y - e)) / (2 * e)];
  const [gx, gy] = C.g2(-1, 0), [nx, ny] = num(-1, 0);
  ok(near(gx, nx, 1e-5) && near(gy, ny, 1e-5) && near(L2(-1, 0), C.L2(-1, 0)), `las dos pendientes en (−1, 0) (${r(gx, 2)}, ${r(gy, 2)}) coinciden con las numéricas: el gradiente es la lista de pendientes`);
  ok(r(gx, 2) === -6.24 && r(gy, 2) === 7.8 && r(L2(-1, 0), 2) === 8.43, 'gradiente (−6.24, 7.80) y error 8.43 en el punto de partida, como en la escena y en «por dentro»');
  const gl = Math.hypot(gx, gy), tx = -gy / gl, ty = gx / gl, d = 1e-4;
  ok(Math.abs(L2(-1 + d * tx, d * ty) - L2(-1, 0)) < 1e-7 && L2(-1 + d * gx / gl, d * gy / gl) > L2(-1, 0), 'a lo largo de la curva de nivel el error no cambia y en la dirección del gradiente sube: apunta cuesta arriba');
  const path: [number, number][] = [[-1, 0]]; for (let i = 0; i < 16; i++) { const [x, y] = path[i], [a, b] = C.g2(x, y); path.push([x - 0.2 * a, y - 0.2 * b]); }
  const vs = path.map(([x, y]) => rot(x, y)[1]);
  ok(path.every((q, i) => near(q[0], C.PATH2[i][0]) && near(q[1], C.PATH2[i][1])), 'curves.ts recorre el mismo camino 2D (16 pasos, η = 0.2)');
  ok(vs.slice(1).every((v, i) => v * vs[i] < 0) && L2(...path[16]) < 0.01, `el camino cambia de lado en cada paso (zigzag) y el error baja de ${r(L2(...path[0]))} a ${r(L2(...path[16]), 3)}`);
}

// ── 6 · el paisaje irregular (rugged, valleys): dos puntos de partida, dos valles ──
{
  const R = (w: number) => 0.08 * w ** 4 - 0.6 * w ** 2 + 0.25 * w + 2.0;
  const dR = (w: number) => 0.32 * w ** 3 - 1.2 * w + 0.25;
  const run = (w0: number) => { let w = w0; for (let i = 0; i < 40; i++) w -= 0.12 * dR(w); return w; };
  const A = run(-0.9), B = run(0.9);
  const roots: number[] = []; for (let w = -3.2; w < 3.2; w += 0.001) if (dR(w) * dR(w + 0.001) < 0) roots.push(w);
  const d2R = (w: number) => 0.96 * w ** 2 - 1.2;
  const mins = roots.filter((w) => d2R(w) > 0), maxs = roots.filter((w) => d2R(w) < 0);
  ok(mins.length === 2 && maxs.length === 1, `R(w) tiene dos mínimos locales (w ≈ ${mins.map((m) => r(m)).join(' y ')}) y un máximo entre ellos`);
  ok(near(A, C.PATH_A[40]) && near(B, C.PATH_B[40]) && A < maxs[0] && B > maxs[0], `desde −0.9 acaba en ${r(A, 3)} y desde 0.9 en ${r(B, 3)}: cada una en el valle más cercano, con la misma regla y la misma tasa`);
  ok(r(R(A)) === 0.38 && r(R(B)) === 1.35, `los valles no son igual de profundos: error ${r(R(A))} (A) frente a ${r(R(B))} (B)`);
}

// ── 7 · escala y narración ──
ok(175e9 === 175000000000 && /ciento setenta y cinco mil millones/.test(seg('scale').es) && /one hundred seventy-five billion/.test(seg('scale').en), 'GPT-3: 175 000 000 000 = «ciento setenta y cinco mil millones» (voz y escena)');
ok(content.segments.every((s) => !/\d/.test(s.es + s.en) || (s.tts?.es && s.tts?.en)), 'ningún segmento lleva dígitos sin texto para la voz');

console.log(bad ? `\n✗ ${bad} comprobación(es) fallan` : '\n✓ todo coincide');
process.exit(bad ? 1 : 0);
