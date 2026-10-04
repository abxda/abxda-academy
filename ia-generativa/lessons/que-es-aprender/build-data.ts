// Regenera los datos de la lección «Programar o aprender» y comprueba CADA cifra que la voz, la escena o «por dentro» afirman.
//   desde app/:  npx tsx src/content/courses/ia-generativa/lessons/que-es-aprender/build-data.ts [--seeds]
// Sale con código 1 si algo no coincide. `--seeds` repite la búsqueda de las 400 semillas candidatas (tarda unos segundos).
// La receta de los datos está descrita en el encabezado de data.ts; aquí está hecha código.
import { gauss, rng } from '../../../../../core/scene/math';
import {
  BAD_MODEL, BEST, BY_N, FINAL, FRESH, MAIL, PATH, RULES, SIZES, START, TRAIN, fit, handHits, measureMail, modelHits, score, subset, type Pt,
} from './data';

const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

/** n correos alternando normal (fila par) y spam (fila impar), con la receta de data.ts. */
export function gen(seed: number, n: number): Pt[] {
  const r = rng(seed), out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const y = (i % 2) as 0 | 1, u = r(), zl = gauss(r), zc = gauss(r);
    const [ml, sl, mc, sc, lo] = y === 0
      ? (u < 0.18 ? [5.5, 1.5, 7, 3, 1] : [1.8, 1.5, 8, 3.8, 1])    // normal: boletín con muchos enlaces / correo corriente
      : (u < 0.2 ? [0.8, 1.0, 24, 6, 4] : [5.2, 2.1, 19, 8, 4]);    // spam: «sin enlaces y a gritos» / spam corriente
    out.push({ l: Math.max(0, Math.round(ml + sl * zl)), c: Math.round(clamp(mc + sc * zc, lo, 40) * 10) / 10, y });
  }
  return out;
}

let bad = 0;
const check = (what: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) bad++;
  console.log(`${ok ? '✓' : '✗'} ${what}: ${JSON.stringify(got)}${ok ? '' : `  (la lección dice ${JSON.stringify(want)})`}`);
};
const same = (a: Pt[], b: Pt[]) => a.length === b.length && a.every((p, i) => p.l === b[i].l && p.c === b[i].c && p.y === b[i].y);

// ── 1. los datos salen de la receta ──
check('TRAIN = gen(190, 30)', same(gen(190, 30), TRAIN), true);
check('FRESH = gen(191, 60)', same(gen(191, 60), FRESH), true);
check('15 + 15 spam en TRAIN; 30 + 30 en FRESH', [TRAIN.filter((p) => p.y).length, FRESH.filter((p) => p.y).length], [15, 30]);

// ── 2. la tarjeta del inicio ──
for (const lang of ['es', 'en'] as const) {
  const m = measureMail(MAIL[lang]);
  check(`tarjeta (${lang}): enlaces y % de mayúsculas`, [m.links, Math.round(m.caps)], [4, 22]);
}

// ── 3. la regla a mano ──
const hits = RULES.map((r) => handHits(r.a, r.b, TRAIN)), fresh = RULES.map((r) => handHits(r.a, r.b, FRESH));
check('reglas posibles con los deslizadores', RULES.length, 360);
check('ninguna regla acierta los 30 (voz: «sea cual sea tu regla, quedan errores»); la mejor, vistos', BEST.seen, 28);
check('mejores reglas empatadas y su rango con los 60 nuevos', [BEST.count, BEST.freshLo, BEST.freshHi], [6, 47, 52]);
const i0 = RULES.findIndex((r) => r.a === 7 && r.b === 28);
check('regla inicial (7; 28 %): vistos y nuevos', [hits[i0], fresh[i0]], [19, 42]);
check('reglas que cumplen el gate (24 de 30 o más)', hits.filter((h) => h >= 24).length, 84);
const dp = RULES.map((_, i) => (fresh[i] / 60 - hits[i] / 30) * 100).filter((_, i) => hits[i] >= 24);
const eq = (x: number) => Math.abs(x) < 0.5;
check('de esas 84: bajan / suben / igual con los nuevos', [dp.filter((x) => x < -0.5).length, dp.filter((x) => x > 0.5).length, dp.filter(eq).length], [58, 16, 10]);
check('de esas 84: diferencia media (puntos, nuevos − vistos)', Math.round((dp.reduce((a, b) => a + b, 0) / dp.length) * 10) / 10, -3.2);
const j = RULES.findIndex((r) => r.a === 5 && r.b === 17);
check('una regla afinada que aguanta (5; 17 %): vistos y nuevos', [hits[j], fresh[j]], [27, 54]);

// ── 4. el modelo aprendido ──
check('punto de partida', START, { w1: -0.32, w2: 0.0625, b: 0.8450000000000002 });
check('parámetros finales (unidades originales)', FINAL, { w1: 0.69, w2: 0.53, b: -9.63 });
check('modelo final: vistos y nuevos', [modelHits(FINAL, TRAIN), modelHits(FINAL, FRESH)], [27, 52]);
check('pasos del entrenamiento', PATH.length - 1, 300);
const tab = SIZES.map((n) => [n, modelHits(BY_N[n], subset(n)), modelHits(BY_N[n], FRESH)]);
check('con 4 ejemplos: vistos y nuevos', tab[0], [4, 4, 48]);
check('con 8 ejemplos: vistos y nuevos', tab.find((t) => t[0] === 8), [8, 8, 50]);
check('con 12 a 30 ejemplos, nuevos', tab.filter((t) => t[0] >= 12).map((t) => t[2]), Array(10).fill(52));
check('hasta 20 ejemplos acierta todos los que vio', tab.filter((t) => t[0] <= 20).every((t) => t[1] === t[0]), true);
check('el ejemplo de uso (2 enlaces, 24 %): puntaje', Math.round(score(FINAL, 2, 24) * 100) / 100, 4.47);

// ── 5. la advertencia: cuatro etiquetas torcidas ──
check('con 4 etiquetas torcidas: parámetros y aciertos con los nuevos', [BAD_MODEL, modelHits(BAD_MODEL, FRESH)], [{ w1: 0.09, w2: 0.07, b: -1.97 }, 43]);

// ── 6. el cálculo del quiz ──
check('quiz: 0,5·6 + 0,1·20 − 4', Math.round((0.5 * 6 + 0.1 * 20 - 4) * 1e9) / 1e9, 1);

// ── 7. el código de «por dentro» (mismo algoritmo, 8 ejemplos) ──
{
  const datos = [[0, 5, 0], [1, 8, 0], [2, 10, 0], [3, 7, 0], [4, 20, 1], [6, 25, 1], [7, 15, 1], [9, 30, 1]];
  let w1 = 0, w2 = 0, b = 0;
  for (let k = 0; k < 2000; k++) {
    let g1 = 0, g2 = 0, gb = 0;
    for (const [l, c, y] of datos) { const e = 1 / (1 + Math.exp(-(w1 * l / 10 + w2 * c / 100 + b))) - y; g1 += e * l / 10; g2 += e * c / 100; gb += e; }
    w1 -= 0.1 * g1 / datos.length; w2 -= 0.1 * g2 / datos.length; b -= 0.1 * gb / datos.length;
  }
  const r1 = (x: number) => Math.round(x * 10) / 10;
  check('código: pesos tras 2000 pasos', [r1(w1), r1(w2), r1(b)], [7.7, 2.8, -3.3]);
  check('código: puntajes de (1, 6), (8, 12) y (5, 30)', [[1, 6], [8, 12], [5, 30]].map(([l, c]) => r1(w1 * l / 10 + w2 * c / 100 + b)), [-2.3, 3.3, 1.5]);
}

// ── 8. (opcional) por qué estas semillas: 400 candidatas ──
if (process.argv.includes('--seeds')) {
  const rows: { s: number; best: number; lo: number; hi: number; ms: number; mf: number }[] = [];
  for (let s = 0; s < 400; s++) {
    const T = gen(s, 30), F = gen(s + 1, 60), m = fit(T).at(-1)!;
    const hs = RULES.map((r) => handHits(r.a, r.b, T)), top = Math.max(...hs), f = RULES.filter((_, i) => hs[i] === top).map((r) => handHits(r.a, r.b, F));
    rows.push({ s, best: top, lo: Math.min(...f), hi: Math.max(...f), ms: modelHits(m, T), mf: modelHits(m, F) });
  }
  const med = (k: 'best' | 'lo' | 'hi' | 'ms' | 'mf') => { const v = rows.map((r) => r[k]).sort((a, b) => a - b); return (v[199] + v[200]) / 2; };
  console.log('mediana de las 400 semillas: mejor regla (vistos)', med('best'), '· su rango con los nuevos', med('lo'), 'a', med('hi'), '· modelo vistos', med('ms'), '· nuevos', med('mf'));
  console.log('semilla 190:', rows[190]);
}

console.log(bad ? `\nFALLAN ${bad}` : '\ntodo coincide');
process.exitCode = bad ? 1 : 0;
