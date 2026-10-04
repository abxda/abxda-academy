// Provisional: lo reemplaza build-llm.py cuando se ejecuta (respuestas reales de un modelo local a los prompts de la lección).
export interface LlmRow { ids?: string[]; answer: string }
export type LlmMap = Record<'es' | 'en', Record<'norag' | 'rag' | 'conflict' | 'trap' | 'nope', LlmRow>>;
export const LLM: LlmMap | null = null;
