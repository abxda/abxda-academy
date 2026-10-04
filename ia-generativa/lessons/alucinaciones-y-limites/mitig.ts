// Acto 8 · cuatro palancas para gestionar el error (no eliminarlo): documentos, herramientas, salida acotada y verificación.
// Cada baldosa lleva un diagrama esquemático (ilustrativo, sin cifras inventadas); aparecen una por segmento.
import { alpha, clamp, tone, type Frame, type Rect, type Tone } from '../../../../../theme/kit';
import { ARITH } from './real-data';
import { FS, card, fitText, mark, para, smooth, tagText } from './ui';

type Draw = (S: Frame, r: Rect, a: number) => void;

function box(S: Frame, r: Rect, label: string, t: Tone, o: { dash?: boolean; fill?: number; size?: number } = {}) {
  const { d } = S, c = tone(S, t);
  d.rect(r.x, r.y, r.w, r.h, { fill: alpha(c.c, o.fill ?? 0.1), stroke: c.c, lw: 1.5, r: 4, dash: o.dash ? [5, 3] : undefined });
  fitText(S, label, r.x + r.w / 2, r.y + r.h / 2, r.w - 8 * S.u, o.size ?? 13, { weight: 700, color: c.ink, align: 'center', base: 'middle' });
}
const arrow = (S: Frame, x1: number, y: number, x2: number, a = 1) => S.d.arrow(x1, y, x2, y, S.pal.ink2, 1.8, 7, a);

/** 1 · documentos: el modelo responde a partir de un texto que se le da y lo cita. */
const dGround: Draw = (S, r, a) => {
  const u = S.u, h = Math.min(r.h, 64 * u), y = r.y + (r.h - h) / 2, w3 = (r.w - 2 * 22 * u) / 3;
  const doc: Rect = { x: r.x, y, w: w3, h }, mod: Rect = { x: r.x + w3 + 22 * u, y, w: w3, h }, ans: Rect = { x: r.x + 2 * (w3 + 22 * u), y, w: w3, h };
  const dat = tone(S, 'dat');
  S.d.withAlpha(S.reveal('mit-ground', 0.5, 0.5) * a, () => {
    S.d.rect(doc.x, doc.y, doc.w, doc.h, { fill: S.pal.surface, stroke: S.pal.lineStrong, lw: 1.5, r: 3 });
    for (let i = 0; i < 4; i++) S.d.rect(doc.x + 7 * u, doc.y + 8 * u + i * (doc.h - 16 * u) / 4, (doc.w - 14 * u) * (i === 2 ? 1 : 0.8 - 0.1 * i), 4 * u, { fill: i === 2 ? alpha(dat.c, 0.75) : S.pal.line });
  });
  S.d.withAlpha(S.reveal('mit-ground', 1.0, 0.5) * a, () => { arrow(S, doc.x + doc.w + 3 * u, y + h / 2, mod.x - 3 * u); box(S, mod, S.l('modelo', 'model'), 'lat'); });
  S.d.withAlpha(S.reveal('mit-ground', 1.5, 0.5) * a, () => {
    arrow(S, mod.x + mod.w + 3 * u, y + h / 2, ans.x - 3 * u);
    box(S, ans, S.l('respuesta [1]', 'answer [1]'), 'dat');
    S.d.line(doc.x + doc.w - 6 * u, doc.y + 8 * u + 2 * (doc.h - 16 * u) / 4 + 2 * u, ans.x + ans.w - 12 * u, ans.y + ans.h + 6 * u, alpha(dat.c, 0.8), 1.3, [3, 3]);
  });
};

/** 2 · herramientas: un sistema determinista produce el dato. */
const dTools: Draw = (S, r, a) => {
  const u = S.u, h = Math.min(r.h, 66 * u), y = r.y + (r.h - h) / 2, w3 = (r.w - 2 * 22 * u) / 3;
  const mod: Rect = { x: r.x, y, w: w3, h }, tool: Rect = { x: r.x + w3 + 22 * u, y, w: w3, h }, out: Rect = { x: r.x + 2 * (w3 + 22 * u), y, w: w3, h };
  const it = ARITH.items[0];
  S.d.withAlpha(S.reveal('mit-tools', 0.4, 0.5) * a, () => box(S, mod, S.l('modelo', 'model'), 'lat'));
  S.d.withAlpha(S.reveal('mit-tools', 1.0, 0.5) * a, () => {
    arrow(S, mod.x + mod.w + 3 * u, y + h * 0.3, tool.x - 3 * u);
    S.d.arrow(tool.x - 3 * u, y + h * 0.72, mod.x + mod.w + 3 * u, y + h * 0.72, S.pal.ink2, 1.8, 7);
    box(S, tool, S.l('calculadora', 'calculator'), 'w');
  });
  S.d.withAlpha(S.reveal('mit-tools', 1.6, 0.5) * a, () => {
    arrow(S, tool.x + tool.w + 3 * u, y + h / 2, out.x - 3 * u);
    box(S, out, S.lang === 'es' ? `${it.a} × ${it.b} = ${String(it.gold).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}` : `${it.a} × ${it.b} = ${String(it.gold).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`, 'dat', { size: 12.5 });
  });
};

/** 3 · acotar la salida: diez códigos válidos, no hay un undécimo; y las fuentes pedidas hay que comprobarlas. */
const dLimit: Draw = (S, r, a) => {
  const u = S.u, cols = r.w > 330 * u ? 6 : 5, cs = Math.min(36 * u, (r.w - (cols - 1) * 6 * u) / cols), rows = Math.ceil(11 / cols);
  const gw = cols * cs + (cols - 1) * 6 * u, x0 = r.x + (r.w - gw) / 2, y0 = r.y + Math.max(0, (r.h - (rows * cs + (rows - 1) * 6 * u)) / 2);
  const dat = tone(S, 'dat'), err = tone(S, 'err');
  for (let i = 0; i < 11; i++) {
    const x = x0 + (i % cols) * (cs + 6 * u), y = y0 + Math.floor(i / cols) * (cs + 6 * u);
    const al = S.reveal('mit-limit', 0.2 + (i < 10 ? i * 0.12 : 1.5), 0.35) * a;
    S.d.withAlpha(al, () => {
      if (i < 10) { S.d.rect(x, y, cs, cs, { fill: alpha(dat.c, 0.14), stroke: dat.c, lw: 1.4, r: 3 }); fitText(S, `C${i + 1}`, x + cs / 2, y + cs / 2, cs - 4 * u, 12, { weight: 700, font: 'mono', color: dat.ink, align: 'center', base: 'middle' }); }
      else { S.d.rect(x, y, cs, cs, { stroke: err.c, lw: 1.4, r: 3, dash: [4, 3] }); mark(S, x + cs / 2, y + cs / 2, 'no', cs * 0.28, { lw: 2.2 }); }
    });
  }
};

/** 4 · verificación proporcional al riesgo: tres usos, tres niveles de revisión. */
const dVerify: Draw = (S, r, a) => {
  const u = S.u, rows = [
    { l: S.l('borrador interno', 'internal draft'), v: S.l('por muestreo', 'spot check'), w: 0.3, t: 'dat' as Tone },
    { l: S.l('cifra para un cliente', 'figure for a client'), v: S.l('una por una', 'one by one'), w: 0.65, t: 'w' as Tone },
    { l: S.l('cita legal', 'legal citation'), v: S.l('contra la fuente', 'against the source'), w: 1, t: 'err' as Tone },
  ];
  const rh = Math.min(30 * u, r.h / 3), lw = Math.min(150 * u, r.w * 0.44), bx = r.x + lw + 8 * u, bw = r.w - lw - 8 * u;
  rows.forEach((o, i) => {
    const y = r.y + (r.h - 3 * rh) / 2 + i * rh, c = tone(S, o.t), al = S.reveal('mit-verify', 0.2 + i * 0.6, 0.45) * a;
    S.d.withAlpha(al, () => {
      fitText(S, o.l, r.x, y + rh / 2, lw, 13, { weight: 700, color: S.pal.ink2, base: 'middle' });
      S.d.rect(bx, y + rh * 0.18, bw, rh * 0.64, { fill: S.pal.surface2 });
      S.d.rect(bx, y + rh * 0.18, bw * o.w * smooth(clamp(al * 1.3)), rh * 0.64, { fill: alpha(c.c, 0.7) });
      fitText(S, o.v, bx + 6 * u, y + rh / 2, bw - 10 * u, 12, { weight: 700, color: S.pal.ink, base: 'middle' });
    });
  });
};

export function drawMitig(S: Frame, R: { main: Rect; aside: Rect; all: Rect }) {
  const { d, pal: p } = S, u = S.u, r = R.all;
  const tiles: { id: string; t: Tone; title: string; cap: string; draw: Draw }[] = [
    { id: 'mit-ground', t: 'lat', title: S.l('1 · Darle el documento', '1 · Hand it the document'), cap: S.l('responde con tus textos y los cita', 'answers from your texts and cites them'), draw: dGround },
    { id: 'mit-tools', t: 'w', title: S.l('2 · Herramientas', '2 · Tools'), cap: S.l('el dato lo produce un sistema determinista', 'a deterministic system produces the fact'), draw: dTools },
    { id: 'mit-limit', t: 'dat', title: S.l('3 · Acotar la salida', '3 · Constrain the output'), cap: S.l('diez códigos válidos: no existe el undécimo', 'ten valid codes: there is no eleventh'), draw: dLimit },
    { id: 'mit-verify', t: 'err', title: S.l('4 · Verificar según el riesgo', '4 · Verify by risk'), cap: S.l('más riesgo, más revisión', 'more risk, more review'), draw: dVerify },
  ];
  const wide = !S.portrait && r.w >= 560 * u, gap = 12 * u;
  const tw = wide ? (r.w - gap) / 2 : r.w, th = wide ? (r.h - gap) / 2 : (r.h - 3 * gap) / 4;
  tiles.forEach((tl, i) => {
    const a = S.reveal(tl.id, 0, 0.5); if (a <= 0) return;
    const rc: Rect = wide ? { x: r.x + (i % 2) * (tw + gap), y: r.y + Math.floor(i / 2) * (th + gap), w: tw, h: th } : { x: r.x, y: r.y + i * (th + gap), w: tw, h: th };
    const c = tone(S, tl.t), pad = 10 * u, hot = S.is(tl.id) ? 0.35 : 0.05, compact = th < 120 * u;
    d.withAlpha(a, () => {
      card(S, rc, tl.t, { hot, fill: 0.04 });
      fitText(S, tl.title, rc.x + pad, rc.y + pad - 1 * u, rc.w - 2 * pad, 15, { weight: 800, color: c.ink, base: 'top' });
      const capH = compact ? 0 : 20 * u;
      const dr: Rect = { x: rc.x + pad, y: rc.y + pad + 22 * u, w: rc.w - 2 * pad, h: rc.h - pad * 2 - 22 * u - capH };
      tl.draw(S, dr, 1);
      if (!compact) fitText(S, tl.cap, rc.x + pad, rc.y + rc.h - pad + 2 * u, rc.w - 2 * pad, 12.5, { weight: 600, color: p.ink2, base: 'bottom' });
    });
  });
  // pedir fuentes: solo sirve si alguien las comprueba
  const sa = S.reveal('mit-limit', 2.6, 0.5);
  if (sa > 0 && S.is('mit-limit')) tagText(S, S.l('¿pedir fuentes? solo si alguien las comprueba', 'ask for sources? only if someone checks them'), r.x + r.w / 2, r.y + r.h - 2 * u, { t: 'err', align: 'center', base: 'bottom', size: 13, a: sa });
  void FS; void para;
}
