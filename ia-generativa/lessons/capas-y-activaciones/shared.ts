// Utilidades compartidas por las partes de la escena «Capas y activaciones».
import { clamp, ease, type Frame, type Rect } from '../../../../../theme/kit';

type EaseName = NonNullable<Parameters<Frame['at']>[3]>;

/** Tamaño de texto del lienzo con piso de 12 px efectivos (el escenario multiplica `size` por S.u). */
export const fs = (S: Frame, px: number) => Math.max(px, 12 / S.u);

export const smooth = (x: number) => { const t = clamp(x); return t * t * (3 - 2 * t); };

/** Duración (s) del segmento `id`, incluido su silencio final. */
export const segDur = (S: Frame, id: string) => Math.max(1, S.end(id) - S.start(id));

/** Progreso 0→1 entre las fracciones a y b de la DURACIÓN del segmento: sigue a la voz en cualquier idioma. */
export const ph = (S: Frame, id: string, a: number, b: number, e: EaseName = 'io') => {
  const d = segDur(S, id);
  return S.at(id, a * d, b * d, e);
};

/** Aparición del escenario que empieza en `from` y cede el paso al que empieza en `to`. */
export const stageA = (S: Frame, from: string, to?: string) => S.at(from, 0, 0.7, 'out') * (to ? 1 - S.at(to, 0, 0.7, 'out') : 1);

/** El mayor cuadrado dentro de r, alineado a la izquierda o centrado. */
export function square(r: Rect, align: 'left' | 'center' = 'center'): Rect {
  const s = Math.min(r.w, r.h);
  return { x: align === 'left' ? r.x : r.x + (r.w - s) / 2, y: r.y + (r.h - s) / 2, w: s, h: s };
}

/** Número con signo menos tipográfico. */
export const sn = (S: Frame, x: number, d = 2) => S.n(x, d).replace('-', '−');

/** Camino con trazo «cheque» (✓) sin depender de que la fuente tenga el glifo. */
export function check(S: Frame, x: number, y: number, size: number, color: string, a = 1) {
  S.d.withAlpha(a, () => S.d.polyline([[x - size * 0.5, y], [x - size * 0.12, y + size * 0.42], [x + size * 0.55, y - size * 0.42]], color, 2.4, { join: 'round' }));
}

/** Cruz (✗) para «no coincide». */
export function cross(S: Frame, x: number, y: number, size: number, color: string, a = 1) {
  S.d.withAlpha(a, () => { S.d.line(x - size * 0.45, y - size * 0.45, x + size * 0.45, y + size * 0.45, color, 2.4); S.d.line(x - size * 0.45, y + size * 0.45, x + size * 0.45, y - size * 0.45, color, 2.4); });
}

export { ease };
