// Comprueba con el MISMO código que ejecuta la escena (models.ts) las cifras de la voz, la escena y «por dentro».
//   npx tsx src/content/courses/ia-generativa/lessons/difusion/verify-data.ts      (desde app/)
// Sale con código 1 si algo no cuadra.
import { CHECK, CODES, LAT, NCODES, NULL, PARAMS, PIX, SEVEN, T, abar, betas, pixTraj, readDigit, signalShare, toInk, toInt, vaeDec } from './models';
import { SEVENS_IDX, guidedJob, sevensCount, sixPoints, starPoint, unc, uncovered } from './state';
import { DEMO } from './demo';

let bad = 0;
const ok = (cond: boolean, msg: string) => { console.log(`${cond ? '✓' : '✗'} ${msg}`); if (!cond) bad++; };
const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;

// 1. el navegador reproduce las redes de PyTorch (pesos int8 en ambos lados)
{
  const e = new Float64Array(64); PIX.eps(toInt(SEVEN), 0, 19, NULL, e);
  const dp = Math.max(...CHECK.pix.map((v, i) => Math.abs(v - e[i])));
  const l = new Float64Array(2); LAT.eps([0.3, -0.7], 0, 30, 7, l);
  const dl = Math.max(Math.abs(l[0] - CHECK.lat[0]), Math.abs(l[1] - CHECK.lat[1]));
  ok(dp < 2e-4 && dl < 2e-4, `redes = PyTorch (desvío máx. píxeles ${dp.toExponential(1)}, plano ${dl.toExponential(1)})`);
}
// 2. calendario
ok(T === 50 && betas.length === 50, 'cincuenta pasos');
console.log('  imagen en la mezcla (ᾱ): ' + [0, 10, 20, 25, 30, 40, 50].map((t) => `t=${t}: ${(signalShare(t) * 100).toFixed(1)} %`).join(' · '));
ok(signalShare(50) < 0.005, `al final casi todo es ruido (imagen ${(abar[49] * 100).toFixed(2)} %)`);
ok(PARAMS.pix === 53056 && PARAMS.lat === 10370, `parámetros: píxeles ${PARAMS.pix}, plano ${PARAMS.lat}`);
ok(NCODES === 1500, 'mil quinientos puntos en el plano');

// 3. demostraciones de la escena
{
  const tr = pixTraj(DEMO.hookSeed, 7, DEMO.pixScale), im = toInk(tr[T]);
  ok(readDigit(im) === 7, `gancho: la estática (semilla ${DEMO.hookSeed}) termina en un siete`);
  const sev = DEMO.moreSeeds.map((s) => readDigit(toInk(pixTraj(s, 7, DEMO.pixScale)[T])));
  ok(sev.every((d) => d === 7), `otras estáticas, otros sietes: ${sev.join(' ')}`);
  // estimación del ruido del siete en el paso veinte
  const e0 = DEMO.noise, x = new Float64Array(64), x0 = toInt(SEVEN), a = signalShare(20);
  for (let i = 0; i < 64; i++) x[i] = Math.sqrt(a) * x0[i] + Math.sqrt(1 - a) * e0[i];
  const e = new Float64Array(64); PIX.eps(x, 0, 19, NULL, e);
  let mse = 0, mse0 = 0; for (let i = 0; i < 64; i++) { mse += (e[i] - e0[i]) ** 2; mse0 += e0[i] ** 2; }
  console.log(`  error de la estimación del ruido (paso 20): ${(mse / 64).toFixed(3)} (si dijera «cero ruido»: ${(mse0 / 64).toFixed(3)})`);
}
// 4. el plano: muestreo sin pista y con la pista «siete» (lo mismo que dibuja la escena)
{
  const t0 = Date.now(); unc().finish(); const ms = Date.now() - t0;
  console.log(`  muestreo de ${DEMO.nPts} puntos sin pista: ${ms} ms`);
  const q = unc().traj[T], h = new Array(10).fill(0);
  for (let p = 0; p < DEMO.nPts; p++) h[readDigit(vaeDec(q[2 * p], q[2 * p + 1]))]++;
  console.log('  sin pista, dígitos leídos: ' + h.map((v, d) => `${d}:${v}`).join(' '));
  { let mn = Infinity; for (let p = 0; p < DEMO.nPts; p++) for (let i = 0; i < NCODES; i++) mn = Math.min(mn, Math.hypot(q[2 * p] - CODES[2 * i], q[2 * p + 1] - CODES[2 * i + 1]));
    let md = Infinity; for (let i = 0; i < NCODES; i++) for (let j = i + 1; j < NCODES; j++) md = Math.min(md, Math.hypot(CODES[2 * i] - CODES[2 * j], CODES[2 * i + 1] - CODES[2 * j + 1]));
    ok(mn > 0.001, `ningún punto nuevo coincide con un dato: distancia mínima ${mn.toFixed(3)} (entre dos datos reales, la mínima es ${md.toFixed(3)})`); }
  ok(new Set(sixPoints().map((p) => readDigit(vaeDec(q[2 * p], q[2 * p + 1])))).size === 6, 'los seis puntos decodificados dan seis dígitos distintos');
  for (const s of [0, 0.5, 1, 1.5, 2, 3, 4, 5]) {
    const t1 = Date.now(); guidedJob(s).finish(); const dt = Date.now() - t1;
    const u = uncovered(s)!;
    console.log(`  escala ${s}: ${sevensCount(s)}/${DEMO.nPts} se leen como siete · sietes reales sin punto cerca ${u.length}/${SEVENS_IDX.length} (${(100 * u.length / SEVENS_IDX.length).toFixed(0)} %) · ${dt} ms`);
  }
  ok(sevensCount(0)! < 60 && sevensCount(1)! >= 190 && sevensCount(5)! === DEMO.nPts, 'escala 0: de todo tipo · 1: casi solo sietes · 5: solo sietes');
  ok(uncovered(5)!.length > SEVENS_IDX.length / 2 && uncovered(1)!.length < SEVENS_IDX.length * 0.1, 'con escala 5, la mayoría de los sietes reales queda sin punto cerca; con 1, casi ninguno');
  const st = starPoint(); console.log(`  punto de las dos flechas: (${st.x.toFixed(2)}, ${st.y.toFixed(2)})`);
}
console.log(bad ? `\n${bad} discrepancia(s)` : '\n0 discrepancias');
process.exit(bad ? 1 : 0);
