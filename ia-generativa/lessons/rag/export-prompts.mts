// Vuelca a JSON (stdout) los prompts exactos de las demostraciones con modelo real, para build-llm.py.
//   cd app && npx tsx src/content/courses/ia-generativa/lessons/rag/export-prompts.mts
import { indexWith, mainIndex, search, oldChunks, trapChunks } from './ir';
import { DEMO_Q, SYSTEM_RAG, SYSTEM_ROLE, userMessage } from './prompts';

const out: Record<string, unknown> = {};
for (const l of ['es', 'en'] as const) {
  const top = (ix: ReturnType<typeof mainIndex>, q: string, k = 3) => search(ix, q).hits.slice(0, k).map((h) => ix.chunks[h.i]);
  const Q = DEMO_Q[l], main = mainIndex(l);
  const withOld = indexWith(l, oldChunks(l), 'old'), withTrap = indexWith(l, trapChunks(l), 'trap');
  out[l] = {
    norag: { system: SYSTEM_ROLE[l], user: Q.battery },
    rag: { system: SYSTEM_RAG[l], user: userMessage(l, top(main, Q.battery), Q.battery), ids: top(main, Q.battery).map((c) => c.id) },
    conflict: { system: SYSTEM_RAG[l], user: userMessage(l, top(withOld, Q.battery), Q.battery), ids: top(withOld, Q.battery).map((c) => c.id) },
    trap: { system: SYSTEM_RAG[l], user: userMessage(l, top(withTrap, Q.refund), Q.refund), ids: top(withTrap, Q.refund).map((c) => c.id) },
    nope: { system: SYSTEM_RAG[l], user: userMessage(l, top(main, Q.nope), Q.nope), ids: top(main, Q.nope).map((c) => c.id) },
  };
}
console.log(JSON.stringify(out));
