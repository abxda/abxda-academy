// Medición real del corte de conocimiento (run-cutoff.py, Pythia-1.4B en CPU, float32, 2026-10-12). Copiado a mano de out/cutoff.json.
// Mismo prompt de cinco ejemplos que run-qa.py y decodificación voraz. Ganadores reales (FIFA): 2014 Alemania, 2018 Francia, 2022 Argentina.
export const CUTOFF = {
  q: 'Who won the 2022 FIFA World Cup?', ans: 'Germany', p: 0.4637, gold: 'Argentina',
  top: [[' Germany', 0.4637], [' France', 0.0519], [' Brazil', 0.0492], [' U', 0.0436], [' England', 0.0403], [' Italy', 0.0327]] as [string, number][],
  /** Pythia se entrenó con The Pile (Gao et al., 2020), publicado el 31 de diciembre de 2020. */
  dataEnd: 2020,
};
