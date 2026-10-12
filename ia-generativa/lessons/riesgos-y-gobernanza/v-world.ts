// Vistas 6–8: fuera del sistema (voz y videollamada falsas), la huella ambiental y quién responde.
// REAL: FCC 24-104 (llamadas del 21 de enero de 2024, multa de 6 millones de dólares); Arup (The Guardian, 17 de mayo de
// 2024: HK$200 millones, unos 25 millones de dólares); Google (Elsworth et al., 2025: 0.24 Wh y 0.26 mL por consulta de
// texto, menos que nueve segundos de televisión); AIE (abril de 2025: 415 TWh en 2024, cerca del 1.5 %; unos 945 TWh en
// 2030, algo más que Japón hoy); Moffatt v. Air Canada (2024, lección 33).
// ILUSTRATIVO: las siluetas, la onda de voz y los pictogramas.
import { alpha, hash, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { FS, PATHS, areaH, card, chip, chipH, fitText, fr, glyph, growArrow, header, para, paraH, person, pick, tagWrap, tight } from './ui';

const head = (S: Frame, k: number, a = 1) => header(S, k, S.L({ es: PATHS[k - 1][0], en: PATHS[k - 1][1] }), a);

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Fuera del sistema: voz falsa y videollamada falsa
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawFakes(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = areaH(S), port = S.portrait && !tight(S), err = tone(S, 'err'), gap = (tight(S) ? 8 : 14) * u;
  head(S, 6);
  const pad = (tight(S) ? 8 : 12) * u, sz = FS(S, tight(S) ? 13 : 14), titleH = FS(S, 15) * u * 1.25;
  const ctrlTxt = S.l('Confirmar por otro canal: llamar al número de siempre.', 'Confirm through another channel: call the usual number.');
  const ctrlH = Math.max(paraH(S, ctrlTxt, A.w - 62 * u, FS(S, 15), { weight: 800 }) + 18 * u, 44 * u);
  const cw = port ? A.w : (A.w - gap) / 2, tw = cw - 2 * pad;
  // contenido de la tarjeta de la llamada
  const L1all = [S.l('Voz falsa del presidente Biden.', 'A fake voice of President Biden.'), S.l('Nuevo Hampshire, 21 de enero de 2024.', 'New Hampshire, January 21, 2024.'), S.l('Pedía no votar en la primaria.', 'It asked people not to vote in the primary.')];
  // en escenarios muy bajos (teléfono en horizontal) se omite el tercer renglón (lo dice la voz)
  const L1 = !S.portrait && tight(S) ? L1all.slice(0, 2) : L1all;
  const lh = L1.map((t) => paraH(S, t, tw, sz, { weight: 650 }));
  const gs = (tight(S) ? (S.portrait ? 22 : 16) : 32) * u;
  const fineT = S.l('multa de la FCC: 6 millones de dólares', 'FCC fine: 6 million dollars'), hkT = S.l('HK$200 millones ≈ 25 millones de dólares', 'HK$200 million ≈ 25 million dollars');
  const chH = tagWrap(S, fineT, 0, 0, tw, 'err', { measureOnly: true });
  const h1 = pad + titleH + 8 * u + gs + 10 * u + lh.reduce((s, h) => s + h + 2 * u, 0) + 8 * u + chH + pad;
  // tarjeta de la videollamada. En vertical, el lugar y la cifra van a la derecha de la cuadrícula; en horizontal, debajo.
  const sideW = port ? tw * 0.46 : tw, chH2 = tagWrap(S, hkT, 0, 0, sideW, 'err', { measureOnly: true });
  const sideH = FS(S, 13) * u * 1.3 + 6 * u + chH2;
  const free = port ? A.h - ctrlH - 2 * gap - h1 : A.h - ctrlH - gap;
  const fixed2 = port ? pad + titleH + 8 * u + pad : pad + titleH + 8 * u + 6 * u + sideH + pad;
  // en horizontal, las dos tarjetas quedan de alto parecido (la cuadrícula se ajusta a la tarjeta de la llamada)
  const gridH = port ? Math.max(sideH, Math.min(120 * u, free - fixed2)) : Math.max(40 * u, Math.min(150 * u, Math.min(free, Math.max(h1, 150 * u)) - fixed2));
  const h2 = fixed2 + gridH;
  const ch = port ? 0 : Math.max(h1, h2);
  const total = port ? h1 + gap + h2 + gap + ctrlH : ch + gap + ctrlH;
  const y0 = A.y + Math.max(0, (A.h - total) / 2);
  const c1: Rect = { x: A.x, y: y0, w: cw, h: port ? h1 : ch };
  const c2: Rect = port ? { x: A.x, y: y0 + h1 + gap, w: cw, h: h2 } : { x: A.x + cw + gap, y: y0, w: cw, h: ch };

  // ── la llamada ──
  const a1 = fr(S, 'fake-voice', 0.1, 0.22);
  d.withAlpha(a1, () => {
    card(S, c1, { tone: 'err', hot: 0.04 });
    fitText(S, S.l('Llamada automática', 'Robocall'), c1.x + pad, c1.y + pad, tw, 15, { weight: 800, color: err.ink, base: 'top' });
  });
  const gy = c1.y + pad + titleH + 8 * u;
  glyph(S, 'phone', c1.x + pad + gs * 0.3, gy + gs / 2, gs, err.ink, a1);
  const wx = c1.x + pad + gs * 0.8, ww = Math.min(tw - gs, 170 * u), nb = 24;
  d.withAlpha(fr(S, 'fake-voice', 0.2, 0.3), () => {
    for (let i = 0; i < nb; i++) { const h = (0.25 + 0.75 * hash(i * 7.3 + 1)) * gs * 0.85, x = wx + (i / nb) * ww; d.rect(x, gy + gs / 2 - h / 2, Math.max(2, ww / nb - 2 * u), h, { fill: alpha(err.c, 0.55) }); }
  });
  let y = gy + gs + 10 * u;
  [0.4, 0.55, 0.8].slice(0, L1.length).forEach((f, i) => {
    d.withAlpha(fr(S, 'fake-voice', f, f + 0.1), () => para(S, L1[i], c1.x + pad, y, tw, sz, { weight: 650, color: p.ink }));
    y += lh[i] + 2 * u;
  });
  tagWrap(S, fineT, c1.x + pad, y + 8 * u, tw, 'err', { a: fr(S, 'fake-arup', 0.04, 0.16) });

  // ── la videollamada ──
  const a2 = fr(S, 'fake-arup', 0.34, 0.46);
  d.withAlpha(a2, () => {
    card(S, c2, { tone: 'err', hot: 0.04 });
    fitText(S, S.l('Videollamada', 'Video call'), c2.x + pad, c2.y + pad, tw, 15, { weight: 800, color: err.ink, base: 'top' });
  });
  const vy = c2.y + pad + titleH + 8 * u, gw = port ? tw - sideW - 10 * u : Math.min(tw, Math.max(gridH * 1.9, tw * 0.8));
  const tileW = (gw - 6 * u) / 2, tileH = (gridH - 6 * u) / 2;
  const tiles = [S.l('falso', 'fake'), S.l('falso', 'fake'), S.l('falso', 'fake'), S.l('real', 'real')];
  tiles.forEach((lab, i) => {
    const tx = c2.x + pad + (i % 2) * (tileW + 6 * u), ty = vy + Math.floor(i / 2) * (tileH + 6 * u), fake = i < 3, a = fr(S, 'fake-arup', 0.4 + i * 0.04, 0.5 + i * 0.04);
    d.withAlpha(a, () => {
      d.rect(tx, ty, tileW, tileH, { fill: alpha(fake ? err.c : tone(S, 'sig').c, 0.1), stroke: fake ? err.c : tone(S, 'sig').c, lw: 1.2, r: 3, dash: fake ? [4, 3] : undefined });
      const sc = Math.max(1.2, Math.min(tileH * 0.62 / 9, 3.2 * u));
      person(S, tx + tileW * 0.3 - 3 * sc, ty + tileH / 2 - 4.5 * sc, sc, fake ? 'err' : 'sig');
      fitText(S, lab, tx + tileW * 0.5, ty + tileH / 2, tileW * 0.48, 12.5, { weight: 800, color: fake ? err.ink : tone(S, 'sig').ink, base: 'middle' });
    });
  });
  const lx = port ? c2.x + pad + gw + 10 * u : c2.x + pad, ly = port ? vy + Math.max(0, (gridH - sideH) / 2) : vy + gridH + 6 * u;
  d.withAlpha(fr(S, 'fake-arup', 0.56, 0.66), () => fitText(S, S.l('Arup, Hong Kong, 2024', 'Arup, Hong Kong, 2024'), lx, ly, sideW, 13.5, { weight: 700, color: p.ink, base: 'top' }));
  tagWrap(S, hkT, lx, ly + FS(S, 13) * u * 1.3 + 6 * u, sideW, 'err', { a: fr(S, 'fake-arup', 0.72, 0.82) });

  // ── la palabra y la defensa ──
  const cy = y0 + total - ctrlH, ca = fr(S, 'fake-control', 0.32, 0.44);
  const wa = fr(S, 'fake-control', 0.04, 0.16) * (1 - ca);
  if (wa > 0.01) chip(S, S.l('suplantación', 'impersonation'), A.x + A.w / 2, cy + ctrlH / 2, 'err', { size: 15.5, a: wa, solid: true });
  d.withAlpha(ca, () => {
    card(S, { x: A.x, y: cy, w: A.w, h: ctrlH }, { tone: 'dat', hot: 0.12 });
    const gx = A.x + 18 * u;
    glyph(S, 'phone', gx, cy + ctrlH / 2, 22 * u, tone(S, 'dat').ink);
    glyph(S, 'check', gx + 17 * u, cy + ctrlH / 2 + 7 * u, 12 * u, tone(S, 'dat').ink);
    const th = paraH(S, ctrlTxt, A.w - 62 * u, FS(S, 15), { weight: 800 });
    para(S, ctrlTxt, gx + 32 * u, cy + (ctrlH - th) / 2, A.w - 62 * u, FS(S, 15), { weight: 800, color: p.ink });
  });
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// La huella ambiental
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawEnv(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = areaH(S), port = S.portrait, dat = tone(S, 'dat'), gap = (tight(S) ? 10 : 22) * u;
  head(S, 7);
  const pad = 12 * u, big = FS(S, tight(S) ? 26 : 34);
  const lw = port ? A.w : Math.min(A.w * 0.4, 320 * u), rw = port ? A.w : A.w - lw - gap * 1.4;
  // tarjeta de una consulta
  const t1 = S.l('Una consulta de texto a Gemini (mediana, 2025)', 'One text prompt to Gemini (median, 2025)');
  const h1 = paraH(S, t1, lw - 2 * pad, FS(S, 13.5), { weight: 800 });
  const lineH = FS(S, 14.5) * u * 1.3;
  const cardH = pad * 2 + h1 + 8 * u + big * u + 10 * u + lineH * 2;
  // bloque de los centros de datos
  const t2 = S.l('Electricidad de los centros de datos del mundo', 'Electricity used by the world’s data centers');
  const th = paraH(S, t2, rw, FS(S, 14), { weight: 800 }) + 10 * u;
  const rowH = Math.min(70 * u, Math.max(44 * u, (port ? A.h - cardH - gap - th - chipH(S, 13) - 40 * u : A.h * 0.6 - th) / 2));
  const rightH = th + 2 * rowH + FS(S, 12.5) * u + 22 * u + chipH(S, 13);
  const total = port ? cardH + gap + rightH : Math.max(cardH, rightH);
  const y0 = A.y + Math.max(0, (A.h - total) / 2);
  const L: Rect = { x: A.x, y: y0, w: lw, h: cardH };
  const R: Rect = port ? { x: A.x, y: y0 + cardH + gap, w: rw, h: rightH } : { x: A.x + lw + gap * 1.4, y: y0, w: rw, h: rightH };

  // ── una consulta ──
  d.withAlpha(fr(S, 'env-one', 0.12, 0.24), () => {
    card(S, L, { tone: 'dat', hot: 0.05 });
    para(S, t1, L.x + pad, L.y + pad, L.w - 2 * pad, FS(S, 13.5), { weight: 800, color: p.ink2 });
  });
  let y = L.y + pad + h1 + 8 * u;
  d.withAlpha(fr(S, 'env-one', 0.4, 0.52), () => {
    glyph(S, 'bolt', L.x + pad + 10 * u, y + (big * u) / 2, 22 * u, dat.ink);
    d.text(`${S.n(0.24, 2)} Wh`, L.x + pad + 28 * u, y, { size: big, weight: 800, font: 'mono', color: dat.ink, base: 'top' });
  });
  y += big * u + 10 * u;
  d.withAlpha(fr(S, 'env-one', 0.66, 0.78), () => fitText(S, S.l('menos que 9 s de televisión', 'less than 9 s of TV'), L.x + pad, y, L.w - 2 * pad, 14.5, { weight: 700, color: p.ink, base: 'top' }));
  y += lineH;
  d.withAlpha(fr(S, 'env-one', 0.8, 0.9), () => fitText(S, S.l(`agua: ${S.n(0.26, 2)} mL, unas 5 gotas`, `water: ${S.n(0.26, 2)} mL, about 5 drops`), L.x + pad, y, L.w - 2 * pad, 14.5, { weight: 700, color: p.ink, base: 'top' }));

  // ── todos los centros de datos ──
  d.withAlpha(fr(S, 'env-all', 0.18, 0.3), () => para(S, t2, R.x, R.y, R.w, FS(S, 14), { weight: 800, color: p.ink2 }));
  const rows: { lab: string; v: number; val: string; f: [string, number] }[] = [
    { lab: '2024', v: 415, val: pick(S, [S.l(`415 TWh · ${S.n(1.5, 1)} % del mundo`, `415 TWh · ${S.n(1.5, 1)}% of the world`), S.l(`415 TWh · ${S.n(1.5, 1)} %`, `415 TWh · ${S.n(1.5, 1)}%`)], R.w * 0.55, 14, 800, 'mono'), f: ['env-all', 0.32] },
    { lab: S.l('2030 (previsión)', '2030 (projected)'), v: 945, val: '945 TWh', f: ['env-all', 0.66] },
  ];
  const max = 1000;
  rows.forEach((r, i) => {
    const ry = R.y + th + i * rowH, a = fr(S, r.f[0], r.f[1], r.f[1] + 0.08), g = fr(S, r.f[0], r.f[1] + 0.02, r.f[1] + 0.24);
    const barY = ry + FS(S, 13.5) * u + 6 * u, barH = Math.max(14 * u, rowH - FS(S, 13.5) * u - 16 * u);
    d.withAlpha(a, () => {
      fitText(S, r.lab, R.x, ry, R.w, 13.5, { weight: 700, color: p.ink, base: 'top' });
      d.rect(R.x, barY, R.w, barH, { fill: alpha(p.ink, 0.04) });
      d.rect(R.x, barY, (r.v / max) * R.w * g, barH, { fill: alpha(dat.c, 0.3 + 0.3 * i), stroke: dat.c, lw: 1.2 });
      // la cifra va dentro de la barra si cabe; si no, a su derecha
      const bwid = (r.v / max) * R.w * g, vw = S.d.measure(r.val, { size: FS(S, 14), weight: 800, font: 'mono' });
      const inside = vw + 16 * u <= bwid;
      fitText(S, r.val, inside ? R.x + 8 * u : R.x + bwid + 8 * u, barY + barH / 2, inside ? bwid - 14 * u : R.w - bwid - 8 * u, 14, { weight: 800, color: p.ink, base: 'middle', font: 'mono', a: g });
    });
    if (i === 1) {
      // la AIE compara la previsión de 2030 con el consumo actual de Japón (algo menor): se rotula al final de la barra
      const ja = fr(S, 'env-control', 0.1, 0.22), jx = R.x + (r.v / max) * R.w;
      d.withAlpha(ja, () => {
        d.line(jx, barY - 4 * u, jx, barY + barH + 4 * u, p.ink, 2, [4, 3]);
        fitText(S, S.l('≈ algo más que todo Japón hoy', '≈ a bit more than all of Japan today'), jx, barY + barH + 6 * u, Math.min(R.w, 300 * u), 13, { weight: 800, color: p.ink, base: 'top', align: 'right' });
      });
    }
  });
  const cy = R.y + th + 2 * rowH + FS(S, 13) * u + 22 * u;
  chip(S, S.l('el modelo más pequeño que resuelva la tarea', 'the smallest model that does the job'), R.x, cy, 'dat', { size: 13.5, align: 'left', a: fr(S, 'env-control', 0.6, 0.72), maxW: R.w });
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Quién responde
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawAccount(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = areaH(S), port = S.portrait, w = tone(S, 'w'), sig = tone(S, 'sig');
  head(S, 8);
  const bw = Math.min(port ? A.w * 0.8 : A.w * 0.34, 250 * u), bh = Math.max(48 * u, chipH(S, 16) + 18 * u), vgap = 54 * u;
  const txt = S.l('Moffatt contra Air Canada (Canadá, 2024): la aerolínea respondió por lo que dijo su chatbot. Lo viste en la lección 33.', 'Moffatt v. Air Canada (Canada, 2024): the airline answered for what its chatbot said. You saw it in lesson 33.');
  const tw = Math.min(A.w, 580 * u), th = paraH(S, txt, tw - 48 * u, FS(S, 14.5), { weight: 650 }) + 22 * u;
  const diagH = port ? bh * 2 + vgap : bh;
  const total = diagH + chipH(S, 13) + 34 * u + th;
  const y0 = A.y + Math.max(0, (A.h - total) / 2);
  const m: Rect = port ? { x: A.x + (A.w - bw) / 2, y: y0, w: bw, h: bh } : { x: A.x + Math.max(0, (A.w - tw) / 2), y: y0, w: bw, h: bh };
  const o: Rect = port ? { x: m.x, y: m.y + bh + vgap, w: bw, h: bh } : { x: A.x + Math.max(0, (A.w - tw) / 2) + tw - bw, y: y0, w: bw, h: bh };
  d.withAlpha(fr(S, 'accountable', 0.1, 0.2), () => {
    d.rect(m.x, m.y, m.w, m.h, { fill: alpha(w.c, 0.1), stroke: w.c, lw: 1.5, r: 6 * u });
    fitText(S, S.l('el modelo', 'the model'), m.x + m.w / 2, m.y + m.h / 2, m.w - 16 * u, 16, { weight: 800, color: w.ink, align: 'center', base: 'middle' });
  });
  d.withAlpha(fr(S, 'accountable', 0.22, 0.32), () => {
    d.rect(o.x, o.y, o.w, o.h, { fill: alpha(sig.c, 0.12), stroke: sig.c, lw: 2.2, r: 6 * u });
    fitText(S, S.l('quien lo puso a funcionar', 'whoever put it to work'), o.x + o.w / 2, o.y + o.h / 2, o.w - 16 * u, 16, { weight: 800, color: sig.ink, align: 'center', base: 'middle' });
  });
  const ga = fr(S, 'accountable', 0.3, 0.44);
  if (port) growArrow(S, m.x + m.w / 2, m.y + m.h + 4 * u, o.x + o.w / 2, o.y - 4 * u, ga, p.ink2, 2);
  else growArrow(S, m.x + m.w + 6 * u, m.y + m.h / 2, o.x - 6 * u, o.y + o.h / 2, ga, p.ink2, 2);
  chip(S, S.l('responde', 'answers for it'), o.x + o.w / 2, o.y + o.h + chipH(S, 13) / 2 + 8 * u, 'sig', { size: 13, a: fr(S, 'accountable', 0.4, 0.5), solid: true });
  // el modelo no firma nada
  const na = fr(S, 'accountable', 0.84, 0.94);
  glyph(S, 'cross', m.x + m.w - 2 * u, m.y + 2 * u, 18 * u, tone(S, 'err').c, na);
  if (port) chip(S, S.l('no firma nada', 'signs nothing'), m.x, m.y + m.h + chipH(S, 12.5) / 2 + 10 * u, 'err', { size: 12.5, a: na, align: 'left', maxW: m.w / 2 - 14 * u });
  else chip(S, S.l('no firma nada', 'signs nothing'), m.x + m.w / 2, m.y + m.h + chipH(S, 12.5) / 2 + 8 * u, 'err', { size: 12.5, a: na });
  // el caso
  const ty = y0 + diagH + chipH(S, 13) + 34 * u, tx = A.x + (A.w - tw) / 2;
  d.withAlpha(fr(S, 'accountable', 0.5, 0.62), () => {
    card(S, { x: tx, y: ty, w: tw, h: th }, { tone: 'ink', hot: 0.02 });
    glyph(S, 'scale', tx + 18 * u, ty + th / 2, 20 * u, p.ink2);
    para(S, txt, tx + 36 * u, ty + 11 * u, tw - 48 * u, FS(S, 14.5), { weight: 650, color: p.ink });
  });
}

export function worldSource(S: Frame): string {
  if (S.on('accountable')) return 'Moffatt v. Air Canada, 2024 BCCRT 149';
  if (S.on('env-all')) return S.l('Agencia Internacional de Energía, «Energy and AI» (abril de 2025)', 'International Energy Agency, “Energy and AI” (April 2025)');
  if (S.on('env-one')) return S.l('Elsworth et al. (Google, 2025): mediana de una consulta de texto a la aplicación Gemini', 'Elsworth et al. (Google, 2025): median text prompt to the Gemini app');
  if (S.on('fake-arup')) return S.l('FCC 24-104 (26 de septiembre de 2024) · The Guardian (17 de mayo de 2024)', 'FCC 24-104 (September 26, 2024) · The Guardian (May 17, 2024)');
  if (S.on('fake-voice')) return S.l('FCC 24-104, orden contra Steve Kramer (26 de septiembre de 2024)', 'FCC 24-104, order against Steve Kramer (September 26, 2024)');
  return '';
}
