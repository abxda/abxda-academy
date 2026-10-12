// Comprueba una por una las cifras que dicen la voz, la escena y «por dentro», con los mismos datos y pesos que usa la escena.
//   npx tsx src/content/courses/ia-generativa/lessons/generar-distribuciones/verify-data.ts      (desde app/)
// Sale con código 1 si alguna no cuadra.
import * as L from './latent';
import * as M from './measures';
import { EX, HOLES, JUNK, NEW_IMG, pathAt } from './state';

let bad = 0;
const ok = (cond: boolean, what: string) => { console.log(`${cond ? '✓' : '✗'} ${what}`); if (!cond) bad++; };
const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;

ok(L.selfCheck() < 0.005, `el navegador reproduce a PyTorch (desvío máximo ${L.selfCheck().toFixed(4)})`);
ok(L.N_ALL === 1797 && L.NTR === 1500, '1797 imágenes; 1500 de entrenamiento («mil quinientas»)');
ok(M.SEVENS.length === 179 && M.SIXES.length === 181, '179 sietes y 181 seises («ciento setenta y nueve», «ciento ochenta y un»)');
ok(L.LAB[EX] === 7 && M.TOP[EX] === 12 && M.BOT[EX] === 7.75, 'el siete de ejemplo: tinta arriba 12 («doce»), abajo 7.75 (en pantalla 7.8, «siete punto ocho»)');
const x = L.img(EX), z = L.encAE(x), r = L.decAE(z[0], z[1]);
let sse = 0; for (let j = 0; j < 64; j++) sse += (x[j] - r[j]) ** 2;
ok(near(z[0], -0.54, 0.005) && near(z[1], 0.61, 0.006), `su código: (${z[0].toFixed(3)}, ${z[1].toFixed(3)}) → «menos cero punto cinco y cero punto seis»`);
ok(near(sse, 0.84, 0.005), `su error de reconstrucción: ${sse.toFixed(3)} (en pantalla 0.84)`);
ok(L.N_PARAMS_AE === 4354 && L.N_PARAMS_VAE === 4420, 'parámetros: autocodificador 4354, VAE 4420 («cuatro mil cuatrocientos veinte»)');
ok(L.NTR * 64 === 96000, 'números en las imágenes de entrenamiento: 96 000');
ok(near(M.G7.mu[0], 10.82, 0.005) && near(M.G7.mu[1], 8.14, 0.005) && near(M.G7.cov[0], 2.24, 0.005) && near(M.G7.cov[1], -0.65, 0.005) && near(M.G7.cov[2], 2.45, 0.005), 'gaussiana de los sietes de «por dentro»: μ = (10.82, 8.14), Σ = [[2.24, −0.65], [−0.65, 2.45]]');
ok(M.G7.mu[0] > M.G7.mu[1] && M.G6.mu[1] > M.G6.mu[0], 'los sietes cargan más tinta arriba; los seises, abajo');
ok(M.LDA.acc > 0.97, `la frontera separa seises de sietes (${(100 * M.LDA.acc).toFixed(1)} % bien)`);
const rd = L.readDigit(NEW_IMG), nn = L.nearest(NEW_IMG).d;
let ref = 0; for (let k = 0; k < 100; k++) ref += L.nearest(L.img(L.NTR + k)).d; ref /= 100;
ok(rd.digit === 7 && rd.p > 0.98, `el «siete nuevo» del principio se lee como 7 (p = ${rd.p.toFixed(2)})`);
ok(nn > 0.7, `y no es copia: su imagen de entrenamiento más cercana está a ${nn.toFixed(2)} (los dígitos reales no vistos están, en promedio, a ${ref.toFixed(2)})`);
let seq = ''; for (let i = 0; i <= 200; i++) { const p = pathAt(i / 200), q = L.readDigit(L.decAE(p[0], p[1])); if (q.p >= 0.8 && seq[seq.length - 1] !== String(q.digit)) seq += q.digit; }
ok(seq === '7395064', `el paseo se lee 7 → 3 → 9 → 5 → 0 → 6 → 4 (sale ${seq})`);
for (const [hx, hy, hr] of HOLES) { let md = Infinity; for (let i = 0; i < L.NTR; i++) md = Math.min(md, Math.hypot(L.CODES_AE.x[i] - hx, L.CODES_AE.y[i] - hy)); ok(md > hr, `hueco en (${hx}, ${hy}) de radio ${hr}: ningún código dentro (el más cercano a ${md.toFixed(2)})`); }
const j = L.readDigit(L.decAE(JUNK[0], JUNK[1]));
ok(j.p < 0.5, `el punto del hueco da una mancha: el clasificador duda (p = ${j.p.toFixed(2)})`);
const f = L.STATS;
ok(f.ae_freq[4] > 0.2 && f.ae_freq[6] > 0.2 && f.ae_freq[8] < 0.01, `autocodificador, 3000 intentos: cuatros ${(100 * f.ae_freq[4]).toFixed(1)} %, seises ${(100 * f.ae_freq[6]).toFixed(1)} %, ochos ${(100 * f.ae_freq[8]).toFixed(1)} %`);
ok(Math.min(...f.vae_freq) >= 0.06 && Math.max(...f.vae_freq) <= 0.14, `VAE, 3000 intentos: entre ${(100 * Math.min(...f.vae_freq)).toFixed(1)} % y ${(100 * Math.max(...f.vae_freq)).toFixed(1)} % de cada dígito`);
// pares «generado ↔ más parecido»: ninguno es copia
const D = L.drawVAE(60, 77), seen = new Set<number>(), ds: number[] = [];
for (let q = 0; q < D.img.length && seen.size < 5; q++) { const t = L.readDigit(D.img[q]); if (t.p < 0.8 || seen.has(t.digit)) continue; seen.add(t.digit); ds.push(L.nearest(D.img[q]).d); }
ok(Math.min(...ds) > 0.5, `los cinco pares de «no es collage» están a ${ds.map((v) => v.toFixed(2)).join(', ')} (ninguno es copia)`);
console.log(bad ? `\n${bad} cifra(s) no cuadran` : '\ntodas las cifras cuadran');
process.exit(bad ? 1 : 0);
