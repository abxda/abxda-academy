#!/usr/bin/env python3
"""
Paso 2 de 2 de la lección «Alucinaciones y límites»: junta los JSON de `run-qa.py` y `run-demo.py` en `real-data.ts`.

Reproducir (desde esta carpeta; ver los comandos de `run-qa.py` y `run-demo.py`; requiere torch y transformers):
    for m in pythia-160m pythia-410m pythia-1b pythia-1.4b pythia-2.8b pythia-6.9b pythia-12b; do
        python run-qa.py EleutherAI/$m out/$m.json [cuda|cpu]; done
    python run-demo.py EleutherAI/pythia-1.4b out/demo.json [cuda|cpu]
    python build-data.py out            # escribe real-data.ts junto a este archivo

Todo son mediciones reales de modelos Pythia (Biderman et al., 2023; Apache-2.0) con decodificación voraz (determinista).
Cada modelo se mide en el dispositivo que le cabe (GPU en float16 los pequeños; CPU en float32 los más grandes): en la
comprobación hecha con Pythia-1.4B ambos dan las mismas respuestas y probabilidades que difieren en la tercera cifra.
Las preguntas y las respuestas aceptadas están en `questions.py` (escritas para la lección). Aquí se vuelve a calificar
cada respuesta con las respuestas aceptadas ACTUALES de `questions.py` (así una corrección de alias no obliga a repetir la medición).
"""
import json, pathlib, sys, math, importlib.util

out_dir = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'out')
here = pathlib.Path(__file__).parent

SIZES = [('pythia-160m', 0.16e9), ('pythia-410m', 0.41e9), ('pythia-1b', 1.0e9), ('pythia-1.4b', 1.4e9),
         ('pythia-2.8b', 2.8e9), ('pythia-6.9b', 6.9e9), ('pythia-12b', 12e9)]
MAIN = 'pythia-1.4b'

spec = importlib.util.spec_from_file_location('rq', here / 'run-qa.py'); rq = importlib.util.module_from_spec(spec); spec.loader.exec_module(rq)
ALIASES = {q: a for _, q, a in rq.Q} if hasattr(rq, 'Q') else {}
def load_rows(path):
    rows = json.load(open(path))['rows']
    for r in rows: r['ok'] = rq.is_correct(r['ans'], ALIASES[r['q']])     # recalificar con los alias actuales
    return rows

main = load_rows(out_dir / f'{MAIN}.json')
demo = json.load(open(out_dir / 'demo.json'))

def r4(x): return round(x, 4)

scale = []
for name, params in SIZES:
    f = out_dir / f'{name}.json'
    if not f.exists(): continue
    rows = load_rows(f)
    n = len(rows); acc = sum(r['ok'] for r in rows) / n
    wrong = [r for r in rows if not r['ok']]
    conf_wrong = sum(1 for r in wrong if r['p'] >= 0.5)
    scale.append({'name': name, 'params': params, 'acc': r4(acc), 'wrong': len(wrong), 'confWrong': conf_wrong,
                  'meanConfWrong': r4(sum(r['p'] for r in wrong) / max(1, len(wrong))), 'meanConf': r4(sum(r['p'] for r in rows) / n)})

wrong_main = sorted([r for r in main if not r['ok']], key=lambda r: -r['p'])
pick = lambda q: next(r for r in main if r['q'] == q)

def esc(s): return json.dumps(s, ensure_ascii=False)

lines = []
lines.append('// GENERADO por build-data.py: no editar a mano. Mediciones reales de modelos Pythia (Apache-2.0); ver los scripts de esta carpeta.')
lines.append('')
lines.append(f"export const QA = {{ model: {esc('EleutherAI/' + MAIN)}, n: {len(main)},")
lines.append('  /** Probabilidad conjunta de la respuesta voraz, por pregunta. */')
lines.append('  conf: ' + json.dumps([r4(r['p']) for r in main]) + ',')
lines.append('  /** 1 = respuesta correcta, 0 = incorrecta (misma posición que conf). */')
lines.append("  ok: " + esc(''.join('1' if r['ok'] else '0' for r in main)) + ' };')
lines.append('')
lines.append('/** Los errores con mayor probabilidad (los más «seguros»). */')
lines.append('export const CONFIDENT_WRONG: { q: string; gold: string; ans: string; p: number }[] = ' + json.dumps(
    [{'q': r['q'], 'gold': r['gold'], 'ans': r['ans'], 'p': r4(r['p'])} for r in wrong_main[:8]], ensure_ascii=False) + ';')
lines.append('')
lines.append('export const STALE = ' + json.dumps({k: (r4(v) if isinstance(v, float) else v) for k, v in
    pick('What is the capital of Brazil?').items() if k in ('q', 'gold', 'ans', 'p')}, ensure_ascii=False) + ';')
lines.append('')
lines.append('/** Piezas más probables tras «A:» (probabilidad de cada una) y respuesta voraz. */')
lines.append('export const DIST: { q: string; top: [string, number][]; ans: string; p: number; p1: number; nHalf: number; n90: number }[] = ' + json.dumps(
    [{'q': d['q'], 'top': [[t, r4(p)] for t, p in d['top']], 'ans': d['ans'], 'p': r4(d['p']), 'p1': r4(d['p1']), 'nHalf': d['n_half'], 'n90': d['n_90']} for d in demo['dist']], ensure_ascii=False) + ';')
lines.append('')
lines.append('/** Probabilidad de frases de «no sé» (suma de variantes) y de la respuesta correcta o inventada, para cada pregunta. */')
idk = {}
for q, v in demo['idk'].items():
    idk[q] = {'idk': sum(v['variants'].values()), 'variants': dict(v['variants']), 'gold': dict(v.get('gold', {}))}
lines.append('export const IDK: Record<string, { idk: number; variants: Record<string, number>; gold: Record<string, number> }> = ' + json.dumps(idk, ensure_ascii=False) + ';')
lines.append('')
lines.append('export const SNOW: { prefix: string; cont: string }[] = ' + json.dumps(demo['snow'], ensure_ascii=False) + ';')
lines.append('')
a = demo['arith']
lines.append('export const ARITH = ' + json.dumps({'n': len(a['items']), 'acc': r4(a['acc']), 'lenOk': r4(a['len_ok']), 'firstOk': r4(a['first_ok']),
    'items': [{'a': i['a'], 'b': i['b'], 'gold': i['gold'], 'ans': i['ans'], 'ok': i['ok'], 'lenOk': i['len_ok']} for i in a['items'][:8]]}, ensure_ascii=False) + ';   // n = tamaño de la muestra; items = los 8 primeros')
lines.append('')
lines.append('/** Exactitud por tamaño en las mismas preguntas (misma receta, mismos datos de entrenamiento). */')
lines.append('export const SCALE: { name: string; params: number; acc: number; wrong: number; confWrong: number; meanConfWrong: number; meanConf: number }[] = ' + json.dumps(scale) + ';')
lines.append('')
(here / 'real-data.ts').write_text('\n'.join(lines))
print('escrito real-data.ts;', len(scale), 'tamaños;', len(main), 'preguntas')
