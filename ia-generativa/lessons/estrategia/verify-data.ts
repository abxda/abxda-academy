// Comprueba que las cifras que dice la voz salen del modelo de la lección (model.ts). Corre en CPU, sin dependencias:
//   cd app && npx tsx src/content/courses/ia-generativa/lessons/estrategia/verify-data.ts
import { CASES, A, ONCE, MONTHLY, breakEvenMin, breakEvenVol, costIn, costOut, hoursOf, perTask, year1 } from './model';

let bad = 0;
const near = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol;
const check = (what: string, got: number, want: number, tol = 1e-6) => {
  const ok = near(got, want, tol);
  if (!ok) bad++;
  console.log(`${ok ? 'ok ' : 'MAL'} ${what}: ${+got.toFixed(4)} (esperado ${want})`);
};

// valor en juego (segmentos value-year)
check('horas al mes, dudas de garantía', hoursOf(CASES[0]), 200);
check('horas al mes, diagnósticos', hoursOf(CASES[1]), 150);
check('minutos de un diagnóstico ÷ minutos de una duda', CASES[1].min / CASES[0].min, 5);
check('horas al mes, currículos', hoursOf(CASES[4]), 2);
// costo por tarea (task-cost-ex) y por mes (tco-def)
check('costo de la entrada por duda', costIn, 0.0105);
check('costo de la salida por duda', costOut, 0.0045);
check('costo por duda (un centavo y medio)', perTask, 0.015);
check('tokens al mes con dos mil dudas', A.vol * perTask, 30);
// costo total (tco-once, tco-month, tco-year)
check('una vez', ONCE, 6000);
check('cada mes, sin tokens', MONTHLY, 470);
const y = year1(A.vol, A.min);
check('costo total del primer año', y.tco, 12000);
check('tokens del primer año', y.tokens, 360);
check('tokens ÷ costo total (tres por ciento)', y.tokens / y.tco, 0.03);
// retorno (roi-benefit, roi-return)
check('beneficio por duda (un dólar)', (A.min / 60) * A.h, 1);
check('beneficio del primer año', y.benefit, 24000);
check('retorno del primer año', y.ret, 12000);
check('mes en que se recupera la inversión', y.payback, 4);
// demostración del volumen (roi-demo)
check('retorno con quinientas dudas al mes', year1(500, 6).ret, -5730);
check('retorno con mil dudas al mes (casi empate)', year1(1000, 6).ret, 180);
check('dudas al mes para empatar (unas mil)', breakEvenVol(6), 984.77, 0.01);
// piloto (pilot-goal, pilot-measure)
check('minutos para no perder con dos mil dudas (tres)', breakEvenMin(2000), 3);
check('retorno con cuatro minutos medidos', year1(2000, 4).ret, 4000);
check('retorno con tres minutos (meta)', year1(2000, 3).ret, 0);

console.log(bad ? `\n${bad} cifra(s) no coinciden` : '\nTodas las cifras coinciden.');
if (bad) process.exit(1);
