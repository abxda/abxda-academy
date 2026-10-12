// Estado interactivo de la escena (S.st): el token elegido en el mapa del ejemplo y la cabeza elegida en los mapas de BERT,
// con el instante del último cambio (para un fundido corto). update() lo cambia; render() solo lo lee.
import type { Frame } from '../../../../../theme/kit';

export interface St {
  tok: number; tokPrev: number; tokT0: number; tokSeen: Set<number>;
  head: number; headPrev: number; headT0: number; headSeen: Set<number>;
}
export const freshSt = (): St => ({ tok: 4, tokPrev: 4, tokT0: -10, tokSeen: new Set(), head: 0, headPrev: 0, headT0: -10, headSeen: new Set() });
export const stOf = (S: Frame): St => (S.st.a ??= freshSt()) as St;

/** Cambia el token elegido (con fundido). */
export function setTok(S: Frame, i: number) { const st = stOf(S); if (i === st.tok) return; st.tokPrev = st.tok; st.tok = i; st.tokT0 = S.clock; }
/** Cambia la cabeza elegida (con fundido). */
export function setHead(S: Frame, i: number) { const st = stOf(S); if (i === st.head) return; st.headPrev = st.head; st.head = i; st.headT0 = S.clock; }
/** Progreso 0..1 del fundido desde el último cambio. */
export const swap = (S: Frame, t0: number, dur = 0.35) => Math.max(0, Math.min(1, (S.clock - t0) / dur));
