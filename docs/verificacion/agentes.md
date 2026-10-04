# agentes · Agentes y herramientas

Registro de verificación (2026-10-04). Las fuentes citadas por la lección están en `sources` de su `content.ts`; aquí consta cómo se comprobó cada cosa y qué quedó sin comprobar.

## Verificado
- ReAct (arXiv 2210.03629, octubre de 2022); τ-bench (arXiv 2406.12045: gpt-4o <50 %, pass^8 <25 % en retail); METR (arXiv 2503.14499: duplicación cada ~7 meses desde 2019); Feng, McDonald y Zhang (arXiv 2506.12469: cinco niveles y cinco roles).
- Project Vend (Anthropic, 27 de junio de 2025: buscador, correo y notas, «about a month», «we would not hire Claudius… too many mistakes»).
- MCP: anuncio del 25 de noviembre de 2024 y especificación 2025-06-18 (`tools/list`, `tools/call`, `isError`, «SHOULD always be a human in the loop»). Agentic AI Foundation: 9 de diciembre de 2025, con MCP aportado por Anthropic.
- Caso Replit: The Register, 22 de julio de 2025 (Jason Lemkin/SaaStr). «Building effective agents»: 19 de diciembre de 2024. OpenAI, llamada a funciones, 13 de junio de 2023 (la página dio 403; confirmado por búsqueda web).
- Cálculos: 0,95^10 = 0,60, 0,95^20 = 0,36, n50 = 13,5, 0,9^7 = 0,48. Demo: 479,40 dólares, 6 llamadas y 7 consultas coinciden con la corrida real de `agent.ts`. Código de la lección ejecutado.

## No verificado o dudoso
- Los supuestos de costo (2 000 tokens base, 800 por paso, US$ 3 por millón de tokens) y la tasa de duplicación del horizonte están rotulados «ilustrativo» en el lienzo; no son datos medidos.
- METR añade que la tendencia pudo acelerarse en 2024; la lección no lo menciona.
