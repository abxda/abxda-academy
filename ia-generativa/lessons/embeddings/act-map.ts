// Acto 4: el mapa 2D (una proyección t-SNE de las 880 palabras), lo que pierde, los vecinos reales, el primer «Tu turno» y la polisemia.
import { alpha, clamp, hash, lerp, tone, type Frame, type PointerEvt, type Rect } from '../../../../../theme/kit';
import MEAS from './data/measures.json';
import { KEY, N, V, XY, cos, idOf, nearest } from './vectors';
import { KNN_WORDS, knnOf, knnView } from './logic';
import { actAlpha, area, big, chip, cosBars, fs, isTiny, num, pct, placeLabels, word, type LabelItem } from './ui';

// ── grupos de palabras (secciones de vocab.tsv) solo para rotular zonas del mapa ──
const gr = (name: string): [number, number] => { const g = MEAS.groups.find((x) => x.name === name)!; return [g.a, g.b]; };
const GROUPS: { es: string; en: string; r: [number, number][] }[] = [
  { es: 'animales', en: 'animals', r: [gr('animales')] },
  { es: 'comida y bebida', en: 'food and drink', r: [gr('comida y bebida'), gr('más comida y bebida')] },
  { es: 'transporte', en: 'transport', r: [gr('transporte')] },
  { es: 'países y ciudades', en: 'countries and cities', r: [gr('geografía'), gr('más países y capitales')] },
  { es: 'familia', en: 'family', r: [gr('personas y familia')] },
  { es: 'emociones', en: 'emotions', r: [gr('emociones y rasgos')] },
];
const GRP = new Int8Array(N).fill(GROUPS.length);
GROUPS.forEach((g, k) => g.r.forEach(([a, b]) => { for (let i = a; i < b; i++) GRP[i] = k; }));
const CENTROID = GROUPS.map((g) => { let x = 0, y = 0, n = 0; g.r.forEach(([a, b]) => { for (let i = a; i < b; i++) { x += XY[2 * i]; y += XY[2 * i + 1]; n++; } }); return [x / n, y / n] as [number, number]; });

const BG_WORDS = ['dog', 'cat', 'horse', 'bird', 'fish', 'lion', 'bread', 'cheese', 'pizza', 'coffee', 'rice', 'car', 'train', 'plane', 'bus', 'ship', 'king', 'queen', 'mother', 'baby', 'paris', 'tokyo', 'france', 'japan', 'london', 'mexico', 'love', 'happy', 'fear', 'angry', 'doctor', 'money'].map(idOf);
const TECH = new Set(['microsoft', 'ibm', 'intel', 'software', 'iphone', 'computer', 'product', 'company', 'app', 'digital']);
const FRUIT = new Set(['pear', 'mango', 'juice', 'peach', 'fruit', 'lemon']);

export interface MapG { sq: Rect; side: Rect; X: (i: number) => number; Y: (i: number) => number; r: number }
export function mapGeom(S: Frame): MapG {
  const A0 = area(S), u = S.u, kList = S.on('neighbors') ? S.at('neighbors', 0, 0.6) : 0, tagH = 28 * u;
  const A: Rect = { x: A0.x, y: A0.y + tagH, w: A0.w, h: A0.h - tagH };   // arriba queda la franja del rótulo «proyección»
  let sq: Rect, side: Rect;
  if (S.portrait) {
    const s = lerp(Math.min(A.w, A.h * 0.72), A.h * 0.5, kList);
    sq = { x: A.x + (A.w - s) / 2, y: A.y, w: s, h: s }; side = { x: A0.x, y: A.y + s + 8 * u, w: A0.w, h: A.h - s - 8 * u };
  } else {
    const s = Math.min(A.h, A.w * 0.58);
    sq = { x: A.x, y: A.y + (A.h - s) / 2, w: s, h: s }; side = { x: A.x + s + 18 * u, y: A0.y, w: A.w - s - 18 * u, h: A0.h };
  }
  const pad = 8 * u;
  return { sq, side, X: (i) => sq.x + pad + XY[2 * i] * (sq.w - 2 * pad), Y: (i) => sq.y + pad + (1 - XY[2 * i + 1]) * (sq.h - 2 * pad), r: Math.max(1.8, 2.3 * u) };
}

// ═════════════ pointer / cursor: tocar un punto del mapa elige esa palabra ═════════════
const inTry1 = (S: Frame) => S.between('try1', 'polysemy');
function pick(S: Frame, x: number, y: number): number {
  const G = mapGeom(S), R = Math.max(S.hitR, 14) * 0.9;
  if (x < G.sq.x - 4 || x > G.sq.x + G.sq.w + 4 || y < G.sq.y - 4 || y > G.sq.y + G.sq.h + 4) return -1;
  let best = -1, bd = R;
  for (let i = 0; i < N; i++) { const dd = Math.hypot(G.X(i) - x, G.Y(i) - y); if (dd < bd) { bd = dd; best = i; } }
  return best;
}
export function pointerMap(S: Frame, e: PointerEvt) {
  if (!inTry1(S) || e.type !== 'down') return;
  const i = pick(S, e.x, e.y);
  if (i >= 0) { const st = knnOf(S); st.src = 'tap'; st.tap = i; st.dwell = 1; S.touched.add('nextW'); }   // tocar el mapa cuenta como interacción de la persona
}
export function cursorMap(S: Frame, x: number, y: number): string | undefined { return inTry1(S) && pick(S, x, y) >= 0 ? 'pointer' : undefined; }

// ═════════════ dibujo ═════════════
function drawDots(S: Frame, G: MapG, focus: Set<number>, dim: number, revealAt: number) {
  const { d } = S, lt = tone(S, 'lat');
  const since = S.since('map');
  for (let i = 0; i < N; i++) {
    if (focus.has(i)) continue;
    const t0 = 0.2 + 0.5 * Math.min(GRP[i], GROUPS.length), a = clamp((since - t0) / 0.5) * revealAt;
    if (a <= 0) continue;
    d.circle(G.X(i), G.Y(i), G.r, { fill: lt.c, a: a * (0.62 - 0.38 * dim) });
  }
}

function drawFrame(S: Frame, G: MapG) {
  const { d, pal: p } = S, u = S.u;
  d.rect(G.sq.x, G.sq.y, G.sq.w, G.sq.h, { fill: alpha(p.surface, 0.55), stroke: p.lineStrong, lw: 1.2, r: 3 });
  const tag = chip(S, S.l('proyección 2D · pierde información', '2D projection · loses information'), G.sq.x, G.sq.y - 15 * u, { tone: 'err', align: 'left', size: fs(S, 12) });
  return tag;
}

/** Dibuja el foco con sus vecinos: líneas, puntos grandes y etiquetas. */
function drawFocus(S: Frame, G: MapG, ids: number[], nb: { i: number; s: number }[], o: { a?: number; kind?: (i: number) => 'tech' | 'fruit' | null; labelN?: number } = {}) {
  const { d, pal: p } = S, u = S.u, lt = tone(S, 'lat'), sg = tone(S, 'sig'), a = o.a ?? 1;
  const cx = ids.reduce((s, i) => s + G.X(i), 0) / Math.max(1, ids.length), cy = ids.reduce((s, i) => s + G.Y(i), 0) / Math.max(1, ids.length);
  d.withAlpha(a, () => {
    nb.forEach((n, k) => {
      const kind = o.kind?.(n.i), dash = kind === 'fruit' ? [5, 4] : undefined;
      d.line(cx, cy, G.X(n.i), G.Y(n.i), kind === 'fruit' ? tone(S, 'dat').c : lt.c, 1.6, dash, 0.75);
      d.circle(G.X(n.i), G.Y(n.i), G.r * 2.1, { fill: kind === 'fruit' ? tone(S, 'dat').c : lt.c, stroke: p.stage, lw: 1.5 });
      void k;
    });
    ids.forEach((i) => d.circle(G.X(i), G.Y(i), G.r * 3, { fill: sg.c, stroke: p.stage, lw: 2 }));
    const items: LabelItem[] = [
      ...ids.map((i) => ({ x: G.X(i), y: G.Y(i), r: G.r * 3, text: word(S, i), prio: 100, color: sg.ink, weight: 800, size: fs(S, 14) })),
      ...nb.slice(0, o.labelN ?? 6).map((n, k) => ({ x: G.X(n.i), y: G.Y(n.i), r: G.r * 2.1, text: word(S, n.i), prio: 50 - k, color: p.ink, weight: 700, size: fs(S, 12) })),
    ];
    placeLabels(S, items, { x: G.sq.x + 2, y: G.sq.y + 2, w: G.sq.w - 4, h: G.sq.h - 4 }, []);
  });
}

function sideList(S: Frame, R: Rect, title: string, rows: { label: string; value: number; hot?: boolean; tag?: string; tone?: 'lat' | 'dat' | 'mute' }[], a = 1) {
  const { d, pal: p } = S, u = S.u;
  const rh = Math.min(28 * u, Math.max(18 * u, (R.h - 30 * u) / Math.max(1, rows.length)));
  const th = fs(S, 13) * u * 1.4;
  d.withAlpha(a, () => {
    d.text(title, R.x, R.y, { size: fs(S, 13), weight: 800, color: p.ink, base: 'top', w: R.w });
    const n = Math.max(1, Math.min(rows.length, Math.floor((R.h - th) / rh)));
    cosBars(S, { x: R.x, y: R.y + th, w: R.w, h: rh * n }, rows.slice(0, n).map((r) => ({ ...r, tone: r.tone ?? 'lat' })), { rowH: rh });
  });
}

export function drawMap(S: Frame) {
  const a = actAlpha(S, 'map', 'offset'); if (a <= 0) return;
  const { d, pal: p } = S, u = S.u, G = mapGeom(S), tiny = isTiny(S);
  const lt = tone(S, 'lat'), sg = tone(S, 'sig');
  d.withAlpha(a, () => {
    drawFrame(S, G);
    const onProj = S.on('proj'), onNb = S.on('neighbors'), onTry = S.on('try1'), onPoly = S.on('polysemy');
    // qué se enfoca en cada tramo
    let focusIds: number[] = [], nb: { i: number; s: number }[] = [], kindFn: ((i: number) => 'tech' | 'fruit' | null) | undefined;
    if (onPoly) { const ap = idOf('apple'); focusIds = [ap]; nb = nearest(ap, 10); kindFn = (i) => (TECH.has(KEY[i]) ? 'tech' : FRUIT.has(KEY[i]) ? 'fruit' : null); }
    else if (onTry) { const v = knnView(S); focusIds = v.ids; nb = v.nb.slice(0, 8); }
    else if (onNb) { const dg = idOf('dog'); focusIds = [dg]; nb = nearest(dg, 6); }
    const focus = new Set<number>([...focusIds, ...nb.map((n) => n.i)]);
    const dim = onProj ? 0.5 : 0;
    // la pareja «cama–dormir» y «caballo–gatito» del tramo proj
    const pairs: [number, number, string][] = [[idOf('bed'), idOf('sleep'), 'far'], [idOf('horse'), idOf('kitten'), 'near']];
    const inProj = onProj && !onNb;
    drawDots(S, G, inProj ? new Set(pairs.flatMap(([i, j]) => [i, j])) : focus, inProj ? 0.55 : focusIds.length ? 0.55 : 0, 1);
    // rótulos de zona y de palabras sueltas (solo al mostrar el mapa entero)
    const kLab = !onProj ? S.reveal('map', 3.6, 0.8) : 1 - S.at('proj', 0, 0.5);
    if (kLab > 0.01) d.withAlpha(kLab, () => {
      GROUPS.forEach((g, k) => {
        const name = S.l(g.es, g.en), cw = d.measure(name, { size: fs(S, tiny ? 11 : 12), weight: 800 }) + 14 * u;
        const x = clamp(G.sq.x + 8 * u + CENTROID[k][0] * (G.sq.w - 16 * u), G.sq.x + 3 * u + cw / 2, G.sq.x + G.sq.w - 3 * u - cw / 2), y = G.sq.y + 8 * u + (1 - CENTROID[k][1]) * (G.sq.h - 16 * u);
        chip(S, name, x, y, { tone: 'lat', size: fs(S, tiny ? 11 : 12), weight: 800, a: S.reveal('map', 0.7 + k * 0.5, 0.5) });
      });
    });
    if (!onProj) {
      const aW = S.reveal('map', 5.0, 0.8);
      if (aW > 0.01) d.withAlpha(aW * 0.9, () => {
        const items: LabelItem[] = BG_WORDS.map((i, k) => ({ x: G.X(i), y: G.Y(i), r: G.r, text: word(S, i), prio: 40 - k, color: p.ink2, weight: 600, size: fs(S, 11) }));
        const avoid = GROUPS.map((_, k) => ({ x: G.sq.x + 8 * u + CENTROID[k][0] * (G.sq.w - 16 * u) - 56 * u, y: G.sq.y + 8 * u + (1 - CENTROID[k][1]) * (G.sq.h - 16 * u) - 12 * u, w: 112 * u, h: 24 * u }));
        placeLabels(S, items, { x: G.sq.x + 2, y: G.sq.y + 2, w: G.sq.w - 4, h: G.sq.h - 4 }, avoid);
      });
    }
    // proj: dos parejas que engañan
    if (inProj) {
      const rv = S.reveal('proj', 0.6, 0.8);
      d.withAlpha(rv, () => {
        pairs.forEach(([i, j, kind]) => {
          const c = cos(i, j), e = tone(S, 'err');
          d.circle(G.X(i), G.Y(i), G.r * 2.6, { fill: sg.c, stroke: p.stage, lw: 1.5 }); d.circle(G.X(j), G.Y(j), G.r * 2.6, { fill: sg.c, stroke: p.stage, lw: 1.5 });
          d.line(G.X(i), G.Y(i), G.X(j), G.Y(j), kind === 'far' ? e.c : sg.c, 1.8, kind === 'far' ? [6, 4] : undefined, 0.9);
          const items: LabelItem[] = [i, j].map((q, k) => ({ x: G.X(q), y: G.Y(q), r: G.r * 2.6, text: word(S, q), prio: 90 - k, color: p.ink, weight: 800, size: fs(S, 13) }));
          placeLabels(S, items, { x: G.sq.x + 2, y: G.sq.y + 2, w: G.sq.w - 4, h: G.sq.h - 4 }, []);
          void c;
        });
      });
    }
    if (focusIds.length) drawFocus(S, G, focusIds, nb, { a: onPoly ? S.reveal('polysemy', 0.2, 0.7) : onTry ? 1 : S.reveal('neighbors', 0.4, 0.8), kind: kindFn, labelN: onPoly ? 10 : 6 });

    // ───────── panel lateral (o inferior) ─────────
    const R = G.side, big2 = S.portrait ? 26 : 38;
    if (S.on('map') && !onProj) {
      d.withAlpha(S.reveal('map', 0.4, 0.8), () => {
        d.text('100 → 2', R.x, R.y + (S.portrait ? 2 : R.h * 0.2), { size: big2, weight: 800, font: 'mono', color: lt.ink, base: 'top' });
        d.text(S.l('dimensiones: de cien números por palabra a dos coordenadas', 'dimensions: from a hundred numbers per word to two coordinates'), R.x, R.y + (S.portrait ? 2 : R.h * 0.2) + big2 * u + 6 * u, { size: fs(S, 13), weight: 600, color: p.ink2, base: 'top', w: R.w });
      });
    }
    if (onProj && !onNb) {
      d.withAlpha(S.reveal('proj', 0.4, 0.8), () => {
        const y0 = R.y + (S.portrait ? 0 : R.h * 0.1);
        d.text(pct(S, MEAS.map.overlap10, 0), R.x, y0, { size: big2, weight: 800, font: 'mono', color: tone(S, 'err').ink, base: 'top' });
        d.text(S.l('de los 10 vecinos reales de una palabra siguen entre sus 10 vecinos del mapa (promedio de 880 palabras)', 'of a word’s 10 true neighbors are still among its 10 nearest on the map (average over 880 words)'), R.x, y0 + big2 * u + 6 * u, { size: fs(S, 12), weight: 600, color: p.ink2, base: 'top', w: R.w });
        if (!S.portrait && !tiny) {
          let y = y0 + big2 * u + 90 * u;
          pairs.forEach(([i, j, kind]) => { d.text(`${word(S, i)} · ${word(S, j)}`, R.x, y, { size: fs(S, 13), weight: 800, color: p.ink, base: 'top' }); d.text(S.l(`coseno ${num(S, cos(i, j), 2)} · ${kind === 'far' ? 'lejos en el mapa' : 'casi juntas'}`, `cosine ${num(S, cos(i, j), 2)} · ${kind === 'far' ? 'far apart on the map' : 'nearly touching'}`), R.x, y + fs(S, 13) * u * 1.3, { size: fs(S, 12), weight: 600, color: kind === 'far' ? tone(S, 'err').ink : p.ink2, base: 'top', w: R.w }); y += 52 * u; });
        }
      });
    }
    if (onNb && !onTry) {
      const dg = idOf('dog');
      sideList(S, R, S.l(`vecinos reales de «${word(S, dg)}»`, `real neighbors of “${word(S, dg)}”`), nearest(dg, 7).map((n) => ({ label: word(S, n.i), value: n.s })), S.reveal('neighbors', 0.5, 0.8));
    }
    if (onTry && !onPoly) {
      const v = knnView(S), st = knnOf(S), text = String(S.p.w ?? '');
      const head = v.ids.length ? S.l(`vecinos de «${v.ids.map((i) => word(S, i)).join(' + ')}»`, `neighbors of “${v.ids.map((i) => word(S, i)).join(' + ')}”`) : S.l('sin resultado', 'no result');
      const statusH = (S.portrait ? 58 : 64) * u;
      sideList(S, { x: R.x, y: R.y, w: R.w, h: R.h - statusH }, head, v.nb.map((n) => ({ label: word(S, n.i), value: n.s })), S.reveal('try1', 0.2, 0.6));
      // estado de la entrada y avance del turno
      const y = R.y + R.h - statusH + 4 * u;
      d.withAlpha(S.reveal('try1', 0.3, 0.6), () => {
        let msg = '';
        if (st.src === 'typed' && !v.ids.length && text.trim()) {
          const sug = [0, 1, 2].map((k) => word(S, KNN_WORDS[(Math.floor(hash(text.length, 7) * 7) + k) % KNN_WORDS.length])).join(', ');
          msg = S.l(`No conozco «${text.trim()}»: solo hay ${big(S, N)} palabras. Prueba: ${sug}.`, `I do not know “${text.trim()}”: there are only ${big(S, N)} words. Try: ${sug}.`);
        } else if (st.src === 'tap') msg = S.l('Elegiste un punto del mapa.', 'You picked a point on the map.');
        else if (v.ids.length > 1) msg = S.l('Promedio de las palabras escritas.', 'Average of the words you typed.');
        else if (v.src === 'preset' && st.k === 0 && !(S.p.nextW > 0)) msg = S.l('Escribe una palabra, toca un punto del mapa o pulsa «Otra palabra».', 'Type a word, tap a point on the map, or press “Another word.”');
        if (msg) d.text(msg, R.x, y, { size: fs(S, 12), weight: 600, color: tone(S, 'err').ink, base: 'top', w: R.w });
        const seen = Math.min(3, st.seen.length), sy = R.y + R.h - 14 * u;
        d.text(S.l(`palabras distintas: ${seen} de 3`, `different words: ${seen} of 3`), R.x, sy, { size: fs(S, 12), weight: 700, color: seen >= 3 ? tone(S, 'dat').ink : p.mute, base: 'middle' });
        for (let k = 0; k < 3; k++) d.rect(R.x + R.w - (3 - k) * 16 * u, sy - 6 * u, 12 * u, 12 * u, { fill: k < seen ? tone(S, 'dat').c : p.surface2, stroke: p.line, lw: 1 });
      });
    }
    if (onPoly) {
      const ap = idOf('apple'), n10 = nearest(ap, 10), ra = S.reveal('polysemy', 0.5, 0.8);
      const rows = n10.map((n) => ({ label: word(S, n.i).replace(' (apple)', ''), value: n.s, tag: TECH.has(KEY[n.i]) ? S.l('empresa', 'company') : FRUIT.has(KEY[n.i]) ? S.l('fruta', 'fruit') : '', tone: (FRUIT.has(KEY[n.i]) ? 'dat' : 'lat') as 'lat' | 'dat' }));
      sideList(S, { x: R.x, y: R.y, w: R.w, h: R.h - 22 * u }, S.l('vecinos de «manzana»', 'neighbors of “apple”'), rows, ra);
      d.withAlpha(ra, () => d.text(S.l('etiquetas empresa/fruta: mías', 'company/fruit labels: mine'), R.x, R.y + R.h - 4 * u, { size: fs(S, 11), weight: 600, color: p.mute, base: 'bottom' }));
    }
    // nota de idioma de los datos
    if (S.on('map') && !onTry) d.withAlpha(S.reveal('map', 6.2, 0.8) * (onNb || onPoly ? 0 : 1), () => d.text(S.l('Vectores entrenados con texto en inglés; en español se muestra la traducción de cada palabra.', 'Vectors trained on English text.'), R.x, R.y + R.h - 2 * u, { size: fs(S, 11), weight: 600, color: p.mute, base: 'bottom', w: R.w }));
  });
}
void V;
