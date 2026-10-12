// Comprueba que las cifras que dice la lección (narración, lienzo y «por dentro») salen de los datos.
// Uso (desde app/): npx tsx src/content/courses/ia-generativa/lessons/atencion/verify-data.ts
import { A, ATT_A, ATT_B, B, MAP_A, avgMax, demoAt, type Lang } from './data';
import { REAL } from './real-data';

let bad = 0;
const ok = (cond: boolean, msg: string) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) bad++; };
const r = (x: number, d = 0) => Math.round(x * 10 ** d) / 10 ** d;
const argmax = (a: number[]) => a.indexOf(Math.max(...a));

for (const L of ['es', 'en'] as Lang[]) {
  const T = A[L], att = ATT_A[L];
  ok(T.tok.length === 8, `${L}: la frase A tiene ocho tokens (${T.tok.join(' ')})`);
  ok(JSON.stringify(att.s.map((x) => r(x, 1))) === JSON.stringify([-1.6, 0.7, -1.6, -1.6, 0, -1.6, -1.6, 1.8]), `${L}: puntuaciones 1.8 · 0.7 · 0 · −1.6 (los otros cinco)`);
  ok(r(att.e[7], 1) === 6 && r(att.e[1], 1) === 2 && att.e[4] === 1 && r(att.e[0], 1) === 0.2, `${L}: exponenciales 6.0 · 2.0 · 1.0 · 0.2`);
  ok(r(att.e.reduce((a, b) => a + b, 0)) === 10, `${L}: la suma de exponenciales es ≈ 10`);
  ok([60, 20, 10, 2].join() === [att.w[7], att.w[1], att.w[4], att.w[0]].map((w) => r(w * 100)).join(), `${L}: pesos 60 · 20 · 10 · 2 %`);
  ok(r(att.w.reduce((a, b) => a + b, 0), 6) === 1, `${L}: los pesos suman 100 %`);
  ok(r(att.out[0], 2) === 0.75 && r(att.out[1], 2) === 0.05, `${L}: nuevo «banco» = (0.75, 0.05)`);
  const tb = B[L], ab = ATT_B[L];
  ok(argmax(ab.w) === tb.ctx && ab.out[1] > ab.out[0], `${L}: en la frase B la clave que más coincide es «${tb.tok[tb.ctx]}» y el resultado va hacia «dinero» (${ab.out.map((x) => r(x, 2)).join(', ')})`);
  // el mapa: las filas que nombra la narración (map-demo)
  ok(argmax(MAP_A[4]) === 7 && argmax(MAP_A[7]) === 4 && argmax(MAP_A[0]) === 1 && argmax(MAP_A[1]) === 0, `${L}: banco→jardín, jardín→banco, me→senté, senté→me`);
  // mapas reales
  const R = REAL[L], h0 = R.heads[0];
  ok(R.words.A.length === 11 && R.words.A[R.q.A] === (L === 'es' ? 'banco' : 'bank'), `${L}: BERT ve 11 piezas (${R.words.A.join(' ')})`);
  ok(argmax(h0.M[R.q.A]) === R.ctx.A && argmax(h0.rowB!) === R.ctx.B, `${L}: cabeza «sentido» (capa ${h0.layer}, cabeza ${h0.head}): mayor peso de «banco» en «${R.words.A[R.ctx.A]}» (${r(h0.M[R.q.A][R.ctx.A] * 100)} %) y, con la otra frase, en «${R.words.B[R.ctx.B]}» (${r(h0.rowB![R.ctx.B] * 100)} %)`);
  for (const h of R.heads.slice(1)) ok((h.metric ?? 0) >= 0.6, `${L}: cabeza «${h.kind}» (capa ${h.layer}, cabeza ${h.head}) con peso promedio ${h.metric}`);
  ok(R.nCtxBoth <= 10, `${L}: pocas cabezas «giran» con el sentido: ${R.nCtxBoth} de 144`);
  ok(R.nMarkTop >= 50, `${L}: en ${R.nMarkTop} de 144 cabezas el mayor peso de «banco» cae en una marca («muchas»)`);
}
// √d
const d64 = demoAt(6), d1 = demoAt(0);
ok(Math.round(d64.d) === 64 && Math.round(d1.d) === 1, 'la demostración recorre d = 1 … 64');
ok(r(Math.max(...d64.wRaw), 2) === 0.98 && r(Math.max(...d64.wScaled), 2) === 0.35, `d = 64: peso mayor 98 % sin dividir y 35 % dividiendo (${r(Math.max(...d64.wRaw), 2)}, ${r(Math.max(...d64.wScaled), 2)})`);
const [a64, s64] = avgMax(64);
ok(r(a64, 2) === 0.89 && r(s64, 2) === 0.36, `promedio de 100 sorteos con d = 64: ${r(a64, 2)} y ${r(s64, 2)}`);
ok(Math.sqrt(64) === 8, 'raíz de 64 = 8 («unas ocho veces»)');
console.log(bad ? `\n${bad} discrepancia(s)` : '\n0 discrepancias');
process.exit(bad ? 1 : 0);
