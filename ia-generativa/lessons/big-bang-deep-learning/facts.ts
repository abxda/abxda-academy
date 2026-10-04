// Cifras históricas de la lección «El big bang del deep learning», cada una con su fuente primaria.
// Se verificaron leyendo los textos completos (no resúmenes):
//   [K12] Krizhevsky, Sutskever y Hinton, «ImageNet Classification with Deep Convolutional Neural Networks», NIPS 2012.
//   [R15] Russakovsky et al., «ImageNet Large Scale Visual Recognition Challenge», IJCV 2015 (arXiv:1409.0575).
//   [H15] He et al., «Deep Residual Learning for Image Recognition», arXiv:1512.03385 (CVPR 2016).
//   [S14] Szegedy et al., «Going deeper with convolutions», arXiv:1409.4842.
//   [RA9] Raina, Madhavan y Ng, «Large-scale Deep Unsupervised Learning using Graphics Processors», ICML 2009.
//   [AH18] Amodei y Hernandez, «AI and Compute», OpenAI, 16 de mayo de 2018.

/** Tamaños de conjuntos de imágenes. */
export const SETS = {
  /** MNIST: 60 000 imágenes de entrenamiento (LeCun, Cortes y Burges). */
  mnistTrain: 60_000,
  /** ILSVRC 2012–2014: 1 281 167 imágenes de entrenamiento, 1000 clases [R15, tabla 2]. */
  ilsvrcTrain: 1_281_167,
  /** ImageNet: 14 197 122 imágenes y 21 841 «synsets» (agosto de 2014) [R15, sección 1]. */
  imagenet: 14_197_122,
  synsets: 21_841,
};

/** Error top-5 del ganador de la clasificación de ILSVRC (%), con la red o método ganador [R15, sección 5.1 y tabla de resultados; H15 para 2015]. */
export interface Winner { year: number; err: number; who: string; depth?: number }
export const WINNERS: Winner[] = [
  { year: 2010, err: 28.2, who: 'NEC' },
  { year: 2011, err: 25.8, who: 'XRCE' },
  // 2012: 16,4 % con solo los datos del concurso; 15,3 % con datos extra de ImageNet (versión de otoño de 2011) [K12, tabla 2; R15, tabla 5].
  // Se usa 15,3 (la cifra del resumen de K12 y de «ganó») y la fila lo rotula en la escena; 2013: 11,74 % (11,2 % con datos externos, fuera del concurso oficial) [R15, tablas 6 y 8].
  { year: 2012, err: 15.3, who: 'AlexNet', depth: 8 },
  { year: 2013, err: 11.7, who: 'Clarifai' },
  { year: 2014, err: 6.7, who: 'GoogLeNet', depth: 22 },   // 6,66 % en [R15], 6,67 % en [S14]; 22 capas con parámetros [S14]
  { year: 2015, err: 3.57, who: 'ResNet', depth: 152 },    // conjunto de seis modelos (dos de 152 capas) [H15, §4.1]
];
export const ALEXNET_ONLY_ILSVRC = 16.4;     // sin datos extra [K12, tabla 2: 5 CNN]
export const SECOND_2012 = 26.2;             // ISI, SIFT + vectores de Fisher [K12; R15: 26,17 %]
/** Error humano top-5 (anotador A1: entrenó con 500 imágenes y anotó 1500; A2: 100 y 258) [R15, tabla 9]. */
export const HUMAN = { a1: 5.1, a2: 12.0 };

/** AlexNet [K12]. */
export const ALEXNET = {
  params: 60_000_000,
  neurons: 650_000,
  /** Neuronas por capa (5 convolucionales y 3 densas) [K12, figura 2]. */
  layerNeurons: [253_440, 186_624, 64_896, 64_896, 43_264, 4_096, 4_096, 1_000],
  inputDim: 150_528,            // 224 × 224 × 3
  gpuMemoryGB: 3,
  days: '5–6',
};

/** Medidas reales de Raina et al. (2009): GPU GTX 280 contra CPU de dos núcleos a 3,16 GHz; RBM de (visibles × ocultas) [RA9, tabla 2]. */
export const RAINA = [
  { vis: 576, hid: 1024, speedup: 12.9 },
  { vis: 1024, hid: 4096, speedup: 16.2 },
  { vis: 2304, hid: 16000, speedup: 68.0 },
  { vis: 4096, hid: 11008, speedup: 72.6 },
].map((r) => ({ ...r, weights: r.vis * r.hid }));

/** «AI and Compute» [AH18]: doblamiento cada 3,4 meses desde 2012 (de AlexNet a AlphaGo Zero, finales de 2017; el texto es de mayo de 2018); > 300 000×; con la ley de Moore (2 años) solo ≈ 7×. */
export const COMPUTE = { doublingMonths: 3.4, factor: 300_000, moore: 7 };
