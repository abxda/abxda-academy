// El transformer diminuto de la lección, ejecutado de verdad en el navegador (TypeScript puro, sin dependencias).
// Los pesos (weights.ts) los entrena train_tiny.py; aquí está el MISMO pase hacia delante que en PyTorch, y
// verify-forward.mts comprueba que los logits y las atenciones coinciden con los de PyTorch (error < 1e-3).
//
// Arquitectura (estilo GPT-2, a escala de juguete):
//   x₀ = E[token] + PE[posición]                         (PE sinusoidal fija, Vaswani et al. 2017)
//   por cada bloque:   x ← x + Atención(LN₁(x))           (con máscara causal)
//                      x ← x + MLP(LN₂(x))                (d → 4d → d, GELU)
//   logits = LN_f(x) · Eᵀ                                 (la misma tabla E: «weight tying»)
//   probabilidades = softmax(logits)
// La lección enseña con este modelo: todo número que se ve en pantalla sale de aquí.
import { TINY, TINY_CFG, type TinyBlockW } from './weights';

export type Lang = 'es' | 'en';
export type Mat = number[][];
export const CFG = TINY_CFG;               // { d: 8, heads: 2, layers: 2, ff: 32, ctx: 12 }
export const DH = CFG.d / CFG.heads;       // 4 números por cabeza
export const VOCAB = (lang: Lang) => TINY[lang].vocab;

// ───────── álgebra mínima ─────────
/** X (T×din) · W (din×dout, fila a fila) + b */
function linear(X: Mat, W: number[], din: number, dout: number, b?: number[]): Mat {
  return X.map((row) => {
    const o = b ? b.slice() : new Array<number>(dout).fill(0);
    for (let i = 0; i < din; i++) { const a = row[i]; if (a === 0) continue; const base = i * dout; for (let j = 0; j < dout; j++) o[j] += a * W[base + j]; }
    return o;
  });
}
export interface LN { y: number[]; mean: number; std: number; z: number[] }
/** Normalización de capa (varianza sesgada y ε = 1e-5, como PyTorch): z = (x − μ)/σ ; y = g·z + b. */
export function layerNorm(x: number[], g: number[], b: number[]): LN {
  const n = x.length, mean = x.reduce((a, v) => a + v, 0) / n, varr = x.reduce((a, v) => a + (v - mean) ** 2, 0) / n, std = Math.sqrt(varr + 1e-5);
  const z = x.map((v) => (v - mean) / std);
  return { y: z.map((v, i) => g[i] * v + b[i]), mean, std, z };
}
const SQ2PI = Math.sqrt(2 / Math.PI);
export const gelu = (x: number) => 0.5 * x * (1 + Math.tanh(SQ2PI * (x + 0.044715 * x ** 3)));
export function softmax(z: number[]): number[] {
  const m = Math.max(...z), e = z.map((v) => (v === -Infinity ? 0 : Math.exp(v - m))), s = e.reduce((a, v) => a + v, 0);
  return e.map((v) => v / s);
}
/** Codificación de posición sinusoidal (Vaswani et al., 2017, §3.5). */
export function posEnc(T: number, d = CFG.d): Mat {
  return Array.from({ length: T }, (_, pos) => Array.from({ length: d }, (_, k) => { const i = k >> 1, a = pos / Math.pow(10000, (2 * i) / d); return k % 2 === 0 ? Math.sin(a) : Math.cos(a); }));
}
const add = (A: Mat, B: Mat): Mat => A.map((r, i) => r.map((v, j) => v + B[i][j]));

// ───────── pase hacia delante con rastro completo ─────────
export interface BlockTrace {
  x: Mat;                     // entrada del bloque (T×d)
  ln1: Mat; ln1s: { mean: number; std: number; z: number[] }[];
  q: Mat[]; k: Mat[]; v: Mat[];           // [cabeza][T][dh]
  scores: Mat[];                          // [cabeza][T][T]  q·k/√dh (sin máscara)
  weights: Mat[];                         // [cabeza][T][T]  softmax con la máscara que se haya pedido
  headOut: Mat[];                         // [cabeza][T][dh]  pesos·v
  cat: Mat;                               // T×d  cabezas pegadas
  attnOut: Mat;                           // T×d  tras Wₒ (cero si se «apagó» la atención)
  mid: Mat;                               // x + atención
  ln2: Mat; ln2s: { mean: number; std: number; z: number[] }[];
  hpre: Mat; hact: Mat;                   // T×ff antes y después de GELU
  mlpOut: Mat;                            // T×d
  out: Mat;                               // mid + MLP: salida del bloque
}
export interface Trace {
  lang: Lang; ids: number[]; words: string[];
  emb: Mat; pos: Mat; x0: Mat;
  blocks: BlockTrace[];
  lnf: Mat; lnfs: { mean: number; std: number; z: number[] }[];
  logits: Mat; probs: Mat;               // T×V
}
export interface RunOpts { mask?: boolean; attention?: boolean }

export function forward(lang: Lang, ids: number[], o: RunOpts = {}): Trace {
  const W = TINY[lang], V = W.vocab.length, { d, heads, layers, ff } = CFG, T = ids.length, dh = DH;
  const useMask = o.mask !== false, useAttn = o.attention !== false;
  const emb = ids.map((t) => W.E.slice(t * d, (t + 1) * d)), pos = posEnc(T), x0 = add(emb, pos);
  let x = x0; const blocks: BlockTrace[] = [];
  for (let l = 0; l < layers; l++) {
    const b: TinyBlockW = W.blocks[l], xin = x;
    const ln1r = xin.map((r) => layerNorm(r, b.ln1g, b.ln1b)), ln1 = ln1r.map((r) => r.y);
    const Q = linear(ln1, b.wq, d, d, b.bq), K = linear(ln1, b.wk, d, d, b.bk), Vv = linear(ln1, b.wv, d, d, b.bv);
    const sl = (M: Mat, h: number): Mat => M.map((r) => r.slice(h * dh, (h + 1) * dh));
    const q: Mat[] = [], k: Mat[] = [], v: Mat[] = [], scores: Mat[] = [], weights: Mat[] = [], headOut: Mat[] = [];
    for (let h = 0; h < heads; h++) {
      const qh = sl(Q, h), kh = sl(K, h), vh = sl(Vv, h);
      const sc = qh.map((qi) => kh.map((kj) => qi.reduce((a, u, c) => a + u * kj[c], 0) / Math.sqrt(dh)));
      const wt = sc.map((row, i) => softmax(row.map((s, j) => (useMask && j > i ? -Infinity : s))));
      const ho = wt.map((row) => Array.from({ length: dh }, (_, c) => row.reduce((a, w, j) => a + w * vh[j][c], 0)));
      q.push(qh); k.push(kh); v.push(vh); scores.push(sc); weights.push(wt); headOut.push(ho);
    }
    const cat = ids.map((_, i) => headOut.flatMap((ho) => ho[i]));
    const attnRaw = linear(cat, b.wo, d, d, b.bo), attnOut = useAttn ? attnRaw : attnRaw.map((r) => r.map(() => 0));
    const mid = add(xin, attnOut);
    const ln2r = mid.map((r) => layerNorm(r, b.ln2g, b.ln2b)), ln2 = ln2r.map((r) => r.y);
    const hpre = linear(ln2, b.w1, d, ff, b.b1), hact = hpre.map((r) => r.map(gelu));
    const mlpOut = linear(hact, b.w2, ff, d, b.b2), out = add(mid, mlpOut);
    blocks.push({ x: xin, ln1, ln1s: ln1r.map(({ mean, std, z }) => ({ mean, std, z })), q, k, v, scores, weights, headOut, cat, attnOut, mid, ln2, ln2s: ln2r.map(({ mean, std, z }) => ({ mean, std, z })), hpre, hact, mlpOut, out });
    x = out;
  }
  const lnr = x.map((r) => layerNorm(r, W.lnfg, W.lnfb)), lnf = lnr.map((r) => r.y);
  const logits = lnf.map((r) => Array.from({ length: V }, (_, t) => r.reduce((a, u, c) => a + u * W.E[t * d + c], 0)));
  return { lang, ids, words: ids.map((i) => W.vocab[i]), emb, pos, x0, blocks, lnf, lnfs: lnr.map(({ mean, std, z }) => ({ mean, std, z })), logits, probs: logits.map(softmax) };
}

export const idsOf = (lang: Lang, words: string[]) => words.map((w) => { const i = TINY[lang].vocab.indexOf(w); if (i < 0) throw new Error('palabra fuera del vocabulario: ' + w); return i; });

/** Distribución de la palabra siguiente para un texto (último renglón de probs). */
export function nextDist(lang: Lang, ids: number[], o: RunOpts = {}): number[] {
  const tr = forward(lang, ids, o); return tr.probs[tr.probs.length - 1];
}

// ───────── la gramática de juguete (verdad de referencia, la misma de train_tiny.py) ─────────
// Índices de vocabulario (idénticos en es y en en): 0 «.», 1 «el/the», 2-4 sujetos, 5-6 verbos, 7-11 objetos.
// OBJ[sujeto][verbo] = probabilidad de cada objeto (índices 7..11).
export const SUBJ = [2, 3, 4], VERB = [5, 6];
export const GRAMMAR: Record<string, Record<number, number>> = {
  '2,5': { 7: .70, 8: .30 }, '2,6': { 9: .90, 10: .10 },
  '3,5': { 8: .80, 7: .20 }, '3,6': { 10: .70, 9: .30 },
  '4,5': { 8: .90, 7: .10 }, '4,6': { 11: .85, 9: .15 },
};
export const trueDist = (s: number, v: number, V = 12): number[] => { const p = new Array<number>(V).fill(0); for (const [o, pr] of Object.entries(GRAMMAR[`${s},${v}`])) p[+o] = pr; return p; };

/** Elige un índice según probabilidades y un número uniforme u en [0,1). */
export function pick(p: number[], u: number): number { let a = 0; for (let i = 0; i < p.length; i++) { a += p[i]; if (u < a) return i; } return p.length - 1; }
