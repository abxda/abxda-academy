// Comprobación reproducible de TODAS las cifras que afirman la voz, la escena y «por dentro» de la lección 2.
//   npx tsx src/content/courses/ia-generativa/lessons/datos-como-numeros/verify-data.ts      (desde app/)
// Sale con código 1 si algo no coincide. No genera datos: la carita, el desenfoque, la señal de juguete y las palabras
// son deterministas y viven en helpers.ts; aquí solo se recalculan de forma independiente y se comparan con el texto.
import {
  BLUR_LEVELS, BLUR_PCT, FACE_B, MIN_RATE, MNIST_LIKE, N, NULL_U, SMILE_GRAY, SMILE_RGB, SND, WORDS,
  boxBlur, codesOf, dist, hood, luma, sample, wave,
} from './helpers';

let bad = 0;
const ok = (cond: boolean, msg: string) => { if (!cond) bad++; console.log(`${cond ? '✓' : '✗'} ${msg}`); };
const near = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps;

// ── 1 · la carita (la misma tabla que «por dentro») ──────────────────────────
const CARITA = [
  [20, 20, 146, 146, 146, 146, 20, 20], [20, 146, 202, 255, 202, 202, 146, 20], [146, 202, 0, 202, 202, 0, 202, 146], [146, 202, 0, 202, 202, 0, 202, 146],
  [146, 202, 202, 202, 202, 202, 202, 146], [146, 202, 0, 202, 202, 0, 202, 146], [20, 146, 202, 0, 0, 202, 146, 20], [20, 20, 146, 146, 146, 146, 20, 20],
];
ok(JSON.stringify(CARITA.flat()) === JSON.stringify(SMILE_GRAY), 'la carita en grises (BT.601 sobre la paleta de colores) coincide con la tabla de «por dentro»');
ok(SMILE_GRAY.length === 64 && N === 8, '8 × 8 = 64 píxeles');
ok(SMILE_RGB.length * 3 === 192, '8 × 8 × 3 = 192 números en color');
ok(near(0.299 + 0.587 + 0.114, 1), 'los pesos de luma BT.601 suman 1 (0,299 + 0,587 + 0,114)');
ok(luma([255, 255, 255]) === 255 && luma([0, 0, 0]) === 0, 'luma de blanco = 255, de negro = 0');
ok(SMILE_RGB[4 * N + 3].join() === '255,214,0', 'el píxel (5, 4) es [255, 214, 0]');
ok(256 ** 3 === 16777216 && 2 ** 8 === 256, '256³ = 16 777 216 colores; 2⁸ = 256 niveles');
ok(255..toString(2) === '11111111' && 0..toString(2) === '0', 'el byte 255 = 11111111, el 0 = 00000000');

// ── 2 · vecindad al aplanar y ventana 3×3 ────────────────────────────────────
ok(2 * 8 + 2 === 18 && 3 * 8 + 2 === 26, 'píxel (2,2) y el de abajo: posiciones 18 y 26 en la lista (distancia 8)');
const h = hood(SMILE_GRAY, 2, 2);
ok(h.cells.join() === '146,202,255,202,0,202,202,0,202' && near(h.mean, 1411 / 9), `ventana 3×3 del píxel fila 3, columna 3: promedio ${h.mean} = 1411/9 ≈ 156,8`);
const h2 = hood(SMILE_GRAY, 2, 5);
ok(Math.round(h2.mean) === 151, `última ventana mostrada (fila 3, columna 6): promedio ${h2.mean.toFixed(2)} → 151`);

// ── 3 · desenfoque parcial: lo que dicen la voz y la escena ─────────────────
const fmt1 = (x: number) => (Math.round(x * 10) / 10).toFixed(1);
const expectMad = ['0.0', '15.0', '29.9', '44.9', '59.9'], expectCon = [255, 205, 175, 145, 131];
BLUR_LEVELS.forEach((a, l) => {
  const changed = a.filter((v, i) => v !== SMILE_GRAY[i]).length;
  const mad = a.reduce((s, v, i) => s + Math.abs(v - SMILE_GRAY[i]), 0) / 64, con = Math.max(...a) - Math.min(...a);
  console.log(`  nivel ${l} (${BLUR_PCT[l]} %): cambian ${changed}/64, cambio medio ${fmt1(mad)}, contraste ${con}`);
  ok(changed === (l === 0 ? 0 : 64) && fmt1(mad) === expectMad[l] && con === expectCon[l], `nivel ${l}: ${l === 0 ? 'sin cambios' : 'los 64 números cambian'}, cambio medio ${expectMad[l]}, contraste ${expectCon[l]}`);
});
const mads = BLUR_LEVELS.map((a) => a.reduce((s, v, i) => s + Math.abs(v - SMILE_GRAY[i]), 0) / 64);
ok(mads.every((m, i) => i === 0 || m > mads[i - 1]), 'el cambio medio crece con el nivel (el «mira cuánto se alejan» es observable)');

// ── 4 · dos imágenes distintas con el mismo desenfoque completo (exacto, en enteros) ──
const sums = (v: number[]) => {
  const out: [number, number][] = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    let s = 0, k = 0;
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < N && cc >= 0 && cc < N) { s += v[rr * N + cc]; k++; } }
    out.push([s, k]);
  }
  return out;
};
const sA = sums(SMILE_GRAY), sB = sums(FACE_B);
ok(sA.every(([s, k], i) => s === sB[i][0] && k === sB[i][1]), 'la suma de cada ventana 3×3 (y el número de vecinos) es idéntica en la carita y en la carita con la columna 4 modificada → mismo desenfoque completo, número por número');
ok(SMILE_GRAY.filter((v, i) => v !== FACE_B[i]).length === 6, 'las dos imágenes difieren en exactamente 6 píxeles');
ok(Math.min(...FACE_B) >= 0 && Math.max(...FACE_B) <= 255, 'la segunda imagen sigue en el rango 0–255');
ok(NULL_U.every((_, i) => (NULL_U[i - 1] ?? 0) + NULL_U[i] + (NULL_U[i + 1] ?? 0) === 0), 'u = (1,−1,0,1,−1,0,1,−1): cada tres vecinos seguidos (y en los bordes) suman cero');
// rango de la matriz de sumas de ventana (K⊗K) con aritmética exacta (eliminación de Bareiss en BigInt)
function rank(M: bigint[][]): number {
  const A = M.map((r) => r.slice()), n = A.length, m = A[0].length;
  let rk = 0, prev = 1n;
  for (let c = 0; c < m && rk < n; c++) {
    let p = rk; while (p < n && A[p][c] === 0n) p++;
    if (p === n) continue;
    [A[rk], A[p]] = [A[p], A[rk]];
    for (let i = rk + 1; i < n; i++) {
      for (let j = c + 1; j < m; j++) A[i][j] = (A[rk][c] * A[i][j] - A[i][c] * A[rk][j]) / prev;
      A[i][c] = 0n;
    }
    prev = A[rk][c]; rk++;
  }
  return rk;
}
const S: bigint[][] = Array.from({ length: 64 }, (_, a) => Array.from({ length: 64 }, (_, b) => {
  const [r, c, rr, cc] = [Math.floor(a / N), a % N, Math.floor(b / N), b % N];
  return Math.abs(r - rr) <= 1 && Math.abs(c - cc) <= 1 ? 1n : 0n;
}));
ok(rank(S) === 49, `rango exacto de la suma de ventana 3×3 sobre 8×8 = ${rank(S)} (7 × 7 = 49, no 64)`);
// ¿Y las mezclas parciales? «por dentro» afirma que (1−λ)I + λB es invertible para λ < 1 y que con λ = 0,75 amplifica ~40 veces el
// redondeo (número de condición). Se comprobó con numpy (no hay SVD en este script); para reproducirlo:
//   python3 - <<'EOF'
//   import numpy as np
//   n=8; M=np.zeros((64,64))
//   for r in range(n):
//     for c in range(n):
//       ks=[(r+a,c+b) for a in(-1,0,1) for b in(-1,0,1) if 0<=r+a<n and 0<=c+b<n]
//       for (rr,cc) in ks: M[r*n+c, rr*n+cc]=1/len(ks)
//   for lam in [0.25,0.5,0.75,1.0]:
//     A=(1-lam)*np.eye(64)+lam*M; s=np.linalg.svd(A,compute_uv=False)
//     print(lam, np.linalg.matrix_rank(A), s[0]/s[-1])
//   EOF
// salida: 0.25 → rango 64, cond 1,49 · 0.5 → 64, 2,88 · 0.75 → 64, 40,2 · 1.0 → rango 49 (cond ≈ 3e17)

// ── 5 · sonido: reconstrucción ideal y mínimo de muestreo ───────────────────
ok(MIN_RATE === 2 * SND.f2 && MIN_RATE === 1000, 'mínimo de muestreo: el doble de 500 = 1 000 muestras por segundo');
ok((SND.f1 * SND.T) / 1000 === 2 && (SND.f2 * SND.T) / 1000 === 5, 'los tonos de 200 y 500 caben 2 y 5 veces en 10 ms: la señal se repite cada 10 ms');
ok(near(wave(0), wave(SND.T), 1e-12), 'wave(0) = wave(10 ms): periódica');
const rows: string[] = [];
let allGood = true, allBad = true;
for (let fs = 200; fs <= 4000; fs += 100) {
  const sp = sample(fs);
  rows.push(`${fs}:${sp.err.toFixed(2)}`);
  if (fs > MIN_RATE && !(sp.err < 1e-9)) allGood = false;
  if (fs <= MIN_RATE && !(sp.err > 0.4)) allBad = false;
  if (sp.n !== fs / 100) allGood = false;
}
console.log('  error relativo por tasa: ' + rows.join(' '));
ok(allGood, 'con más de 1 000 muestras por segundo la reconstrucción ideal coincide con la señal (error < 1e-9) y hay fs/100 muestras en 10 ms');
ok(allBad, 'con 1 000 o menos el error relativo es mayor que 0,4 (la compuerta del sonido: err > 0,05)');
ok(near(sample(1000).err, 0.4313, 5e-4) && near(sample(500).err, 0.6687, 5e-4) && near(sample(300).err, 1.6539, 5e-4) && near(sample(600).err, 0.739, 5e-4), 'errores citados en «por dentro»: 0,43 a 1 000; de 0,67 a 1,65 por debajo');
ok(sample(2000).n === 20 && sample(4000).n === 40, '2 000 muestras por segundo → 20 muestras en 10 ms');
{
  // las muestras mostradas (×100, redondeadas) son las de la lista de la escena
  const nums = sample(2000).v.slice(0, 9).map((v) => Math.round(v * 100)).join(', ');
  console.log('  lista de la escena a 2 000: [' + nums + ', …]');
}
ok(16000 * 60 === 960000 && 80 * 100 === 8000 && 80 * 100 * 60 === 480000, 'Whisper: 16 000 × 60 = 960 000 muestras; espectrograma 80 canales × 100 columnas/s = 8 000 números/s');

// ── 6 · texto ───────────────────────────────────────────────────────────────
ok(codesOf('Neu').join() === '78,101,117' && codesOf('ñ')[0] === 241, '«N», «e», «u» = 78, 101, 117 y «ñ» = 241 (puntos de código Unicode)');
const same = (a: string, b: string) => { const x = codesOf(a), y = codesOf(b); return x.filter((v, i) => v === y[i]).length; };
ok(same('gato', 'dato') === 3 && same('cat', 'car') === 2 && same('gato', 'felino') === 0 && same('cat', 'feline') === 0, 'gato/dato comparten 3 de 4 códigos en la misma posición; cat/car, 2 de 3; gato/felino y cat/feline, ninguno');
const d = WORDS.slice(1).map((w) => [w.es, dist(WORDS[0].f, w.f)] as const);
console.log('  distancias a «gato»: ' + d.map(([w, x]) => `${w} ${x.toFixed(2)}`).join(' · '));
ok(d[0][0] === 'perro' && d[0][1] < 0.25 && d[3][1] > 1.6 && d.every(([, x], i) => i === 0 || x > d[0][1]), 'gato–perro 0,22 (cerca), gato–tigre 1,08, gato–queso 1,62, gato–pan 1,68 (lejos)');

// ── 7 · MNIST, foto, AlexNet y cuentas del quiz ─────────────────────────────
ok(28 * 28 === 784 && MNIST_LIKE.length === 784, '28 × 28 = 784 números por imagen MNIST (la ilustración tiene 784 valores)');
ok(60000 / 10000 === 6, 'MNIST: 60 000 de entrenamiento y 10 000 de prueba (barras 1 : 1/6)');
ok(4000 * 3000 === 12_000_000 && 12_000_000 * 3 === 36_000_000, 'foto de 12 megapíxeles: 4000 × 3000 = 12 000 000 píxeles; × 3 canales = 36 000 000 números');
ok(256 * 256 * 3 === 196608 && near(36_000_000 / 196608, 183.105, 1e-3), 'AlexNet: 256 × 256 × 3 = 196 608 («casi doscientos mil»); 36 000 000 / 196 608 ≈ 183 veces menos');
ok(100 * 100 * 3 === 30000, 'quiz: imagen de 100 × 100 en color = 30 000 números');

console.log(bad ? `\nFALLAN ${bad}` : '\ntodo coincide');
process.exit(bad ? 1 : 0);
