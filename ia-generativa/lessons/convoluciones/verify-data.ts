// Comprobación reproducible de las cifras y afirmaciones calculables de la lección 11 (voz, escena, «por dentro», quiz).
//   npx tsx src/content/courses/ia-generativa/lessons/convoluciones/verify-data.ts      (desde app/)
// Sale con código 1 si algo no coincide. Recalcula de forma independiente (otra formulación que la de scene.ts) la convolución
// real de la imagen de 16×16 de la escena, los kernels, las dimensiones de la red de ejemplo, los parámetros, el campo receptivo,
// el efecto del pooling ante un desplazamiento de un píxel, y ejecuta con Python 3 el código de «por dentro».
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import content from './content';
import { CNN_STAGES, IMG, K, KS, M, N, OUT, conv, pool } from './scene';

let bad = 0;
const ok = (cond: boolean, msg: string) => { if (!cond) bad++; console.log(`${cond ? '✓' : '✗'} ${msg}`); };
const near = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) <= eps;
const r = (x: number, d = 3) => Math.round(x * 10 ** d) / 10 ** d;
const kd = (id: string) => KS.find((q) => q.id === id)!;
const H = path.dirname(new URL(import.meta.url).pathname);

// ── 1 · el gancho: 100 × 100 píxeles conectados a 1 000 neuronas ──
{
  ok(100 * 100 === 10_000, 'una imagen de 100 × 100 tiene 10 000 valores');
  ok(10_000 * 1_000 === 10_000_000, '10 000 entradas × 1 000 neuronas = 10 000 000 pesos (sin contar los 1 000 sesgos)');
  // pesos de una capa totalmente conectada, contados uno por uno
  let w = 0; for (let i = 0; i < 10_000; i++) for (let j = 0; j < 1_000; j++) w++;
  ok(w === 10_000_000, `contados uno por uno: ${w}`);
  // un kernel de 3×3 sobre un canal: 9 pesos + 1 sesgo, sin depender del tamaño de la imagen
  ok(3 * 3 + 1 === 10, 'un kernel de 3 × 3 con un solo canal: 9 pesos + 1 sesgo = 10');
  // comparación honesta de «por dentro»: 1 000 kernels de 3×3 sobre la misma imagen de 100 × 100 (sin relleno)
  const out = 100 - 3 + 1;
  ok(out === 98, 'sin relleno, 100 × 100 con kernel 3 × 3 da 98 × 98');
  ok(1_000 * (3 * 3 * 1 + 1) === 10_000, '1 000 kernels de 3 × 3 (1 canal): 1 000 · (9 + 1) = 10 000 parámetros, mil veces menos que 10 000 000');
  ok(out * out * 1_000 === 9_604_000, 'su salida: 1 000 mapas de 98 × 98 = 9 604 000 valores (más valores de salida que la capa densa, que da 1 000)');
  ok(out * out * 9 * 1_000 === 86_436_000 && 10_000 * 1_000 === 10_000_000, 'multiplicaciones: 86 436 000 en la capa convolucional frente a 10 000 000 en la densa: compartir pesos ahorra parámetros, no operaciones');
}

// ── 2 · la convolución real de la escena, por otra vía (matriz de la operación) ──
{
  ok(N === 16 && K === 3 && M === 14, 'imagen 16 × 16, kernel 3 × 3, salida 14 × 14 (16 − 3 + 1)');
  // otra formulación: la convolución como multiplicación por una matriz (cada fila de la matriz es una posición de la ventana)
  const flat = IMG.flat();
  let maxDiff = 0, shapeOk = true;
  for (const q of KS) {
    const rows: number[][] = [];
    for (let i = 0; i < M; i++) for (let j = 0; j < M; j++) {
      const row = new Array(N * N).fill(0);
      for (let u = 0; u < K; u++) for (let v = 0; v < K; v++) row[(i + u) * N + (j + v)] = q.k[u][v];
      rows.push(row);
    }
    const y = rows.map((row) => row.reduce((s, w, k) => s + w * flat[k], 0));
    const got = OUT[q.id];
    shapeOk &&= got.length === M && got.every((rr) => rr.length === M);
    got.flat().forEach((v, k) => { maxDiff = Math.max(maxDiff, Math.abs(v - y[k])); });
  }
  ok(shapeOk && maxDiff < 1e-12, `los 5 mapas de salida de scene.ts (14 × 14) coinciden con la multiplicación por la matriz de la operación (diferencia máxima ${maxDiff.toExponential(1)})`);
  ok(KS.length === 5 && KS.map((q) => q.id).join() === 'vert,horiz,blur,sharp,id', 'los cinco kernels de la escena: vertical, horizontal, desenfoque, nitidez, identidad');
  const sum = (k: number[][]) => k.flat().reduce((a, b) => a + b, 0);
  ok(near(sum(kd('blur').k), 1) && near(sum(kd('sharp').k), 1) && sum(kd('id').k) === 1, 'desenfoque (nueve 1/9), nitidez e identidad suman 1: no cambian el brillo medio de las zonas uniformes');
  ok(sum(kd('vert').k) === 0 && sum(kd('horiz').k) === 0, 'los kernels de bordes suman 0: dan 0 en las zonas uniformes');
  // identidad: la salida es la imagen recortada
  ok(OUT.id.every((rr, i) => rr.every((v, j) => near(v, IMG[i + 1][j + 1]))), 'el kernel identidad devuelve la imagen sin su marco de un píxel');
  // Sobel: tipo y magnitud (fuente: documentación de OpenCV, «Sobel Derivatives»)
  ok(JSON.stringify(kd('vert').k) === '[[-1,0,1],[-2,0,2],[-1,0,1]]' && JSON.stringify(kd('horiz').k) === '[[-1,-2,-1],[0,0,0],[1,2,1]]', 'los kernels vertical y horizontal son los de Sobel (Gx y Gy de la documentación de OpenCV)');
  ok(JSON.stringify(kd('vert').k.map((_, i, a) => a.map((row) => row[i]))) === JSON.stringify(kd('horiz').k), 'K_y = K_xᵀ (como dice «por dentro»)');
}

// ── 3 · girar el kernel vertical da el horizontal; bordes de subida y de bajada ──
{
  const rot90cw = (k: number[][]) => k[0].map((_, j) => k.map((row) => row[j]).reverse());
  ok(JSON.stringify(rot90cw(kd('vert').k)) === JSON.stringify(kd('horiz').k), 'girar 90° el kernel vertical (en sentido horario) da exactamente el kernel horizontal (voz del segmento «horizontal»)');
  // un escalón oscuro → claro de izquierda a derecha (negativos a la izquierda, positivos a la derecha): respuesta positiva; claro → oscuro: negativa
  const step = (a: number, b: number) => Array.from({ length: 5 }, () => [a, a, b, b, b]);
  // ventana de 3 columnas centrada en el borde (columnas 1, 2, 3 de cada fila)
  const win = (img: number[][]) => img.slice(1, 4).map((row) => row.slice(1, 4));
  const rs = (img: number[][], k: number[][]) => { const w = win(img); let s = 0; for (let u = 0; u < 3; u++) for (let v = 0; v < 3; v++) s += k[u][v] * w[u][v]; return s; };
  ok(rs(step(0.1, 0.9), kd('vert').k) > 0 && rs(step(0.9, 0.1), kd('vert').k) < 0, 'el kernel vertical da positivo donde el brillo sube de izquierda a derecha y negativo donde baja');
  ok(near(rs(step(0.1, 0.9), kd('vert').k), 4 * 0.8) && rs(step(0.5, 0.5), kd('vert').k) === 0, 'sobre un escalón de 0.1 a 0.9 la respuesta es 4 · 0.8 = 3.2; sobre una zona uniforme, 0');
  // en la imagen de la escena, el borde izquierdo de la franja (columna 2) da positivo y el derecho (columna 3 → 4) negativo
  const v = OUT.vert;
  ok(v[5][0] > 3 && v[5][2] < -3, `en la franja de la escena el mapa vertical vale ${r(v[5][0], 2)} en su borde izquierdo (cian) y ${r(v[5][2], 2)} en el derecho (rosa)`);
  // los colores del lienzo (positivo = tono sig, negativo = tono err) son cian y rosa
  const tokens = fs.readFileSync(path.join(H, '../../../../../theme/tokens.css'), 'utf8');
  const hex = (name: string) => [...tokens.matchAll(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`, 'g'))].map((m) => m[1]);
  const hue = (h: string) => { const [R, G, B] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255); const mx = Math.max(R, G, B), mn = Math.min(R, G, B), d = mx - mn; let x = mx === R ? ((G - B) / d) % 6 : mx === G ? (B - R) / d + 2 : (R - G) / d + 4; x *= 60; return x < 0 ? x + 360 : x; };
  const sig = hex('sig'), err = hex('err');
  ok(sig.length >= 2 && sig.every((c) => hue(c) > 170 && hue(c) < 200), `--sig (${sig.join(', ')}) tiene matiz ${sig.map((c) => Math.round(hue(c))).join('°, ')}°: cian (no azul puro)`);
  ok(err.length >= 2 && err.every((c) => hue(c) > 320 && hue(c) < 345), `--err (${err.join(', ')}) tiene matiz ${err.map((c) => Math.round(hue(c))).join('°, ')}°: rosa`);
  const sceneSrc = fs.readFileSync(path.join(H, 'scene.ts'), 'utf8');
  ok(/v >= 0 \? alpha\(tone\(S, 'sig'\)/.test(sceneSrc) && /: alpha\(tone\(S, 'err'\)\.c, clamp\(-v/.test(sceneSrc), 'scene.ts pinta los valores positivos con el tono sig y los negativos con err');
}

// ── 4 · el turno «predecir»: ¿qué kernel resalta más la franja vertical? (columnas 2–3, filas 2–13) ──
{
  // En el mapa de salida, la columna c mira las columnas c..c+2 de la entrada: la franja (columnas 2–3) queda en las columnas de salida 0–3.
  // Filas de salida 3–10: ventanas que cubren filas de entrada 3–12, todas dentro de la franja (que ocupa las filas 2–13).
  const lado = (m: number[][]) => Math.max(...[3, 5, 8, 10].flatMap((i) => [0, 1, 2, 3].map((j) => Math.abs(m[i][j]))));
  const g: Record<string, number> = { vert: lado(OUT.vert), horiz: lado(OUT.horiz) };
  ok(g.vert > 3 && g.horiz < 1e-9, `a lo largo de la franja (filas interiores) el kernel vertical responde ${r(g.vert, 2)} y el horizontal ${r(g.horiz, 2)}: su respuesta es 0`);
  // el horizontal solo responde en los extremos de la franja (arriba y abajo)
  const hz = OUT.horiz;
  const ext = [1, 2, 11, 12].map((i) => Math.max(...[0, 1, 2, 3].map((j) => Math.abs(hz[i][j]))));
  ok(ext.some((v) => v > 2), `el kernel horizontal solo responde en los extremos de la franja (|respuesta| hasta ${r(Math.max(...ext), 2)} en las filas de salida 1, 2, 11 y 12)`);
  // desenfoque: la franja sigue visible (≈ 0.67 frente a un fondo de 0.12), pero no marca bordes
  const centro = OUT.blur[5][1], bg = OUT.blur[0][8];
  ok(near(centro, (2 * 0.95 + 0.12) / 3, 1e-9) && near(bg, 0.12, 1e-9), `con el desenfoque la franja queda en ${r(centro, 2)} frente a un fondo de ${r(bg, 2)}: sigue visible, solo más borrosa (decir que «casi no la resalta» sería exagerado)`);
  // el kernel vertical marca los dos lados de la franja con respuesta de signo opuesto (cian y rosa); como la franja mide 2 píxeles y la ventana 3, cada lado ocupa 2 columnas de salida
  const v5 = OUT.vert[5];
  ok(v5[0] > 3 && v5[1] > 3 && v5[2] < -3 && v5[3] < -3 && Math.abs(OUT.vert[4][4]) < 1e-9, `el vertical marca el lado izquierdo con +${r(v5[0], 2)} (columnas de salida 0–1), el derecho con ${r(v5[2], 2)} (2–3) y da 0 fuera de la franja`);
}

// ── 5 · pooling 2 × 2: la imagen se encoge y se tolera un desplazamiento pequeño (de forma solo aproximada) ──
{
  const p = pool(OUT.vert);
  ok(p.length === 7 && p[0].length === 7, 'pooling 2 × 2 sobre el mapa de 14 × 14 da 7 × 7');
  // hasta 16 filas; desplazar la imagen un píxel hacia la derecha (columna nueva = fondo 0.12) y comparar mapas
  const shiftR = (img: number[][], s: number) => img.map((row) => [...new Array(s).fill(0.12), ...row.slice(0, N - s)]);
  const absMap = (img: number[][]) => conv(img, kd('vert').k).map((row) => row.map(Math.abs));
  const l1 = (a: number[][], b: number[][]) => a.flat().reduce((s, v, i) => s + Math.abs(v - b.flat()[i]), 0);
  const norm = (a: number[][]) => a.flat().reduce((s, v) => s + Math.abs(v), 0);
  // 1) sin pooling: el mapa 14 × 14 de la imagen desplazada vs. el original
  const m0 = absMap(IMG), m1 = absMap(shiftR(IMG, 1));
  const cambioMapa = l1(m0, m1) / norm(m0);
  // 2) con pooling máximo de 2 × 2 (fase de 0 y de 1 píxel)
  const p0 = pool(m0), p1 = pool(m1);
  const cambioPool = l1(p0, p1) / norm(p0);
  console.log(`  cambio relativo (L1) con un desplazamiento de 1 px: mapa 14 × 14 = ${r(cambioMapa, 2)}; tras pooling 7 × 7 = ${r(cambioPool, 2)}`);
  // La invariancia es aproximada y depende de la fase: se mide en todos los desplazamientos de 1 px a 3 px y de forma aleatoria con imágenes de ruido suave.
  let mejor = 0, total = 0;
  for (let s = 1; s <= 3; s++) { const a = absMap(IMG), b = absMap(shiftR(IMG, s)); total++; if (l1(pool(a), pool(b)) / norm(pool(a)) < l1(a, b) / norm(a)) mejor++; }
  console.log(`  desplazamientos de 1 a 3 px en la imagen de la escena: el pooling reduce el cambio relativo en ${mejor} de ${total}`);
  // Imágenes aleatorias con bordes (franjas verticales de ancho 2–4 en posiciones aleatorias): fracción de casos en que el pooling reduce el cambio
  let seed = 12345; const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  let menos = 0, n = 0, sumMapa = 0, sumPool = 0;
  for (let t = 0; t < 400; t++) {
    const img = Array.from({ length: N }, () => new Array(N).fill(0.1));
    for (let b = 0; b < 3; b++) { const w = 2 + Math.floor(rnd() * 3), x0 = 1 + Math.floor(rnd() * (N - 3 - w)); for (let i = 0; i < N; i++) for (let j = x0; j < x0 + w; j++) img[i][j] = 0.9; }
    const a = absMap(img), b = absMap(shiftR(img, 1));
    const cm = l1(a, b) / norm(a), cp = l1(pool(a), pool(b)) / norm(pool(a));
    sumMapa += cm; sumPool += cp; n++; if (cp < cm) menos++;
  }
  console.log(`  400 imágenes de franjas aleatorias, desplazamiento de 1 px: cambio relativo medio, mapa = ${r(sumMapa / n, 2)}, tras pooling = ${r(sumPool / n, 2)}; el pooling lo reduce en ${menos} de ${n}`);
  ok(sumPool / n < sumMapa / n, 'en promedio, el pooling máximo de 2 × 2 reduce el efecto de un desplazamiento de un píxel (invariancia aproximada)');
  ok(menos < n, `pero no siempre: en ${n - menos} de ${n} casos no lo reduce, por eso la voz dice «tolera pequeños desplazamientos» y no «es invariante» (Azulay y Weiss 2019: no hay garantía)`);
}

// ── 6 · tamaño de la salida, parámetros, dimensiones de la red de ejemplo ──
{
  const outSize = (n: number, k: number, s: number, p: number) => Math.floor((n + 2 * p - k) / s) + 1;
  // cuenta de posiciones de la ventana por enumeración
  const count = (n: number, k: number, s: number, p: number) => { let c = 0; for (let x = -p; x + k <= n + p; x += s) c++; return c; };
  let all = true;
  for (let n = 3; n <= 40; n++) for (let k = 1; k <= Math.min(n, 7); k++) for (let s = 1; s <= 4; s++) for (let p = 0; p <= 3; p++) all &&= outSize(n, k, s, p) === count(n, k, s, p);
  ok(all, '⌊(n + 2p − k)/s⌋ + 1 coincide con contar las posiciones de la ventana (n 3–40, k 1–7, s 1–4, p 0–3)');
  ok(outSize(28, 3, 1, 0) === 26 && 28 - 3 + 1 === 26, 'quiz: 28 × 28 con kernel 3 × 3, sin relleno y zancada 1 da 26 × 26 (las otras opciones: 25, 28 y 14 no)');
  ok(outSize(28, 3, 1, 1) === 28, 'con relleno 1 el tamaño se conserva (28): por eso «relleno cero» no es lo mismo que «sin relleno»');
  ok(outSize(16, 3, 1, 0) === 14, 'la imagen de la escena: 16 → 14');
  // parámetros de una capa convolucional C_out (k² C_in + 1)
  const params = (cout: number, k: number, cin: number) => { let c = 0; for (let o = 0; o < cout; o++) { for (let i = 0; i < cin; i++) for (let u = 0; u < k; u++) for (let v = 0; v < k; v++) c++; c++; } return c; };
  ok(params(16, 3, 1) === 160 && 16 * (9 + 1) === 160, 'por dentro: 16 kernels de 3 × 3 con 1 canal = 16 · (9 + 1) = 160 parámetros');
  // la red de ejemplo de la escena: 28 → conv3 → 26 → pool → 13 → conv3 → 11 → pool → 5 → densa 400 → 10
  const dims = [28, outSize(28, 3, 1, 0), 0, 0, 0];
  dims[2] = Math.floor(dims[1] / 2); dims[3] = outSize(dims[2], 3, 1, 0); dims[4] = Math.floor(dims[3] / 2);
  ok(dims.join() === '28,26,13,11,5', `28 → ${dims.slice(1).join(' → ')} (conv 3×3, pooling, conv 3×3, pooling)`);
  ok(5 * 5 * 16 === 400, '5 × 5 × 16 = 400 entradas a la capa densa');
  const want = CNN_STAGES.map((s) => s.dim);
  ok(want.join('|') === '28×28×1|26×26×8|13×13×8|11×11×16|5×5×16|400 → 10', `las etapas rotuladas en la escena: ${want.join(' | ')}`);
  // parámetros de esa red (ilustración de «pocos pesos»): conv1 8·(9+1), conv2 16·(9·8+1), densa 400·10+10
  const pr = params(8, 3, 1) + params(16, 3, 8) + (400 * 10 + 10);
  console.log(`  parámetros de la red de ejemplo de la escena: ${params(8, 3, 1)} + ${params(16, 3, 8)} + ${400 * 10 + 10} = ${pr}`);
  ok(pr === 80 + 1168 + 4010, 'conv1 = 80, conv2 = 1 168, densa = 4 010');
  // una red totalmente conectada equivalente (784 → 8·26·26 = 5 408 valores) tendría muchísimos más pesos
  ok(784 * 5408 === 4_239_872, 'comparación: solo la primera capa de una red densa 784 → 5 408 (el tamaño de la salida de conv1) tendría 4 239 872 pesos');
}

// ── 7 · campo receptivo (Araujo, Norris y Sim 2019: r_{l−1} = s_l · r_l + (k_l − s_l)) ──
{
  const field = (layers: { k: number; s: number }[]) => { let rr = 1; for (let l = layers.length - 1; l >= 0; l--) rr = layers[l].s * rr + (layers[l].k - layers[l].s); return rr; };
  ok(field([{ k: 3, s: 1 }, { k: 3, s: 1 }]) === 5, 'dos convoluciones de 3 × 3 seguidas «ven» 5 × 5 (por dentro)');
  const conv3 = { k: 3, s: 1 }, pool2 = { k: 2, s: 2 };
  const con = field([conv3, pool2, conv3]), sin = field([conv3, conv3]);
  ok(con === 8 && con > sin, `con un pooling 2 × 2 en medio (conv3, pool, conv3) el campo es ${con} × ${con} y no ${sin} × ${sin}: «con pooling el campo crece más rápido»`);
  const pila = field([conv3, pool2, conv3, pool2]);
  ok(pila === 10, `la red de ejemplo de la escena, tras sus dos pooling, tiene un campo de ${pila} × ${pila} píxeles por unidad`);
  // comprobación independiente por propagación de dependencias: ¿qué píxeles de entrada influyen en una unidad de la última capa?
  const influence = (layers: { k: number; s: number }[], size: number) => {
    // posiciones de entrada (1D) de las que depende la unidad 0 de la salida; en 1D basta para el lado del campo (la operación es separable por ejes)
    let lo = 0, hi = 0;   // intervalo [lo, hi] de posiciones de la capa l
    for (let l = layers.length - 1; l >= 0; l--) { lo = lo * layers[l].s; hi = hi * layers[l].s + layers[l].k - 1; }
    return Math.min(hi, size - 1) - lo + 1;
  };
  ok(influence([conv3, pool2, conv3, pool2], 28) === pila && influence([conv3, pool2, conv3], 28) === con && influence([conv3, conv3], 28) === 5, 'propagando dependencias capa por capa se obtienen los mismos campos (5, 8 y 10)');
}

// ── 8 · el código de «por dentro» (es y en) con Python 3: valores 4 en las columnas del borde, 0 en el resto ──
{
  const exec = (md: string, lang: string) => {
    const m = md.match(/```python\n([\s\S]*?)```/);
    if (!m) { ok(false, `${lang}: no hay bloque de código`); return ''; }
    try { return execFileSync('python3', ['-c', m[1]], { encoding: 'utf8' }).trim(); } catch (e) { ok(false, `${lang}: el código falla: ${(e as Error).message.slice(0, 80)}`); return ''; }
  };
  const deeper = content.deeper as { es: string; en: string };
  const es = exec(deeper.es, 'es'), en = exec(deeper.en, 'en');
  ok(es.length > 0 && es === en, 'el código de «por dentro» (es y en) imprime lo mismo');
  console.log(es.split('\n').map((l) => '    ' + l).join('\n'));
  // la salida esperada: 4 filas de [0, 4, 4, 0] (imagen 6 × 6, mitad izquierda 0, mitad derecha 1, kernel de Sobel vertical)
  const vals = es.replace(/[\[\]]/g, ' ').split(/\s+/).filter(Boolean).map(Number);
  const rows = es.split('\n').length;
  ok(rows === 4 && vals.length === 16 && vals.every((v, i) => v === (i % 4 === 1 || i % 4 === 2 ? 4 : 0)), 'cuatro filas [0, 4, 4, 0]: «valores 4 en las columnas del borde, 0 en el resto»');
  // el mismo cálculo en TypeScript con la función de la escena
  const img = Array.from({ length: 6 }, () => [0, 0, 0, 1, 1, 1]);
  const sob = conv; void sob;
  const manual = Array.from({ length: 4 }, (_, i) => Array.from({ length: 4 }, (_, j) => { let s = 0; for (let u = 0; u < 3; u++) for (let v = 0; v < 3; v++) s += kd('vert').k[u][v] * img[i + u][j + v]; return s; }));
  ok(manual.flat().join() === vals.join(), 'el mismo cálculo en TypeScript con el kernel de la escena da la misma matriz');
}

// ── 9 · números de lección citados, años y fuentes ──
{
  const map = fs.readFileSync(path.join(H, '../../../../../../../docs/v2/CURRICULUM-MAP.md'), 'utf8');
  const L = (n: string, id: string) => new RegExp(`### ${n} · \`${id}\``).test(map);
  ok(L('08', 'backpropagation') && L('12', 'secuencias-y-memoria') && L('13', 'big-bang-deep-learning'), '«por dentro» cita bien las lecciones 8 (retropropagación), 12 (secuencias) y 13 (big bang del deep learning)');
  const urls = (content.sources ?? []).map((s: { url?: string }) => s.url ?? '');
  ok(urls.every((u: string) => /^https?:\/\//.test(u)) && (content.sources ?? []).every((s: { authors?: string }) => !!s.authors), `${(content.sources ?? []).length} fuentes, todas con autores y enlace`);
}

// ── 10 · aritmética de las dos redes históricas (cifras copiadas de los artículos; se comprueba que cuadran entre sí) ──
{
  // LeCun et al. 1989 (Neural Computation 1(4):541–551), §3.3: H1 12 mapas 8×8 con kernels 5×5; H2 12 mapas 4×4 con kernels 5×5×8; H3 30; salida 10
  const h1Units = 12 * 8 * 8, h1Conn = h1Units * (25 + 1), h1Params = h1Units + 25 * 12;
  const h2Units = 12 * 4 * 4, h2Conn = h2Units * (200 + 1), h2Params = 12 * 200 + h2Units;
  const h3 = 30 * 192 + 30, out = 30 * 10 + 10;
  ok(h1Units === 768 && h1Conn === 19_968 && h1Params === 1_068, `1989, capa H1: ${h1Units} unidades, ${h1Conn} conexiones, ${h1Params} parámetros libres (el artículo: 768, 19 968, 1 068)`);
  ok(h2Units === 192 && h2Conn === 38_592 && h2Params === 2_592, `1989, capa H2: ${h2Units} unidades, ${h2Conn} conexiones, ${h2Params} parámetros (192, 38 592, 2 592)`);
  ok(h3 === 5_790 && out === 310, `1989, H3: ${h3} conexiones; salida: ${out} (5 790 y 310)`);
  ok(h1Conn + h2Conn + h3 + out === 64_660 && h1Params + h2Params + h3 + out === 9_760, `1989, total: ${h1Conn + h2Conn + h3 + out} conexiones y ${h1Params + h2Params + h3 + out} parámetros independientes (el artículo: 64 660 y 9 760)`);
  ok(256 * 40 + 40 + 40 * 10 + 10 === 10_690, '1989, la red totalmente conectada de comparación: 256 · 40 + 40 + 40 · 10 + 10 = 10 690 conexiones');
  ok(r((10 / 7291) * 100, 2) === 0.14 && r((102 / 2007) * 100, 1) === 5.1, '1989, resultados: 10 errores en 7 291 de entrenamiento = 0.14 %; 102 en 2 007 de prueba = 5.1 % (el artículo escribe 5.0 %)');
  ok(7291 + 2007 === 9298, '1989: 7 291 de entrenamiento + 2 007 de prueba = 9 298 dígitos');
  // LeCun et al. 1998 (Proc. IEEE 86(11):2278–2324), §II.B: LeNet-5
  const c1 = { p: 6 * (25 + 1), c: 6 * 28 * 28 * 26 }, s2 = { p: 6 * 2, c: 6 * 14 * 14 * 5 }, c3 = { p: 1_516, c: 151_600 }, s4 = { p: 16 * 2, c: 16 * 5 * 5 * 5 }, c5 = { p: 120 * (16 * 25 + 1), c: 120 * (16 * 25 + 1) }, f6 = { p: 84 * 121, c: 84 * 121 }, o = { p: 840, c: 840 };
  ok(c1.p === 156 && c1.c === 122_304 && s2.p === 12 && s2.c === 5_880 && s4.p === 32 && s4.c === 2_000 && c5.p === 48_120 && f6.p === 10_164, 'LeNet-5: C1 156 parámetros y 122 304 conexiones; S2 12 y 5 880; S4 32 y 2 000; C5 48 120; F6 10 164 (los del artículo)');
  const conns = c1.c + s2.c + c3.c + s4.c + c5.c + f6.c + o.c, pars = c1.p + s2.p + c3.p + s4.p + c5.p + f6.p + o.p;
  ok(conns === 340_908, `LeNet-5: ${conns} conexiones en total (el artículo: 340 908)`);
  console.log(`  LeNet-5: ${pars} parámetros entrenables (el artículo dice «only 60,000» como redondeo)`);
  ok(32 - 5 + 1 === 28 && 28 / 2 === 14 && 14 - 5 + 1 === 10 && 10 / 2 === 5 && 5 - 5 + 1 === 1, 'LeNet-5: 32 → 28 → 14 → 10 → 5 → 1 (kernels de 5 × 5 y submuestreo 2 × 2)');
}

console.log(bad ? `\n${bad} comprobación(es) fallida(s)` : '\ntodo coincide');
process.exit(bad ? 1 : 0);
