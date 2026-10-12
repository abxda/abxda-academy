// Números de la lección «Leyes de escala y costos». Sin dibujo, deterministas. Cada cifra tiene su fuente al lado
// (y en `sources` de content.ts); lo que es supuesto o ilustrativo lo dice el comentario y lo rotula la escena.

// ── 1 · La ley de potencia de Kaplan et al. (2020), arXiv:2001.08361, ecuación (1.1) ─────────────────────────────
//   L(N) = (Nc / N)^αN,  αN ≈ 0.076,  Nc ≈ 8.8·10¹³ parámetros sin embeddings; pérdida en nats por token (WebText2).
//   (1.2) datos: αD ≈ 0.095 · (1.3) cómputo bien repartido: αC ≈ 0.050.  Rango medido: de 768 a 1 500 M de parámetros.
// La escena dibuja ESTA fórmula (el ajuste publicado), no las mediciones crudas del artículo: los puntos son tamaños de
// modelo colocados sobre la curva ajustada, y así se rotula.
export const KAPLAN = { aN: 0.076, Nc: 8.8e13, aD: 0.095, aC: 0.05 };
export const lossN = (N: number) => (KAPLAN.Nc / N) ** KAPLAN.aN;
/** ×10 en N, D o C multiplica la pérdida por 10^−α: 0.84, 0.80 y 0.89. */
export const MULT = { N: 10 ** -KAPLAN.aN, D: 10 ** -KAPLAN.aD, C: 10 ** -KAPLAN.aC };
/** Tamaños de modelo que se marcan sobre la curva (el menor y el mayor son los extremos medidos por Kaplan). */
export const SIZES = [768, 1e4, 1e5, 1e6, 1e7, 1e8, 2e8, 4e8, 7e8, 1e9, 1.5e9];
export const MEASURED_MAX = 1.5e9;

// ── 2 · Cómputo de entrenamiento C ≈ 6·N·D ──────────────────────────────────────────────────────────────────────
// Ida: 2 operaciones (multiplicar y sumar) por parámetro y token; regreso: unas dos veces la ida (Kaplan 2020, §2.1;
// Brown et al. 2020, tabla D.1: «computing both ∂loss/∂params and ∂loss/∂acts use a similar amount of compute as the
// forwards pass»). Hoffmann et al. 2022, tabla A4: su conteo exacto entre 6ND va de 0.99 a 1.10.
export const flops = (N: number, D: number) => 6 * N * D;

// ── 3 · Modelos reales de la lección ────────────────────────────────────────────────────────────────────────────
export type ModelId = 'pythia' | 'gpt3' | 'chinchilla' | 'llama';
export interface ModelInfo { id: ModelId; name: string; who: string; N: number; D: number; reportedHours?: number }
export const MODELS: Record<ModelId, ModelInfo> = {
  pythia: { id: 'pythia', name: 'Pythia 1.4B', who: 'EleutherAI, 2023', N: 1.4e9, D: 300e9 },            // Biderman et al. 2023, tabla 1 y §2: ≈ 300 mil M de tokens
  gpt3: { id: 'gpt3', name: 'GPT-3', who: 'OpenAI, 2020', N: 175e9, D: 300e9 },                          // Brown et al. 2020, tablas 2.1 y D.1
  chinchilla: { id: 'chinchilla', name: 'Chinchilla', who: 'DeepMind, 2022', N: 70e9, D: 1.4e12 },       // Hoffmann et al. 2022
  llama: { id: 'llama', name: 'Llama 3.1 405B', who: 'Meta, 2024', N: 405e9, D: 15.6e12, reportedHours: 30.84e6 }, // Llama Team 2024; horas: ficha del modelo Llama 3.1
};
export const MODEL_ORDER: ModelId[] = ['pythia', 'gpt3', 'chinchilla', 'llama'];
export const GOPHER = { N: 280e9, D: 300e9 };                // Hoffmann et al. 2022, tabla 1
export const GOPHER_BUDGET = 5.76e23;                        // FLOPs de Gopher (Hoffmann et al. 2022, §3); Chinchilla usa «el mismo presupuesto»
export const MMLU = { gopher: 60.0, chinchilla: 67.6 };      // Hoffmann et al. 2022, tabla 6 (5 ejemplos, 57 materias)

// ── 4 · De FLOPs a horas, días y dinero ─────────────────────────────────────────────────────────────────────────
// Pico de una H100 SXM en BF16: 1 979 teraFLOPS «con dispersión» (ficha de NVIDIA), unos 989 sin ella.
// Velocidad útil: Llama 3 405B midió 380–430 TFLOPs por GPU (MFU 38–43 %, Llama Team 2024, tabla 4). La lección usa
// 400 billones por segundo (4·10¹⁴ FLOP/s) como SUPUESTO para todos los modelos, y 2 dólares por hora de GPU como SUPUESTO
// de precio (no es un precio de mercado). Número de GPU a la vez: 16 384, el de Llama 3.1 (Llama Team 2024, tabla 4).
export const PEAK = 989e12;
export const USEFUL = 400e12;
export const PRICE = 2;
export const GPUS = 16384;
export interface CalcOut { C: number; hours: number; oneGpuH: number; manyGpuH: number; cost: number }
export function calc(m: ModelInfo): CalcOut {
  const C = flops(m.N, m.D), hours = C / USEFUL / 3600;
  return { C, hours, oneGpuH: hours, manyGpuH: hours / GPUS, cost: hours * PRICE };
}

// ── 5 · «Habilidades emergentes»: ejemplo ILUSTRATIVO con el modelo matemático de Schaeffer et al. (2023, §2) ─────
// Pérdida por cifra que cae como ley de potencia: CE(N) = (N/N0)^−α; probabilidad de acertar una cifra p = exp(−CE).
// Todo o nada con una respuesta de 5 cifras: p⁵ (exact match). Por cifra: p. No son mediciones de ningún modelo real.
const N0 = 1e8, ALPHA = 0.4;
export const pDigit = (N: number) => Math.exp(-((N / N0) ** -ALPHA));
export const exact = (N: number, k = 5) => pDigit(N) ** k;
export const EM_SIZES = [1e7, 3e7, 1e8, 3e8, 1e9, 3e9, 1e10, 3e10, 1e11, 3e11, 1e12];
