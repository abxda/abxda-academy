// Vista 1: hablar no es actuar (hook, only-text, cant-know). El pedido en un chat; el modelo que solo escribe texto;
// lo que no puede: saber la cartelera de hoy (pesos fijos) ni pagar (solo escribe).
import { alpha, neu, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { FS, area, bubble, card, fitText, fr, glyph, growArrow, lock, paraH, tight } from './ui';

function lay(S: Frame) {
  const u = S.u, A = area(S);
  if (S.portrait) {
    const chatH = A.h * 0.46;
    return { A, chat: { x: A.x, y: A.y, w: A.w, h: chatH } as Rect, right: { x: A.x, y: A.y + chatH + 18 * u, w: A.w, h: A.h - chatH - 18 * u } as Rect };
  }
  const cw = Math.min(A.w * 0.46, 400 * u);
  return { A, chat: { x: A.x, y: A.y, w: cw, h: A.h } as Rect, right: { x: A.x + cw + 30 * u, y: A.y, w: A.w - cw - 30 * u, h: A.h } as Rect };
}

export function drawIntro(S: Frame) {
  const { d, pal: p } = S, u = S.u, L = lay(S), C = L.chat;
  const size = FS(S, tight(S) ? 13 : 14.5);
  // ── el chat ──
  const ask = S.l('Compra dos boletos de cine para hoy en la noche, juntos, por menos de 300 pesos.', 'Buy two movie tickets for tonight, seats together, for under 300 pesos.');
  const reply = S.l('No puedo ver la cartelera de hoy ni comprar boletos. Te sugiero revisar la página del cine.', 'I can’t see today’s listings or buy tickets. I suggest checking the theater’s website.');
  const pad = 10 * u, bw = C.w - 2 * pad - (S.portrait ? 0 : 20 * u);
  const h1 = bubble(S, ask, 'user', 0, 0, bw, size, { measureOnly: true });
  const h2 = bubble(S, reply, 'ai', 0, 0, bw, size, { measureOnly: true });
  const head = (FS(S, 13) + 14) * u, inner = head + h1 + 14 * u + h2 + 2 * pad;
  const ch = Math.min(C.h, inner + 6 * u), cy = C.y + (C.h - ch) / 2;
  const chat = { x: C.x, y: cy, w: C.w, h: ch };
  d.withAlpha(S.reveal('hook', 0, 0.6), () => {
    card(S, chat, { fill: alpha(p.surface, 0.8), r: 10 * u });
    fitText(S, S.l('chat', 'chat'), chat.x + pad, chat.y + 8 * u, chat.w - 2 * pad, 13, { weight: 800, color: p.mute, base: 'top' });
    d.line(chat.x, chat.y + head - 4 * u, chat.x + chat.w, chat.y + head - 4 * u, p.line, 1);
  });
  const y1 = chat.y + head + 4 * u;
  bubble(S, ask, 'user', chat.x + pad + (S.portrait ? 0 : 20 * u), y1, bw, size, { a: S.reveal('hook', 0.3, 0.6) });
  bubble(S, reply, 'ai', chat.x + pad, y1 + h1 + 14 * u, bw, size, { a: fr(S, 'cant-know', 0.62, 0.78) });
  if (S.between('hook', 'only-text')) {
    const sc = Math.max(2, Math.round(2.3 * u)), nx = chat.x + chat.w - 24 * sc, ny = chat.y + chat.h + 8 * u;
    if (ny + 22 * sc < L.A.y + L.A.h + 20 * u || S.portrait) neu(S, S.portrait ? chat.x + chat.w - 26 * sc : nx, S.portrait ? chat.y + chat.h + 6 * u : ny, { scale: sc, mood: 'think', a: S.reveal('hook', 1, 0.6) });
  }

  // ── el modelo: texto → texto ──
  const R = L.right, ma = fr(S, 'only-text', 0.08, 0.25);
  if (ma < 0.01) return;
  const bwM = Math.min(R.w * 0.42, 150 * u), bhM = Math.min(84 * u, R.h * 0.3);
  const rowsH = tight(S) ? 2 * (FS(S, 13) * u + 16 * u) : 2 * (FS(S, 13) * u * 2.6 + 18 * u);
  const blockH = bhM + 26 * u + rowsH, by = R.y + Math.max(0, (R.h - blockH) / 2);
  const mx = R.x + (R.w - bwM) / 2, box = { x: mx, y: by, w: bwM, h: bhM };
  const w = tone(S, 'w'), aw = Math.min((R.w - bwM) / 2 - 8 * u, 90 * u);
  d.withAlpha(ma, () => {
    card(S, box, { tone: 'w', hot: 0.2 });
    fitText(S, S.l('modelo', 'model'), box.x + box.w / 2, box.y + 8 * u, box.w - 12 * u, 15, { weight: 800, color: w.ink, align: 'center', base: 'top' });
    const c = Math.max(2, Math.round(2.4 * u)), la = fr(S, 'cant-know', 0.15, 0.3);
    if (box.h > (FS(S, 15) + 16) * u + 8 * c) lock(S, box.x + box.w / 2 - 4 * c, box.y + box.h - 8 * c - 7 * u, c, Math.max(0.35, la));
    const cy = box.y + box.h / 2;
    growArrow(S, box.x - aw - 4 * u, cy, box.x - 4 * u, cy, fr(S, 'only-text', 0.2, 0.35), tone(S, 'sig').c, 2.4);
    growArrow(S, box.x + box.w + 4 * u, cy, box.x + box.w + aw, cy, fr(S, 'only-text', 0.4, 0.55), tone(S, 'lat').c, 2.4);
    fitText(S, S.l('texto', 'text'), box.x - aw / 2 - 4 * u, cy - 6 * u, aw, 13, { weight: 700, color: tone(S, 'sig').ink, align: 'center', base: 'bottom', a: fr(S, 'only-text', 0.25, 0.4) });
    fitText(S, S.l('texto', 'text'), box.x + box.w + aw / 2 + 4 * u, cy - 6 * u, aw, 13, { weight: 700, color: tone(S, 'lat').ink, align: 'center', base: 'bottom', a: fr(S, 'only-text', 0.45, 0.6) });
    // tokens que salen uno tras otro
    const toks = S.l('No · puedo · ver…', 'I · can’t · see…').split(' · '), tk = fr(S, 'only-text', 0.55, 0.9, 'lin');
    let tx = box.x + box.w + 6 * u; const ty = cy + 8 * u;
    toks.forEach((t, i) => {
      const a = Math.min(1, Math.max(0, tk * toks.length - i));
      if (a <= 0) return;
      const tw = d.measure(t, { size: FS(S, 12), weight: 700 }) + 10 * u;
      if (tx + tw > R.x + R.w + 10 * u) return;
      d.rect(tx, ty, tw, FS(S, 12) * u + 8 * u, { fill: alpha(tone(S, 'lat').c, 0.14), stroke: tone(S, 'lat').c, lw: 1.2, r: 3, a });
      d.text(t, tx + tw / 2, ty + (FS(S, 12) * u + 8 * u) / 2, { size: FS(S, 12), weight: 700, color: tone(S, 'lat').ink, align: 'center', base: 'middle', a });
      tx += tw + 4 * u;
    });
  });

  // ── lo que no puede ──
  const rows = [
    { a: fr(S, 'cant-know', 0.05, 0.2), t: S.l('¿qué funciones hay hoy?', 'which showtimes today?'), why: S.l('sus pesos quedaron fijos', 'its weights are frozen') },
    { a: fr(S, 'cant-know', 0.42, 0.56), t: S.l('¿pagar los boletos?', 'pay for the tickets?'), why: S.l('solo escribe texto', 'it only writes text') },
  ];
  let y = box.y + box.h + 26 * u;
  const rw = Math.min(R.w, 340 * u), rx = R.x + (R.w - rw) / 2;
  rows.forEach((r) => {
    if (r.a < 0.01) { y += rowsH / 2; return; }
    const two = !tight(S);
    const hh = two ? FS(S, 13) * u * 2.6 + 12 * u : FS(S, 13) * u + 12 * u;
    d.withAlpha(r.a, () => {
      d.rect(rx, y, rw, hh, { fill: alpha(tone(S, 'err').c, 0.08), stroke: tone(S, 'err').c, lw: 1.3, r: 4 * u });
      const gs = Math.min(hh * 0.5, 18 * u);
      glyph(S, 'cross', rx + 8 * u + gs / 2, y + hh / 2, gs, tone(S, 'err').c);
      const tx = rx + 16 * u + gs, tw = rw - (tx - rx) - 8 * u;
      if (two) {
        fitText(S, r.t, tx, y + 6 * u, tw, 13.5, { weight: 800, base: 'top' });
        fitText(S, r.why, tx, y + 8 * u + FS(S, 13.5) * u, tw, 12.5, { weight: 600, color: p.ink2, base: 'top' });
      } else fitText(S, `${r.t} · ${r.why}`, tx, y + hh / 2, tw, 12.5, { weight: 700, base: 'middle' });
    });
    y += hh + 8 * u;
  });
  void paraH;
}
