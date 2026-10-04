// Vuelca a JSON (stdout) los fragmentos del índice principal y las preguntas fijas, para build-dense.py.
//   cd app && npx tsx src/content/courses/ia-generativa/lessons/rag/export-corpus.mts
import { mainChunks } from './ir';
import { ALL_FIXED } from './corpus';

const out: Record<string, unknown> = {};
for (const l of ['es', 'en'] as const) out[l] = { chunks: mainChunks(l).map((c) => ({ id: c.id, text: c.text })), questions: ALL_FIXED(l).map((q) => q.q) };
console.log(JSON.stringify(out));
