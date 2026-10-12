// Comprueba que cada cifra que dice la narración sale del modelo de la escena (lm.ts, demo.ts), en los dos idiomas.
//   npx tsx src/content/courses/ia-generativa/lessons/siguiente-palabra/verify-data.ts      (desde app/)
// Sale con código 1 si algo no coincide.
import { demoOf, runOf, SEEDS_3, WORDS } from './demo';
import { choose, CORPUS, inCorpus, modelOf, probs, rowsFor, softmax, truncate, type Lang } from './lm';

let bad = 0;
const ok = (cond: boolean, msg: string) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) bad++; };
const near = (a: number, b: number, e = 1e-9) => Math.abs(a - b) < e;
const r0 = (x: number) => Math.round(x * 100);

// el texto es paralelo palabra por palabra: correspondencia uno a uno
{
  const es = CORPUS.es.join(' ').split(' '), en = CORPUS.en.join(' ').split(' ');
  const f = new Map<string, string>(), g = new Map<string, string>();
  let bij = es.length === en.length;
  es.forEach((w, i) => { if ((f.get(w) ?? en[i]) !== en[i] || (g.get(en[i]) ?? w) !== w) bij = false; f.set(w, en[i]); g.set(en[i], w); });
  ok(bij, `texto paralelo: ${es.length} piezas, correspondencia uno a uno entre ${f.size} palabras`);
  for (const k of Object.keys(WORDS.es) as (keyof typeof WORDS.es)[]) if (k !== 'oceano') ok(f.get(WORDS.es[k]) === WORDS.en[k], `WORDS.${k}: ${WORDS.es[k]} ↔ ${WORDS.en[k]}`);
}

for (const lang of ['es', 'en'] as Lang[]) {
  console.log(`\n── ${lang} ──`);
  const m = modelOf(lang), D = demoOf(lang), W = D.W;
  ok(CORPUS[lang].length === 8, 'text: ocho frases');
  // find / next / divide
  const occ = m.toks.filter((w) => w === W.es).length;
  ok(occ === 8, `find: «${W.es}» aparece ${occ} veces (ocho)`);
  const es = rowsFor(m, W.es)!;
  ok(es.map((r) => `${r.w}:${r.c}`).join(' ') === `${W.azul}:4 ${W.gris}:2 ${W.grande}:1 ${W.oscuro}:1`, `next: ${es.map((r) => `${r.w} ${r.c}`).join(', ')} (cuatro, dos, una, una)`);
  ok(D.esP.map((x) => x.p).join() === '0.5,0.25,0.125,0.125', 'bars/divide: 50 %, 25 %, 12.5 %, 12.5 %');
  // rows
  const el = rowsFor(m, W.el)!, tot = el.reduce((a, r) => a + r.c, 0);
  ok(el[0].w === W.cielo && el[0].c === 5 && tot === 9, `rows: tras «${W.el}», «${W.cielo}» ${el[0].c} de ${tot} (cinco de nueve)`);
  ok(m.t1.size === 15, `rows: ${m.t1.size} filas (se muestran 6, «y 9 filas más»)`);
  // autoreg
  const az = probs(rowsFor(m, W.azul)!);
  ok(az[0].w === '.' && near(az[0].p, 0.75) && az[1].w === W.y && near(az[1].p, 0.25), 'autoreg: tras «azul», punto 75 % e «y» 25 %');
  ok(D.esP[0].w === W.azul, 'pick1: «azul» es la primera fila (la más probable)');
  // run / new-sentence
  const run = D.runWords.join(' ');
  const want = lang === 'es' ? 'el cielo es azul . de noche el mar es oscuro .' : 'the sky is blue . at night the sea is dark .';
  ok(run === want, `run: «${run}»`);
  const novel = D.runWords.slice(D.novel[0], D.novel[1] + 1);
  ok(!CORPUS[lang].includes(novel.join(' ')) && !inCorpus(m, novel.slice(0, -1)), `new-sentence: «${novel.join(' ')}» no está en el texto`);
  ok(inCorpus(m, [W.de, W.noche, W.el]) && inCorpus(m, [W.el, W.mar, W.es]) && inCorpus(m, [W.es, W.oscuro, '.']), 'new-sentence: los tres pedazos sí están en el texto');
  ok(CORPUS[lang][4].startsWith(`${W.de} ${W.noche} ${W.el}`) && CORPUS[lang][4].endsWith(`${W.es} ${W.oscuro} .`), 'pedazos 1 y 3: de la frase 5');
  ok(CORPUS[lang][1].startsWith(`${W.el} ${W.mar} ${W.es}`) && CORPUS[lang][6].startsWith(`${W.el} ${W.mar} ${W.es}`), 'pedazo 2: de las frases 2 y 7');
  // greedy
  const g = D.greedy.join(' '), unit = `${W.el} ${W.cielo} ${W.es} ${W.azul} .`;
  ok(g === [unit, unit, unit].join(' '), `greedy: «${g}» (ciclo)`);
  // dart
  const dc = [0, 0, 0, 0]; D.darts.forEach((u) => dc[choose(D.esP, u)]++);
  ok(dc.join('/') === '5/3/1/1', `dart: diez dardos → ${dc.join('/')} (azul más o menos la mitad)`);
  // sample-runs
  const r3 = SEEDS_3.map((s) => runOf(m, D.start, s).join(' '));
  ok(new Set(r3).size === 3 && r3.every((t) => t.startsWith(D.start.join(' '))), `sample-runs: tres textos distintos desde «${D.start.join(' ')}»`);
  r3.forEach((t) => console.log('   ', t));
  // limit-short / limit-unseen
  ok(rowsFor(m, W.oceano) === null && !m.toks.includes(W.oceano), `limit-unseen: «${W.oceano}» no está en el texto (cero cuentas)`);
  ok(m.toks.join(' ').includes(`${W.el} ${W.sol} ${W.es}`), `limit-short: «${W.el} ${W.sol} ${W.es}» existe en el texto; la fila de «${W.es}» da «${W.azul}» 50 %`);
  // scores / exp / sum-divide / softmax-result
  const z = es.map((r) => Math.log(r.c) - Math.log(2)), e = z.map(Math.exp), se = e.reduce((a, b) => a + b, 0);
  ok(z.map((v) => (Math.round(v * 10) / 10 || 0).toFixed(1)).join(' ') === '0.7 0.0 -0.7 -0.7', `scores: ${z.map((v) => v.toFixed(3)).join(', ')} (en pantalla 0.7, 0, −0.7, −0.7)`);
  ok(e.map((v) => +v.toFixed(6)).join() === '2,1,0.5,0.5' && near(se, 4), 'exp/sum-divide: 2, 1, 0.5, 0.5; suma 4');
  ok(near(Math.exp(0.7), 2.0138, 1e-3) && near(Math.exp(-0.7), 0.4966, 1e-3), 'exp: con los valores redondeados, e^0.7 ≈ 2.01 y e^−0.7 ≈ 0.50 («casi dos», «un medio»)');
  ok(softmax(z).map((v) => +v.toFixed(9)).join() === '0.5,0.25,0.125,0.125', 'softmax-result: 50, 25, 12.5, 12.5 % (las mismas barras)');
  ok(near(z.reduce((a, b) => a + b, 0), -Math.log(2), 1e-12), 'not-probs: los puntajes suman −0.69 («suma −0.7»)');
  // temperatura
  const p05 = softmax(z, 0.5), p2 = softmax(z, 2), p01 = softmax(z, 0.1);
  ok(r0(p05[0]) === 73, `temp-low: con 0.5, azul ${(p05[0] * 100).toFixed(1)} % (setenta y tres)`);
  ok(z.map((v) => (v / 0.5).toFixed(1)).join(' ') === '1.4 0.0 -1.4 -1.4', 'temp-low: los puntajes se duplican (1.4, 0, −1.4)');
  ok(r0(p2[0]) === 37 && r0(p2[3]) === 18, `temp-high: con 2, azul ${(p2[0] * 100).toFixed(1)} % (treinta y siete) y oscuro ${(p2[3] * 100).toFixed(1)} % (dieciocho)`);
  const draws = (T: number) => D.draws.map((u) => choose(probs(es, T), u));
  const cnt = (T: number) => { const c = [0, 0, 0, 0]; draws(T).forEach((i) => c[i]++); return c; };
  ok(p01[0] > 0.999 && cnt(0.1)[0] === 10, `temp-zero: con 0.1, azul ${(p01[0] * 100).toFixed(2)} % y los diez sorteos dan «azul»`);
  ok(cnt(0.5)[0] >= 6, `temp-zero: con 0.5, sorteos ${cnt(0.5).join('/')}`);
  ok(cnt(2).filter((c) => c > 0).length >= 3, `temp-high: con 2, sorteos ${cnt(2).join('/')} («sale de todo»)`);
  // top-k / top-p
  const tk = truncate(D.esP, { topK: 2 });
  ok(tk.filter((x) => x.keep).length === 2 && r0(tk[0].q) === 67 && r0(tk[1].q) === 33, 'topk: k = 2 deja azul y gris, con 67 % y 33 %');
  const tp = truncate(D.esP, { topP: 0.7 });
  ok(tp.filter((x) => x.keep).length === 2 && near(tp[0].p + tp[1].p, 0.75), 'topp: p = 70 % deja azul y gris, que juntan 75 %');
  const tc = truncate(probs(rowsFor(m, W.cielo)!), { topP: 0.7 });
  ok(tc.length === 1 && tc[0].w === W.es && near(tc[0].p, 1), `topp-adapt: tras «${W.cielo}», «${W.es}» sola junta 100 % (deja 1); tras «${W.es}», deja 2`);
}

console.log('\n── cifras externas (de sus artículos; ver el registro de verificación) ──');
ok(Math.round(175e9 / 117e6) === 1496, `gpt23: 175 000 millones ÷ 117 millones = ${(175e9 / 117e6).toFixed(0)} («unas mil quinientas veces»)`);

console.log(bad ? `\n${bad} discrepancia(s)` : '\n0 discrepancias');
process.exit(bad ? 1 : 0);
