// Reproduce y comprueba lo que la voz, la escena y «por dentro» afirman del modelo diminuto y de las cuentas de LoRA/QLoRA.
// Sale con código 1 si algo ya no se cumple.
//   Reproducir:  cd app && npx tsx src/content/courses/ia-generativa/lessons/fine-tuning-lora/check-claims.ts
// Todo es determinista (semillas fijas, base.ts generado por build-base.ts). No usa red, ni GPU, ni datos externos.
import { BASE } from './base';
import { BASE_NF4, NF4 } from './quant';
import { Run, STEPS } from './runs';
import { CHANGED, G, TARGET_BASE, cellX, cellY, fullCount, loraCount, mapOf, skills } from './task';
import { nParams, singularValues } from './tinynet';

let bad = 0;
const check = (name: string, cond: boolean, detail = '') => { if (!cond) bad++; console.log(`${cond ? 'ok  ' : 'FALLA'} ${name}${detail ? '  (' + detail + ')' : ''}`); };
const pc = (v: number) => (v * 100).toFixed(1) + ' %';
const r0 = (v: number) => Math.round(v * 100);
const run = (rule: 'A' | 'B', mode: 'full' | number, replay: boolean, q = false) => { const r = new Run({ rule, mode, replay, q }); r.ensure(STEPS); return r; };

// ── cuentas (voz: toy-intro, count, rank-demo, gpt3-table, paper, cost-big; quiz; por dentro) ──
check('el modelo diminuto tiene 1 251 parámetros', nParams() === 1251, String(nParams()));
check('capa del centro 32 × 32 = 1 024; rango 2 → 128 (8 veces menos)', fullCount(32, 32) === 1024 && loraCount(32, 32, 2) === 128 && fullCount(32, 32) / loraCount(32, 32, 2) === 8);
check('rango 8 → 512; rango 16 → 1 024 (empate con la tabla entera)', loraCount(32, 32, 8) === 512 && loraCount(32, 32, 16) === 1024 && loraCount(32, 32, 15) < 1024 && loraCount(32, 32, 17) > 1024);
check('tabla de multiplicar 6 × 6: 36 casillas de 12 números (rango 2: 24)', 6 * 6 === 36 && loraCount(6, 6, 1) === 12 && loraCount(6, 6, 2) === 24);
check('tabla de GPT-3: 12 288² = 150 994 944; rango 2 → 49 152 (3 072 veces menos); rango 8 → 196 608 (768)', fullCount(12288, 12288) === 150994944 && loraCount(12288, 12288, 2) === 49152 && fullCount(12288, 12288) / loraCount(12288, 12288, 2) === 3072 && loraCount(12288, 12288, 8) === 196608 && fullCount(12288, 12288) / loraCount(12288, 12288, 8) === 768);
const gpt3 = 96 * 2 * loraCount(12288, 12288, 4); // 96 capas × (W_q y W_v), r = 4
check('GPT-3 con r = 4 en W_q y W_v: 18 874 368 parámetros, ≈ 9 300 veces menos que 175 mil millones', gpt3 === 18874368 && Math.abs(175e9 / gpt3 - 9300) < 50, `${gpt3}; ${(175e9 / gpt3).toFixed(0)}×`);
check('4096 × 4096 con r = 8: 65 536 frente a 16 777 216 (256 veces)', loraCount(4096, 4096, 8) === 65536 && fullCount(4096, 4096) / loraCount(4096, 4096, 8) === 256);
check('70 mil millones × 16 bytes = 1 120 GB = 14 H100 de 80 GB', (70e9 * 16) / 1e9 === 1120 && 1120 / 80 === 14);
check('7 mil millones: 112 / 14 / 3.5 GB (por dentro)', 7 * 16 === 112 && 7 * 2 === 14 && 7 * 0.5 === 3.5);
check('LLaMA 65B: 1.4 billones de tokens es «más de un billón»; LIMA ≈ 750 000 tokens', 1.4e12 > 1e12 && 1.4e12 / 7.5e5 > 1e6);

// ── modelo base y ajuste completo (voz: rule-new, meter-old, full-old, forget-where) ──
const base = mapOf(BASE, null), sb = skills(base, 'A');
check('el modelo base acierta 0 % en lo nuevo y 100 % en lo que ya sabía', sb.newSk === 0 && sb.oldSk === 1 && base.every((v, k) => v === TARGET_BASE[k]));
const full = run('A', 'full', false), fs = full.at(STEPS);
check('ajuste completo: lo nuevo 98 %, lo que ya sabía baja a 93 %', r0(fs.newSk) === 98 && r0(fs.oldSk) === 93, `${pc(fs.newSk)} / ${pc(fs.oldSk)}`);
let inBox = 0, outBox = 0;
for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) { const k = j * G + i; if (!CHANGED.A[k] && fs.pred[k] !== TARGET_BASE[k]) { const x = cellX(i), y = cellY(j); if (x >= 0.05 && x <= 1 && y >= -0.5 && y <= 0.35) inBox++; else outBox++; } }
check('«casi todos caen lejos de los ejemplos» (fuera de la franja)', outBox / (inBox + outBox) > 0.9, `${outBox} fuera, ${inBox} dentro`);
const fr = run('A', 'full', true).at(STEPS);
check('ajuste completo con 30 de repaso: 94 % en lo nuevo y 97 % en lo que ya sabía (voz: replay)', r0(fr.newSk) === 94 && r0(fr.oldSk) === 97, `${pc(fr.newSk)} / ${pc(fr.oldSk)}`);

// ── bajo rango (por dentro) ──
const sv = singularValues(fs.dW), tot = sv.reduce((a, v) => a + v * v, 0), top4 = sv.slice(0, 4).reduce((a, v) => a + v * v, 0) / tot;
check('los cuatro primeros valores singulares del cambio reúnen ≈ 97 %', top4 > 0.96 && top4 < 0.985, pc(top4));

// ── LoRA en el modelo diminuto (voz: toy-lora, toy-lora-result; escena: lora-idea, lora-table, b-zero, eval) ──
const lr = run('A', 2, true), ls = lr.at(STEPS), ln = run('A', 2, false).at(STEPS);
check('LoRA r = 2 con repaso: 93 % en lo nuevo y 98 % en lo que ya sabía', r0(ls.newSk) === 93 && r0(ls.oldSk) === 98, `${pc(ls.newSk)} / ${pc(ls.oldSk)}`);
check('LoRA r = 2 sin repaso también olvida: 91 % y 87 %', r0(ln.newSk) === 91 && r0(ln.oldSk) === 87 && ln.oldSk < fs.oldSk, `${pc(ln.newSk)} / ${pc(ln.oldSk)}`);
const k = 9 * 32 + 21, w0 = BASE.W2[k], dw = ls.dW[k];
check('casilla de lora-table: 0.16 + 0.59 = 0.75', w0.toFixed(2) === '0.16' && dw.toFixed(2) === '0.59' && (w0 + dw).toFixed(2) === '0.75', `${w0.toFixed(4)} + ${dw.toFixed(4)}`);
const b0 = lr.at(0);
check('al empezar, B = 0 y la corrección es 0 (b-zero)', (b0.B ?? [1]).every((v) => v === 0) && b0.dW.every((v) => v === 0));
const w2 = BASE.W2.slice(); run('A', 2, true); run('B', 2, true);
check('tras entrenar adaptadores, la tabla original queda idéntica y sin adaptador el mapa es el base', BASE.W2.every((v, i) => v === w2[i]) && mapOf(BASE, null).every((v, kk) => v === base[kk]));

// ── QLoRA a escala diminuta (por dentro) ──
const REF = [-1, -0.6961928009986877, -0.5250730514526367, -0.39491748809814453, -0.28444138169288635, -0.18477343022823334, -0.09105003625154495, 0, 0.07958029955625534, 0.16093020141124725, 0.24611230194568634, 0.33791524171829224, 0.44070982933044434, 0.5626170039176941, 0.7229568362236023, 1];
check('los 16 niveles NF4 calculados coinciden con la tabla publicada (bitsandbytes) a 1e-6', NF4.length === 16 && NF4.every((v, i) => Math.abs(v - REF[i]) < 1e-6));
const mq = mapOf(BASE_NF4, null); let diff = 0; for (let kk = 0; kk < mq.length; kk++) if (mq[kk] !== base[kk]) diff++;
check('base en 4 bits: el mapa cambia en 22 de 1 600 celdas', diff === 22, `${diff} de ${mq.length}`);
const q4 = run('A', 2, true, true).at(STEPS);
check('LoRA r = 2 con repaso sobre la base de 4 bits: 91 % y 98 %', r0(q4.newSk) === 91 && r0(q4.oldSk) === 98, `${pc(q4.newSk)} / ${pc(q4.oldSk)}`);

console.log(bad ? `\n${bad} afirmaciones ya no se cumplen` : '\ntodo coincide con lo que dicen la voz, la escena y «por dentro»');
process.exit(bad ? 1 : 0);
