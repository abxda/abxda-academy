// Acto 4 · tres familias de error: inventar, desactualizar y razonar mal. Cada tarjeta lleva un ejemplo medido en Pythia-1.4B
// (real-data.ts) o el caso judicial de Nueva York. Las tarjetas aparecen una por segmento (types, stale, reason).
// La fecha del cambio de capital de Brasil (1960) es un hecho histórico: Brasilia fue inaugurada el 21 de abril de 1960.
import { tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { ARITH, DIST } from './real-data';
import { card, fitText, mark, source } from './ui';

interface Row { k: string; text: string; kind: 'q' | 'bad' | 'good'; font?: 'mono' | 'ui' }

/** Fila «etiqueta · texto · marca». */
function row(S: Frame, r: Rect, y: number, h: number, o: Row, a: number) {
  const { d, pal: p } = S, u = S.u;
  const lw = Math.min(88 * u, r.w * 0.3);
  d.withAlpha(a, () => {
    fitText(S, o.k, r.x, y + h / 2, lw - 6 * u, 12, { weight: 700, color: p.mute, base: 'middle' });
    const t = tone(S, o.kind === 'bad' ? 'err' : o.kind === 'good' ? 'dat' : 'ink');
    fitText(S, o.text, r.x + lw, y + h / 2, r.w - lw - (o.kind === 'q' ? 0 : 22 * u), 14, { weight: o.kind === 'q' ? 600 : 800, color: o.kind === 'q' ? p.ink : t.ink, base: 'middle', font: o.font });
    if (o.kind !== 'q') mark(S, r.x + r.w - 9 * u, y + h / 2, o.kind === 'bad' ? 'no' : 'ok', 6.5 * u, { lw: 2.4 });
  });
}

export function drawTypes(S: Frame, R: { main: Rect; aside: Rect; all: Rect }) {
  const { d, pal: p } = S, u = S.u, r: Rect = { ...R.all, h: R.all.h - 14 * u };
  const portrait = S.portrait || r.w < 560 * u, gap = 12 * u;
  const n = 3, ch = portrait ? (r.h - gap * (n - 1)) / n : Math.min(r.h, 330 * u), cw = portrait ? r.w : (r.w - gap * (n - 1)) / n;
  const y0 = portrait ? r.y : r.y + (r.h - ch) / 2;
  const q = DIST[2], paramoAns = q.ans.replace(/\s+/g, ' ');
  const ar = ARITH.items[0];
  const fmtN = (v: number) => (S.lang === 'es' ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
  const ans0 = (ar.ans.replace(/\D/g, '') || '0');
  const cards: { id: string; t: Tone; title: string; sub: string; rows: Row[]; extra?: (rr: Rect, a: number) => void }[] = [
    {
      id: 'types', t: 'err', title: S.l('1 · Inventar', '1 · Making things up'), sub: S.l('El dato no está en el modelo', 'The fact is not in the model'),
      rows: [
        { k: S.l('Pregunta', 'Question'), text: S.l('¿Quién escribió «Pedro Páramo»?', 'Who wrote “Pedro Páramo”?'), kind: 'q' },
        { k: 'Pythia', text: paramoAns, kind: 'bad' },
        { k: S.l('Correcto', 'Correct'), text: 'Juan Rulfo', kind: 'good' },
      ],
      extra: (rr, a) => {
        d.withAlpha(a, () => {
          fitText(S, S.l('Y en Nueva York: 6 casos que no existen', 'And in New York: 6 cases that do not exist'), rr.x, rr.y + rr.h / 2, rr.w, 13, { weight: 700, color: tone(S, 'err').ink, base: 'middle' });
        });
      },
    },
    {
      id: 'stale', t: 'w', title: S.l('2 · Desactualizar', '2 · Going stale'), sub: S.l('El conocimiento se congela', 'Knowledge is frozen'),
      rows: [
        { k: S.l('Pregunta', 'Question'), text: S.l('¿Capital de Brasil?', 'Capital of Brazil?'), kind: 'q' },
        { k: 'Pythia', text: S.l('Río de Janeiro', 'Rio de Janeiro'), kind: 'bad' },
        { k: S.l('Correcto', 'Correct'), text: S.l('Brasilia (desde 1960)', 'Brasília (since 1960)'), kind: 'good' },
      ],
      extra: (rr, a) => drawCutoff(S, rr, a),
    },
    {
      id: 'reason', t: 'sig', title: S.l('3 · Razonar mal', '3 · Reasoning badly'), sub: S.l('Los datos bien, la cadena mal', 'Facts right, chain wrong'),
      rows: [
        { k: S.l('Pregunta', 'Question'), text: `${ar.a} × ${ar.b}`, kind: 'q', font: 'mono' },
        { k: 'Pythia', text: fmtN(Number(ans0)), kind: 'bad', font: 'mono' },
        { k: S.l('Correcto', 'Correct'), text: fmtN(ar.gold), kind: 'good', font: 'mono' },
      ],
      extra: (rr, a) => {
        d.withAlpha(a, () => {
          const right = Math.round(ARITH.acc * ARITH.n);
          fitText(S, S.l(`${right} de ${ARITH.n} multiplicaciones correctas`, `${right} of ${ARITH.n} multiplications right`), rr.x, rr.y + rr.h / 2, rr.w, 13, { weight: 700, color: tone(S, 'sig').ink, base: 'middle' });
        });
      },
    },
  ];
  cards.forEach((c, i) => {
    const a = S.reveal(c.id, 0, 0.55); if (a <= 0) return;
    const rc: Rect = portrait ? { x: r.x, y: y0 + i * (ch + gap), w: cw, h: ch } : { x: r.x + i * (cw + gap), y: y0, w: cw, h: ch };
    const tn = tone(S, c.t), pad = 12 * u;
    d.withAlpha(a, () => {
      card(S, rc, c.t, { hot: S.is(c.id) ? 0.35 : 0.05, fill: 0.04 });
      fitText(S, c.title, rc.x + pad, rc.y + pad, rc.w - 2 * pad, 18, { weight: 800, color: tn.ink, base: 'top' });
      fitText(S, c.sub, rc.x + pad, rc.y + pad + 25 * u, rc.w - 2 * pad, 13, { weight: 600, color: p.ink2, base: 'top' });
      const inner: Rect = { x: rc.x + pad, y: rc.y + pad + 50 * u, w: rc.w - 2 * pad, h: rc.h - pad * 2 - 50 * u };
      const rh = Math.min(30 * u, inner.h / 4.2);
      c.rows.forEach((rw, j) => row(S, inner, inner.y + j * rh, rh, rw, S.reveal(c.id, 0.35 + j * 0.45, 0.4)));
      const ex: Rect = { x: inner.x, y: inner.y + 3 * rh + 4 * u, w: inner.w, h: Math.max(0, inner.y + inner.h - (inner.y + 3 * rh + 4 * u)) };
      if (c.extra && ex.h > 20 * u) c.extra(ex, S.reveal(c.id, 1.9, 0.5));
    });
  });
  // pie: fuente de lo medido
  source(S, S.l('Respuestas de Pythia-1.4B · preguntas en inglés · decodificación voraz', 'Pythia-1.4B answers · questions in English · greedy decoding'), S.reveal('types', 1.0, 0.6));
}

/** Línea de tiempo: datos de entrenamiento hasta el corte; lo posterior es desconocido para el modelo. */
function drawCutoff(S: Frame, r: Rect, a: number) {
  const { d, pal: p } = S, u = S.u;
  const w = Math.min(r.w, 330 * u), x = r.x, y = r.y + Math.min(r.h * 0.5, 22 * u), cut = x + w * 0.62;
  d.withAlpha(a, () => {
    d.rect(x, y, cut - x, 8 * u, { fill: tone(S, 'w').c });
    d.rect(cut, y, x + w - cut, 8 * u, { stroke: p.mute, lw: 1.4, dash: [4, 3] });
    d.line(cut, y - 8 * u, cut, y + 16 * u, p.ink, 2);
    fitText(S, S.l('datos', 'data'), x, y - 4 * u, cut - x, 12, { weight: 700, color: tone(S, 'w').ink, base: 'bottom' });
    fitText(S, S.l('corte', 'cutoff'), cut, y + 18 * u, 70 * u, 12, { weight: 800, color: p.ink, align: 'center', base: 'top' });
    fitText(S, S.l('no lo sabe', 'unknown'), (cut + x + w) / 2, y - 4 * u, x + w - cut, 12, { weight: 700, color: p.mute, align: 'center', base: 'bottom' });
  });
}
