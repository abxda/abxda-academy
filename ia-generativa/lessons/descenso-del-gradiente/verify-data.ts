// Comprobación reproducible de las cifras y afirmaciones calculables de la lección 4 (voz, escena, «por dentro», quiz).
//   npx tsx src/content/courses/ia-generativa/lessons/descenso-del-gradiente/verify-data.ts      (desde app/)
// Sale con código 1 si algo no coincide. No genera datos: recalcula de forma independiente las curvas de scene.ts
// (parábola L(w) = ½(w − 2.4)² + 0.2, paisaje irregular R(w), cuenco 2D girado) y ejecuta con Python 3 el código de «por dentro».
import { execFileSync } from 'node:child_process';
import content from './content';

let bad = 0;
const ok = (cond: boolean, msg: string) => { if (!cond) bad++; console.log(`${cond ? '✓' : '✗'} ${msg}`); };
const near = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps;
const r = (x: number, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

// ── 1 · la parábola de la escena: L(w) = ½(w − 2.4)² + 0.2 (curvatura h = 1) ──
const WS = 2.4, W0 = -0.6;
const L = (w: number) => 0.5 * (w - WS) ** 2 + 0.2;
const dL = (w: number) => w - WS;
const traj = (w0: number, eta: number, n: number) => { const a = [w0]; for (let i = 0; i < n; i++) a.push(a[i] - eta * dL(a[i])); return a; };
ok(near(dL(W0), -3) && near(L(W0), 4.7), 'en w = −0.6 la pendiente es −3 (la curva baja hacia la derecha: segmento slope) y el error 4.7');
// el factor (1 − ηh): w_{t+1} − w* = (1 − η)(w_t − w*) con h = 1
{
  const p = traj(W0, 0.37, 6);
  ok(p.every((w, i) => i === 0 || near(w - WS, (1 - 0.37) * (p[i - 1] - WS), 1e-12)), 'w_{t+1} − w* = (1 − ηh)(w_t − w*) con h = 1');
}
const half = traj(W0, 0.5, 8);
ok(half.every((w, i) => i === 0 || near(Math.abs(w - WS), Math.abs(half[i - 1] - WS) / 2, 1e-12)), 'con η = 0.5 cada paso reduce a la mitad la distancia al fondo');
ok(near(traj(W0, 1, 1)[1], WS), 'con η = 1 llega de un salto');
// el error baja y la pendiente se aplana en cada paso con η = 0.5 (segmento repeat)
ok(half.slice(1).every((w, i) => L(w) < L(half[i]) && Math.abs(dL(w)) < Math.abs(dL(half[i]))), 'con η = 0.5 el error baja y la pendiente se aplana en cada paso');
// tres regímenes (η·h < 1, entre 1 y 2, > 2) con las tasas de la escena
const cross = (p: number[]) => p.slice(1).filter((w, i) => (w - WS) * (p[i] - WS) < 0).length;
const dist = (p: number[]) => p.map((w) => Math.abs(w - WS));
{
  const small = traj(W0, 0.06, 12), good = traj(W0, 0.7, 5), osc = traj(W0, 1.7, 9), div = traj(W0, 2.08, 5);
  ok(cross(small) === 0 && dist(small)[12] > 1.4 && r(dist(small)[12]) === 1.43, `η = 0.06: sin cruzar, tras 12 pasos sigue a ${r(dist(small)[12])} del fondo (era 3.0): «aún lejos»`);
  ok(cross(good) === 0 && dist(good)[5] < 0.01, `η = 0.7: no cruza el fondo y tras 5 pasos está a ${r(dist(good)[5], 4)}`);
  ok(cross(osc) === 9 && dist(osc).every((v, i) => i === 0 || v < dist(osc)[i - 1]), 'η = 1.7: cruza el fondo en los 9 pasos pero la distancia baja (oscila y converge)');
  ok(cross(div) === 5 && dist(div).every((v, i) => i === 0 || v > dist(div)[i - 1]) && L(div[5]) > L(div[0]), `η = 2.08: cruza y la distancia crece en cada paso; el error pasa de ${r(L(div[0]))} a ${r(L(div[5]))}: diverge`);
  // el factor |1 − η|: justo en η = 2 rebota sin acercarse
  const edge = traj(W0, 2, 6);
  ok(edge.every((w, i) => i === 0 || near(Math.abs(w - WS), 3, 1e-12)), 'con η·h = 2 exacto la distancia no cambia (rebota sin acercarse ni alejarse)');
}
// el gate del turno 2: «llegue al fondo en diez pasos o menos, sin oscilar» (|w − w*| < 0.08 y η ≤ 1)
{
  const conv = (eta: number) => { const p = traj(W0, eta, 40); const k = p.findIndex((w) => Math.abs(w - WS) < 0.08); return k; };
  const okEtas: number[] = [];
  for (let e = 0.04; e <= 2.4001; e += 0.02) { const k = conv(r(e)); if (k > 0 && k <= 10 && r(e) <= 1) okEtas.push(r(e)); }
  ok(okEtas[0] === 0.32 && okEtas[okEtas.length - 1] === 1 && conv(0.5) === 6, `gate lr: lo cumplen η de ${okEtas[0]} a ${okEtas[okEtas.length - 1]} (η = 0.5 llega en ${conv(0.5)} pasos)`);
  ok(conv(0.3) === 11, 'con η = 0.3 llegaría en 11 pasos (no cumple); el deslizador va de 0.04 a 2.4 en pasos de 0.02');
}

// ── 2 · el cuaderno de «por dentro»: código y comentario ──
{
  const py = (md: string) => /```python\n([\s\S]*?)```/.exec(md)?.[1] ?? '';
  for (const lang of ['es', 'en'] as const) {
    const code = py(content.deeper[lang]);
    const want = /# (\[.*\])\s*$/m.exec(code)?.[1] ?? '';
    const out = execFileSync('python3', ['-c', code], { encoding: 'utf8' }).trim();
    ok(out === want && out === '[-0.6, 0.9, 1.65, 2.025, 2.2125, 2.30625]', `python (${lang}): salida ${out} = comentario del código`);
  }
  ok(near(2 - 0.1 * 4, 1.6), 'quiz: 2 − 0.1 × 4 = 1.6');
}

// ── 3 · varias dimensiones: umbral 2/λmax, mejor tasa 2/(λmax + λmin) y factor (κ − 1)/(κ + 1) ──
{
  // cuadrática diagonal L = ½ Σ λ_i x_i²; el paso x ← (1 − ηλ_i) x. El factor por paso es máx_i |1 − ηλ_i|.
  const lam = [1, 7];                                        // los de la escena 2D: H2 = [1, 7]
  const factor = (eta: number) => Math.max(...lam.map((l) => Math.abs(1 - eta * l)));
  const lmax = Math.max(...lam), lmin = Math.min(...lam), kappa = lmax / lmin;
  ok(factor(2 / lmax - 1e-9) < 1 && near(factor(2 / lmax), 1) && factor(2 / lmax + 1e-3) > 1, `converge si y solo si η < 2/λmax = ${r(2 / lmax, 4)} (el factor cruza 1 ahí)`);
  let best = { eta: 0, f: Infinity };
  for (let e = 0.0001; e < 2 / lmax; e += 0.0001) if (factor(e) < best.f) best = { eta: e, f: factor(e) };
  ok(near(best.eta, 2 / (lmax + lmin), 2e-4) && near(best.f, (kappa - 1) / (kappa + 1), 1e-3), `mejor tasa fija por búsqueda: η = ${r(best.eta, 4)} ≈ 2/(λmax+λmin) = ${r(2 / (lmax + lmin), 4)}; factor ${r(best.f, 4)} ≈ (κ−1)/(κ+1) = ${r((kappa - 1) / (kappa + 1), 4)}`);
  // con la tasa de la escena (η = 0.2) el camino zigzaguea en el eje de curvatura 7 (factor −0.4) y avanza lento en el eje plano (0.8)
  ok(near(1 - 0.2 * 7, -0.4) && near(1 - 0.2 * 1, 0.8), 'η = 0.2 en la escena 2D: factor −0.4 (zigzag) en la dirección empinada y 0.8 en la plana');
  // aleatorio: para varias parejas (λmin, λmax) la fórmula se cumple
  let allOk = true;
  for (const [a, b] of [[0.5, 3], [1, 100], [2, 2.5], [0.1, 10]]) {
    const f = (e: number) => Math.max(Math.abs(1 - e * a), Math.abs(1 - e * b));
    let bf = Infinity, be = 0; for (let e = 1e-5; e < 2 / b; e += 1e-5) if (f(e) < bf) { bf = f(e); be = e; }
    const k = b / a; if (!(near(be, 2 / (a + b), 1e-4) && near(bf, (k - 1) / (k + 1), 1e-3))) allOk = false;
  }
  ok(allOk, 'la fórmula del mejor η y de (κ−1)/(κ+1) se cumple también con (0.5, 3), (1, 100), (2, 2.5) y (0.1, 10)');
}

// ── 4 · el paisaje 2D de la escena: el gradiente es perpendicular a las curvas de nivel ──
{
  const C2 = [1.2, -0.4], ANG = 0.5, H2 = [1, 7];
  const rot = (x: number, y: number) => { const dx = x - C2[0], dy = y - C2[1]; return [dx * Math.cos(ANG) + dy * Math.sin(ANG), -dx * Math.sin(ANG) + dy * Math.cos(ANG)]; };
  const L2 = (x: number, y: number) => { const [u, v] = rot(x, y); return 0.5 * (H2[0] * u * u + H2[1] * v * v); };
  const g2 = (x: number, y: number): [number, number] => { const [u, v] = rot(x, y); const gu = H2[0] * u, gv = H2[1] * v; return [gu * Math.cos(ANG) - gv * Math.sin(ANG), gu * Math.sin(ANG) + gv * Math.cos(ANG)]; };
  const e = 1e-6;
  const num = (x: number, y: number): [number, number] => [(L2(x + e, y) - L2(x - e, y)) / (2 * e), (L2(x, y + e) - L2(x, y - e)) / (2 * e)];
  const [gx, gy] = g2(-1, 0), [nx, ny] = num(-1, 0);
  ok(near(gx, nx, 1e-5) && near(gy, ny, 1e-5), `el gradiente analítico de la escena (${r(gx, 3)}, ${r(gy, 3)}) coincide con el numérico`);
  // la tangente a la curva de nivel en (−1, 0) es perpendicular al gradiente: L2 apenas cambia al moverse en esa dirección
  const gl = Math.hypot(gx, gy), tx = -gy / gl, ty = gx / gl, d = 1e-4;
  ok(Math.abs(L2(-1 + d * tx, d * ty) - L2(-1, 0)) < 1e-7 && L2(-1 + d * gx / gl, d * gy / gl) > L2(-1, 0), 'a lo largo de la curva de nivel el error no cambia y, en la dirección del gradiente, sube: el gradiente es perpendicular a las curvas y apunta cuesta arriba');
  const path: [number, number][] = [[-1, 0]]; for (let i = 0; i < 16; i++) { const [x, y] = path[i], [a, b] = g2(x, y); path.push([x - 0.2 * a, y - 0.2 * b]); }
  const vs = path.map(([x, y]) => rot(x, y)[1]);
  ok(vs.slice(1).every((v, i) => v * vs[i] < 0) && L2(...path[16]) < L2(...path[0]) / 50, `el camino de 16 pasos cambia de lado en la dirección empinada en cada paso (zigzag) y el error baja de ${r(L2(...path[0]))} a ${r(L2(...path[16]), 3)}`);
}

// ── 5 · el paisaje irregular del segmento rugged: dos puntos de partida, dos valles ──
{
  const R = (w: number) => 0.08 * w ** 4 - 0.6 * w ** 2 + 0.25 * w + 2.0;
  const dR = (w: number) => 0.32 * w ** 3 - 1.2 * w + 0.25;
  const run = (w0: number) => { let w = w0; for (let i = 0; i < 40; i++) w -= 0.12 * dR(w); return w; };
  const A = run(-0.9), B = run(0.9);
  // mínimos locales: ceros de dR con R'' > 0
  const roots: number[] = []; for (let w = -3.2; w < 3.2; w += 0.001) if (dR(w) * dR(w + 0.001) < 0) roots.push(w);
  const d2R = (w: number) => 0.96 * w ** 2 - 1.2;
  const mins = roots.filter((w) => d2R(w) > 0), maxs = roots.filter((w) => d2R(w) < 0);
  ok(mins.length === 2 && maxs.length === 1, `R(w) tiene dos mínimos locales (w ≈ ${mins.map((m) => r(m)).join(' y ')}) y un máximo local entre ellos (w ≈ ${maxs.map((m) => r(m)).join('')})`);
  ok(A < maxs[0] && B > maxs[0] && Math.abs(A - mins[0]) < 0.02 && Math.abs(B - mins[1]) < 0.02, `desde −0.9 el descenso acaba en w = ${r(A, 3)} (valle izquierdo) y desde 0.9 en w = ${r(B, 3)} (valle derecho), con la misma tasa 0.12 y la misma regla`);
  ok(R(A) < R(B), `los dos valles no son igual de profundos: error ${r(R(A), 3)} (A) frente a ${r(R(B), 3)} (B); la escena muestra A ${r(R(A))} y B ${r(R(B))}`);
}

// ── 6 · cifras de la escala ──
ok(175e9 === 175000000000 && /ciento setenta y cinco mil millones/.test(content.segments.find((s) => s.id === 'scale')!.es), 'GPT-3: 175 000 000 000 = «ciento setenta y cinco mil millones» (en voz y escena)');

console.log(bad ? `\n✗ ${bad} comprobación(es) fallan` : '\n✓ todo coincide');
process.exit(bad ? 1 : 0);
