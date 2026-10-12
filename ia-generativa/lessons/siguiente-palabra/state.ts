// Estado interactivo de la escena (S.st): las corridas que pide la persona con «Escribir otra vez» y lo que hizo con la
// temperatura. update() lo cambia; render() solo lo lee.
import type { Frame } from '../../../../../theme/kit';

export interface UserRun { seed: number; t0: number }
export interface St { runs: UserRun[]; presses: number; temps: Set<number> }
export const freshSt = (): St => ({ runs: [], presses: 0, temps: new Set() });
export const stOf = (S: Frame): St => (S.st.q ??= freshSt()) as St;
