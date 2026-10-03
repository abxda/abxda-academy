// BPE (codificación por pares de bytes) de juguete, a nivel de bytes como el de GPT-2. Puro, determinista y sin DOM:
// lo usan el script que entrena (`build-tokenizers.mts`) y la escena que tokeniza lo que escribe la persona.
//
// Idea (Sennrich et al., 2016, a partir de Gage, 1994): partir de piezas mínimas y fusionar, una y otra vez, el par
// de piezas vecinas más frecuente en el corpus. Cada fusión crea una pieza nueva del vocabulario.
//
//  · Ids 0–255 = los 256 valores posibles de un byte. El id 256 + i es la pieza creada por la fusión número i.
//  · Pretokenización (como GPT-2): antes de fusionar, el texto se parte en trozos (palabra con su espacio inicial,
//    número, signos, espacios) y las fusiones nunca cruzan de un trozo al siguiente.
//  · Desempate al entrenar: gana el par más frecuente; si empatan, el de menor (a, b). Así el resultado es reproducible.

export type Pair = [number, number];

/** Trozos de texto. Misma idea que el patrón de GPT-2 (contracciones, palabra con espacio inicial, números, signos, espacios). */
const CHUNK = /'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu;
export const chunks = (text: string): string[] => text.match(CHUNK) ?? [];

const enc = new TextEncoder();
const dec = new TextDecoder('utf-8', { fatal: true });
export const toBytes = (s: string): number[] => Array.from(enc.encode(s));

export interface Tok {
  /** Id de la pieza en el vocabulario. */
  id: number;
  /** Bytes que representa. */
  bytes: number[];
  /** Texto si los bytes forman UTF-8 válido; null si es un fragmento de un carácter (p. ej. media «ü»). */
  text: string | null;
  /** Índice del trozo (palabra, número…) del que sale. */
  chunk: number;
}

export interface Tokenizer {
  merges: Pair[];
  /** Bytes de cada pieza (256 + merges.length). */
  bytesOf: number[][];
  rank: Map<number, number>;
}

const key = (a: number, b: number) => a * 65536 + b;

export function makeTokenizer(merges: Pair[]): Tokenizer {
  const bytesOf: number[][] = Array.from({ length: 256 }, (_, i) => [i]);
  const rank = new Map<number, number>();
  merges.forEach(([a, b], i) => { bytesOf.push([...bytesOf[a], ...bytesOf[b]]); rank.set(key(a, b), i); });
  return { merges, bytesOf, rank };
}

/** Aplica las fusiones (solo las primeras `max`) a una lista de ids: siempre la de menor rango presente. */
function applyMerges(ids: number[], tk: Tokenizer, max: number): number[] {
  const out = ids.slice();
  for (;;) {
    let best = Infinity, bi = -1;
    for (let i = 0; i < out.length - 1; i++) {
      const r = tk.rank.get(key(out[i], out[i + 1]));
      if (r !== undefined && r < max && r < best) { best = r; bi = i; }
    }
    if (bi < 0) return out;
    const a = out[bi], b = out[bi + 1], id = 256 + best;
    for (let i = 0; i < out.length - 1; i++) if (out[i] === a && out[i + 1] === b) { out.splice(i, 2, id); }
  }
}

/** Tokeniza un texto con las primeras `max` fusiones del tokenizador. */
export function encode(text: string, tk: Tokenizer, max = Infinity): Tok[] {
  const res: Tok[] = [];
  chunks(text).forEach((c, ci) => {
    for (const id of applyMerges(toBytes(c), tk, max)) {
      const bytes = tk.bytesOf[id];
      let t: string | null = null;
      try { t = dec.decode(new Uint8Array(bytes)); } catch { t = null; }
      res.push({ id, bytes, text: t, chunk: ci });
    }
  });
  return res;
}

/** Entrena: `words` = trozo → frecuencia. Devuelve las fusiones en orden. */
export function train(words: Map<string, number>, nMerges: number, minCount = 2): Pair[] {
  const seqs = [...words.entries()].map(([w, n]) => ({ ids: toBytes(w), n }));
  const merges: Pair[] = [];
  for (let m = 0; m < nMerges; m++) {
    const counts = new Map<number, number>();
    for (const s of seqs) for (let i = 0; i < s.ids.length - 1; i++) { const k = key(s.ids[i], s.ids[i + 1]); counts.set(k, (counts.get(k) ?? 0) + s.n); }
    let bk = -1, bc = 0;
    for (const [k, c] of counts) if (c > bc || (c === bc && k < bk)) { bk = k; bc = c; }
    if (bk < 0 || bc < minCount) break;
    const a = Math.floor(bk / 65536), b = bk % 65536, id = 256 + m;
    merges.push([a, b]);
    for (const s of seqs) for (let i = 0; i < s.ids.length - 1; i++) if (s.ids[i] === a && s.ids[i + 1] === b) s.ids.splice(i, 2, id);
  }
  return merges;
}

/** Cuenta los trozos de una lista de textos. */
export function countChunks(texts: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of texts) for (const c of chunks(t)) m.set(c, (m.get(c) ?? 0) + 1);
  return m;
}

/** Cómo se muestra una pieza: espacios como «·», saltos de línea como «↵», fragmentos de carácter como su valor hexadecimal. */
export function show(t: Tok): { label: string; raw: boolean } {
  if (t.text === null) return { label: t.bytes.map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' '), raw: true };
  return { label: t.text.replace(/ /g, '·').replace(/\n/g, '↵').replace(/\t/g, '⇥'), raw: false };
}

// ── demostración paso a paso a nivel de letras (para la animación del algoritmo) ────────────────────────────────
export interface Step { pieces: string[][]; pair?: [string, string]; count?: number; made?: string }

/** Ejecuta BPE sobre una lista pequeña de (palabra, frecuencia) a nivel de letras y devuelve el estado tras cada fusión. */
export function trace(list: [string, number][], steps: number): Step[] {
  let pieces = list.map(([w]) => [...w]);
  const freq = list.map(([, n]) => n);
  const out: Step[] = [{ pieces: pieces.map((p) => p.slice()) }];
  for (let s = 0; s < steps; s++) {
    const counts = new Map<string, number>();
    pieces.forEach((p, wi) => { for (let i = 0; i < p.length - 1; i++) { const k = p[i] + '\u0000' + p[i + 1]; counts.set(k, (counts.get(k) ?? 0) + freq[wi]); } });
    let bk = '', bc = 0;
    for (const [k, c] of counts) if (c > bc || (c === bc && k < bk)) { bk = k; bc = c; }
    if (!bk || bc < 2) break;
    const [a, b] = bk.split('\u0000');
    pieces = pieces.map((p) => { const q = p.slice(); for (let i = 0; i < q.length - 1; i++) if (q[i] === a && q[i + 1] === b) q.splice(i, 2, a + b); return q; });
    out.push({ pieces: pieces.map((p) => p.slice()), pair: [a, b], count: bc, made: a + b });
  }
  return out;
}
