// Piezas de dibujo propias de la lección «El transformer completo»: tiempo por fracciones del segmento, márgenes,
// texto que se achica o se parte, fichas (tokens), tiras de números, barras con signo, tablas y nodos de suma.
// El kit no trae matrices con signo ni tiras de vector; se implementan aquí. Todo pide roles de color (tone) y colores
// del tema (S.pal): nada de hex. Todo es puro: solo lee sus argumentos.
//
// Convención visual de la lección (no depende solo del color):
//   · relleno más intenso = valor de mayor magnitud; borde PUNTEADO = valor negativo (y el número lleva «−»).
//   · lat = listas de números de los tokens (embeddings y lo que fluye por los bloques) · sig = atención
//     · dat = red y cálculo · w = parámetros · err = trampa / error · mute = normalización, máscara, lo apagado.
import { alpha, clamp, ease, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';

// ───────── tiempo: siempre por fracciones de la duración del segmento (las voces y los idiomas duran distinto) ─────────
/** Progreso 0..1 entre las fracciones a y b de la duración del segmento k (0 si aún no empieza). */
export function fr(S: Frame, k: string, a: number, b: number): number {
  if (!S.on(k)) return 0;
  const s = S.start(k), d = Math.max(0.6, S.end(k) - s);
  return clamp(((S.t - s) / d - a) / (b - a || 1e-6));
}
/** Aparición suave entre las fracciones a y b. */
export const ap = (S: Frame, k: string, a = 0, b = 0.12) => ease.out(fr(S, k, a, b));
/** Movimiento con entrada y salida suaves entre las fracciones a y b. */
export const mv = (S: Frame, k: string, a: number, b: number) => ease.io(fr(S, k, a, b));
/** Resaltado que sube al empezar `k` y baja al empezar `until` (0..1). */
export const hold = (S: Frame, k: string, until?: string, a = 0.05, b = 0.18) => ap(S, k, a, b) * (until && S.on(until) ? 1 - ap(S, until, 0, 0.1) : 1);

// ───────── espacio ─────────
/** ¿Escenario muy bajo (teléfono en horizontal)? */
export const isShort = (S: Frame) => !S.portrait && S.H < 300;
/** Área útil del escenario. */
export function area(S: Frame): Rect { const m = isShort(S) ? 10 : S.portrait ? 12 : 16; return { x: m, y: m, w: S.W - 2 * m, h: S.H - 2 * m }; }

// ───────── texto ─────────
/** Tamaño nominal con mínimo de 12 px efectivos (d.text multiplica por S.u). */
export const fz = (S: Frame, n: number) => Math.max(n, 12 / S.u);
export interface TxtOpts { s?: number; c?: string; align?: CanvasTextAlign; base?: CanvasTextBaseline; weight?: number; mono?: boolean; halo?: boolean; a?: number; w?: number; lh?: number }
/** Texto con mínimo de 12 px efectivos. `s` es el tamaño nominal. */
export function txt(S: Frame, str: string, x: number, y: number, o: TxtOpts = {}) {
  return S.d.text(str, x, y, { size: fz(S, o.s ?? 13), weight: o.weight ?? 600, color: o.c ?? S.pal.ink, align: o.align, base: o.base ?? 'middle', font: o.mono ? 'mono' : undefined, halo: o.halo ? S.pal.stage : undefined, haloW: 4, a: o.a, w: o.w, lh: o.lh });
}
export const measure = (S: Frame, str: string, s = 13, mono = false, weight = 600) => S.d.measure(str, { size: fz(S, s), weight, font: mono ? 'mono' : undefined });
/** Texto en una línea que se achica (hasta 12 px efectivos) para caber en `w`; si aun así no cabe, se recorta con «…». */
export function fitText(S: Frame, str: string, x: number, y: number, w: number, o: TxtOpts = {}) {
  let size = fz(S, o.s ?? 13); const min = fz(S, 12), weight = o.weight ?? 600, font = o.mono ? 'mono' as const : undefined;
  while (size > min && S.d.measure(str, { size, weight, font }) > w) size -= 0.5;
  let s = str;
  if (S.d.measure(s, { size, weight, font }) > w) { while (s.length > 1 && S.d.measure(s + '…', { size, weight, font }) > w) s = s.slice(0, -1); s += '…'; }
  return S.d.text(s, x, y, { size, weight, color: o.c ?? S.pal.ink, align: o.align, base: o.base ?? 'middle', font, a: o.a, halo: o.halo ? S.pal.stage : undefined, haloW: 4 });
}
/** Rótulo pequeño y apagado. */
export const caption = (S: Frame, str: string, x: number, y: number, w: number, o: TxtOpts = {}) => fitText(S, str, x, y, w, { s: 12, weight: 700, c: S.pal.mute, ...o });

// ───────── números ─────────
/** Menos tipográfico para los números negativos. */
export const sgn = (s: string) => s.replace('-', '−');
export const num = (S: Frame, v: number, d = 1) => sgn(S.n(Math.abs(v) < 0.5 * 10 ** -d ? 0 : v, d));
export const pct = (S: Frame, p: number, digits = 0) => `${S.n(p * 100, digits)}${S.lang === 'es' ? ' %' : '%'}`;
/** Entero con separador de miles del idioma (es: espacio desde 5 cifras; en: coma). */
export function fmtInt(S: Frame, n: number): string {
  const s = Math.round(n).toString();
  if (S.lang === 'en') return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return s.length <= 4 ? s : s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
/** Cantidad grande compacta: «174.6 mil millones» / «174.6 billion»; «125.2 millones» / «125.2 million»; el resto, entera. */
export function bigNum(S: Frame, n: number): string {
  if (n >= 1e9) return `${S.n(n / 1e9, 1)} ${S.l('mil millones', 'billion')}`;
  if (n >= 1e6) return `${S.n(n / 1e6, 1)} ${S.l('millones', 'million')}`;
  return fmtInt(S, n);
}

// ───────── fichas, tiras y tablas ─────────
/** Una ficha (token). Devuelve su ancho. `active` 0..1 la rellena. */
export function chip(S: Frame, x: number, y: number, text: string, o: { tone?: Tone; h?: number; s?: number; a?: number; active?: number; mono?: boolean; w?: number; dash?: boolean } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'lat'), h = o.h ?? 28, s = o.s ?? 14;
  const w = o.w ?? measure(S, text, s, o.mono, 700) + 16;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(x, y, w, h, { fill: alpha(t.c, 0.14 + 0.5 * (o.active ?? 0)), stroke: t.c, lw: 1.5, r: 3, dash: o.dash ? [4, 3] : undefined });
    fitText(S, text, x + w / 2, y + h / 2, w - 6, { s, weight: 700, c: (o.active ?? 0) > 0.6 ? p.stage : t.ink, align: 'center', mono: o.mono });
  });
  return w;
}
export const chipW = (S: Frame, text: string, s = 14) => measure(S, text, s, false, 700) + 16;

export interface GridOpts {
  tone?: Tone; vmax?: number; digits?: number;
  /** false = solo color; función = texto propio por celda. */
  numbers?: boolean | ((v: number, r: number, c: number) => string);
  cw?: number; ch?: number; gap?: number; size?: number;
  /** Celdas tapadas por la máscara: rayadas con «−∞». */
  masked?: (r: number, c: number) => number;
  /** Opacidad por celda. */
  cellA?: (r: number, c: number) => number;
  hot?: (r: number, c: number) => number;
  a?: number;
  /** Valores de 0 a vmax (probabilidades): sin borde punteado. */
  unsigned?: boolean;
}
/** Matriz de celdas con color por magnitud; (x, y) es la esquina superior izquierda de la primera celda. */
export function grid(S: Frame, x: number, y: number, M: number[][], o: GridOpts = {}) {
  const { d, pal: p } = S, rows = M.length, cols = M[0]?.length ?? 0, t = tone(S, o.tone ?? 'lat');
  const cw = o.cw ?? 34, ch = o.ch ?? 26, gap = o.gap ?? 2;
  const vmax = o.vmax ?? Math.max(1e-9, ...M.flat().map(Math.abs));
  d.withAlpha(o.a ?? 1, () => {
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const v = M[r][c], k = clamp(Math.abs(v) / vmax), cx = x + c * cw, cy = y + r * ch, a = o.cellA?.(r, c) ?? 1;
      if (a <= 0.01) continue;
      d.withAlpha(a, () => {
        const neg = v < 0 && !o.unsigned;
        d.rect(cx, cy, cw - gap, ch - gap, { fill: alpha(t.c, 0.06 + 0.74 * k), stroke: neg ? t.c : undefined, lw: 1.3, dash: neg ? [3, 2] : undefined });
        if (o.numbers !== false && o.numbers !== undefined) {
          const str = typeof o.numbers === 'function' ? o.numbers(v, r, c) : num(S, v, o.digits ?? 1);
          fitText(S, str, cx + (cw - gap) / 2, cy + (ch - gap) / 2, cw - gap - 2, { s: o.size ?? 12, mono: true, c: k > 0.55 ? p.stage : p.ink, align: 'center' });
        }
        const m = o.masked?.(r, c) ?? 0;
        if (m > 0.01) d.withAlpha(m, () => {
          d.rect(cx, cy, cw - gap, ch - gap, { fill: p.surface2, stroke: p.lineStrong, lw: 1 });
          hatch(S, { x: cx, y: cy, w: cw - gap, h: ch - gap });
          if (cw >= 26 && ch >= 18) fitText(S, '−∞', cx + (cw - gap) / 2, cy + (ch - gap) / 2, cw - gap - 2, { s: o.size ?? 12, mono: true, c: p.ink2, align: 'center', halo: true });
        });
      });
      const h = o.hot?.(r, c) ?? 0;
      if (h > 0.01) d.rect(cx - 1.5, cy - 1.5, cw - gap + 3, ch - gap + 3, { stroke: p.ink, lw: 2.5, a: h });
    }
  });
  return { x, y, w: cols * cw - gap, h: rows * ch - gap };
}
/** Una lista de números como una fila de celdas de color (sin números). */
export const strip = (S: Frame, x: number, y: number, v: number[], cw: number, ch: number, o: GridOpts = {}) => grid(S, x, y, [v], { cw, ch, gap: Math.min(2, cw * 0.18), vmax: o.vmax ?? 2.2, ...o });

/** Barras con signo (cero en el centro): negativo hacia abajo, con borde punteado. `zero` desplaza la línea del cero (fracción de alto). */
export function vbars(S: Frame, r: Rect, v: number[], o: { tone?: Tone; vmax?: number; a?: number; gap?: number; line?: number | null; lineLabel?: string; band?: number; values?: boolean; hotI?: number; hotA?: number } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'lat'), n = v.length, vmax = o.vmax ?? Math.max(1e-9, ...v.map(Math.abs)), zy = r.y + r.h / 2, bw = r.w / n, gap = o.gap ?? Math.max(2, bw * 0.2);
  const Y = (q: number) => zy - (clamp(q / vmax, -1, 1)) * (r.h / 2 - 1);
  d.withAlpha(o.a ?? 1, () => {
    if (o.band) d.rect(r.x, Y(o.band), r.w, Y(-o.band) - Y(o.band), { fill: alpha(p.ink, 0.07) });
    d.line(r.x, zy, r.x + r.w, zy, p.lineStrong, 1.3);
    v.forEach((q, i) => {
      const bx = r.x + i * bw + gap / 2, w = bw - gap, y0 = Y(q);
      if (q >= 0) d.rect(bx, y0, w, zy - y0, { fill: alpha(t.c, 0.72) });
      else d.rect(bx, zy, w, y0 - zy, { fill: alpha(t.c, 0.16), stroke: t.c, lw: 1.3, dash: [3, 2] });
      if (o.hotI === i && (o.hotA ?? 1) > 0.01) d.rect(bx - 2, Math.min(y0, zy) - 2, w + 4, Math.abs(y0 - zy) + 4, { stroke: p.ink, lw: 2, a: o.hotA ?? 1 });
    });
    if (o.line !== undefined && o.line !== null) {
      const ly = Y(o.line);
      d.line(r.x - 4, ly, r.x + r.w + 4, ly, p.ink, 1.6, [5, 4]);
    }
  });
  return { Y, bw };
}

/** Rayado de «tapado» para un rectángulo. */
export function hatch(S: Frame, r: Rect, a = 1) {
  const { d, pal: p } = S;
  d.withAlpha(a, () => { d.ctx.save(); d.ctx.beginPath(); d.ctx.rect(r.x, r.y, r.w, r.h); d.ctx.clip(); for (let q = -r.h; q < r.w; q += 7) d.line(r.x + q, r.y + r.h, r.x + q + r.h, r.y, p.line, 1); d.ctx.restore(); });
}

/** Nodo ⊕ (suma). */
export function plus(S: Frame, x: number, y: number, r: number, o: { tone?: Tone; a?: number; fill?: number } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'ink');
  d.withAlpha(o.a ?? 1, () => {
    d.circle(x, y, r, { fill: o.fill ? alpha(t.c, 0.12 + 0.3 * o.fill) : p.surface, stroke: t.c, lw: 2 });
    d.line(x - r * 0.55, y, x + r * 0.55, y, t.c, 2); d.line(x, y - r * 0.55, x, y + r * 0.55, t.c, 2);
  });
}

/** Caja con título centrado. `active` 0..1 la resalta. */
export function node(S: Frame, r: Rect, label: string, o: { tone?: Tone; a?: number; active?: number; size?: number; dim?: number } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'ink'), act = o.active ?? 0;
  d.withAlpha((o.a ?? 1) * (1 - 0.6 * (o.dim ?? 0)), () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: p.stage, r: 3 });
    d.rect(r.x, r.y, r.w, r.h, { fill: alpha(t.c, 0.1 + 0.28 * act), stroke: o.tone ? t.c : p.lineStrong, lw: 1.5 + 1.2 * act, r: 3 });
    fitText(S, label, r.x + r.w / 2, r.y + r.h / 2, r.w - 8, { s: o.size ?? 13, weight: 700, c: o.tone ? t.ink : p.ink, align: 'center' });
  });
}

/** Flecha entre dos puntos con progreso 0..1 (se dibuja a medida que avanza). */
export function arrowP(S: Frame, x1: number, y1: number, x2: number, y2: number, o: { tone?: Tone; p?: number; lw?: number; dash?: number[]; a?: number; head?: number } = {}) {
  const k = clamp(o.p ?? 1); if (k <= 0) return;
  const t = tone(S, o.tone ?? 'mute'), tx = x1 + (x2 - x1) * k, ty = y1 + (y2 - y1) * k;
  S.d.withAlpha(o.a ?? 1, () => { if (o.dash) S.d.line(x1, y1, tx, ty, t.c, o.lw ?? 1.6, o.dash); else S.d.arrow(x1, y1, tx, ty, t.c, o.lw ?? 1.6, k > 0.97 ? (o.head ?? 7) : 0.001); });
}

/** Barra horizontal de proporción (0..1) con fondo tenue. */
export function hbar(S: Frame, x: number, y: number, w: number, h: number, v: number, o: { tone?: Tone; a?: number; hot?: number } = {}) {
  const { d, pal: p } = S, t = tone(S, o.tone ?? 'lat');
  d.withAlpha(o.a ?? 1, () => {
    d.rect(x, y, w, h, { fill: alpha(p.ink, 0.05) });
    d.rect(x, y, Math.max(0, w * clamp(v)), h, { fill: alpha(t.c, 0.35 + 0.45 * (o.hot ?? 0)) });
  });
}

/** Arco (Bézier cuadrática) entre dos puntos, abombado `bulge` px hacia la izquierda del sentido de avance; punta opcional. */
export function arc(S: Frame, x1: number, y1: number, x2: number, y2: number, o: { bulge?: number; tone?: Tone; lw?: number; dash?: number[]; a?: number; head?: number; p?: number } = {}) {
  const k = clamp(o.p ?? 1); if (k <= 0) return;
  const c = S.d.ctx, col = tone(S, o.tone ?? 'sig').c, len = Math.hypot(x2 - x1, y2 - y1) || 1, b = o.bulge ?? len * 0.3;
  const cx = (x1 + x2) / 2 - ((y2 - y1) / len) * b, cy = (y1 + y2) / 2 + ((x2 - x1) / len) * b;
  // trozo de la curva hasta k (de Casteljau)
  const qx = x1 + (cx - x1) * k, qy = y1 + (cy - y1) * k, rx = cx + (x2 - cx) * k, ry = cy + (y2 - cy) * k, ex = qx + (rx - qx) * k, ey = qy + (ry - qy) * k;
  c.save(); c.globalAlpha *= o.a ?? 1; c.strokeStyle = col; c.lineWidth = o.lw ?? 1.6; c.lineCap = 'round';
  if (o.dash) c.setLineDash(o.dash);
  c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(qx, qy, ex, ey); c.stroke(); c.restore();
  if (o.head && k > 0.97) { const ang = Math.atan2(ey - qy, ex - qx), h = o.head; S.d.polygon([[ex, ey], [ex - Math.cos(ang - 0.45) * h, ey - Math.sin(ang - 0.45) * h], [ex - Math.cos(ang + 0.45) * h, ey - Math.sin(ang + 0.45) * h]], { fill: col, a: o.a }); }
}
