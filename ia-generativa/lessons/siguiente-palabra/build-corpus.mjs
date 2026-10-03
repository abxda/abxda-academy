// Reconstruye corpus.ts a partir de los textos originales de Project Gutenberg.
//   node build-corpus.mjs            (necesita red; Node >= 18)
//
// Qué se extrae (todo es dominio público; ver corpus.ts para la ficha de cada texto):
//   · es: Miguel de Cervantes, «Don Quijote de la Mancha» (1605), Primera parte, capítulos I–III.
//         Project Gutenberg eBook #2000 (https://www.gutenberg.org/ebooks/2000), última actualización 17-ene-2021.
//   · en: Lewis Carroll, «Alice's Adventures in Wonderland» (1865), capítulos I–III.
//         Project Gutenberg eBook #11 (https://www.gutenberg.org/ebooks/11), última actualización 26-jun-2025.
// Reglas de extracción (deterministas): se corta desde la primera frase del capítulo I hasta el título del capítulo
// siguiente; se quitan los títulos de capítulo y las líneas de asteriscos; los párrafos se unen en una línea y se
// colapsan los espacios; se eliminan los guiones bajos de cursiva (_palabra_). No se corrige ni se moderniza nada.
// Se anota el SHA-256 del texto resultante: si cambias la regla (o Gutenberg corrige su edición), cambiará.
import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const get = async (url) => { const r = await fetch(url); if (!r.ok) throw new Error(url + ' → ' + r.status); return (await r.text()).replace(/\r\n/g, '\n'); };
const paragraphs = (s) => s.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean);

const q = await get('https://www.gutenberg.org/cache/epub/2000/pg2000.txt');
const i = q.indexOf('En un lugar de la Mancha, de cuyo');
const j = q.indexOf('Capítulo IV. ', i);
const es = paragraphs(q.slice(i, j).replace(/^Capítulo [IVX]+\. [^\n]*\n[^\n]*\n/gm, '').replace(/^\s*\*[\s*]*$/gm, ''));

const a = await get('https://www.gutenberg.org/cache/epub/11/pg11.txt');
const ai = a.indexOf('Alice was beginning to get very tired');
const aj = a.indexOf('CHAPTER IV.', ai);
const en = paragraphs(a.slice(ai, aj).replace(/^CHAPTER [IVX]+\.\n[^\n]*\n/gm, '').replace(/^\s*\*[\s*]*$/gm, '').replace(/_/g, ''));

const sha = (ps) => createHash('sha256').update(ps.join('\n\n')).digest('hex');
const entry = (ps, meta) => `  ${meta.lang}: {\n    title: ${JSON.stringify(meta.title)}, author: ${JSON.stringify(meta.author)}, year: ${meta.year}, part: ${JSON.stringify(meta.part)},\n    source: ${JSON.stringify(meta.source)},\n    license: ${JSON.stringify(meta.license)},\n    sha256: '${sha(ps)}',\n    paragraphs: [\n${ps.map((p) => '      ' + JSON.stringify(p) + ',').join('\n')}\n    ],\n  },`;

const out = `// GENERADO por build-corpus.mjs (no editar a mano). Textos de dominio público para el modelo de n-gramas de la lección.
// Cómo se hizo: ver el comentario de build-corpus.mjs (corte por capítulos, sin modernizar ni corregir nada).
export interface CorpusEntry { title: string; author: string; year: number; part: string; source: string; license: string; sha256: string; paragraphs: string[] }
export const CORPUS: Record<'es' | 'en', CorpusEntry> = {
${entry(es, { lang: 'es', title: 'Don Quijote de la Mancha', author: 'Miguel de Cervantes Saavedra', year: 1605, part: 'Primera parte, capítulos I–III', source: 'Project Gutenberg, eBook #2000 (gutenberg.org/ebooks/2000)', license: 'Dominio público (el autor murió en 1616).' })}
${entry(en, { lang: 'en', title: "Alice's Adventures in Wonderland", author: 'Lewis Carroll', year: 1865, part: 'Chapters I–III', source: 'Project Gutenberg, eBook #11 (gutenberg.org/ebooks/11)', license: 'Public domain (the author died in 1898).' })}
};
`;
writeFileSync(new URL('./corpus.ts', import.meta.url), out);
console.log('es', es.join(' ').split(/\s+/).length, 'palabras ·', sha(es));
console.log('en', en.join(' ').split(/\s+/).length, 'words ·', sha(en));
