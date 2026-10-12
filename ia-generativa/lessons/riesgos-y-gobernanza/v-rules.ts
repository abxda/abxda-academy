// Vistas 10–13: gobernanza (cuatro piezas), el Reglamento de IA de la UE (alcance, niveles, multas y calendario), las dos
// guías de referencia (NIST AI RMF 1.0 e ISO/IEC 42001), repaso y puente.
// REAL: Reglamento (UE) 2024/1689 (art. 2, 5, 50, 99, 113 y anexo III), modificado por el Reglamento (UE) 2026/1744
// (publicado el 24 de julio de 2026: alto riesgo del anexo III al 2 de diciembre de 2027 y del anexo I al 2 de agosto
// de 2028); NIST AI 100-1 (26 de enero de 2023; GOVERN 1.6, 2.1 y MANAGE 4.3); ISO/IEC 42001:2023 (18 de diciembre de
// 2023; certificación voluntaria por organismos independientes).
import { alpha, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { FS, area, areaH, card, chip, chipH, fitText, fr, glyph, header, para, paraH, tight, win, type GlyphKind } from './ui';

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Gobernanza: cuatro piezas
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawGov(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = areaH(S), port = S.portrait, gap = (tight(S) ? 8 : 14) * u;
  header(S, 0, S.l('Gobernanza', 'Governance'), fr(S, 'gov-def', 0, 0.1));
  // la pregunta y la definición
  const q = S.l('¿Quién decide qué riesgo se acepta, y quién vigila?', 'Who decides which risk is accepted, and who keeps watch?');
  const def = S.l('Gobernanza: las reglas y los responsables del uso de la IA en una organización.', 'Governance: the rules and the people in charge of how an organization uses AI.');
  const sz = FS(S, tight(S) ? 14 : 15.5);
  const qh = paraH(S, q, A.w, sz, { weight: 700 }), dh = paraH(S, def, A.w - 20 * u, sz, { weight: 800 }) + 16 * u;
  const cols = !port && A.w / 4 >= 150 * u ? 4 : 2, rowsN = Math.ceil(4 / cols);
  const chMax = Math.min((A.h - qh - dh - gap * 2.4 - (rowsN - 1) * gap) / rowsN, cols === 4 ? 150 * u : 128 * u);
  const total = qh + gap + dh + gap * 1.4 + rowsN * chMax + (rowsN - 1) * gap;
  const yq = A.y + Math.max(0, (A.h - total) / 2);
  d.withAlpha(fr(S, 'gov-def', 0.05, 0.16), () => para(S, q, A.x, yq, A.w, sz, { weight: 700, color: p.ink2 }));
  const dy = yq + qh + gap;
  d.withAlpha(fr(S, 'gov-def', 0.52, 0.64), () => { card(S, { x: A.x, y: dy, w: A.w, h: dh }, { tone: 'sig', hot: 0.06 }); para(S, def, A.x + 10 * u, dy + 8 * u, A.w - 20 * u, sz, { weight: 800, color: p.ink }); });
  // las cuatro piezas
  const items: { g: GlyphKind; t: string; s: string; tone: Tone; f: [string, number] }[] = [
    { g: 'doc', t: S.l('Política de uso', 'Usage policy'), s: S.l('qué herramientas, con qué datos y para qué', 'which tools, with which data, and for what'), tone: 'sig', f: ['gov-1', 0.2] },
    { g: 'list', t: S.l('Inventario', 'Inventory'), s: S.l('qué sistemas de IA hay y qué datos tocan', 'which AI systems exist and what data they touch'), tone: 'dat', f: ['gov-1', 0.62] },
    { g: 'user', t: S.l('Responsable', 'Owner'), s: S.l('uno por sistema, con nombre y apellido', 'one per system, by name'), tone: 'w', f: ['gov-2', 0.06] },
    { g: 'warn', t: S.l('Registro de incidentes', 'Incident log'), s: S.l('cada falla se anota, se revisa y ajusta los controles', 'every failure is logged, reviewed, and used to adjust the controls'), tone: 'err', f: ['gov-2', 0.42] },
  ];
  const top = dy + dh + gap * 1.4;
  const cw = (A.w - (cols - 1) * gap) / cols, ch = chMax;
  const slotA = fr(S, 'gov-def', 0.78, 0.9);
  items.forEach((it, i) => {
    const x = A.x + (i % cols) * (cw + gap), y = top + Math.floor(i / cols) * (ch + gap), r: Rect = { x, y, w: cw, h: ch };
    const a = fr(S, it.f[0], it.f[1], it.f[1] + 0.12), t = tone(S, it.tone);
    if (a < 0.99) d.withAlpha(slotA * (1 - a), () => d.rect(x, y, cw, ch, { stroke: p.line, lw: 1.2, dash: [5, 4], r: 4 }));
    d.withAlpha(a, () => {
      card(S, r, { tone: it.tone, hot: 0.06 });
      const gs = Math.min(22 * u, ch * 0.3), pad = 10 * u, ttw = cw - 2 * pad - gs - 8 * u;
      glyph(S, it.g, x + pad + gs / 2, y + pad + gs / 2, gs, t.ink);
      // el título se parte en dos renglones si no cabe
      const tls = S.d.measure(it.t, { size: FS(S, 14.5), weight: 800 }) <= ttw ? 1 : 2;
      const tH = para(S, it.t, x + pad + gs + 8 * u, y + pad + (tls === 1 ? gs / 2 - FS(S, 14.5) * u * 0.62 : 0), ttw, FS(S, 14.5), { weight: 800, color: t.ink, maxLines: 2, lh: 1.15 });
      const dy0 = y + pad + Math.max(gs, tH) + 6 * u;
      para(S, it.s, x + pad, dy0, cw - 2 * pad, FS(S, tight(S) ? 12.5 : 13.5), { weight: 600, color: p.ink, maxLines: Math.max(1, Math.floor((y + ch - pad - dy0) / (FS(S, 13.5) * u * 1.26))) });
    });
  });
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// El Reglamento de IA de la UE
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawAct(S: Frame) {
  header(S, 0, S.l('Reglas externas', 'Outside rules'), fr(S, 'aiact', 0, 0.1));
  const a1 = win(S, 'aiact', 'aiact-levels'), a2 = win(S, 'aiact-levels', 'aiact-dates'), a3 = win(S, 'aiact-dates');
  if (a1 > 0.01) S.d.withAlpha(a1, () => drawActCard(S));
  if (a2 > 0.01) S.d.withAlpha(a2, () => drawLevels(S));
  if (a3 > 0.01) S.d.withAlpha(a3, () => drawDates(S));
}

function drawActCard(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = areaH(S), w = Math.min(A.w, 560 * u), x = A.x + (A.w - w) / 2;
  const sz = FS(S, tight(S) ? 14 : 15.5), pad = 14 * u, tw = w - 2 * pad - 30 * u;
  const L1 = S.l('Reglamento de IA de la Unión Europea', 'The European Union’s AI Act');
  const rows: [GlyphKind, string, number][] = [
    ['check', S.l('En vigor desde el 1 de agosto de 2024.', 'In force since August 1, 2024.'), 0.36],
    ['scale', S.l('Alcanza a empresas de fuera si su IA se usa en la UE.', 'It reaches companies abroad if their AI is used in the EU.'), 0.68],
  ];
  const hT = FS(S, 17) * u * 1.3, hS = FS(S, 12.5) * u * 1.4;
  const hs = rows.map(([, t]) => paraH(S, t, tw, sz, { weight: 700 }));
  const h = pad * 2 + hT + hS + 10 * u + hs.reduce((s, v) => s + v + 10 * u, 0);
  const y = A.y + Math.max(0, (A.h - h) / 2);
  d.withAlpha(fr(S, 'aiact', 0.12, 0.24), () => {
    card(S, { x, y, w, h }, { tone: 'w', hot: 0.05 });
    fitText(S, L1, x + pad, y + pad, w - 2 * pad, 17, { weight: 800, color: tone(S, 'w').ink, base: 'top' });
    fitText(S, S.l('Reglamento (UE) 2024/1689', 'Regulation (EU) 2024/1689'), x + pad, y + pad + hT, w - 2 * pad, 12.5, { weight: 700, color: p.mute, base: 'top', font: 'mono' });
  });
  let yy = y + pad + hT + hS + 10 * u;
  rows.forEach(([g, t, f], i) => {
    const a = fr(S, 'aiact', f, f + 0.1);
    glyph(S, g, x + pad + 10 * u, yy + sz * u * 0.62, 16 * u, p.ink2, a);
    d.withAlpha(a, () => para(S, t, x + pad + 30 * u, yy, tw, sz, { weight: 700, color: p.ink }));
    yy += hs[i] + 10 * u;
  });
}

function drawLevels(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = areaH(S), port = S.portrait, gap = (tight(S) ? 4 : 7) * u;
  const L: { t: string; ex: string; tone: Tone; f: [string, number] }[] = [
    { t: S.l('Prohibido', 'Banned'), ex: S.l('puntuar a la gente por su conducta social', 'scoring people on their social behavior'), tone: 'err', f: ['aiact-levels', 0.3] },
    { t: S.l('Alto riesgo', 'High risk'), ex: S.l('contratar personal, dar crédito', 'hiring staff, granting credit'), tone: 'w', f: ['aiact-levels', 0.66] },
    { t: S.l('Transparencia', 'Transparency'), ex: S.l('avisar que hay una IA: un chatbot, un video generado', 'disclose there is an AI: a chatbot, a generated video'), tone: 'lat', f: ['aiact-levels-2', 0.06] },
    { t: S.l('El resto', 'The rest'), ex: S.l('sin reglas especiales', 'no special rules'), tone: 'dat', f: ['aiact-levels-2', 0.36] },
  ];
  const fineTxt = S.l('Multas por lo prohibido: hasta 35 millones de euros o el 7 % de la facturación mundial.', 'Fines for banned practices: up to 35 million euros or 7% of worldwide turnover.');
  const fineTH = paraH(S, fineTxt, A.w - 20 * u, FS(S, 13), { weight: 700 }), fineH = fineTH + 16 * u;
  const bandsH = A.h - fineH - gap;
  const bh = Math.min((bandsH - FS(S, 12.5) * u - 8 * u - 3 * gap) / 4, 74 * u);
  const pw = port ? Math.min(A.w * 0.3, 110 * u) : Math.min(A.w * 0.3, 220 * u);
  const labH = FS(S, 12.5) * u + 8 * u;
  const y0 = A.y + labH + Math.max(0, (bandsH - labH - 4 * bh - 3 * gap) / 2);
  d.withAlpha(fr(S, 'aiact-levels', 0.06, 0.18), () => fitText(S, S.l('de más a menos riesgo', 'from more to less risk'), A.x, y0 - 4 * u, pw + 120 * u, 12.5, { weight: 700, color: p.mute, base: 'bottom' }));
  L.forEach((b, i) => {
    const a = fr(S, b.f[0], b.f[1], b.f[1] + 0.12), t = tone(S, b.tone), y = y0 + i * (bh + gap);
    const wTop = pw * (0.25 + 0.75 * (i / 4)), wBot = pw * (0.25 + 0.75 * ((i + 1) / 4)), cx = A.x + pw / 2;
    d.withAlpha(a, () => {
      d.polygon([[cx - wTop / 2, y], [cx + wTop / 2, y], [cx + wBot / 2, y + bh], [cx - wBot / 2, y + bh]], { fill: alpha(t.c, 0.3), stroke: t.c, lw: 1.4 });
      const tx = A.x + pw + 14 * u, tw = A.x + A.w - tx;
      if (bh >= FS(S, 15) * u * 1.25 + FS(S, 13) * u * 1.3 + 6 * u) {
        fitText(S, b.t, tx, y + 4 * u, tw, 15, { weight: 800, color: t.ink, base: 'top' });
        para(S, b.ex, tx, y + 4 * u + FS(S, 15) * u * 1.25, tw, FS(S, tight(S) ? 12.5 : 13.5), { weight: 600, color: p.ink, maxLines: bh > 56 * u ? 2 : 1 });
      } else {
        // banda baja (teléfono en horizontal): nombre y ejemplo en un solo renglón
        const lw = S.d.measure(b.t + ': ', { size: FS(S, 13.5), weight: 800 });
        fitText(S, b.t + ':', tx, y + bh / 2, tw, 13.5, { weight: 800, color: t.ink, base: 'middle' });
        fitText(S, b.ex, tx + lw, y + bh / 2, tw - lw, 12.5, { weight: 600, color: p.ink, base: 'middle' });
      }
    });
  });
  const fy = A.y + A.h - fineH;
  d.withAlpha(fr(S, 'aiact-levels-2', 0.68, 0.8), () => { card(S, { x: A.x, y: fy, w: A.w, h: fineH }, { tone: 'err', hot: 0.08 }); para(S, fineTxt, A.x + 10 * u, fy + 8 * u, A.w - 20 * u, FS(S, 13), { weight: 700, color: p.ink }); });
}

function drawDates(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = areaH(S);
  const E: { date: string; what: string; f: number; tone: Tone; note?: string }[] = [
    { date: S.l('1 ago 2024', 'Aug 1, 2024'), what: S.l('entra en vigor', 'enters into force'), f: 0.04, tone: 'ink' },
    { date: S.l('2 feb 2025', 'Feb 2, 2025'), what: S.l('lo prohibido', 'the bans'), f: 0.16, tone: 'err' },
    { date: S.l('2 ago 2026', 'Aug 2, 2026'), what: S.l('avisar que es IA', 'disclosing AI'), f: 0.42, tone: 'lat' },
    { date: S.l('2 dic 2027', 'Dec 2, 2027'), what: S.l('alto riesgo, como contratar o dar crédito', 'high risk, like hiring or credit'), f: 0.7, tone: 'w', note: S.l('pospuesto en julio de 2026; antes, agosto de 2026', 'postponed in July 2026; previously August 2026') },
    { date: S.l('2 ago 2028', 'Aug 2, 2028'), what: S.l('alto riesgo en productos regulados', 'high risk in regulated products'), f: 0.84, tone: 'w' },
  ];
  const sz = FS(S, tight(S) ? 13 : 14.5), dw = Math.max(...E.map((e) => S.d.measure(e.date, { size: FS(S, 14), weight: 800, font: 'mono' }))) + 10 * u;
  const lx = A.x + dw + 14 * u, tx = lx + 16 * u, tw = A.x + A.w - tx;
  const hs = E.map((e) => paraH(S, e.what, tw, sz, { weight: 700 }) + (e.note ? paraH(S, e.note, tw, FS(S, 12.5), { weight: 600 }) + 2 * u : 0));
  const tot = hs.reduce((s, h) => s + h, 0);
  const g = Math.max(6 * u, Math.min(26 * u, (A.h - tot) / (E.length - 1)));
  let y = A.y + Math.max(0, (A.h - tot - g * (E.length - 1)) / 2);
  d.withAlpha(fr(S, 'aiact-dates', 0.02, 0.1), () => d.line(lx, y, lx, y + tot + g * (E.length - 1), p.lineStrong, 1.6));
  E.forEach((e, i) => {
    const a = fr(S, 'aiact-dates', e.f, e.f + 0.1), t = tone(S, e.tone);
    d.withAlpha(a, () => {
      d.circle(lx, y + sz * u * 0.62, 5.5 * u, { fill: e.tone === 'ink' ? p.ink : t.c });
      fitText(S, e.date, lx - 12 * u, y, dw, 14, { weight: 800, color: e.tone === 'ink' ? p.ink : t.ink, base: 'top', align: 'right', font: 'mono' });
      const h = para(S, e.what, tx, y, tw, sz, { weight: 700, color: p.ink });
      if (e.note) para(S, e.note, tx, y + h + 2 * u, tw, FS(S, 12.5), { weight: 600, color: p.mute, italic: true });
    });
    y += hs[i] + g;
  });
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Dos guías de referencia
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawStandards(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = areaH(S), port = S.portrait, gap = (tight(S) ? 10 : 18) * u;
  header(S, 0, S.l('Guías de referencia (no son leyes)', 'Reference guides (not laws)'));
  const pad = 12 * u, sz = FS(S, tight(S) ? 13 : 14), cw = port ? A.w : (A.w - gap) / 2;
  const headBlock = FS(S, 16) * u * 1.3 + FS(S, 13) * u * 1.4 + 8 * u;
  const nl0 = S.l('Cuatro funciones; pide inventario, responsables y registro de incidentes.', 'Four functions; it asks for an inventory, owners, and incident reporting.');
  const chipRows = (() => { let x = 0, rows = 1; [S.l('gobernar', 'govern'), S.l('mapear', 'map'), S.l('medir', 'measure'), S.l('gestionar', 'manage')].forEach((t) => { const w = S.d.measure(t, { size: FS(S, 13.5), weight: 800 }) + 14 * u; if (x + w > cw - 2 * pad) { x = 0; rows++; } x += w + 8 * u; }); return rows; })();
  const h1 = pad + headBlock + chipRows * (chipH(S, 13.5) + 6 * u) + 10 * u + paraH(S, nl0, cw - 2 * pad, sz, { weight: 600 }) + pad;
  const isoT = [S.l('Requisitos de un sistema de gestión de IA.', 'Requirements for an AI management system.'), S.l('Certificación voluntaria, con un auditor externo.', 'Voluntary certification, by an outside auditor.')];
  const h2 = pad + headBlock + isoT.reduce((s, t) => s + paraH(S, t, cw - 2 * pad - 24 * u, sz, { weight: 650 }) + 8 * u, 0) + pad;
  const total = port ? h1 + gap + h2 : Math.max(h1, h2), y0 = A.y + Math.max(0, (A.h - total) / 2);
  const c1: Rect = { x: A.x, y: y0, w: cw, h: port ? h1 : total };
  const c2: Rect = port ? { x: A.x, y: y0 + h1 + gap, w: cw, h: h2 } : { x: A.x + cw + gap, y: y0, w: cw, h: total };
  const box = (r: Rect, tone0: Tone, title: string, sub: string, a: number) => {
    d.withAlpha(a, () => {
      card(S, r, { tone: tone0, hot: 0.05 });
      fitText(S, title, r.x + pad, r.y + pad, r.w - 2 * pad, 16, { weight: 800, color: tone(S, tone0).ink, base: 'top' });
      fitText(S, sub, r.x + pad, r.y + pad + FS(S, 16) * u * 1.3, r.w - 2 * pad, 13, { weight: 700, color: p.mute, base: 'top' });
    });
    return r.y + pad + FS(S, 16) * u * 1.3 + FS(S, 13) * u * 1.4 + 8 * u;
  };
  // NIST
  let y = box(c1, 'sig', S.l('Marco de riesgos de IA del NIST 1.0', 'NIST AI Risk Management Framework 1.0'), S.l('enero de 2023 · de uso voluntario', 'January 2023 · voluntary'), fr(S, 'standards', 0.1, 0.2));
  const fn = [S.l('gobernar', 'govern'), S.l('mapear', 'map'), S.l('medir', 'measure'), S.l('gestionar', 'manage')];
  let cx = c1.x + pad, cy = y + chipH(S, 13.5) / 2;
  fn.forEach((t, i) => {
    const w = S.d.measure(t, { size: FS(S, 13.5), weight: 800 }) + 14 * u;
    if (cx + w > c1.x + c1.w - pad) { cx = c1.x + pad; cy += chipH(S, 13.5) + 6 * u; }
    if (cy + chipH(S, 13.5) / 2 <= c1.y + c1.h - 2) chip(S, t, cx, cy, 'sig', { size: 13.5, align: 'left', weight: 800, a: fr(S, 'standards', 0.24 + i * 0.05, 0.32 + i * 0.05) });
    cx += w + 8 * u;
  });
  y = cy + chipH(S, 13.5) / 2 + 10 * u;
  const nl = S.l('Cuatro funciones; pide inventario, responsables y registro de incidentes.', 'Four functions; it asks for an inventory, owners, and incident reporting.');
  if (y + paraH(S, nl, c1.w - 2 * pad, sz, { weight: 600 }) < c1.y + c1.h) d.withAlpha(fr(S, 'standards', 0.44, 0.54), () => para(S, nl, c1.x + pad, y, c1.w - 2 * pad, sz, { weight: 600, color: p.ink }));
  // ISO
  y = box(c2, 'w', 'ISO/IEC 42001', S.l('diciembre de 2023', 'December 2023'), fr(S, 'standards', 0.56, 0.66));
  const iso: [GlyphKind, string, number][] = [
    ['list', S.l('Requisitos de un sistema de gestión de IA.', 'Requirements for an AI management system.'), 0.66],
    ['check', S.l('Certificación voluntaria, con un auditor externo.', 'Voluntary certification, by an outside auditor.'), 0.8],
  ];
  iso.forEach(([g, t, f]) => {
    const h = paraH(S, t, c2.w - 2 * pad - 24 * u, sz, { weight: 650 });
    if (y + h > c2.y + c2.h - 4 * u) return;
    const a = fr(S, 'standards', f, f + 0.1);
    glyph(S, g, c2.x + pad + 8 * u, y + sz * u * 0.62, 15 * u, tone(S, 'w').ink, a);
    d.withAlpha(a, () => para(S, t, c2.x + pad + 24 * u, y, c2.w - 2 * pad - 24 * u, sz, { weight: 650, color: p.ink }));
    y += h + 8 * u;
  });
}

// ════════════════════════════════════════════════════════════════════════════════════════════════
// Repaso y puente
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function drawRecap(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), w = Math.min(A.w, 560 * u), x = A.x + (A.w - w) / 2;
  const R: [GlyphKind, string, Tone, number][] = [
    ['warn', S.l('Los riesgos viven en los caminos del sistema.', 'Risks live on the system’s paths.'), 'err', 0.04],
    ['scale', S.l('Riesgo = probabilidad × impacto.', 'Risk = likelihood × impact.'), 'w', 0.32],
    ['user', S.l('Cada zona pide sus controles, y alguien con nombre responde por ellos.', 'Each zone calls for its own controls, and someone with a name answers for them.'), 'sig', 0.6],
  ];
  const sz = FS(S, tight(S) ? 15 : 17), gs = 22 * u, tw = w - gs - 18 * u, gap = (tight(S) ? 12 : 22) * u;
  const hs = R.map(([, t]) => paraH(S, t, tw, sz, { weight: 800 }));
  let y = A.y + Math.max(0, (A.h - hs.reduce((s, h) => s + h, 0) - gap * 2) / 2);
  R.forEach(([g, t, tn, f], i) => {
    const a = fr(S, 'recap', f, f + 0.12);
    glyph(S, g, x + gs / 2, y + sz * u * 0.62, gs, tone(S, tn).ink, a);
    d.withAlpha(a, () => para(S, t, x + gs + 18 * u, y, tw, sz, { weight: 800, color: p.ink }));
    y += hs[i] + gap;
  });
}

export function drawBridge(S: Frame) {
  const { d, pal: p } = S, u = S.u, A = area(S), w = Math.min(A.w, 560 * u), x = A.x + (A.w - w) / 2;
  const q = S.l('¿Dónde conviene usar IA en tu organización, y por dónde empezar?', 'Where does AI make sense in your organization, and where do you start?');
  const sz = FS(S, tight(S) ? 17 : 21), qh = paraH(S, q, w, sz, { weight: 800 });
  const y = A.y + Math.max(0, (A.h - qh - 60 * u) / 2);
  d.withAlpha(fr(S, 'bridge', 0.05, 0.2), () => para(S, q, x, y, w, sz, { weight: 800, color: p.ink }));
  d.withAlpha(fr(S, 'bridge', 0.55, 0.7), () => {
    fitText(S, S.l('Siguiente: Estrategia para organizaciones', 'Next: Strategy for organizations'), x, y + qh + 26 * u, w, 15, { weight: 800, color: tone(S, 'sig').ink, base: 'top' });
  });
}

export function rulesSource(S: Frame): string {
  if (S.on('standards')) return S.l('NIST AI 100-1 (26 de enero de 2023) · ISO/IEC 42001:2023 (18 de diciembre de 2023)', 'NIST AI 100-1 (January 26, 2023) · ISO/IEC 42001:2023 (December 18, 2023)');
  if (S.on('aiact-dates')) return S.l('Reglamento (UE) 2024/1689, art. 113, modificado por el Reglamento (UE) 2026/1744 (24 de julio de 2026)', 'Regulation (EU) 2024/1689, Art. 113, as amended by Regulation (EU) 2026/1744 (July 24, 2026)');
  if (S.on('aiact-levels')) return S.l('Reglamento (UE) 2024/1689: art. 5, anexo III, art. 50 y art. 99 · esquema simplificado', 'Regulation (EU) 2024/1689: Art. 5, Annex III, Art. 50, and Art. 99 · simplified');
  if (S.on('aiact')) return S.l('Reglamento (UE) 2024/1689, art. 2 y 113', 'Regulation (EU) 2024/1689, Arts. 2 and 113');
  if (S.on('gov-def')) return S.l('NIST AI RMF 1.0: GOVERN 1.6 (inventario), 2.1 (responsables) y MANAGE 4.3 (incidentes)', 'NIST AI RMF 1.0: GOVERN 1.6 (inventory), 2.1 (roles), and MANAGE 4.3 (incidents)');
  return '';
}
