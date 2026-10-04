// Panel lateral común del modelo diminuto: parámetros que se entrenan, habilidades (nueva y original) y curva de pérdida.
import { clamp, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { meter, miniLoss } from './ui';

export interface PanelO {
  a?: number;
  /** parámetros que se entrenan / que quedan congelados */
  trainable: number; frozen: number;
  newSk: number; oldSk: number;
  /** habilidad original del modelo base (marca discontinua de referencia) */
  oldRef?: number;
  showMeters?: boolean; showTrain?: boolean;
  losses?: number[]; step?: number; total?: number; showLoss?: boolean;
  /** marcas de umbral del turno (0..1) */
  markNew?: number; markOld?: number;
  /** pone el medidor de la habilidad original en rojo/tinta si está bajo el umbral */
  title?: string;
}

export function drawPanel(S: Frame, r: Rect, o: PanelO) {
  const { d, pal: p } = S, u = S.u, wt = tone(S, 'w');
  const showMeters = o.showMeters ?? true, showTrain = o.showTrain ?? true;
  d.withAlpha(o.a ?? 1, () => {
    if (S.portrait) {
      const gap = 14 * u, hw = (r.w - gap) / 2;
      let y = r.y;
      if (showMeters) {
        meter(S, { x: r.x, y, w: hw, h: 36 * u }, S.l('regla nueva', 'new rule'), o.newSk, { tone: 'dat', hatch: true, mark: o.markNew });
        meter(S, { x: r.x + hw + gap, y, w: hw, h: 36 * u }, S.l('regla original', 'original rule'), o.oldSk, { tone: 'dat', ghost: o.oldRef, mark: o.markOld });
        y += 46 * u;
      }
      const rest = r.y + r.h - y;
      if (showTrain) {
        d.text(S.l('se entrenan', 'trainable'), r.x, y, { size: 12, weight: 700, color: p.mute, base: 'top' });
        d.text(S.n(o.trainable, 0), r.x, y + 15 * u, { size: 24, weight: 700, font: 'mono', color: wt.ink, base: 'top' });
        d.text(S.l('congelados ', 'frozen ') + S.n(o.frozen, 0), r.x, y + 46 * u, { size: 12, weight: 600, color: p.mute, base: 'top' });
      }
      if (o.showLoss && o.losses && rest > 50 * u) miniLoss(S, { x: r.x + (showTrain ? hw * 0.62 + gap : 0), y: y, w: showTrain ? r.w - hw * 0.62 - gap : r.w, h: Math.min(rest, 78 * u) }, o.losses, o.step ?? 0, o.total ?? 300, { label: S.l('pérdida', 'loss'), maxY: 1.5 });
    } else {
      let y = r.y;
      if (o.title) { d.text(o.title, r.x, y, { size: 13, weight: 700, color: p.ink2, base: 'top' }); y += 24 * u; }
      if (showTrain) {
        d.text(S.l('parámetros que se entrenan', 'trainable parameters'), r.x, y, { size: 12, weight: 700, color: p.mute, base: 'top' });
        d.text(S.n(o.trainable, 0), r.x, y + 16 * u, { size: 28, weight: 700, font: 'mono', color: wt.ink, base: 'top' });
        d.text(S.l('congelados: ', 'frozen: ') + S.n(o.frozen, 0), r.x + r.w, y + 26 * u, { size: 12, weight: 600, color: p.mute, align: 'right', base: 'top' });
        y += 58 * u;
      }
      if (showMeters) {
        meter(S, { x: r.x, y, w: r.w, h: 36 * u }, S.l('regla nueva (zonas rayadas)', 'new rule (hatched zones)'), o.newSk, { tone: 'dat', hatch: true, mark: o.markNew });
        y += 46 * u;
        meter(S, { x: r.x, y, w: r.w, h: 36 * u }, S.l('regla original (resto)', 'original rule (the rest)'), o.oldSk, { tone: 'dat', ghost: o.oldRef, mark: o.markOld });
        y += 50 * u;
      }
      const rest = r.y + r.h - y;
      if (o.showLoss && o.losses && rest > 56 * u) miniLoss(S, { x: r.x, y, w: r.w, h: Math.min(rest, 110 * u) }, o.losses, o.step ?? 0, o.total ?? 300, { label: S.l('pérdida de entrenamiento', 'training loss'), maxY: 1.5 });
    }
  });
  void clamp;
}
