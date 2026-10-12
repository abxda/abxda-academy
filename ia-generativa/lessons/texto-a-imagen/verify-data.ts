// Comprobación del modelo del navegador (nn.ts) contra los valores de referencia de train_toy.py, y recálculo de todas las
// cifras que dicen la voz, la escena y «por dentro». Sale con código 1 si algo no cuadra.
// Desde app/:   npx tsx src/content/courses/ia-generativa/lessons/texto-a-imagen/verify-data.ts
import { CLIP_REC, DEMO, GALLERY, REF, SWAP, WORLD } from './model';
import { caption, decode, dot, encodeBag, encodeText, eps, generate, readImage, tokens } from './nn';
import { GEN_SCALE, GUIDE_SEEDS, LIMIT_SEEDS, NEVER_SEEDS, PROMPTS, RESULT_SEEDS, SEEN_RATE, UNSEEN_BAD, UNSEEN_OK, UNSEEN_RATE, dataColors } from './state';

let bad = 0;
const close = (a: number, b: number, tol: number, what: string) => { if (!(Math.abs(a - b) <= tol)) { bad++; console.log(`✗ ${what}: ${a} vs ${b}`); } };
const same = (a: unknown, b: unknown, what: string) => { if (JSON.stringify(a) !== JSON.stringify(b)) { bad++; console.log(`✗ ${what}: ${JSON.stringify(a)} vs ${JSON.stringify(b)}`); } else console.log(`✓ ${what}: ${JSON.stringify(a)}`); };

// 1. mismas cuentas que PyTorch (pesos cuantizados a 8 bits)
REF.tok.forEach((ids: number[], i: number) => {
  encodeText(ids).forEach((v, j) => close(v, REF.te[i][j], 2e-4, `te[${i}][${j}]`));
  encodeBag(ids).forEach((v, j) => close(v, REF.bag[i][j], 2e-4, `bag[${i}][${j}]`));
  eps(REF.z, REF.t[i], encodeText(ids)).forEach((v, j) => close(v, REF.eps[i][j], 2e-3, `eps[${i}][${j}]`));
});
const pr = decode(REF.z);
REF.dec.forEach((row: number[], p: number) => row.forEach((v, k) => close(pr[p * 5 + k], v, 2e-4, `dec[${p}][${k}]`)));
console.log(bad ? `✗ ${bad} discrepancias con PyTorch` : '✓ nn.ts reproduce los valores de referencia de PyTorch');

// 2. el lector de reglas lee bien todas las imágenes reales de la lección
const real = [...DEMO.combos.map((c: number[], i: number) => [c, DEMO.imgs[i]]), ...GALLERY.combos.map((c: number[], i: number) => [c, GALLERY.imgs[i]]), ...SWAP.combos.map((c: number[], i: number) => [c, SWAP.imgs[i]])] as [number[], number[]][];
same(real.filter(([c, img]) => { const r = readImage(img); return r.shape === c[0] && r.fg === c[1] && r.bg === c[2]; }).length, real.length, 'lector: imágenes reales bien leídas (de 20)');

// 3. CLIP: coseno de la imagen de ejemplo con su frase y con otra (segmentos «cosine» y «goal»)
for (const lang of ['es', 'en'] as const) {
  const own = dot(encodeText(tokens(caption(0, 1, 2, lang)).ids), GALLERY.emb[0]), other = dot(encodeText(tokens(caption(2, 3, 0, lang)).ids), GALLERY.emb[0]);
  same([+own.toFixed(2), +other.toFixed(1)], [0.78, -0.3], `coseno con su frase y con otra (${lang})`);
}
// entrenamiento registrado: pasos, error del lote al inicio y al final, diagonal final
same(CLIP_REC.steps, [0, 5, 10, 20, 40, 80, 160, 320, 640, 1280, 2500], 'pasos registrados del entrenamiento de CLIP');
same([+CLIP_REC.loss.es[0].toFixed(1), +CLIP_REC.loss.en[0].toFixed(1), +CLIP_REC.loss.es[10].toFixed(2), +CLIP_REC.loss.en[10].toFixed(2)], [3.1, 2.6, 0, 0], 'error del lote: inicio es/en y final es/en');
const last = CLIP_REC.sims.es[10] as number[][];
same(last.map((r, i) => +r[i].toFixed(2)), [0.79, 0.8, 0.78, 0.79, 0.88, 0.87], 'diagonal final (es)');
// galería: cada frase elige su propia imagen
for (const lang of ['es', 'en'] as const) {
  const top1 = GALLERY.combos.filter((c: number[], i: number) => { const v = encodeText(tokens(caption(c[0], c[1], c[2], lang)).ids), s = (GALLERY.emb as number[][]).map((e) => dot(v, e)); return s.indexOf(Math.max(...s)) === i; }).length;
  same(top1, 12, `galería (${lang}): frases que eligen su propia imagen`);
}

// 4. la generación de la demostración y la lista de prompts (escala 3, semillas 1 a 4): todas cumplen
for (const lang of ['es', 'en'] as const) PROMPTS.forEach((c) => {
  const q = caption(c[0], c[1], c[2], lang), ok = RESULT_SEEDS.filter((sd) => { const r = generate(q, GEN_SCALE, sd).read; return r.shape === c[0] && r.fg === c[1] && r.bg === c[2]; }).length;
  same(ok, 4, `«${q}»: imágenes que cumplen (de 4)`);
});

// 5. la cuadrícula del guiado: círculos, combinaciones distintas y figuras magenta con escala 0, 1, 3 y 8
for (const [q, want] of [['círculo', { c: [11, 19, 21, 16], m: [18, 12, 7, 7] }], ['circle', { c: [11, 20, 23, 13], m: [18, 11, 6, 8] }]] as [string, { c: number[]; m: number[] }][]) {
  const circles: number[] = [], combos: number[] = [], magenta: number[] = [];
  for (const s of [0, 1, 3, 8]) {
    const reads = GUIDE_SEEDS.map((sd) => generate(q, s, sd).read);
    circles.push(reads.filter((r) => r.shape === 0).length); combos.push(new Set(reads.map((r) => `${r.shape}-${r.fg}-${r.bg}`)).size); magenta.push(reads.filter((r) => r.fg === 1).length);
  }
  same(circles, want.c, `«${q}» círculos con escala 0, 1, 3, 8`);
  same(combos, want.m, `«${q}» combinaciones distintas con escala 0, 1, 3, 8`);
  same([magenta[1], magenta[2]], [15, 22], `«${q}» figuras magenta con escala 1 y 3`);
}
// tasas con 256 ruidos (por dentro)
{
  const seeds = Array.from({ length: 256 }, (_, i) => 5000 + i), pct = (s: number) => Math.round((100 * seeds.filter((sd) => generate('círculo', s, sd).read.shape === 0).length) / 256);
  same([0, 1, 2, 4, 8].map(pct), [36, 80, 95, 93, 63], '«círculo»: % de círculos con 256 ruidos y escala 0, 1, 2, 4, 8');
}

// 6. sesgo en los datos: fracción de círculos magenta
same(+(dataColors(0)[1] * 100).toFixed(1), 64.9, 'datos: % de círculos magenta');

// 7. lo nunca visto: tiras de la escena y tasas medidas
for (const lang of ['es', 'en'] as const) {
  const read = (c: number[]) => LIMIT_SEEDS.map((sd) => { const r = generate(caption(c[0], c[1], c[2], lang), GEN_SCALE, sd).read; return r.shape === c[0] && r.fg === c[1] && r.bg === c[2]; });
  same(read(UNSEEN_OK).filter(Boolean).length, 4, `«${caption(UNSEEN_OK[0], UNSEEN_OK[1], UNSEEN_OK[2], lang)}»: bien (de 4)`);
  const badStrip = LIMIT_SEEDS.map((sd) => generate(caption(UNSEEN_BAD[0], UNSEEN_BAD[1], UNSEEN_BAD[2], lang), GEN_SCALE, sd).read);
  const circlesInstead = badStrip.filter((r) => r.shape === 0).length;
  if (circlesInstead < 1) { bad++; console.log(`✗ «${caption(UNSEEN_BAD[0], UNSEEN_BAD[1], UNSEEN_BAD[2], lang)}»: ningún círculo en la tira (la voz dice «a veces dibuja un círculo»)`); }
  else console.log(`✓ «${caption(UNSEEN_BAD[0], UNSEEN_BAD[1], UNSEEN_BAD[2], lang)}»: ${circlesInstead} de 4 salen círculo`);
}
{
  const hold = WORLD.hold as number[][], seeds = Array.from({ length: 16 }, (_, i) => 7000 + i);
  let okT = 0, nT = 0, okH = 0, nH = 0;
  for (let s = 0; s < 4; s++) for (let f = 0; f < 5; f++) for (let b = 0; b < 5; b++) {
    if (f === b) continue;
    const isHold = hold.some((h) => h[0] === s && h[1] === f && h[2] === b), q = caption(s, f, b, 'es');
    for (const sd of seeds) { const r = generate(q, 3, sd).read, ok = r.shape === s && r.fg === f && r.bg === b; if (isHold) { nH++; okH += +ok; } else { nT++; okT += +ok; } }
  }
  same([okT, nT, okH, nH], [Math.round(SEEN_RATE * 1120), 1120, Math.round(UNSEEN_RATE * 160), 160], 'vistas y nunca vistas (escala 3, 16 ruidos)');
}

// 8. quién va con quién: el codificador que lee el orden distingue; la bolsa de palabras empata
for (const lang of ['es', 'en'] as const) {
  const caps = SWAP.combos.map((c: number[]) => caption(c[0], c[1], c[2], lang)), I = SWAP.emb as number[][];
  const f = caps.map((q: string) => encodeText(tokens(q).ids)), g = caps.map((q: string) => encodeBag(tokens(q).ids));
  const flatOk = dot(f[0], I[0]) > dot(f[1], I[0]) && dot(f[1], I[1]) > dot(f[0], I[1]);
  const bagTie = Math.abs(dot(g[0], I[0]) - dot(g[1], I[0])) < 1e-9 && Math.abs(dot(g[0], I[1]) - dot(g[1], I[1])) < 1e-9;
  same([flatOk, bagTie], [true, true], `intercambio de colores (${lang}): lee el orden distingue · bolsa empata`);
}

// 9. lo que nunca vio: la palabra «y»/«and» no existe y sale una sola figura reconocible
for (const q of ['círculo y cruz', 'circle and cross']) {
  same(tokens(q).unknown, [q.includes('y') ? 'y' : 'and'], `«${q}»: palabras desconocidas`);
  same(NEVER_SEEDS.map((sd) => generate(q, GEN_SCALE, sd).read.shape >= 0), [true, true, true, true], `«${q}»: cada imagen se lee como una figura`);
}

process.exit(bad ? 1 : 0);
