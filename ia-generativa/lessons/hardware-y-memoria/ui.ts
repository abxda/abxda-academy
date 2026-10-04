// Ayudas de dibujo propias de la lección (el kit no trae tarjetas de calculadora, cajas de GPU ni ejes con tamaño mínimo garantizado).
// Todo texto respeta ≥ 12 px efectivos (FS) y los colores salen de tone()/S.pal (nunca hex).
import { alpha, clamp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';

/** Tamaño de fuente (antes de escalar por S.u) que garantiza ≥ 12 px efectivos. */
export const FS = (S: Frame, px: number) => Math.max(px, 12.2 / S.u);

/** Dibuja texto que se encoge hasta caber en `w` (sin bajar de 12 px efectivos). */
export function fitText(S: Frame, str: string, x: number, y: number, w: number, size: number, o: { weight?: number; font?: 'ui' | 'mono'; color?: string; align?: CanvasTextAlign; base?: CanvasTextBaseline; halo?: string; a?: number } = {}) {
  const d = S.d, minS = FS(S, 12);
  let s = Math.max(size, minS);
  while (s > minS && d.measure(str, { size: s, weight: o.weight ?? 600, font: o.font }) > w) s -= 0.5;
  return d.text(str, x, y, { size: s, weight: o.weight ?? 600, font: o.font, color: o.color, align: o.align, base: o.base, halo: o.halo, a: o.a });
}

/** Etiqueta con halo del color del escenario (legible sobre líneas). */
export function tagText(S: Frame, str: string, x: number, y: number, o: { t?: Tone; align?: CanvasTextAlign; base?: CanvasTextBaseline; size?: number; weight?: number; font?: 'ui' | 'mono'; a?: number; w?: number } = {}) {
  const c = tone(S, o.t ?? 'ink');
  return S.d.text(str, x, y, { size: FS(S, o.size ?? 13), weight: o.weight ?? 700, color: o.t ? c.ink : S.pal.ink, align: o.align, base: o.base ?? 'middle', font: o.font, halo: S.pal.stage, haloW: 4, a: o.a, w: o.w });
}

/** Tarjeta: rótulo arriba, valor abajo. `assume` = borde punteado (supuesto ilustrativo). */
export function chip(S: Frame, r: Rect, label: string, value: string, t: Tone, o: { assume?: boolean; a?: number; hot?: number; vsize?: number; measured?: boolean } = {}) {
  const { d, pal: p } = S, u = S.u, c = tone(S, t), hot = o.hot ?? 0;
  d.withAlpha(o.a ?? 1, () => {
    d.rect(r.x, r.y, r.w, r.h, { fill: alpha(c.c, 0.07 + 0.3 * hot), stroke: c.c, lw: hot > 0.3 ? 2.2 : 1.4, r: 3, dash: o.assume ? [5, 3] : undefined });
    fitText(S, label, r.x + r.w / 2, r.y + 4 * u, r.w - 8 * u, 12, { weight: 700, color: p.mute, align: 'center', base: 'top' });
    fitText(S, value, r.x + r.w / 2, r.y + r.h - 5 * u, r.w - 8 * u, o.vsize ?? 16, { weight: 700, font: 'mono', color: c.ink, align: 'center', base: 'bottom' });
  });
}

/** Operador entre tarjetas (×, ÷, =). */
export function op(S: Frame, x: number, y: number, ch: string, a = 1) {
  S.d.text(ch, x, y, { size: FS(S, 17), weight: 700, font: 'mono', color: S.pal.mute, align: 'center', base: 'middle', a });
}

/** Casilla de verificación con rótulo (checklist de un turno). */
export function check(S: Frame, x: number, y: number, ok: boolean, label: string, w: number, t: Tone = 'dat') {
  const { d, pal: p } = S, u = S.u, c = tone(S, t);
  d.rect(x, y - 7 * u, 14 * u, 14 * u, { stroke: ok ? c.c : p.lineStrong, lw: 1.8, fill: ok ? alpha(c.c, 0.25) : undefined, r: 2 });
  if (ok) { d.line(x + 3 * u, y, x + 6 * u, y + 3 * u, c.ink, 2.2); d.line(x + 6 * u, y + 3 * u, x + 11 * u, y - 4 * u, c.ink, 2.2); }
  fitText(S, label, x + 20 * u, y, w - 24 * u, 12.5, { weight: 700, color: ok ? c.ink : p.ink2, base: 'middle' });
}

/** Veredicto con forma: ✓ (cabe), ◐ (justo), ✗ (no cabe). La forma acompaña al color. */
export function verdict(S: Frame, x: number, y: number, kind: 'ok' | 'tight' | 'no', size = 8) {
  const { d, pal: p } = S, u = S.u, s = size * u;
  if (kind === 'ok') { const c = tone(S, 'dat'); d.circle(x, y, s + 2, { fill: alpha(c.c, 0.2), stroke: c.c, lw: 1.8 }); d.line(x - s * 0.5, y, x - s * 0.1, y + s * 0.45, c.ink, 2.4); d.line(x - s * 0.1, y + s * 0.45, x + s * 0.55, y - s * 0.4, c.ink, 2.4); }
  else if (kind === 'tight') {
    // medio disco relleno: «cabe, pero justo»
    const c = tone(S, 'w'), pts: [number, number][] = [];
    for (let k = 0; k <= 12; k++) { const a = Math.PI / 2 + (Math.PI * k) / 12; pts.push([x + Math.cos(a) * s, y + Math.sin(a) * s]); }
    d.circle(x, y, s + 2, { fill: p.stage, stroke: c.c, lw: 1.8 });
    d.polygon(pts, { fill: c.c });
  }
  else { const c = tone(S, 'err'); d.circle(x, y, s + 2, { fill: alpha(c.c, 0.18), stroke: c.c, lw: 1.8 }); d.line(x - s * 0.5, y - s * 0.5, x + s * 0.5, y + s * 0.5, c.ink, 2.4); d.line(x - s * 0.5, y + s * 0.5, x + s * 0.5, y - s * 0.5, c.ink, 2.4); }
}

/** Opacidad de cada fase de una escena: la fase i vive entre el inicio del segmento ids[i] y el de ids[i+1]; cada cambio se funde en ~0,7 s. */
export function phases(S: Frame, ids: string[], dur = 0.7): number[] {
  return ids.map((id, i) => {
    const enter = i === 0 ? 1 : S.at(id, 0, dur, 'io'), leave = i + 1 < ids.length ? S.at(ids[i + 1], 0, dur, 'io') : 0;
    return clamp(enter * (1 - leave));
  });
}

export const smooth = (x: number) => { const t = clamp(x); return t * t * (3 - 2 * t); };

/** Tarjeta de GPU esquemática: chip con núcleos y pilas de memoria. No está a escala (ilustrativa). */
export function pxLabel(S: Frame, text: string, x: number, y: number, o: { t?: Tone; align?: CanvasTextAlign; size?: number; a?: number } = {}) {
  const c = tone(S, o.t ?? 'ink');
  S.d.text(text, x, y, { size: FS(S, o.size ?? 12.5), weight: 700, color: o.t ? c.ink : S.pal.ink2, align: o.align, base: 'middle', a: o.a, halo: S.pal.stage, haloW: 4 });
}
