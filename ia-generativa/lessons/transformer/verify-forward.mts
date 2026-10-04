// Comprueba que model.ts (TypeScript) reproduce a PyTorch: compara logits y atenciones con TINY_REF (weights.ts).
//   npx tsx src/content/courses/ia-generativa/lessons/transformer/verify-forward.mts      (desde app/)
import { TINY_REF, TINY, MASK_EXP } from './weights';
import { forward, idsOf, type Lang } from './model';

let worst = 0, worstA = 0;
for (const lang of ['es', 'en'] as Lang[]) {
  for (const r of TINY_REF[lang]) {
    const tr = forward(lang, idsOf(lang, r.words));
    tr.logits.forEach((row, i) => row.forEach((v, j) => { worst = Math.max(worst, Math.abs(v - r.logits[i][j])); }));
    tr.blocks.forEach((b, l) => b.weights.forEach((w, h) => w.forEach((row, i) => row.forEach((v, j) => { worstA = Math.max(worstA, Math.abs(v - r.attn[l][h][i][j])); }))));
  }
}
console.log(`máxima diferencia con PyTorch: logits ${worst.toExponential(2)}, atención ${worstA.toExponential(2)}`);
if (worst > 1e-3 || worstA > 1e-3) { console.error('NO COINCIDE'); process.exit(1); }
console.log('OK: model.ts coincide con PyTorch');
void TINY; void MASK_EXP;
