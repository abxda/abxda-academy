// Comprueba que las cifras que dice la voz (y dibuja la escena) salen de verdad de stats.ts. Ejecutar desde app/:
//   npx tsx src/content/courses/ia-generativa/lessons/evaluar/verify-data.ts
// Sale con «todo coincide» o con la lista de discrepancias (código de salida 1).
import { N_STEPS, PA, PB, Q_ONLY_A, Q_ONLY_B, REPS, YOUR_CASES, casesOf, margin, oneRuns, scoreA, tally } from './stats';

const bad: string[] = [];
const eq = (what: string, got: number | string, want: number | string) => { const ok = got === want; console.log(`${ok ? '✓' : '✗'} ${what}: ${got}${ok ? '' : ` (se esperaba ${want})`}`); if (!ok) bad.push(what); };

// ── un sistema ──
const r100 = oneRuns(100), r400 = oneRuns(400);
eq('tu evaluación: aciertos en la cuadrícula', YOUR_CASES.filter(Boolean).length, 78);
eq('tu evaluación: primer resultado', r100[0], 78);
eq('«again»: segunda evaluación', r100[1], 75);
eq('«again»: tercera evaluación', r100[2], 80);
eq('«again»: cuarta evaluación', r100[3], 77);
for (let k = 1; k <= 3; k++) eq(`cuadrícula de la evaluación ${k + 1} = su resultado`, casesOf(k).filter(Boolean).length, r100[k]);
eq('«ci»: resultados a ocho puntos o menos de 78 (de 100)', r100.filter((v) => Math.abs(v - 78) <= 8).length, 95);
eq('«ci»: margen con 100 casos (puntos, redondeado)', Math.round(100 * margin(0.78, 100)), 8);
eq('«ci-name»: intervalo con 100 casos', `${Math.round(78 - 100 * margin(0.78, 100))}–${Math.round(78 + 100 * margin(0.78, 100))}`, '70–86');
eq('«ci-400»: margen con 400 casos (puntos, redondeado)', Math.round(100 * margin(0.78, 400)), 4);
console.log(`  (con 400 casos, ${r400.filter((v) => Math.abs(v - 78) <= 4).length} de 100 resultados quedan a 4 puntos o menos; mín ${Math.min(...r100)}, máx ${Math.max(...r100)} con 100 casos)`);

// ── dos sistemas ──
const t100 = tally(100), t200 = tally(200), t400 = tally(400), t1000 = tally(1000);
eq('«wrong»: A gana con 100 casos', t100.winA, 78);
eq('«wrong»: B empata o gana con 100 casos', t100.tie + t100.winB, 22);
eq('«demo-n»: A gana con 200', t200.winA, 88);
eq('«demo-n»: A gana con 400', t400.winA, 96);
eq('«demo-n»: A gana con 1000', t1000.winA, 100);
eq('«two-100»: margen de A con 100 casos (≈ 8)', Math.round(100 * margin(PA, 100)), 8);
eq('«two-100»: margen de B con 100 casos (≈ 9, «unos ocho»)', Math.round(100 * margin(PB, 100)), 9);
const ti = tally(400, false);
eq('«paired»: A gana con 400 casos distintos para cada uno (≈ 90)', ti.winA, 90);
// la evaluación típica que se dibuja con 100 casos
const ty = t100.runs[t100.typical];
console.log(`  evaluación típica con 100 casos: A ${ty.a}, B ${ty.b}; con 1000: A ${tally(1000).runs[tally(1000).typical].a / 10}, B ${tally(1000).runs[tally(1000).typical].b / 10}`);

// probabilidades exactas (multinomial) de que A quede por delante, para «por dentro»
function exact(n: number) {
  const lf: number[] = [0]; for (let i = 1; i <= n; i++) lf[i] = lf[i - 1] + Math.log(i);
  const r = 1 - Q_ONLY_A - Q_ONLY_B; let pa = 0;
  for (let x = 0; x <= n; x++) for (let y = 0; y < x && x + y <= n; y++) pa += Math.exp(lf[n] - lf[x] - lf[y] - lf[n - x - y] + x * Math.log(Q_ONLY_A) + y * Math.log(Q_ONLY_B) + (n - x - y) * Math.log(r));
  return pa;
}
for (const n of [100, 200, 400, 1000]) { const p = exact(n); console.log(`  exacto: A por delante con ${n} casos = ${(100 * p).toFixed(2)} % (escena: ${tally(n).winA} de ${REPS})`); eq(`escena = exacto redondeado con ${n}`, tally(n).winA, Math.round(100 * p)); }
console.log('  tamaños del control:', N_STEPS.map((n) => `${n}:${tally(n).winA}/${tally(n).tie}/${tally(n).winB}`).join('  '));

// ── contaminación ──
eq('«contam-more»: A con una quinta parte vista empata con B', scoreA(20), 76);
eq('«contam-more»: A con 40 vistas', scoreA(40), 82);
eq('A sin nada visto', scoreA(0), 70);

// ── mezcla de casos (ilustrativa) ──
import { SLICES, mixAverage } from './data';
eq('«slices»: frecuentes', SLICES[0].acc, 96);
eq('«slices»: de riesgo', SLICES[2].acc, 54);
eq('«avg»: promedio con la mezcla real (redondeado)', Math.round(mixAverage()), 87);

console.log(bad.length ? `\n${bad.length} discrepancia(s)` : '\ntodo coincide');
process.exit(bad.length ? 1 : 0);
