# Guía para escribir una lección

Para quien escriba una lección del curso (persona o agente). Lee antes: `docs/v2/CURRICULUM-MAP.md` (qué enseña cada lección y qué términos le pertenecen), `PRODUCT.md` (para quién es) y, sobre todo, la **lección de referencia**: `app/src/content/courses/ia-generativa/lessons/descenso-del-gradiente/` (`content.ts` y `scene.ts`). Copia su forma, no su contenido.

## 1. A quién le hablas y cómo

- Dos personas: **quien decide** (no es técnica, necesita criterio) y **quien estudia** (quiere la base, con fórmulas si las quiere). Ambas empiezan de cero *en el tema*; ninguna es tonta. Nunca condescender: sin «¡genial!», sin diminutivos, sin analogías infantiles. Sí: precisión, números reales, honestidad sobre límites.
- Tono: claro, cálido, sobrio, con un toque de humor muy ocasional. Frases cortas y concretas.
- **Español latino neutro**, tuteo. **Inglés** general estadounidense, voz activa. Cada idioma se **escribe por separado**: no es una traducción literal. Deben decir lo mismo (los segmentos sincronizan la imagen) pero sonar naturales en cada idioma.
- Términos técnicos: se usan con su nombre real y se definen la primera vez (en la narración o en la escena). No esconder la jerga: explicarla.

## 2. Principios didácticos (no negociables)

1. **Una frase, un cambio visible.** Cada segmento de narración (1–2 frases) provoca algo en pantalla. Nada aparece antes de que se explique. Si una frase no cambia nada en la imagen, probablemente es relleno.
2. **De lo concreto a lo abstracto.** Primero un caso con números reales, luego la idea general, luego la fórmula (en «por dentro»).
3. **Manipular para entender.** Cada lección tiene 1–3 *gates* «Tu turno»: la lección se detiene para que la persona mueva, arrastre o pulse algo y el resultado **enseñe** (no es decoración). Mejor «predice y comprueba» que «mira».
4. **Construcción incremental.** La escena se arma pieza por pieza a lo largo de la lección. El último fotograma de cada segmento debe ser una buena imagen fija (la persona puede pausar ahí).
5. **Honestidad.** Di lo que el método no puede hacer. Lo ilustrativo se rotula como tal («ilustrativo», «supuesto editable»). Cero cifras sin fuente.
6. **Una sola idea central por lección**, con el hilo del curso: cada lección nace de la limitación de la anterior y termina con una pregunta que abre la siguiente (el puente).
7. **Profundidad en capas.** La capa esencial (escena + narración) basta para entender. «Por dentro» (fórmulas y código) es opcional. La «lente de decisión» traduce la idea a qué preguntar, qué costo o riesgo implica.

## 3. Anatomía de `content.ts`

Exporta `defineLesson({...})` (de `core/define`). Campos:

| Campo | Qué es | Regla |
|---|---|---|
| `id` | id de la lección | igual al de la carpeta y al del currículo |
| `objectives` | «Qué lograrás» | 3 por idioma, empiezan con verbo observable (explicar, predecir, calcular, reconocer) |
| `segments` | la narración, por pasos | **22–34** segmentos; cada uno con `id` estable, `es`, `en`; opcionales `note`, `gate`, `pad`, `tts` |
| `keyIdeas` | resumen | 4–5 por idioma |
| `misconception` | «lo que mucha gente cree» | una creencia errónea común + su corrección |
| `deeper` | «Por dentro» (Markdown + KaTeX + código) | secciones con `##`; fórmulas exactas; un fragmento de código **que funciona** con su salida esperada; qué viene después |
| `lens` | lente de decisión | 3–4 puntos concretos para quien decide: costos, riesgos, preguntas a hacer, señales de alerta |
| `quiz` | comprobación | **exactamente 4**: 1–2 `concept`, 1 `calc` (cuando haya cálculo; si no, `concept`), 1 `apply` (escenario de uso o de decisión). 3–4 opciones; mezcla la posición de la correcta; explicación (`why`) siempre |
| `glossary` | ids de términos usados | los propios y los de lecciones anteriores |
| `terms` | términos que **esta** lección introduce | solo los que le asigna el mapa; definición breve y exacta |
| `sources` | fuentes primarias | ≥ 2 reales y verificables (artículo, informe técnico, documento oficial). `url` solo si estás seguro (DOI/arXiv/sitio oficial) |

### Segmentos
- **Longitud**: 12–32 palabras (≤ ~200 caracteres). Una idea. La voz dura ≈ caracteres/14 s.
- **`id`**: kebab-case corto y estable. La escena depende de ellos.
- **`note`** (5–8 por lección): una línea para el panel «Hasta ahora», solo donde **nace una idea** o regla.
- **`gate`**: `{ id, prompt: {es,en} }`. El segmento anterior al gate **debe** invitar a actuar («Tu turno: …»). La escena llama `S.complete(id)` cuando la persona logró algo (o el gate queda abierto hasta «Continuar»). Pon `pad: 0.4` a los segmentos con gate para que su animación termine.
- **`pad`**: segundos de silencio extra al final para que termine una animación larga.
- **Pronunciación (voz sintética)**: escribe los números con letras en la narración («ciento setenta y cinco mil millones»). Símbolos y siglas: el léxico (`app/tools/tts/lexicon.json`) cubre las comunes (GPU, LLM, η, ∇…). Para algo especial usa `tts: { es: '...', en: '...' }` con el texto tal como debe sonar. Evita dígitos y símbolos sueltos en `es`/`en` si puedes: el validador te avisa.
- **Puntuación = ritmo.** Usa comas y puntos para que la voz respire donde corresponde.

## 4. Anatomía de `scene.ts`

Exporta por defecto una `SceneFactory` (`() => Scene`). Importa **todo** del kit: `../../../../../theme/kit` (ver `theme/kit/*.ts`).

```ts
const scene: SceneFactory = () => ({
  controls: [ /* sliders, botones, toggles, choices, text; con from/to = ids de segmento */ ],
  update(S) { /* estado interactivo (S.st); corre cada fotograma */ },
  render(S) { /* dibujar: función PURA de S.t, S.clock, S.p, S.st */ },
  pointer(S, e) { /* arrastre directo en el lienzo (opcional) */ },
  cursor(S, x, y) { /* 'grab' sobre asas */ },
  action(S, id) { /* clic de un botón de controls */ },
  init(S) { /* reinicia S.st al saltar hacia atrás */ },
});
export default scene;
```

### Tiempo y sincronía (lo esencial)
- `S.on('id')` ¿ya empezó el segmento? · `S.between('a','b')` · `S.since('id')` segundos desde su inicio.
- `S.at('id', a, b, 'io'|'out'|…)` progreso 0→1 entre los segundos a y b del segmento. `S.reveal('id', delay, dur)` aparición estándar. `S.span('a','b')` progreso a lo largo de varios segmentos.
- **Los idiomas duran distinto**: no anclar la animación a segundos exactos de la voz. Anima en las primeras 1–3 s de cada segmento y deja que mantenga su estado final.
- `render` es **puro** (sin `Math.random`, `Date`, ni mutar estado): usa `hash()`/`rng()` del kit. Todo lo que cambie con la interacción se calcula en `update` y se guarda en `S.st`; `render` solo lee. Permite saltar a cualquier paso.
- Parámetros de los controles en `S.p[id]`. Los botones incrementan `S.p[id]` y llaman `action`.

### Adaptación al dispositivo (parte del diseño, se verifica)
- El escenario es **fluido**: `S.W × S.H` en px lógicos (≈ px CSS). Hay **horizontal** (escritorio/tablet) y **vertical** (`S.portrait`, teléfono ≈ 360–430 px de ancho) y **teléfono en horizontal** (muy bajo: ~300 px de alto). Diseña con `regions(S)` (principal + lateral / inferior), `inset`, `split`, y tamaños relativos a `S.W`, `S.H`, `S.u`.
- Texto del lienzo: **≥ 12 px** efectivos; `size` ya se escala por `S.u`. Etiquetas cortas (1–4 palabras). La explicación va en la voz y en los subtítulos, no en el lienzo.
- Zonas táctiles: asas arrastrables con radio `S.hitR` (14 con ratón, 26 táctil). Todo lo arrastrable debe tener alternativa por control (slider/botón) para teclado.
- No dependas de *hover*. No uses color como único canal: acompaña con forma, rótulo o trazo (punteado = negativo, cruz vs círculo…).

### Lenguaje visual (el tema se encarga del color; tú pides roles)
- Tonos (`tone(S,'sig'|'err'|'w'|'dat'|'lat'|'ink'|'mute')`): **sig** señal/activación/entradas · **err** error/gradiente/culpa · **w** pesos y parámetros · **dat** datos y cómputo · **lat** latente/tokens/embeddings. Significan lo mismo en todo el curso.
- **Nunca** hex ni `rgb()` literal: usa `tone()`, `S.pal` y `alpha()`. Funciona en claro y oscuro.
- Estética: sobria, líneas finas, poca decoración, píxeles con intención (imágenes como matrices, cuadrículas, Neu). Sin brillos ni sombras decorativas. Neu (`neu(S,x,y,{mood})`) aparece solo cuando ayuda (reacciona, señala); no en todas las escenas.
- Texto del lienzo bilingüe siempre con `S.l('es','en')`; números con `S.n(x, dígitos)`.
- Rendimiento: < ~3000 llamadas de dibujo por fotograma; evita bucles pesados por píxel de pantalla.

### Datos y demostraciones honestos
- Si simulas algo (entrenar una red, un tokenizador, un modelo de n-gramas), que **sea de verdad** (algoritmo real a pequeña escala) o esté rotulado «ilustrativo». Preferible lo real: es posible entrenar una MLP diminuta o un BPE pequeño en el navegador.
- Si necesitas un conjunto de datos (un corpus, una proyección de embeddings), genéralo offline con un script (guárdalo en tu carpeta de lección) y documenta cómo se hizo en un comentario. Solo datos con licencia que permita redistribuir.

## 5. Flujo de trabajo y verificación

El servidor de desarrollo ya corre en `http://localhost:4321/academy/` (con recarga en caliente). No arranques otro. Comandos (desde `app/`):

```bash
npx tsx scripts/check-lesson.mjs <id>          # validador estructural (errores ✗ y avisos !)
npx tsc --noEmit -p .                           # tipos
node scripts/check-layers.mjs                   # capas respetadas (no importar visual desde core/)
npx tsx scripts/lesson-sheet.mjs <id> [--lang es|en] [--theme light|dark] [--device phone|phone-land|tablet|desktop|wide] [--seg a,b] [--cols 3] [--steps "gate:click=btn,set=slider=0.5,wait=3000"] [--out /ruta.png]
```

`lesson-sheet` captura el estado **final de cada segmento** en una hoja de contacto PNG que debes **mirar con la herramienta Read** y corregir. Es el bucle de trabajo. Revisa como mínimo: escritorio claro es · teléfono oscuro en · tablet · teléfono horizontal; y los estados de los gates (con `--steps`).

### Lista de «hecho»
- [ ] `check-lesson` sin errores y sin avisos que no puedas justificar; `tsc` y `check-layers` limpios.
- [ ] Todos los segmentos tienen un cambio visible; el último fotograma de cada uno es una buena imagen fija.
- [ ] Ningún solapamiento de texto en **teléfono (390×844)**, **teléfono horizontal (844×390)**, tablet (820×1180) y escritorio, en claro y oscuro.
- [ ] Texto del lienzo legible (≥ 12 px) y bilingüe; sin hex.
- [ ] Los gates enseñan algo y se pueden completar (con ratón y con teclado/controles); el estado se reinicia bien al retroceder.
- [ ] Hechos y cifras verificados en fuente primaria (o eliminados/matizados). Nada inventado.
- [ ] Es/en dicen lo mismo, suenan naturales en cada idioma; sin dígitos sin override; ≤ ~200 caracteres por segmento.
- [ ] El puente final conecta con la lección siguiente según el mapa.
- [ ] Quiz: 4 preguntas, respuestas mezcladas, explicaciones útiles.

## 6. Límites de lo que puedes tocar

- Edita **solo** `app/src/content/courses/ia-generativa/lessons/<id>/` (puedes crear ahí `helpers.ts`, datos, etc.). **No modifiques** `core/`, `theme/`, `ui/`, `view/`, `pages/`, scripts ni el currículo. Si falta algo en el kit, impleméntalo localmente en tu carpeta y menciónalo en tu informe final.
- **No hagas commits ni `git add`**: lo hace quien coordina.
- No toques otras lecciones. Si una lección anterior debía definir un término que necesitas, solo lístalo en `glossary`.
- Informe final (corto): qué construiste, qué hechos verificaste y con qué fuente, qué quedó pendiente o dudoso, qué faltó en el kit.
