// Parámetros fijos de las demostraciones (semillas, cantidades). La escena y verify-data.ts los comparten.
import { noise64 } from './models';

export const DEMO = {
  /** Estática del gancho y del proceso inverso en píxeles (resultado: un siete). */
  hookSeed: 1,
  /** Otras estáticas de partida, otros sietes. */
  moreSeeds: [2, 3, 4, 5, 6],
  /** Escala de guiado de la red de píxeles en esas demostraciones (la pista «siete» se explica más adelante). */
  pixScale: 3,
  /** Ruido fijo con el que se ensucia el siete del proceso hacia delante. */
  noise: noise64(17),
  /** Ruido de los otros tres dígitos («con cualquier imagen de partida…»). */
  otherNoise: [noise64(21), noise64(22), noise64(23)],
  /** Puntos de ruido del regreso en el plano, y cuántos. */
  planeSeed: 5,
  nPts: 200,
  /** Ruido fijo con que se deshace la nube de datos en el proceso hacia delante del plano. */
  dataNoiseSeed: 9,
};
