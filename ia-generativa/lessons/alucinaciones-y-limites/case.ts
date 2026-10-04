// Acto 1 · el caso: un escrito con seis casos que no existen, la pregunta al propio modelo y el nombre del error.
// Fuente: Mata v. Avianca, Inc., 22-cv-1461 (PKC), S.D.N.Y.: Orden de comparecencia (4 may. 2023) y Opinión y orden sobre sanciones (22 jun. 2023).
import { alpha, clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { FS, bubble, card, fitText, mark, para, smooth, stamp, stat } from './ui';

/** Los seis casos que el tribunal declaró inexistentes (nombres abreviados como en la orden, ¶36). */
const CASES = ['Varghese v. China Southern Airlines', 'Shaboon v. Egyptair', 'Petersen v. Iran Air', 'Martinez v. Delta Airlines', 'Estate of Durden v. KLM', 'Miller v. United Airlines'];

export function drawCase(S: Frame, R: { main: Rect; aside: Rect; all: Rect }) {
  const { d, pal: p } = S, u = S.u;
  const toAsk = S.at('ask', 0, 0.9), toDef = S.at('define', 0, 0.9);
  // el escrito: grande en «hook», se achica en «ask» y se atenúa en «define»
  const full = R.main, smallW = S.portrait ? full.w * 0.62 : full.w * 0.5;
  const w = smallW + (full.w - smallW) * (1 - smooth(toAsk)) * 0 + 0;
  const docW = Math.min(full.w, S.portrait ? full.w : 430 * u) * (1 - 0.0) , docX = full.x + (S.portrait ? 0 : 0);
  void w;
  const docH = S.portrait ? (toAsk > 0 ? full.h * 0.5 : full.h) : full.h;
  const dw = toAsk > 0 ? Math.min(docW, S.portrait ? full.w : full.w * 0.5) : docW;
  const doc: Rect = { x: docX, y: full.y, w: dw, h: docH };
  const dim = 1 - 0.55 * smooth(toDef);
  d.withAlpha(S.reveal('hook', 0, 0.5) * dim, () => drawDoc(S, doc));

  // pregunta al modelo
  if (toAsk > 0) {
    const cx = S.portrait ? full.x : doc.x + doc.w + 16 * u, cy = S.portrait ? doc.y + doc.h + 10 * u : full.y;
    const cw = S.portrait ? full.w : full.x + full.w - cx, ch = S.portrait ? full.h - doc.h - 10 * u : full.h;
    drawChat(S, { x: cx, y: cy, w: cw, h: ch }, dim);
  }

  // lateral: contador (hook) y multa (define)
  const aside = R.aside;
  d.withAlpha(S.reveal('hook', 1.0, 0.6) * (1 - toDef), () => {
    const k = clamp((S.since('hook') - 1.6) / 3.6) * CASES.length, gone = Math.min(CASES.length, Math.floor(k + 0.001));
    stat(S, aside.x, aside.y + 4 * u, S.l('casos citados', 'cases cited'), '6', 'ink', { size: 30 });
    stat(S, aside.x + (S.portrait ? aside.w / 2 : 0), aside.y + (S.portrait ? 4 * u : 70 * u), S.l('existen', 'exist'), String(CASES.length - gone), 'err', { size: 30 });
  });
  if (toDef > 0) drawDefinition(S, R, toDef);
}

function drawDoc(S: Frame, r: Rect) {
  const { d, pal: p } = S, u = S.u;
  d.rect(r.x, r.y, r.w, r.h, { fill: p.surface, stroke: p.lineStrong, lw: 1.5, r: 3 });
  // encabezado y párrafo difuminado
  fitText(S, S.l('Escrito presentado al tribunal', 'Brief filed with the court'), r.x + 12 * u, r.y + 10 * u, r.w - 24 * u, 13, { weight: 800, color: p.ink, base: 'top' });
  fitText(S, 'Mata v. Avianca · S.D.N.Y. · 2023', r.x + 12 * u, r.y + 28 * u, r.w - 24 * u, 12, { weight: 600, color: p.mute, base: 'top', font: 'mono' });
  const tall = r.h > 190 * u;
  let y = r.y + 54 * u;
  if (tall) for (let i = 0; i < 2; i++) { d.rect(r.x + 12 * u, y, (r.w - 24 * u) * (i ? 0.7 : 1), 5 * u, { fill: p.line }); y += 11 * u; }
  y += 4 * u;
  fitText(S, S.l('Jurisprudencia citada:', 'Case law cited:'), r.x + 12 * u, y, r.w - 24 * u, 12.5, { weight: 700, color: p.ink2, base: 'top' });
  y += 20 * u;
  const rowH = Math.max(FS(S, 12) * u * 1.5, Math.min(30 * u, (r.y + r.h - y - 8 * u) / CASES.length));
  const k = clamp((S.since('hook') - 0.4) / 1.8) * CASES.length;       // aparecen las líneas
  const kx = clamp((S.since('hook') - 1.6) / 3.6) * CASES.length;       // se tachan una a una
  CASES.forEach((c, i) => {
    const a = clamp(k - i); if (a <= 0) return;
    const yy = y + i * rowH, gone = clamp(kx - i);
    d.withAlpha(a, () => {
      fitText(S, c, r.x + 12 * u, yy + rowH / 2, r.w - 24 * u - 30 * u, 12.5, { weight: 600, font: 'mono', color: gone > 0.5 ? p.mute : p.ink, base: 'middle' });
      if (gone > 0) {
        const lw = d.measure(c, { size: FS(S, 12.5), weight: 600, font: 'mono' });
        d.line(r.x + 12 * u, yy + rowH / 2, r.x + 12 * u + lw * smooth(gone), yy + rowH / 2, tone(S, 'err').c, 2);
        mark(S, r.x + r.w - 18 * u, yy + rowH / 2, 'no', 7 * u, { a: smooth(gone) });
      }
    });
  });
  if (kx > 5.2 && r.h > 150 * u) stamp(S, S.l('NO EXISTEN', 'DO NOT EXIST'), r.x + r.w * 0.62, r.y + r.h * 0.52, 'err', { angle: -0.14, size: 17, pop: smooth(clamp((kx - 5.2) / 0.8)) });
}

function drawChat(S: Frame, r: Rect, dim: number) {
  const { d, pal: p } = S, u = S.u;
  const a1 = S.reveal('ask', 0.3, 0.5), a2 = S.reveal('ask', 1.6, 0.6);
  d.withAlpha(dim, () => {
    const bw = Math.min(r.w, 300 * u);
    const q = bubble(S, S.l('Is Varghese a real case?  (¿Es real el caso Varghese?)', 'Is Varghese a real case?'), r.x + r.w - bw, r.y + 2 * u, bw, 'user', { a: a1, tag: S.l('el abogado', 'the lawyer'), size: 13.5 });
    const ans = S.l('Sí. Es un caso real y se encuentra en Westlaw y LexisNexis.', 'Yes. It is a real case and can be found on Westlaw and LexisNexis.');
    const b = bubble(S, ans, r.x, q.y + q.h + 10 * u, bw, 'bot', { a: a2, tag: S.l('ChatGPT (paráfrasis)', 'ChatGPT (paraphrase)'), size: 13.5 });
    d.withAlpha(S.reveal('ask', 2.6, 0.6), () => {
      para(S, S.l('Paráfrasis de lo que consta en la sentencia. Esos casos no existen.', 'Paraphrase of what the ruling records. Those cases do not exist.'), r.x, b.y + b.h + 8 * u, Math.min(r.w, 330 * u), { size: 12, weight: 600, color: p.mute });
    });
  });
}

function drawDefinition(S: Frame, R: { main: Rect; aside: Rect; all: Rect }, a: number) {
  const { d, pal: p } = S, u = S.u, r = R.all;
  const chips: [string, 'sig' | 'w' | 'err', number][] = [[S.l('fluida', 'fluent'), 'sig', 0.2], [S.l('segura', 'confident'), 'w', 0.8], [S.l('falsa o sin respaldo', 'false or unsupported'), 'err', 1.4]];
  const cw = Math.min(190 * u, (r.w - 24 * u) / (S.portrait ? 1 : 3.3)), ch = 40 * u;
  const total = S.portrait ? chips.length * ch + (chips.length - 1) * 10 * u : chips.length * cw + (chips.length - 1) * 18 * u;
  const x0 = S.portrait ? r.x + (r.w - cw) / 2 : r.x + (r.w - total) / 2;
  const y0 = S.portrait ? r.y + r.h * 0.14 : r.y + r.h * 0.2;
  d.withAlpha(a, () => {
    chips.forEach(([t, tn, dl], i) => {
      const al = S.reveal('define', dl, 0.5);
      const x = S.portrait ? x0 : x0 + i * (cw + 18 * u), y = S.portrait ? y0 + i * (ch + 10 * u) : y0;
      d.withAlpha(al, () => {
        card(S, { x, y, w: cw, h: ch }, tn, { hot: 0.5 });
        fitText(S, t, x + cw / 2, y + ch / 2, cw - 14 * u, 15, { weight: 800, color: tone(S, tn).ink, align: 'center', base: 'middle' });
      });
    });
    // multa
    const al = S.reveal('define', 0.1, 0.5);
    const fy = S.portrait ? y0 + total + 22 * u : y0 + ch + 34 * u;
    stamp(S, S.l('MULTA · US$ 5 000', 'PENALTY · $5,000'), r.x + r.w / 2, fy + 20 * u, 'ink', { angle: -0.05, size: 16, pop: al });
    // definición
    const rr = S.reveal('define', 2.4, 0.7);
    d.withAlpha(rr, () => {
      const ty = fy + 54 * u;
      para(S, S.l('Alucinación', 'Hallucination'), r.x, ty, r.w, { size: 22, weight: 800, align: 'center' });
      para(S, S.l('es una respuesta fluida y segura que es falsa o no tiene respaldo.', 'is a fluent, confident answer that is false or has no backing.'), r.x + r.w * 0.1, ty + 32 * u, r.w * 0.8, { size: 15, weight: 600, color: p.ink2, align: 'center' });
    });
  });
  void alpha;
}
