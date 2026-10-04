// Comprobación reproducible de las afirmaciones calculables de la lección 6 (voz, escena, «por dentro», quiz).
//   npx tsx src/content/courses/ia-generativa/lessons/limite-xor/verify-data.ts      (desde app/)
// Sale con código 1 si algo no coincide. No genera datos: recalcula por fuerza bruta lo que dicen la voz y el mapa de rectas
// (el máximo de aciertos con una recta es 3 de 4), la demostración algebraica, la red 2-2-1 y el código de «por dentro».
import { execFileSync } from 'node:child_process';
import content from './content';

let bad = 0;
const ok = (cond: boolean, msg: string) => { if (!cond) bad++; console.log(`${cond ? '✓' : '✗'} ${msg}`); };

const PTS: [number, number][] = [[0, 0], [0, 1], [1, 0], [1, 1]];
const XOR = (x: number, y: number) => (x !== y ? 1 : 0);
const OR = (x: number, y: number) => (x || y ? 1 : 0);
const AND = (x: number, y: number) => (x && y ? 1 : 0);
const H = (z: number) => (z > 0 ? 1 : 0);

// ── 1 · una neurona de dos entradas: ¿qué funciones booleanas puede calcular? (convención de la lección: 1 si z > 0) ──
// Rejilla fina de (w1, w2, b): se recogen las tablas de verdad que alcanza alguna recta (las 16 posibles tienen 4 filas).
{
  const reach = new Set<string>();
  for (let w1 = -4; w1 <= 4.0001; w1 += 0.25) for (let w2 = -4; w2 <= 4.0001; w2 += 0.25) for (let b = -4; b <= 4.0001; b += 0.125) {
    reach.add(PTS.map(([x, y]) => H(w1 * x + w2 * y + b)).join(''));
  }
  const table = (f: (x: number, y: number) => number) => PTS.map(([x, y]) => f(x, y)).join('');
  ok(reach.has(table(OR)) && reach.has(table(AND)), 'OR y AND las calcula una sola neurona (hay rectas que las separan)');
  ok(!reach.has(table(XOR)) && !reach.has('1001'), `XOR (0110) y su complemento (1001) no aparecen entre las ${reach.size} tablas alcanzables`);
  ok(reach.size === 14, `de las 16 funciones de dos variables, 14 se alcanzan con una neurona (las dos que faltan son XOR y su complemento); alcanzadas: ${reach.size}`);
  // Minsky y Papert, Perceptrons, §1.4 ejemplo 1: «de las 16 funciones booleanas de dos variables todas son de orden 1 salvo el o exclusivo y su complemento».
}

// ── 2 · el mapa de todas las rectas (scene.ts): el máximo de aciertos sobre XOR es 3 de 4, elija el lado que elija ──
{
  const score = (ang: number, c: number) => {
    const a = (ang * Math.PI) / 180, nx = Math.cos(a), ny = Math.sin(a);
    let hit = 0; for (const [x, y] of PTS) if ((nx * x + ny * y - c > 0 ? 1 : 0) === XOR(x, y)) hit++;
    return Math.max(hit, 4 - hit);
  };
  let max = 0, n3 = 0, total = 0;
  for (let ang = 0; ang < 360; ang += 0.5) for (let c = -3; c <= 3.0001; c += 0.01) { const s = score(ang, c); total++; if (s > max) max = s; if (s === 3) n3++; }
  ok(max === 3 && n3 > 0, `en ${total} rectas (ángulo 0–360°, desplazamiento −3 a 3) el máximo de aciertos sobre XOR es ${max}; ${n3} rectas llegan a 3`);
  // las del mapa de la escena (ángulo 0–180°, desplazamiento −1 a 1.5) cubren toda recta que corta el cuadrado: fuera de ese rango no hay recta que lo corte
  let cuts = true;
  for (let ang = 0; ang <= 180; ang += 0.5) {
    const a = (ang * Math.PI) / 180, v = PTS.map(([x, y]) => Math.cos(a) * x + Math.sin(a) * y);
    if (Math.min(...v) < -1 - 1e-12 || Math.max(...v) > 1.5 + 1e-12) cuts = false;
  }
  ok(cuts, 'el rango de la escena (ángulo 0–180°, desplazamiento −1 a 1.5) contiene todas las rectas que cortan el cuadrado de las cuatro esquinas; las demás dejan las cuatro del mismo lado (2 de 4)');
}

// ── 3 · la demostración algebraica de «por dentro» ──
// Hacen falta: b ≤ 0, w1 + b > 0, w2 + b > 0, w1 + w2 + b ≤ 0. Sumando las dos del medio: w1 + w2 + 2b > 0, o sea w1 + w2 + b > −b ≥ 0.
{
  let found = 0;
  for (let w1 = -6; w1 <= 6.0001; w1 += 0.1) for (let w2 = -6; w2 <= 6.0001; w2 += 0.1) for (let b = -6; b <= 6.0001; b += 0.1) {
    if (b <= 1e-9 && w1 + b > 1e-9 && w2 + b > 1e-9 && w1 + w2 + b <= 1e-9) found++;
  }
  ok(found === 0, `ninguna terna (w1, w2, b) de la rejilla [−6, 6] cumple las cuatro desigualdades de XOR (${found})`);
}

// ── 4 · la red 2-2-1: h1 = H(x + y − 0.5) = OR, h2 = H(x + y − 1.5) = AND, salida = H(h1 − h2 − 0.5) = XOR ──
{
  const h1 = (x: number, y: number) => H(x + y - 0.5), h2 = (x: number, y: number) => H(x + y - 1.5), out = (a: number, b: number) => H(a - b - 0.5);
  ok(PTS.every(([x, y]) => h1(x, y) === OR(x, y) && h2(x, y) === AND(x, y) && out(h1(x, y), h2(x, y)) === XOR(x, y)), 'h1 es OR, h2 es AND y la salida es XOR en las cuatro entradas');
  ok(JSON.stringify(PTS.map(([x, y]) => [h1(x, y), h2(x, y)])) === JSON.stringify([[0, 0], [1, 0], [1, 0], [1, 1]]), 'en el plano (h1, h2) los cuatro puntos pasan a (0,0), (1,0), (1,0) y (1,1)');
  // en ese plano una recta separa: salida = 1 si h1 − h2 − 0.5 > 0
  ok(PTS.every(([x, y]) => out(h1(x, y), h2(x, y)) === XOR(x, y)) && (1 - 0 - 0.5 > 0) && !(0 - 0 - 0.5 > 0) && !(1 - 1 - 0.5 > 0), 'la recta h1 − h2 = 0.5 deja (1,0) de un lado y (0,0), (1,1) del otro');
  // OR − AND = XOR por tabla; con las franjas: los unos caen entre x + y = 0.5 y x + y = 1.5 (segmento fix)
  ok(PTS.every(([x, y]) => (x + y > 0.5 && x + y <= 1.5 ? 1 : 0) === XOR(x, y)), 'los unos de XOR quedan en la franja 0.5 < x + y ≤ 1.5 (segmento fix)');
  // quiz: entrada (1, 0) → (h1, h2) = (1, 0)
  ok(h1(1, 0) === 1 && h2(1, 0) === 0, 'quiz: para (1, 0), OR = 1 y AND = 0');
}

// ── 5 · el código de «por dentro» (es y en) ──
{
  const py = (md: string) => /```python\n([\s\S]*?)```/.exec(md)?.[1] ?? '';
  for (const lang of ['es', 'en'] as const) {
    const code = py(content.deeper[lang]);
    const out = execFileSync('python3', ['-c', code], { encoding: 'utf8' }).trim().split('\n').map((l) => l.trim()).join(' | ');
    ok(out === '0 0 -> 0 | 0 1 -> 1 | 1 0 -> 1 | 1 1 -> 0', `python (${lang}): salida «${out}» = comentario del código`);
  }
}

// ── 6 · paridad de n bits: con n = 2 es XOR; con n = 3 tampoco la separa una recta (plano) ──
{
  const par = (bits: number[]) => bits.reduce((a, b) => a ^ b, 0);
  ok(PTS.every(([x, y]) => par([x, y]) === XOR(x, y)), 'la paridad de 2 bits es XOR');
  // n = 3: ¿hay un plano w·x + b > 0 con la paridad? Rejilla fina de (w, b)
  let found = 0;
  const pts3: number[][] = []; for (let i = 0; i < 8; i++) pts3.push([(i >> 2) & 1, (i >> 1) & 1, i & 1]);
  for (let w1 = -4; w1 <= 4.0001; w1 += 0.5) for (let w2 = -4; w2 <= 4.0001; w2 += 0.5) for (let w3 = -4; w3 <= 4.0001; w3 += 0.5) for (let b = -4; b <= 4.0001; b += 0.25) {
    if (pts3.every((p) => H(w1 * p[0] + w2 * p[1] + w3 * p[2] + b) === par(p))) found++;
  }
  ok(found === 0, 'ningún plano de la rejilla separa la paridad de 3 bits (consecuencia del teorema 3.1.1 de Minsky y Papert para orden 1)');
}

console.log(bad ? `\n✗ ${bad} comprobación(es) fallan` : '\n✓ todo coincide');
process.exit(bad ? 1 : 0);
