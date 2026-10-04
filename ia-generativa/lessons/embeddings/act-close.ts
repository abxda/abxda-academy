// Cierre: el hilo de la lección en cuatro cajas, y el puente hacia la lección 15.
import { box, link, neu, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { actAlpha, area, fs, isTiny } from './ui';

export function drawRecap(S: Frame) {
  const a = actAlpha(S, 'recap', 'bridge'); if (a <= 0) return;
  const { d } = S, u = S.u, A = area(S), tiny = isTiny(S);
  const labels = [S.l('1 · Casillas aisladas', '1 · Isolated slots'), S.l('2 · Vectores aprendidos', '2 · Learned vectors'), S.l('3 · Cerca = parecido', '3 · Near = similar'), S.l('4 · Búsqueda, y sesgos', '4 · Search, and biases')];
  const subs = [S.l('todo a igual distancia', 'all equally far'), S.l('una fila por palabra', 'one row per word'), S.l('coseno, vecinos, direcciones', 'cosine, neighbors, directions'), S.l('hay que medirlos', 'both need measuring')];
  const tones = ['mute', 'lat', 'sig', 'dat'] as const;
  const bw = Math.min((S.portrait ? A.w * 0.86 : A.w * 0.4), 280 * u), bh = (tiny ? 50 : 64) * u;
  const pos: Rect[] = S.portrait
    ? [0, 1, 2, 3].map((i) => ({ x: A.x + (A.w - bw) / 2, y: A.y + 6 * u + i * (bh + (A.h - 4 * bh - 12 * u) / 3), w: bw, h: bh }))
    : [{ x: A.x + A.w / 2 - bw - 36 * u, y: A.y + A.h * (tiny ? 0.12 : 0.2), w: bw, h: bh }, { x: A.x + A.w / 2 + 36 * u, y: A.y + A.h * (tiny ? 0.12 : 0.2), w: bw, h: bh }, { x: A.x + A.w / 2 + 36 * u, y: A.y + A.h * (tiny ? 0.55 : 0.58), w: bw, h: bh }, { x: A.x + A.w / 2 - bw - 36 * u, y: A.y + A.h * (tiny ? 0.55 : 0.58), w: bw, h: bh }];
  d.withAlpha(a, () => {
    pos.forEach((b, i) => { const ra = S.reveal('recap', 0.2 + i * 0.9, 0.6); if (ra > 0) box(S, b, labels[i], { tone: tones[i], sub: subs[i], a: ra, size: fs(S, 15) }); });
    for (let i = 0; i < 3; i++) { const al = S.at('recap', 0.7 + i * 0.9, 1.3 + i * 0.9); if (al > 0) link(S, pos[i], pos[i + 1], { tone: 'ink', progress: al }); }
    if (!S.portrait && !tiny) neu(S, A.x + A.w / 2 - 36 * u, A.y + A.h * 0.4 + 10 * u, { scale: Math.max(2, Math.round(2.8 * u)), mood: 'happy', a: S.reveal('recap', 3.4, 0.6) });
  });
  void tone;
}

export function drawBridge(S: Frame) {
  const a = S.reveal('bridge', 0, 0.6); if (a <= 0) return;
  const { d, pal: p } = S, u = S.u, cx = S.W / 2, cy = S.H / 2;
  const sc = Math.max(4, Math.round((S.portrait ? 5 : 6) * u));
  d.withAlpha(a, () => {
    neu(S, cx - (24 * sc) / 2, cy - (S.portrait ? 78 : 92) * u, { scale: sc, mood: 'wow', a: S.reveal('bridge', 0.2, 0.6) });
    d.withAlpha(S.reveal('bridge', 0.9, 0.6), () => {
      d.text(S.l('Siguiente', 'Next'), cx, cy + 44 * u, { size: fs(S, 13), weight: 700, color: p.mute, align: 'center' });
      d.text(S.l('Generar es aprender una distribución', 'Generating is learning a distribution'), cx, cy + 74 * u, { size: S.portrait ? 20 : 24, weight: 800, align: 'center', w: S.W - 40 * u });
    });
  });
}
