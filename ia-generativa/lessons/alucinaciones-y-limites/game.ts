// Juego «¿verdadero o inventado?»: seis afirmaciones escritas para la lección, al estilo de un asistente. Unas son verdaderas y otras no.
// Son ILUSTRATIVAS (no son salidas de un modelo): se rotulan así en el lienzo. Cada una lleva cómo se comprobaba y su fuente.
import { alpha, tone, type Frame, type Rect } from '../../../../../theme/kit';
import { FS, card, fitText, mark, para, stat, tagText } from './ui';

export interface Claim { es: string; en: string; truth: boolean; tellEs: string; tellEn: string; srcEs: string; srcEn: string; short: { es: string; en: string } }

export const CLAIMS: Claim[] = [
  {
    es: 'Marie Curie recibió dos premios Nobel: el de Física en 1903 y el de Química en 1911.',
    en: 'Marie Curie won two Nobel Prizes: Physics in 1903 and Chemistry in 1911.',
    truth: true,
    tellEs: 'Verdadera. Los dos premios figuran en nobelprize.org.', tellEn: 'True. Both prizes are listed at nobelprize.org.',
    srcEs: 'nobelprize.org', srcEn: 'nobelprize.org', short: { es: 'Curie', en: 'Curie' },
  },
  {
    es: 'Varghese v. China Southern Airlines, 925 F.3d 1339 (11th Cir. 2019): la quiebra de una aerolínea suspende el plazo de prescripción del Convenio de Montreal.',
    en: 'Varghese v. China Southern Airlines, 925 F.3d 1339 (11th Cir. 2019): an airline’s bankruptcy tolls the statute of limitations under the Montreal Convention.',
    truth: false,
    tellEs: 'Inventada: es uno de los seis casos de Nueva York. El tribunal federal confirmó que no existe.', tellEn: 'Invented: it is one of the six New York cases. The federal court confirmed it does not exist.',
    srcEs: 'Mata v. Avianca, 2023', srcEn: 'Mata v. Avianca, 2023', short: { es: 'Varghese', en: 'Varghese' },
  },
  {
    es: '«La locura es hacer lo mismo una y otra vez esperando resultados distintos», escribió Albert Einstein.',
    en: '“Insanity is doing the same thing over and over and expecting different results,” wrote Albert Einstein.',
    truth: false,
    tellEs: 'Falsa atribución: no hay evidencia de que Einstein lo dijera; las primeras apariciones conocidas son de 1981.', tellEn: 'False attribution: there is no evidence Einstein said it; the earliest known appearances are from 1981.',
    srcEs: 'Quote Investigator', srcEn: 'Quote Investigator', short: { es: 'Einstein', en: 'Einstein' },
  },
  {
    es: 'Brown contra la Junta de Educación de Topeka, 347 U.S. 483 (1954), declaró inconstitucional la segregación racial en las escuelas públicas.',
    en: 'Brown v. Board of Education of Topeka, 347 U.S. 483 (1954), held racial segregation in public schools unconstitutional.',
    truth: true,
    tellEs: 'Verdadera. La sentencia se localiza por su cita en cualquier base jurídica.', tellEn: 'True. The ruling can be found by its citation in any legal database.',
    srcEs: 'Corte Suprema de EE. UU.', srcEn: 'U.S. Supreme Court', short: { es: 'Brown', en: 'Brown' },
  },
  {
    es: 'La ley de Hartwell–Soto (1974) establece que el error de una red neuronal disminuye con la raíz cuarta del número de ejemplos.',
    en: 'The Hartwell–Soto law (1974) states that a neural network’s error shrinks with the fourth root of the number of examples.',
    truth: false,
    tellEs: 'Inventada por nosotros para esta lección: ni la ley ni los nombres existen. Un modelo puede fabricar leyes con apellidos.', tellEn: 'Invented by us for this lesson: neither the law nor the names exist. A model can fabricate laws with surnames.',
    srcEs: 'inventada aquí', srcEn: 'invented here', short: { es: 'Hartwell–Soto', en: 'Hartwell–Soto' },
  },
  {
    es: 'El artículo «Deep learning», de LeCun, Bengio y Hinton, se publicó en Nature en 2015 (doi 10.1038/nature14539).',
    en: 'The paper “Deep learning” by LeCun, Bengio, and Hinton appeared in Nature in 2015 (doi 10.1038/nature14539).',
    truth: true,
    tellEs: 'Verdadera. Un DOI se comprueba en doi.org en segundos.', tellEn: 'True. A DOI can be checked at doi.org in seconds.',
    srcEs: 'doi.org', srcEn: 'doi.org', short: { es: 'Deep learning', en: 'Deep learning' },
  },
];

/** Respuesta de la persona: dice si cree que es verdadera y qué tan segura está. */
export interface Answer { saysTrue: boolean; sure: boolean; right: boolean }
export interface GameState { answers: Answer[]; done: boolean }
export const newGame = (): GameState => ({ answers: [], done: false });
export const gameOf = (S: Frame): GameState => (S.st.game ??= newGame());

/** Registra una respuesta (botón). Devuelve true si con ella se completa el juego. */
export function answer(S: Frame, id: string): boolean {
  const g = gameOf(S);
  if (g.done || g.answers.length >= CLAIMS.length) return false;
  const saysTrue = id === 'v-sure' || id === 'v-maybe', sure = id === 'v-sure' || id === 'f-sure';
  const claim = CLAIMS[g.answers.length];
  g.answers.push({ saysTrue, sure, right: saysTrue === claim.truth });
  if (g.answers.length === CLAIMS.length) { g.done = true; return true; }
  return false;
}

/** Resumen: aciertos y desempeño según la seguridad declarada. */
export function summary(g: GameState) {
  const right = g.answers.filter((a) => a.right).length;
  const sure = g.answers.filter((a) => a.sure), sureRight = sure.filter((a) => a.right).length;
  const unsure = g.answers.filter((a) => !a.sure), unsureRight = unsure.filter((a) => a.right).length;
  return { right, n: g.answers.length, sure: sure.length, sureRight, unsure: unsure.length, unsureRight };
}

/** Dibuja el juego dentro de `r`. `a` es la opacidad del acto. */
export function drawGame(S: Frame, r: Rect, aside: Rect, a: number) {
  const { d, pal: p } = S, u = S.u, g = gameOf(S), n = CLAIMS.length, k = g.answers.length;
  d.withAlpha(a, () => {
    // ── tarjeta con la afirmación actual ──
    const showIdx = Math.min(k, n - 1), claim = CLAIMS[showIdx];
    const c = tone(S, 'lat');
    const cardR: Rect = { x: r.x, y: r.y, w: r.w, h: Math.min(r.h, S.portrait ? r.h * 0.62 : r.h) };
    if (!g.done) {
      card(S, cardR, 'lat', { fill: 0.05 });
      d.text(S.l('Respuesta de un asistente', 'An assistant’s answer'), cardR.x + 12 * u, cardR.y + 10 * u, { size: FS(S, 12), weight: 700, color: c.ink, base: 'top' });
      d.text(`${k + 1} / ${n}`, cardR.x + cardR.w - 12 * u, cardR.y + 10 * u, { size: FS(S, 12), weight: 700, font: 'mono', color: p.mute, align: 'right', base: 'top' });
      const size = cardR.w > 420 ? 19 : 16;
      para(S, claim[S.lang], cardR.x + 14 * u, cardR.y + 36 * u, cardR.w - 28 * u, { size, weight: 600, lh: 1.32 });
      d.text(S.l('Afirmación escrita para esta lección (ilustrativa): unas son verdaderas, otras inventadas.', 'Statement written for this lesson (illustrative): some are true, some are invented.'), cardR.x + 14 * u, cardR.y + cardR.h - 10 * u, { size: FS(S, 11.5), weight: 600, color: p.mute, base: 'bottom', w: cardR.w - 28 * u });
    } else {
      drawSummary(S, cardR, g);
    }
  });
  // ── lateral: seis marcas y la comprobación de la última ──
  d.withAlpha(a, () => drawAside(S, aside, g));
}

function drawAside(S: Frame, r: Rect, g: GameState) {
  const { d, pal: p } = S, u = S.u, n = CLAIMS.length, k = g.answers.length;
  // seis casillas: ✓ acierto, ✗ error, vacío = pendiente; borde grueso = seguro
  const cs = Math.min(34 * u, (r.w - 6 * u * (n - 1)) / n), gap = 6 * u;
  const rowW = n * cs + (n - 1) * gap, x0 = r.x + Math.max(0, (r.w - rowW) / 2) * 0, y0 = r.y + 2 * u;
  for (let i = 0; i < n; i++) {
    const x = x0 + i * (cs + gap), ans = g.answers[i], cur = i === k && !g.done;
    d.rect(x, y0, cs, cs, { fill: ans ? alpha(tone(S, ans.right ? 'dat' : 'err').c, 0.16) : undefined, stroke: ans ? tone(S, ans.right ? 'dat' : 'err').c : cur ? p.ink : p.lineStrong, lw: ans?.sure ? 3 : cur ? 2 : 1.4, r: 3 });
    if (ans) mark(S, x + cs / 2, y0 + cs / 2, ans.right ? 'ok' : 'no', cs * 0.28);
    else d.text(String(i + 1), x + cs / 2, y0 + cs / 2, { size: FS(S, 12), weight: 700, font: 'mono', color: cur ? p.ink : p.mute, align: 'center', base: 'middle' });
  }
  const ty = y0 + cs + 8 * u;
  d.text(S.l('borde grueso = estabas seguro', 'thick border = you were sure'), r.x, ty, { size: FS(S, 11.5), weight: 600, color: p.mute, base: 'top' });
  // comprobación de la última afirmación respondida
  if (k > 0 && !g.done) {
    const cl = CLAIMS[k - 1], ans = g.answers[k - 1], t = tone(S, cl.truth ? 'dat' : 'err');
    const y = ty + 24 * u, hh = r.y + r.h - y;
    if (hh > 40 * u) {
      d.rect(r.x, y, r.w, hh, { fill: alpha(t.c, 0.08), stroke: t.c, lw: 1.4, r: 3 });
      mark(S, r.x + 18 * u, y + 18 * u, ans.right ? 'ok' : 'no', 8 * u);
      d.text(`${S.l('Afirmación', 'Statement')} ${k}: ${ans.right ? S.l('acertaste', 'you got it') : S.l('fallaste', 'you missed')}`, r.x + 34 * u, y + 18 * u, { size: FS(S, 13), weight: 800, color: t.ink, base: 'middle' });
      para(S, S.lang === 'es' ? cl.tellEs : cl.tellEn, r.x + 10 * u, y + 34 * u, r.w - 20 * u, { size: 13, weight: 600, lh: 1.28 });
    }
  } else if (g.done) {
    const lines2 = CLAIMS.map((c, i) => ({ c, a: g.answers[i] }));
    const rowH = Math.min(24 * u, (r.y + r.h - (ty + 22 * u)) / n);
    lines2.forEach(({ c, a }, i) => {
      const y = ty + 22 * u + i * rowH + rowH / 2;
      if (rowH < 15) return;
      if (a) mark(S, r.x + 8 * u, y, a.right ? 'ok' : 'no', 6 * u, { lw: 2.2 }); else mark(S, r.x + 8 * u, y, 'dash', 6 * u, { lw: 2.2 });
      fitText(S, `${c.short[S.lang]} · ${c.truth ? S.l('verdadera', 'true') : S.l('inventada', 'invented')}`, r.x + 22 * u, y, r.w - 24 * u, 12.5, { weight: 700, color: tone(S, c.truth ? 'dat' : 'err').ink, base: 'middle' });
    });
  }
}

function drawSummary(S: Frame, r: Rect, g: GameState) {
  const { d, pal: p } = S, u = S.u, s = summary(g);
  card(S, r, 'ink', { fill: 0.03 });
  const x = r.x + 16 * u;
  d.text(S.l('Tu resultado', 'Your result'), x, r.y + 12 * u, { size: FS(S, 12), weight: 700, color: p.mute, base: 'top' });
  stat(S, x, r.y + 32 * u, S.l('aciertos', 'right answers'), `${s.right} / ${s.n}`, 'ink', { size: 30 });
  const half = r.w / 2;
  stat(S, x, r.y + 92 * u, S.l('cuando estabas seguro', 'when you were sure'), `${s.sureRight} / ${s.sure}`, 'w', { size: 22, w: half - 24 * u });
  stat(S, r.x + half, r.y + 92 * u, S.l('cuando dudabas', 'when you doubted'), `${s.unsureRight} / ${s.unsure}`, 'sig', { size: 22, w: half - 16 * u });
  const ty = r.y + 150 * u;
  if (ty + 30 * u < r.y + r.h) para(S, S.l('Todas sonaban igual de convincentes: la seguridad que sentías venía del tono, no de una comprobación.', 'All of them sounded equally convincing: the confidence you felt came from the tone, not from a check.'), x, ty, r.w - 32 * u, { size: 13.5, weight: 600, color: p.ink2 });
}
void tagText;
