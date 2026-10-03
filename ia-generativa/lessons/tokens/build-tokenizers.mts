// Entrena los tres tokenizadores de juguete de la lección «Tokens» y escribe `merges.ts`.
//
//   npx tsx src/content/courses/ia-generativa/lessons/tokens/build-tokenizers.mts
//
// Es determinista: el mismo corpus (`corpus.ts`) produce siempre el mismo `merges.ts`. Para cambiar el corpus o el
// número de fusiones, edita `corpus.ts` / las constantes de abajo y vuelve a ejecutarlo.
//
//  · Algoritmo: BPE a nivel de bytes (ver `bpe.ts`), 400 fusiones como máximo y solo si el par aparece al menos 3 veces.
//  · Variantes (misma cantidad de fusiones; cambia solo el texto de entrenamiento):
//      en  = únicamente inglés            · mix = inglés + ES_CORE (mayormente inglés)      · bal = inglés + todo el español
import fs from 'node:fs';
import { EN, ES, ES_CORE } from './corpus';
import { countChunks, train, makeTokenizer, encode, type Pair } from './bpe';

const MERGES = 400, MIN_COUNT = 3;
const variants: Record<string, string[]> = { en: EN, mix: [...EN, ...ES_CORE], bal: [...EN, ...ES] };

// Comprobaciones del corpus: sin «ü» ni las palabras raras que la lección usa para mostrar lo desconocido.
const all = [...EN, ...ES].join('\n');
for (const bad of ['ü', 'Quetzal', 'quetzal', 'pingüino', 'penguin']) if (all.includes(bad)) throw new Error(`el corpus no debe contener «${bad}»`);

const out: Record<string, Pair[]> = {};
for (const [name, texts] of Object.entries(variants)) {
  const m = train(countChunks(texts), MERGES, MIN_COUNT);
  if (m.length < MERGES) throw new Error(`la variante ${name} solo produjo ${m.length} fusiones (se pedían ${MERGES}); amplía el corpus o baja MIN_COUNT`);
  out[name] = m;
  const tk = makeTokenizer(m);
  const chars = texts.join('').length, toks = encode(texts.join(' '), tk).length;
  console.log(`${name}: ${texts.length} párrafos, ${chars} caracteres, ${m.length} fusiones, vocabulario ${256 + m.length}, ${(chars / toks).toFixed(2)} caracteres por token en el propio corpus`);
}

const fmt = (m: Pair[]) => m.map((p) => `[${p[0]},${p[1]}]`).reduce((rows: string[], x, i) => { if (i % 12 === 0) rows.push(x); else rows[rows.length - 1] += ',' + x; return rows; }, []).map((r) => '    ' + r).join(',\n');
const src = `// GENERADO por build-tokenizers.mts a partir de corpus.ts. No editar a mano: vuelve a ejecutar el script.
// Cada fusión es un par de ids [a, b]; la fusión número i crea la pieza con id 256 + i (los ids 0–255 son los bytes).
import type { Pair } from './bpe';

export const MERGE_COUNT = ${MERGES};
export type Variant = 'en' | 'mix' | 'bal';
export const VARIANTS: Record<Variant, Pair[]> = {
${Object.entries(out).map(([k, m]) => `  ${k}: [\n${fmt(m)},\n  ],`).join('\n')}
};
`;
fs.writeFileSync(new URL('./merges.ts', import.meta.url), src);
console.log('escrito merges.ts');
