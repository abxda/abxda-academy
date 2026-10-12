// Vista 5 · ¿verdadero o inventado? (game-intro … game-after).
// Seis afirmaciones ESCRITAS PARA LA LECCIÓN al estilo de un asistente (no son salidas de un modelo; se rotulan así).
// Las dos primeras las resuelve la escena sola (demostración); las otras cuatro, si quiere, la persona, con dos botones.
// Cómo se comprobó cada una: Mata v. Avianca (2023), Archivo Nacional de EE. UU. (Brown, 347 U.S. 483), nobelprize.org,
// Quote Investigator (2017), doi.org (Nature 521, 436–444). «Hartwell y Soto» la inventamos aquí: no existe.
import { alpha, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { FS, LH, area, card, chip, fitText, fr, lines, mark, para, paraH, smooth, stamp, tight } from './ui';

interface Claim { es: string; en: string; truth: boolean; checkEs: string; checkEn: string; src: string; short: string; brief: [string, string] }
export const CLAIMS: Claim[] = [
  {
    es: 'Según Varghese contra China Southern Airlines, 925 F.3d 1339 (11.º Circuito, 2019), la quiebra de una aerolínea suspende el plazo para demandarla.',
    en: 'Under Varghese v. China Southern Airlines, 925 F.3d 1339 (11th Cir. 2019), an airline’s bankruptcy pauses the deadline to sue it.',
    truth: false, checkEs: 'No aparece en ningún registro judicial: es uno de los seis casos inventados de Nueva York.', checkEn: 'It appears in no court record: it is one of the six invented New York cases.',
    src: 'Mata v. Avianca (2023)', short: 'Varghese (2019)', brief: ['no aparece en ningún registro judicial', 'appears in no court record'],
  },
  {
    es: 'Brown contra la Junta de Educación, 347 U.S. 483 (Corte Suprema de EE. UU., 1954), declaró inconstitucional la segregación racial en las escuelas públicas.',
    en: 'Brown v. Board of Education, 347 U.S. 483 (U.S. Supreme Court, 1954), held racial segregation in public schools unconstitutional.',
    truth: true, checkEs: 'Está en los registros oficiales de la Corte Suprema de Estados Unidos.', checkEn: 'It is in the official records of the U.S. Supreme Court.',
    src: 'National Archives', short: 'Brown (1954)', brief: ['registros de la Corte Suprema', 'Supreme Court records'],
  },
  {
    es: 'Marie Curie recibió dos premios Nobel: el de Física en 1903 y el de Química en 1911.',
    en: 'Marie Curie won two Nobel Prizes: Physics in 1903 and Chemistry in 1911.',
    truth: true, checkEs: 'Los dos aparecen en el registro oficial de los premios Nobel.', checkEn: 'Both appear in the official record of the Nobel Prizes.',
    src: 'nobelprize.org', short: 'Curie', brief: ['registro oficial de los Nobel', 'official Nobel record'],
  },
  {
    es: 'Albert Einstein escribió: «La locura es hacer lo mismo una y otra vez esperando resultados distintos».',
    en: 'Albert Einstein wrote: “Insanity is doing the same thing over and over and expecting different results.”',
    truth: false, checkEs: 'No hay pruebas de que Einstein lo dijera; la frase aparece por primera vez en 1981.', checkEn: 'There is no evidence Einstein said it; the phrase first appears in 1981.',
    src: 'Quote Investigator', short: 'Einstein', brief: ['sin pruebas; aparece en 1981', 'no evidence; first seen in 1981'],
  },
  {
    es: 'Según la ley de Hartwell y Soto (1974), el error de una red neuronal baja con la raíz cuarta del número de ejemplos.',
    en: 'According to the Hartwell–Soto law (1974), a neural network’s error shrinks with the fourth root of the number of examples.',
    truth: false, checkEs: 'Ni la ley ni sus autores existen: la inventamos para esta lección.', checkEn: 'Neither the law nor its authors exist: we made it up for this lesson.',
    src: '—', short: 'Hartwell–Soto', brief: ['la inventamos para esta lección', 'we made it up for this lesson'],
  },
  {
    es: 'El artículo «Deep learning», de LeCun, Bengio y Hinton, se publicó en Nature en 2015 (doi: 10.1038/nature14539).',
    en: 'The paper “Deep learning” by LeCun, Bengio, and Hinton appeared in Nature in 2015 (doi: 10.1038/nature14539).',
    truth: true, checkEs: 'El DOI lleva al artículo en Nature.', checkEn: 'The DOI leads to the paper in Nature.',
    src: 'doi.org', short: 'LeCun (2015)', brief: ['el DOI lleva a Nature', 'the DOI leads to Nature'],
  },
];

export const BUTTONS = ['g-true', 'g-false'];
interface Ans { says: boolean; t0: number }
interface Game { ans: (Ans | null)[] }
export const gameOf = (S: Frame): Game => (S.st.game ??= { ans: CLAIMS.map(() => null) });

/** Afirmación que se muestra en la tarjeta (la escena manda en la demostración; después, la primera sin responder). */
function current(S: Frame, g: Game) {
  if (!S.on('try-game')) return S.on('game-check') ? 1 : 0;
  for (let i = 2; i < CLAIMS.length; i++) if (!g.ans[i]) return i;
  return -1;
}
/** Botón «Verdadera» / «Inventada»: responde la afirmación que está en la tarjeta. */
export function answer(S: Frame, id: string) {
  if (S.on('game-after')) return;
  const g = gameOf(S), i = current(S, g);
  if (i < 0 || g.ans[i]) return;
  g.ans[i] = { says: id === 'g-true', t0: S.clock };
}
export const turnDone = (S: Frame) => { const g = gameOf(S); return [2, 3, 4, 5].every((i) => !!g.ans[i]); };

/** 0..1: cuánto se ha revelado la comprobación de la afirmación i. */
function revealed(S: Frame, g: Game, i: number) {
  const a = g.ans[i];
  const byPerson = a ? Math.min(1, (S.clock - a.t0) / 0.5) : 0;
  const byTime = i === 0 ? fr(S, 'game-look', 0.55, 0.68) : i === 1 ? fr(S, 'game-check', 0.55, 0.68) : fr(S, 'game-after', 0.1 + (i - 2) * 0.1, 0.18 + (i - 2) * 0.1);
  return Math.max(byPerson, byTime);
}

export function drawGame(S: Frame) {
  const A = area(S), g = gameOf(S);
  const toAfter = smooth(fr(S, 'game-after', 0, 0.08));
  if (toAfter < 0.99) S.d.withAlpha(1 - toAfter, () => drawPlay(S, A, g));
  if (toAfter > 0.01) S.d.withAlpha(toAfter, () => drawList(S, A, g));
}

const label = (S: Frame, t: boolean) => (t ? S.l('VERDADERA', 'TRUE') : S.l('INVENTADA', 'INVENTED'));

function drawPlay(S: Frame, A: Rect, g: Game) {
  const { d, pal: p } = S, u = S.u, vert = S.portrait, small = tight(S);
  const cur = current(S, g);
  // reparto: tarjeta + comprobación (lado a lado en horizontal; una sobre otra en vertical) + fila de progreso abajo
  const progH = (small ? 26 : 34) * u;
  const body: Rect = { x: A.x, y: A.y, w: A.w, h: A.h - progH - 10 * u };
  const gap = 14 * u;
  const cardR: Rect = vert ? { x: body.x, y: body.y, w: body.w, h: body.h * 0.52 } : { x: body.x, y: body.y, w: body.w * 0.58, h: body.h };
  const chkR: Rect = vert ? { x: body.x, y: cardR.y + cardR.h + gap, w: body.w, h: body.h - cardR.h - gap } : { x: cardR.x + cardR.w + gap, y: body.y, w: body.w - cardR.w - gap, h: body.h };
  const intro = fr(S, 'game-intro', 0.25, 0.4);
  // ── la tarjeta ──
  d.withAlpha(intro, () => {
    card(S, cardR, { tone: 'lat', fill: alpha(tone(S, 'lat').c, 0.05) });
    const pad = 14 * u;
    if (cur < 0) {
      const right = [2, 3, 4, 5].filter((i) => g.ans[i] && g.ans[i]!.says === CLAIMS[i].truth).length;
      fitText(S, S.l('¡Listo!', 'Done!'), cardR.x + pad, cardR.y + pad + 10 * u, cardR.w - 2 * pad, 16, { weight: 800 });
      para(S, S.l(`Acertaste ${right} de 4. Todas sonaban igual de seguras.`, `You got ${right} of 4. They all sounded equally sure.`), cardR.x + pad, cardR.y + pad + 30 * u, cardR.w - 2 * pad, FS(S, 16), { weight: 600 });
      return;
    }
    const c = CLAIMS[cur];
    fitText(S, S.l(`Afirmación ${cur + 1} de ${CLAIMS.length}`, `Statement ${cur + 1} of ${CLAIMS.length}`), cardR.x + pad, cardR.y + pad + 6 * u, cardR.w - 2 * pad, 12.5, { weight: 800, color: tone(S, 'lat').ink });
    // tamaño que hace caber la afirmación más larga (no salta de una a otra)
    const tw = cardR.w - 2 * pad, room = cardR.h - pad * 2 - 24 * u - LH(S, FS(S, 12), 2.6);
    let sz = FS(S, small ? 15 : S.portrait ? 18 : 26);
    const longest = CLAIMS.reduce((m, k) => (k[S.lang].length > m[S.lang].length ? k : m), CLAIMS[0])[S.lang];
    while (sz > FS(S, 12) && paraH(S, longest, tw, sz) > room) sz -= 0.5;
    const prev = cur >= 3 ? g.ans[cur - 1] : null;
    const swap = cur === 1 ? fr(S, 'game-check', 0, 0.12) : prev ? Math.min(1, Math.max(0, (S.clock - prev.t0) / 0.45)) : 1;
    para(S, c[S.lang], cardR.x + pad, cardR.y + pad + 22 * u, tw, sz, { weight: 600, a: swap, maxLines: Math.max(2, Math.floor(room / LH(S, sz, 1.28))) });
    para(S, S.l('Escrita para esta lección al estilo de un asistente (ilustrativa).', 'Written for this lesson in an assistant’s style (illustrative).'), cardR.x + pad, cardR.y + cardR.h - pad - LH(S, FS(S, 12), 2.3), tw, FS(S, 12), { color: p.mute, italic: true, maxLines: 2 });
    const a = g.ans[cur];
    if (a) chip(S, S.l(`tú: ${a.says ? 'verdadera' : 'inventada'}`, `you: ${a.says ? 'true' : 'invented'}`), cardR.x + cardR.w - pad, cardR.y + pad + 6 * u, 'sig', { align: 'right', size: 12 });
    // en la demostración, los detalles «de autoridad» se subrayan
    if (cur === 0) {
      const k = fr(S, 'game-look', 0.1, 0.4);
      if (k > 0.01) chip(S, S.l('nombre · tomo · página · tribunal · año', 'name · volume · page · court · year'), cardR.x + cardR.w - pad, cardR.y + cardR.h - pad - LH(S, FS(S, 12), 2.3) - 16 * u, 'w', { align: 'right', size: 12, a: k * (1 - fr(S, 'game-look', 0.5, 0.6)), maxW: tw });
    }
  });
  // ── la comprobación (la última revelada) ──
  // en la demostración, la comprobación de la afirmación que está en la tarjeta; en el turno, la de la última respondida
  let shown = -1;
  if (!S.on('try-game')) shown = revealed(S, g, cur) > 0.01 ? cur : -1;
  else for (let i = 0; i < CLAIMS.length; i++) if (revealed(S, g, i) > 0.01 && (i < 2 || g.ans[i])) shown = i;
  d.withAlpha(intro, () => {
    card(S, chkR, { dash: shown < 0, fill: alpha(p.ink, 0.02) });
    const pad = 12 * u;
    fitText(S, shown < 0 ? S.l('Comprobación en una fuente', 'Checked against a source') : S.l(`Comprobación de la afirmación ${shown + 1}`, `Check of statement ${shown + 1}`), chkR.x + pad, chkR.y + pad + 6 * u, chkR.w - 2 * pad - 20 * u, 12.5, { weight: 800, color: p.mute });
    if (shown < 0) { para(S, S.l('Aparece al buscarla en una fuente.', 'Appears once you look it up.'), chkR.x + pad, chkR.y + pad + 22 * u, chkR.w - 2 * pad, FS(S, 13), { color: p.mute, italic: true, maxLines: 3 }); return; }
    const c = CLAIMS[shown], k = revealed(S, g, shown), t = c.truth ? 'dat' : 'err';
    const sy = chkR.y + pad + (vert ? 34 : 44) * u;
    stamp(S, label(S, c.truth), chkR.x + chkR.w / 2, sy, t, { pop: k, size: 17, maxW: chkR.w - 2 * pad });
    const ty = sy + (vert ? 26 : 34) * u;
    const h = para(S, S.lang === 'es' ? c.checkEs : c.checkEn, chkR.x + pad, ty, chkR.w - 2 * pad, FS(S, 13.5), { weight: 600, a: k, maxLines: Math.max(2, Math.floor((chkR.y + chkR.h - ty - LH(S, FS(S, 12), 1.6)) / LH(S, FS(S, 13.5), 1.28))) });
    const srcTxt = c.src === '—' ? S.l('Fuente: inventada para esta lección', 'Source: invented for this lesson') : `${S.l('Fuente', 'Source')}: ${c.src}`;
    if (ty + h + LH(S, FS(S, 12), 1.5) < chkR.y + chkR.h) fitText(S, srcTxt, chkR.x + pad, ty + h + LH(S, FS(S, 12), 0.9), chkR.w - 2 * pad, 12, { weight: 600, color: p.mute, italic: true, a: k });
    const a = g.ans[shown];
    if (a) { mark(S, chkR.x + chkR.w - pad - 8 * u, chkR.y + pad + 6 * u, a.says === c.truth, 6, k); }
  });
  // ── fila de progreso: seis casillas ──
  const y = A.y + A.h - progH / 2, n = CLAIMS.length, cs = Math.min(progH - 6 * u, 26 * u), gapc = 8 * u;
  d.withAlpha(intro, () => {
    const lw = Math.min(A.w - n * (cs + gapc), d.measure(S.l('Afirmaciones:', 'Statements:'), { size: FS(S, 12), weight: 700 }) + 10 * u);
    fitText(S, S.l('Afirmaciones:', 'Statements:'), A.x, y, lw, 12, { weight: 700, color: p.mute });
    for (let i = 0; i < n; i++) {
      const x = A.x + lw + i * (cs + gapc), k = revealed(S, g, i) * (i < 2 || g.ans[i] ? 1 : 0), c = CLAIMS[i], isCur = i === cur;
      d.rect(x, y - cs / 2, cs, cs, { fill: k > 0.5 ? tone(S, c.truth ? 'dat' : 'err').soft : undefined, stroke: isCur ? p.ink : k > 0.5 ? tone(S, c.truth ? 'dat' : 'err').c : p.lineStrong, lw: isCur ? 2.2 : 1.3, r: 3 });
      if (k > 0.5) mark(S, x + cs / 2, y, c.truth, cs / u * 0.22);
      else d.text(String(i + 1), x + cs / 2, y, { size: FS(S, 12), weight: 700, font: 'mono', color: isCur ? p.ink : p.mute, align: 'center', base: 'middle' });
    }
  });
}

/** game-after: las seis, resueltas, con cómo se comprobó cada una y tu marca si respondiste. */
function drawList(S: Frame, A: Rect, g: Game) {
  const { d, pal: p } = S, u = S.u, n = CLAIMS.length;
  const hy = fr(S, 'game-after', 0.02, 0.1);
  const hh = para(S, S.l('Las seis, comprobadas', 'All six, checked'), A.x, A.y, A.w, FS(S, 15), { weight: 800, a: hy });
  const top = A.y + hh + 8 * u, rh = Math.min((A.y + A.h - top) / n, 54 * u);
  const two = rh > LH(S, FS(S, 12), 2.6) && !tight(S);
  const tagW = Math.min(118 * u, A.w * 0.3);
  CLAIMS.forEach((c, i) => {
    const a = revealed(S, g, i), y = top + i * rh;
    const ans = g.ans[i];
    d.withAlpha(Math.max(a, 0.25), () => {
      d.line(A.x, y + rh - 1, A.x + A.w, y + rh - 1, p.line, 1);
      const t = c.truth ? 'dat' : 'err';
      chip(S, label(S, c.truth), A.x, y + (two ? rh * 0.32 : rh / 2), t, { align: 'left', size: 12, a, maxW: tagW });
      const tx = A.x + tagW + 10 * u, tw = A.x + A.w - tx - (ans ? 64 * u : 0);
      fitText(S, c.short, tx, y + (two ? rh * 0.32 : rh / 2), tw, 14, { weight: 800 });
      if (two) { const full = S.lang === 'es' ? c.checkEs : c.checkEn, txt = S.d.measure(full, { size: FS(S, 12), weight: 600 }) > A.w ? S.l(c.brief[0], c.brief[1]) : full; fitText(S, txt, A.x, y + rh * 0.72, A.w, 12, { weight: 600, color: p.ink2, a }); }
      else fitText(S, S.l(c.brief[0], c.brief[1]), tx + S.d.measure(c.short + '  ', { size: FS(S, 14), weight: 800 }), y + rh / 2, Math.max(10, tw - S.d.measure(c.short + '  ', { size: FS(S, 14), weight: 800 })), 12, { weight: 600, color: p.ink2, a });
      if (ans) {
        const ok = ans.says === c.truth;
        fitText(S, S.l('tú', 'you'), A.x + A.w - 26 * u, y + (two ? rh * 0.32 : rh / 2), 30 * u, 12, { weight: 700, color: p.mute, align: 'right' });
        mark(S, A.x + A.w - 10 * u, y + (two ? rh * 0.32 : rh / 2), ok, 6);
      }
    });
  });
  void lines;
}
