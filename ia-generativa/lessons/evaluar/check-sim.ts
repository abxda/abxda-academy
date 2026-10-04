// Verificación de los números que cita la narración: ejecutar con
//   npx tsx src/content/courses/ia-generativa/lessons/evaluar/check-sim.ts
import { N_STEPS, REPS, curveByN, margin, minNForClearWinner, repeated, wilson } from './stats';

console.log(`REPS = ${REPS}`);
for (const paired of [true, false]) {
  console.log(paired ? '\nMISMOS CASOS (por pares)' : '\nCASOS DISTINTOS (independientes)');
  for (const row of curveByN(paired)) {
    const r = repeated(row.n, paired);
    console.log(String(row.n).padStart(5), 'A por delante', row.winsA.toFixed(1).padStart(5), '%  empate', ((100 * r.ties) / REPS).toFixed(1).padStart(4), '%  B por delante', ((100 * r.winsB) / REPS).toFixed(1).padStart(4), '%  IC excluye 0', row.sig.toFixed(1).padStart(5), '%');
  }
  console.log('menor n con A por delante >= 95 %:', minNForClearWinner(paired));
}
console.log('\nMárgenes al 95 % para una nota de 78 %:');
for (const n of [25, 100, 400, 1600]) { const [lo, hi] = wilson(Math.round(0.78 * n), n); console.log(n, 'Wald ±', (100 * margin(0.78, n)).toFixed(2), ' Wilson', (100 * lo).toFixed(1), '–', (100 * hi).toFixed(1)); }
console.log('N_STEPS', N_STEPS.join(','));
