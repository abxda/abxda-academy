// Acto 3 · El ancho de banda: cuántos bytes por segundo se mueven, dentro y fuera de la tarjeta, y el «muro de la memoria».
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { H100, OPS_PER_BYTE, bwText, nf } from './model';
import { FS, chip, fitText, phases, tagText } from './ui';

export function drawAct3(S: Frame, all: Rect) {
  const [a, b] = phases(S, ['bandwidth', 'wall']);
  if (a > 0.005) S.d.withAlpha(a, () => drawRows(S, all));
  if (b > 0.005) S.d.withAlpha(b, () => drawWall(S, all));
}

interface Row { name: string; sub: string; v: number; t: 'w' | 'sig'; id: 'bandwidth' | 'links'; at: number }

function drawRows(S: Frame, all: Rect) {
  const { d, pal: p } = S, u = S.u, port = S.portrait;
  const rows: Row[] = [
    { name: S.l('Memoria de la H100', 'H100 memory'), sub: 'HBM3', v: 3350, t: 'w', id: 'bandwidth', at: 0.3 },
    { name: S.l('Memoria de la RTX 3060', 'RTX 3060 memory'), sub: 'GDDR6', v: 360, t: 'w', id: 'bandwidth', at: 1.2 },
    { name: S.l('Entre 8 GPU de un servidor', 'Between 8 GPUs in a server'), sub: 'NVLink', v: 900, t: 'sig', id: 'links', at: 0.3 },
    { name: S.l('Hacia la CPU', 'To the CPU'), sub: 'PCIe 5.0 ×16', v: 128, t: 'sig', id: 'links', at: 1.4 },
    { name: S.l('Entre servidores', 'Between servers'), sub: S.l('red de 400 Gb/s', '400 Gb/s network'), v: 50, t: 'sig', id: 'links', at: 2.5 },
  ];
  const labW = (port ? 118 : 190) * u, valW = (port ? 74 : 92) * u, track = all.w - labW - valW, X = (g: number) => all.x + labW + (g / 3500) * track;
  const top = all.y + 30 * u, rowH = Math.min(58 * u, (all.h - 78 * u) / 5);
  // título: la fórmula
  d.withAlpha(S.reveal('bandwidth', 0.1, 0.6), () => {
    d.text(S.l('Ancho de banda = bytes por segundo', 'Bandwidth = bytes per second'), all.x, all.y + 2 * u, { size: FS(S, 15), weight: 800, color: p.ink, base: 'top' });
  });
  rows.forEach((r, i) => {
    const a = S.reveal(r.id, r.at, 0.6);
    if (a <= 0) return;
    const gap = i >= 2 ? 16 * u : 0, y = top + i * rowH + gap, c = tone(S, r.t), bh = rowH * 0.42;
    d.withAlpha(a, () => {
      fitText(S, r.name, all.x, y + rowH * 0.22, labW - 8 * u, 13.5, { weight: 800, color: p.ink, base: 'middle' });
      d.text(r.sub, all.x, y + rowH * 0.22 + 16 * u, { size: FS(S, 12.5), weight: 700, font: 'mono', color: p.mute, base: 'middle' });
      const by = y + rowH * 0.5 - bh / 2 + 2 * u;
      d.rect(X(0), by, Math.max(2, X(r.v) - X(0)), bh, { fill: alpha(c.c, r.t === 'w' ? 0.75 : 0.35), stroke: c.c, lw: 1.5, dash: r.t === 'sig' ? [5, 3] : undefined });
      d.text(bwText(r.v, S.lang), all.x + all.w, by + bh / 2, { size: FS(S, 14), weight: 800, font: 'mono', color: c.ink, align: 'right', base: 'middle' });
    });
  });
  // separadores de grupo
  const aG = S.reveal('links', 0, 0.7);
  if (aG > 0) d.withAlpha(aG, () => {
    const y = top + 2 * rowH + 4 * u;
    d.line(all.x, y, all.x + all.w, y, p.line, 1.2, [3, 4]);
    d.text(S.l('fuera de la tarjeta: más lejos, más lento', 'outside the card: farther, slower'), all.x + all.w, y - 2 * u, { size: FS(S, 12), weight: 700, color: p.mute, align: 'right', base: 'bottom' });
  });
  const aN = S.reveal('links', 3.2, 0.7);
  d.text(S.l('Cifras de fichas técnicas; no se comparan al milímetro (NVLink y PCIe cuentan ambos sentidos).', 'Datasheet figures; not strictly comparable (NVLink and PCIe count both directions).'), all.x, all.y + all.h, { size: FS(S, 12), weight: 600, color: p.mute, base: 'bottom', w: all.w, a: aN });
}

// ── el muro de la memoria: ~590 operaciones posibles por cada peso leído, y el peso solo usa 2 ──
function drawWall(S: Frame, all: Rect) {
  const { d, pal: p } = S, u = S.u, port = S.portrait, dat = tone(S, 'dat'), err = tone(S, 'err');
  const nCells = Math.round(OPS_PER_BYTE * 2);                        // ≈ 591
  const head = 40 * u, foot = (port ? 96 : 56) * u;
  const gr: Rect = { x: all.x, y: all.y + head, w: all.w, h: all.h - head - foot };
  const cols = Math.max(10, Math.round(Math.sqrt((nCells * gr.w) / Math.max(40, gr.h)))), rows = Math.ceil(nCells / cols);
  const cs = Math.min(gr.w / cols, gr.h / rows), gap = Math.max(1, cs * 0.14), gx = gr.x + (gr.w - cs * cols) / 2, gy = gr.y + (gr.h - cs * rows) / 2;
  const grow = S.at('wall', 0.2, 2.2, 'out') * nCells;
  d.text(S.l('En lo que la H100 tarda en leer un peso (2 bytes)…', 'In the time the H100 takes to read one weight (2 bytes)…'), all.x, all.y + 2 * u, { size: FS(S, 14.5), weight: 800, color: p.ink, base: 'top', w: all.w });
  for (let k = 0; k < nCells; k++) {
    const a = clamp(grow - k + 1); if (a <= 0) break;
    const i = k % cols, j = Math.floor(k / cols), used = k < 2 && S.on('wall') && S.since('wall') > 2.6;
    d.rect(gx + i * cs, gy + j * cs, cs - gap, cs - gap, { fill: used ? err.c : alpha(dat.c, 0.2), a });
    if (used) d.rect(gx + i * cs - 1.5, gy + j * cs - 1.5, cs - gap + 3, cs - gap + 3, { stroke: err.c, lw: 1.6 });
  }
  const a1 = S.reveal('wall', 2.2, 0.6), a2 = S.reveal('wall', 3.0, 0.6), cw = (all.w - 14 * u) / 2, y = all.y + all.h - foot + 6 * u;
  d.withAlpha(a1, () => chip(S, { x: all.x, y, w: port ? all.w : cw, h: 40 * u }, S.l('podría hacer', 'could do'), S.l(`≈ ${nf(nCells, 0, 'es')} operaciones`, `≈ ${nf(nCells, 0, 'en')} operations`), 'dat', { vsize: 16 }));
  d.withAlpha(a2, () => chip(S, { x: port ? all.x : all.x + cw + 14 * u, y: port ? y + 46 * u : y, w: port ? all.w : cw, h: 40 * u }, S.l('el peso usa', 'the weight uses'), S.l('2 operaciones (0.3 %)', '2 operations (0.3%)'), 'err', { vsize: 16 }));
  d.withAlpha(S.reveal('wall', 3.4, 0.6), () => d.text(`${nf(H100.tflops, 0, S.lang)} TFLOPS ÷ ${nf(H100.bw / 1000, 2, S.lang)} TB/s ≈ ${nf(OPS_PER_BYTE, 0, S.lang)} ${S.l('operaciones por byte', 'operations per byte')}`, all.x + all.w, all.y + all.h, { size: FS(S, 12), weight: 700, font: 'mono', color: p.mute, align: 'right', base: 'bottom' }));
  void tagText;
}
