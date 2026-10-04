// Mini-rastreo de la lección «Preentrenamiento»: doce «páginas web» escritas para esta lección (texto propio, libre de derechos;
// los correos y la IP usan dominios y rangos reservados para documentación: nada es real) y una tubería de limpieza REAL a
// pequeña escala. Lo ilustrativo es el CONTENIDO de las páginas; las funciones de abajo hacen el trabajo de verdad:
//   1 · idioma: voto por palabras muy frecuentes (es, en, fr, de); se conservan es y en (supuesto de la lección).
//   2 · calidad: las tres reglas de FineWeb con sus umbrales (Penedo et al., 2024, §3.6) y dos de C4 (Raffel et al., 2020, §2.2).
//   3 · datos personales: correos y direcciones IPv4 se enmascaran (como en la versión pública de FineWeb).
//   4 · duplicados: similitud de Jaccard entre conjuntos de «tejas» de 5 palabras (FineWeb usa 5-gramas con MinHash;
//       aquí se calcula el Jaccard exacto, que es lo que MinHash estima). Una página se descarta si se parece a una anterior
//       en al menos el umbral.

export type Lang = 'es' | 'en' | 'fr';
export interface Page { id: string; lang: Lang; tag: { es: string; en: string }; text: string }

const lines = (...ls: string[]) => ls.join('\n');

// ── Familia 1 (inglés): una noticia, su copia exacta bajo otro titular y una copia editada ─────────────────────────
const NEWS_BODY = lines(
  'The city council approved a plan on Monday to plant two thousand trees along the river path before the end of next year. The project will cost about four hundred thousand dollars, most of it paid by a state grant for green spaces.',
  'Residents will be able to choose some of the species at three public meetings. Council members said the trees should lower summer temperatures near the path and give shade to the people who walk or cycle there every day.',
  'Work is expected to begin in October, once the nursery confirms the delivery of the first thousand young trees.',
);
const NEWS_EDIT = lines(
  'The city council approved a plan on Monday to plant three thousand trees along the river path before the end of next year. The project will cost about six hundred thousand dollars, most of it paid by a state grant for green spaces.',
  'Residents will be able to choose some of the species at two public meetings. Council members said the trees should lower summer temperatures near the path and give shade to the many people who walk or cycle there each day.',
  'Work is expected to begin in November, once the nursery confirms the delivery of the first young trees.',
);

// ── Familia 2 (español): una receta, su copia con otro pie de página y una versión reescrita con otras palabras ───────
const RECIPE_BODY = lines(
  'Para preparar pan de maíz, mezcla en un tazón dos tazas de harina de maíz, una taza de harina de trigo, una cucharada de polvo para hornear y una pizca de sal. Agrega dos huevos, una taza de leche y un poco de mantequilla derretida, y revuelve hasta que no queden grumos.',
  'Vierte la masa en un molde engrasado y hornea durante veinticinco minutos a doscientos grados, o hasta que un palillo salga limpio. Déjalo reposar diez minutos antes de cortarlo, porque así conserva mejor su forma.',
);
const RECIPE_PARAPHRASE = lines(
  'Este pan de maíz es fácil: combina harina de maíz y de trigo con polvo de hornear y sal, suma huevos, leche y mantequilla líquida, y bate la mezcla hasta que quede uniforme.',
  'Pásala a un recipiente con grasa y hornea durante veinticinco minutos a doscientos grados, o hasta que un palillo salga limpio. Déjalo reposar diez minutos antes de cortarlo, porque así conserva mejor su forma. Es una receta de familia.',
);

export const PAGES: Page[] = [
  { id: 'news', lang: 'en', tag: { es: 'Noticia', en: 'News' }, text: lines('City council approves plan to plant trees', NEWS_BODY) },
  { id: 'news-copy', lang: 'en', tag: { es: 'Copia exacta', en: 'Exact copy' }, text: lines('Two thousand new trees for the river path', NEWS_BODY, 'Posted by Metro Daily.') },
  { id: 'news-edit', lang: 'en', tag: { es: 'Copia editada', en: 'Edited copy' }, text: lines('City council approves plan to plant trees', NEWS_EDIT) },
  { id: 'recipe', lang: 'es', tag: { es: 'Receta', en: 'Recipe' }, text: lines('Pan de maíz casero', RECIPE_BODY) },
  { id: 'recipe-copy', lang: 'es', tag: { es: 'Copia, otro pie', en: 'Copy, new footer' }, text: lines('Pan de maíz casero', RECIPE_BODY, 'Recetas de la abuela. Todos los derechos reservados.') },
  { id: 'recipe-para', lang: 'es', tag: { es: 'Reescrita', en: 'Rewritten' }, text: lines('Un pan de maíz fácil', RECIPE_PARAPHRASE) },
  {
    id: 'garden', lang: 'en', tag: { es: 'Artículo', en: 'Article' },
    text: lines(
      'Five tips for a small vegetable garden',
      'Choose a spot that gets at least six hours of sun, because tomatoes, peppers, and beans all need plenty of light to produce fruit. If your space is small, a few large pots work as well as a bed.',
      'Water early in the morning so the leaves dry during the day, and add a layer of straw or dry leaves around the plants to keep the soil moist. Start with only three or four crops, and add more once you learn what grows well where you live.',
    ),
  },
  {
    id: 'contact', lang: 'es', tag: { es: 'Contacto', en: 'Contact' },
    text: lines(
      'Taller de bicicletas El Rayo',
      'Arreglamos frenos, cadenas y llantas de lunes a sábado, y siempre te decimos el precio antes de empezar el trabajo.',
      'Escríbenos a contacto@elrayo-taller.example o a ana.lopez@elrayo-taller.example, y revisa el estado de tu reparación en http://192.0.2.17/estado.',
    ),
  },
  {
    id: 'french', lang: 'fr', tag: { es: 'En francés', en: 'In French' },
    text: lines(
      'Le marché du dimanche',
      'Chaque dimanche matin, les habitants du quartier se retrouvent sur la place pour acheter des fruits, du fromage et du pain frais. Les vendeurs connaissent presque tous leurs clients par leur prénom, et personne ne semble pressé.',
      'Vers midi, les enfants jouent près de la fontaine pendant que leurs parents boivent un café au soleil.',
    ),
  },
  {
    id: 'menu', lang: 'en', tag: { es: 'Menú web', en: 'Web menu' },
    text: lines('Home', 'Products', 'Sale!', 'New arrivals', 'Login', 'Cart (0)', 'Search', 'Contact us', 'About', 'Terms of use', 'Privacy policy', '© 2019 All rights reserved'),
  },
  {
    id: 'spam', lang: 'es', tag: { es: 'Spam', en: 'Spam' },
    text: lines(
      'Oferta única, compra ahora y recibe un descuento increíble en todos los productos.',
      'Oferta única, compra ahora y recibe un descuento increíble en todos los productos.',
      'Haz clic aquí',
      'Oferta única, compra ahora y recibe un descuento increíble en todos los productos.',
      'Oferta única, compra ahora y recibe un descuento increíble en todos los productos.',
      'Haz clic aquí',
    ),
  },
  {
    id: 'lorem', lang: 'en', tag: { es: 'Texto de relleno', en: 'Filler text' },
    text: lines(
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.',
    ),
  },
];

// ── 1 · idioma ────────────────────────────────────────────────────────────────────────────────────────────────────
const STOP: Record<Lang, string[]> = {
  en: 'the of and to in is that for it on with as are was be at by this from or an will their who'.split(' '),
  es: 'el la de que y en los las un una por con para es se del al su como más lo sus pero porque cuando'.split(' '),
  fr: 'le la les de des et en un une du que pour dans est qui au sur pas avec plus par ce ses sont'.split(' '),
};
export const wordsOf = (t: string): string[] => t.toLowerCase().replace(/https?:\/\/\S+/g, ' ').match(/[a-záéíóúüñàâçèêëîïôùûœ']+/g) ?? [];
export function detectLang(text: string): { lang: Lang; share: Record<Lang, number> } {
  const w = wordsOf(text), share = {} as Record<Lang, number>;
  (Object.keys(STOP) as Lang[]).forEach((l) => { const s = new Set(STOP[l]); share[l] = w.filter((x) => s.has(x)).length / Math.max(1, w.length); });
  const lang = (Object.keys(share) as Lang[]).reduce((a, b) => (share[b] > share[a] ? b : a));
  return { lang, share };
}
export const KEEP_LANGS: Lang[] = ['es', 'en'];

// ── 2 · calidad ───────────────────────────────────────────────────────────────────────────────────────────────────
export type QualityRule = 'punct' | 'short' | 'dup' | 'lorem' | 'brace';
export interface Quality { ok: boolean; rule?: QualityRule; stats: { punct: number; short: number; dup: number } }
export function checkQuality(text: string): Quality {
  const ls = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const n = Math.max(1, ls.length);
  const punct = ls.filter((l) => /[.!?»”"]$/.test(l)).length / n;                                       // FineWeb: ≤ 0,12 → se descarta
  const short = ls.filter((l) => l.length < 30).length / n;                                              // FineWeb: ≥ 0,67 → se descarta
  const counts = new Map<string, number>(); ls.forEach((l) => counts.set(l, (counts.get(l) ?? 0) + 1));
  const total = ls.reduce((a, l) => a + l.length, 0);
  const dupChars = ls.filter((l) => (counts.get(l) ?? 0) > 1).reduce((a, l) => a + l.length, 0) / Math.max(1, total); // FineWeb: ≥ 0,1 → se descarta
  const stats = { punct, short, dup: dupChars };
  if (/lorem ipsum/i.test(text)) return { ok: false, rule: 'lorem', stats };                           // C4: páginas con «lorem ipsum»
  if (text.includes('{')) return { ok: false, rule: 'brace', stats };                                   // C4: llaves = código
  if (punct <= 0.12) return { ok: false, rule: 'punct', stats };
  if (dupChars >= 0.1) return { ok: false, rule: 'dup', stats };
  if (short >= 0.67) return { ok: false, rule: 'short', stats };
  return { ok: true, stats };
}

// ── 3 · datos personales ──────────────────────────────────────────────────────────────────────────────────────────
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const IPV4 = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
export interface Masked { text: string; n: number }
export function maskPII(text: string, tag = { email: '[correo]', ip: '[ip]' }): Masked {
  let n = 0;
  const out = text.replace(EMAIL, () => { n++; return tag.email; }).replace(IPV4, () => { n++; return tag.ip; });
  return { text: out, n };
}

// ── 4 · duplicados ────────────────────────────────────────────────────────────────────────────────────────────────
export function shingles(text: string, k = 5): Set<string> {
  const w = wordsOf(text), s = new Set<string>();
  for (let i = 0; i + k <= w.length; i++) s.add(w.slice(i, i + k).join(' '));
  return s;
}
export function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0; a.forEach((x) => { if (b.has(x)) inter++; });
  const uni = a.size + b.size - inter;
  return uni ? inter / uni : 0;
}

export interface Row { page: Page; lang: Lang; langOk: boolean; quality: Quality; pii: number; text: string; sim: number; simWith: number; dup: boolean }
/** Corre la tubería completa con un umbral de similitud para los duplicados. Siempre devuelve una fila por página. */
export function runPipeline(threshold: number): Row[] {
  const rows: Row[] = PAGES.map((page) => {
    const l = detectLang(page.text);
    return { page, lang: l.lang, langOk: KEEP_LANGS.includes(l.lang), quality: checkQuality(page.text), pii: 0, text: page.text, sim: 0, simWith: -1, dup: false };
  });
  const alive = (r: Row) => r.langOk && r.quality.ok;
  rows.forEach((r) => { if (alive(r)) { const m = maskPII(r.text); r.text = m.text; r.pii = m.n; } });
  const sh = rows.map((r) => (alive(r) ? shingles(r.page.text) : new Set<string>()));
  rows.forEach((r, i) => {
    if (!alive(r)) return;
    for (let j = 0; j < i; j++) {
      if (!alive(rows[j])) continue;
      const s = jaccard(sh[i], sh[j]);
      if (s > r.sim) { r.sim = s; r.simWith = j; }
    }
  });
  // el descarte es en cascada: se compara con las páginas anteriores que SE QUEDARON
  const kept: number[] = [];
  rows.forEach((r, i) => {
    if (!alive(r)) return;
    let dup = false;
    for (const j of kept) if (jaccard(sh[i], sh[j]) >= threshold) { dup = true; break; }
    r.dup = dup;
    if (!dup) kept.push(i);
  });
  return rows;
}

/** Palabras de una página (para contar cuánto texto queda en cada etapa). */
export const wordCount = (t: string) => wordsOf(t).length;
/** Etapas: cuántas páginas y palabras quedan tras cada filtro. */
export function stageCounts(rows: Row[]) {
  const out = [{ pages: rows.length, words: rows.reduce((a, r) => a + wordCount(r.page.text), 0) }];
  let cur = rows.filter((r) => r.langOk); out.push({ pages: cur.length, words: cur.reduce((a, r) => a + wordCount(r.page.text), 0) });
  cur = cur.filter((r) => r.quality.ok); out.push({ pages: cur.length, words: cur.reduce((a, r) => a + wordCount(r.page.text), 0) });
  out.push({ pages: cur.length, words: cur.reduce((a, r) => a + wordCount(r.text), 0) });
  cur = cur.filter((r) => !r.dup); out.push({ pages: cur.length, words: cur.reduce((a, r) => a + wordCount(r.text), 0) });
  return out;
}

/** Umbral de partida de la escena y rango en el que el resultado es el «correcto» (copias fuera, textos distintos dentro). */
export const T0 = 1;
export const isGoodThreshold = (rows: Row[]) => {
  const dropped = new Set(rows.filter((r) => r.dup).map((r) => r.page.id));
  return dropped.size === 3 && dropped.has('news-copy') && dropped.has('news-edit') && dropped.has('recipe-copy');
};
