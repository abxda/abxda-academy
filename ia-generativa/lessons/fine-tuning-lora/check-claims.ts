// Reproduce y comprueba lo que la voz y la escena afirman del modelo diminuto y de las cuentas de LoRA/QLoRA. Sale con código 1 si algo ya no se cumple.
//   Reproducir:  cd app && npx tsx src/content/courses/ia-generativa/lessons/fine-tuning-lora/check-claims.ts
// Todo es determinista (semillas fijas, base.ts generado por build-base.ts). No usa red ni datos externos.
import { BASE } from './base';
import { BASE_NF4, NF4 } from './quant';
import { Run, STEPS } from './runs';
import { CHANGED, G, TARGET_BASE, cellX, cellY, fullCount, loraCount, mapOf, skills } from './task';
import { nParams, singularValues } from './tinynet';

let bad = 0;
const check = (name: string, cond: boolean, detail = '') => { if (!cond) bad++; console.log(`${cond ? 'ok  ' : 'FALLA'} ${name}${detail ? '  (' + detail + ')' : ''}`); };
const pc = (v: number) => (v * 100).toFixed(1) + ' %';
const run = (rule: 'A' | 'B', mode: 'full' | number, replay: boolean, q = false) => { const r = new Run({ rule, mode, replay, q }); r.ensure(STEPS); return r; };

// ── cuentas (voz: ft-def…count, gpt3-scale, paper; por dentro) ──
check('el modelo diminuto tiene 1 251 parámetros', nParams() === 1251, String(nParams()));
check('la capa central tiene 1 024 números; LoRA r = 2 guarda 128 (8 veces menos)', fullCount(32, 32) === 1024 && loraCount(32, 32, 2) === 128 && fullCount(32, 32) / loraCount(32, 32, 2) === 8);
check('empate en r = 16 (B y A ocupan lo mismo que la matriz completa)', loraCount(32, 32, 16) === 1024 && loraCount(32, 32, 15) < 1024 && loraCount(32, 32, 17) > 1024);
check('matriz de GPT-3, r = 8: 150 994 944 frente a 196 608 (768 veces)', fullCount(12288, 12288) === 150994944 && loraCount(12288, 12288, 8) === 196608 && fullCount(12288, 12288) / loraCount(12288, 12288, 8) === 768);
const gpt3 = 96 * 2 * loraCount(12288, 12288, 4); // 96 capas × (W_q y W_v), r = 4
check('GPT-3 con r = 4 en W_q y W_v: 18 874 368 parámetros, ≈ 9 270 veces menos que 175 mil millones', gpt3 === 18874368 && Math.round(175e9 / gpt3 / 10) * 10 === 9270, `${gpt3}; ${(175e9 / gpt3).toFixed(0)}×`);
check('4096×4096 con r = 8: 65 536 frente a 16 777 216 (256 veces)', loraCount(4096, 4096, 8) === 65536 && fullCount(4096, 4096) / loraCount(4096, 4096, 8) === 256);
check('16 bytes por parámetro × 175 mil millones = 2,8 TB; 7 mil millones: 112 / 14 / 3,5 GB', 175e9 * 16 === 2.8e12 && 7 * 16 === 112 && 7 * 2 === 14 && 7 * 0.5 === 3.5);

// ── modelo base y ajuste completo (voz: toy-intro, company-rule, full-result, forget-name) ──
const base = mapOf(BASE, null);
check('el modelo base acierta su regla en el 100 % de la rejilla y 0 % de las celdas que cambian', skills(base, 'A').oldSk === 1 && skills(base, 'A').newSk === 0 && base.every((v, k) => v === TARGET_BASE[k]));
const full = run('A', 'full', false), fs = full.at(STEPS);
check('ajuste completo: regla nueva ≈ 98 %, original baja a ≈ 93 %', fs.newSk > 0.95 && fs.oldSk > 0.9 && fs.oldSk < 0.95, `nueva ${pc(fs.newSk)}, original ${pc(fs.oldSk)}`);
let inBox = 0, outBox = 0;
for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) { const k = j * G + i; if (!CHANGED.A[k] && fs.pred[k] !== TARGET_BASE[k]) { const x = cellX(i), y = cellY(j); if (x >= 0.05 && x <= 1 && y >= -0.5 && y <= 0.35) inBox++; else outBox++; } }
check('los puntos oscuros caen casi todos fuera de la franja de ejemplos (voz: «casi todos en zonas sin ejemplos»)', outBox / (inBox + outBox) > 0.9, `${outBox} fuera, ${inBox} dentro`);

// ── bajo rango (voz: insight; por dentro) ──
const sv = singularValues(fs.dW), tot = sv.reduce((a, v) => a + v * v, 0), top4 = sv.slice(0, 4).reduce((a, v) => a + v * v, 0) / tot;
check('los cuatro primeros valores singulares reúnen ≈ 97 % del cambio', top4 > 0.96 && top4 < 0.985, pc(top4));

// ── LoRA en el modelo diminuto (voz: rank-demo, replay, try-train, swap) ──
const r1 = run('A', 1, false).at(STEPS), r2 = run('A', 2, false).at(STEPS), r8 = run('A', 8, false).at(STEPS);
check('rango 1 aprende una parte; rango 2, casi todo; rango 8, apenas mejora', r1.newSk < 0.8 && r2.newSk > 0.88 && r8.newSk - r2.newSk < 0.05, `${pc(r1.newSk)} / ${pc(r2.newSk)} / ${pc(r8.newSk)}`);
check('LoRA r = 2 sin repaso olvida más que el ajuste completo (deeper)', r2.oldSk < fs.oldSk, `${pc(r2.oldSk)} < ${pc(fs.oldSk)}`);
const r2r = run('A', 2, true).at(STEPS);
check('con repaso, r = 2: original ≥ 96 % y nueva ≥ 85 % (las metas del turno)', r2r.oldSk >= 0.96 && r2r.newSk >= 0.85, `nueva ${pc(r2r.newSk)}, original ${pc(r2r.oldSk)}`);
let passPlain = 0, passReplay = 0; const failReplay: number[] = [];
for (let r = 1; r <= 32; r++) {
  const a = run('A', r, false).at(STEPS), b = run('A', r, true).at(STEPS);
  if (a.newSk >= 0.85 && a.oldSk >= 0.96) passPlain++;
  if (b.newSk >= 0.85 && b.oldSk >= 0.96) passReplay++; else failReplay.push(r);
}
check('el turno `train` es posible y enseña: ningún rango cumple sin repaso; con repaso cumplen todos salvo los extremos', passPlain === 0 && passReplay >= 28, `sin repaso ${passPlain}/32; con repaso ${passReplay}/32, no cumplen r = ${failReplay.join(', ')}`);
const w2 = BASE.W2.slice(); const ab = [run('A', 2, true), run('B', 2, true)];
check('tras entrenar los adaptadores A y B, W₀ queda idéntica y el modelo sin adaptador da el mapa base exacto', BASE.W2.every((v, i) => v === w2[i]) && mapOf(BASE, null).every((v, k) => v === base[k]) && ab.every((r) => r.done));

// ── QLoRA a escala diminuta (voz: qlora; por dentro) ──
const REF = [-1, -0.6961928009986877, -0.5250730514526367, -0.39491748809814453, -0.28444138169288635, -0.18477343022823334, -0.09105003625154495, 0, 0.07958029955625534, 0.16093020141124725, 0.24611230194568634, 0.33791524171829224, 0.44070982933044434, 0.5626170039176941, 0.7229568362236023, 1];
check('los 16 niveles NF4 calculados coinciden con la tabla publicada (bitsandbytes) a 1e-6', NF4.length === 16 && NF4.every((v, i) => Math.abs(v - REF[i]) < 1e-6), `máx. ${Math.max(...NF4.map((v, i) => Math.abs(v - REF[i]))).toExponential(1)}`);
const mq = mapOf(BASE_NF4, null); let diff = 0; for (let k = 0; k < mq.length; k++) if (mq[k] !== base[k]) diff++;
check('base en 4 bits: el mapa cambia en pocas celdas (≈ 22 de 1 600)', diff > 0 && diff <= 40, `${diff} de ${mq.length}`);
const q16 = run('A', 2, true).at(STEPS), q4 = run('A', 2, true, true).at(STEPS);
check('LoRA r = 2 con repaso sobre la base de 4 bits queda a ≤ 3 puntos de la de 16 bits', Math.abs(q4.newSk - q16.newSk) <= 0.03 && Math.abs(q4.oldSk - q16.oldSk) <= 0.03, `16 bits ${pc(q16.newSk)} / ${pc(q16.oldSk)}; 4 bits ${pc(q4.newSk)} / ${pc(q4.oldSk)}`);

console.log(bad ? `\n${bad} afirmaciones ya no se cumplen` : '\ntodo coincide con lo que dicen la voz y la escena');
process.exit(bad ? 1 : 0);
