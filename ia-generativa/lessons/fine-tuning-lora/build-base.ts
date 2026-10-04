// Preentrena el «modelo base» de la lección (red 2→32→32→3, tanh) con la regla original y escribe base.ts.
//   Reproducir:  cd app && npx tsx src/content/courses/ia-generativa/lessons/fine-tuning-lora/build-base.ts
// Datos: 900 puntos uniformes en [-1,1]², etiquetados con la regla original (task.ts), semilla fija. Optimizador: Adam, tasa 0,02, 1500 pasos
// con todo el conjunto. Sin datos externos: todo es sintético y determinista. Los pesos se guardan con 5 decimales.
import fs from 'node:fs';
import path from 'node:path';
import { gauss, rng } from '../../../../../theme/kit';
import { H, Tuner, accuracy, type Params } from './tinynet';
import { baseData, TARGET_BASE, mapOf } from './task';

function init(seed: number): Params {
  const r = rng(seed), W = (n: number, fan: number) => Array.from({ length: n }, () => gauss(r) / Math.sqrt(fan));
  return { W1: W(2 * H, 2).map((v) => v * 1.5), b1: Array.from({ length: H }, () => (r() - 0.5) * 1.2), W2: W(H * H, H), b2: new Array(H).fill(0), W3: W(3 * H, H), b3: [0, 0, 0] };
}
const data = baseData();
const T = new Tuner(init(1), data, { full: true }, 0.02);
for (let i = 0; i < 1500; i++) T.advance();
const round = (a: number[]) => a.map((v) => Math.round(v * 1e5) / 1e5);
const P: Params = { W1: round(T.p.W1), b1: round(T.p.b1), W2: round(T.p.W2), b2: round(T.p.b2), W3: round(T.p.W3), b3: round(T.p.b3) };
const m = mapOf(P, null);
let ok = 0;
for (let k = 0; k < m.length; k++) if (m[k] === TARGET_BASE[k]) ok++;
console.log(`acierto en los datos de preentrenamiento: ${(accuracy(P, null, data) * 100).toFixed(1)} %; en la rejilla: ${((ok / m.length) * 100).toFixed(1)} %`);
const out = `// GENERADO por build-base.ts (no editar a mano). Pesos del modelo base diminuto: 2→32→32→3, tanh. Ver el script para la receta exacta.
import type { Params } from './tinynet';
export const BASE: Params = ${JSON.stringify(P)};
`;
fs.writeFileSync(path.join(import.meta.dirname, 'base.ts'), out);
console.log('escrito base.ts', out.length, 'bytes');
