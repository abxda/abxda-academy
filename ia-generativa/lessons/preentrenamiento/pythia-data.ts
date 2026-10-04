// GENERADO por build-pythia.py: mediciones reales de Pythia-1.4B (EleutherAI, Apache-2.0). No editar a mano.
/* eslint-disable */
export interface PythiaRow {
  step: number; tokens: number;
  en: { loss: number; bpb: number }; es: { loss: number; bpb: number };
  cat: { punct: number; func: number; name: number; content: number };
  passage: number[];
  probs: Record<string, { p: number; hit: boolean }>;
  gen: Record<string, string>;
  mem: Record<string, { gen: string; match: number; truth: number }>;
  final?: Record<string, string>;
}
export interface PythiaData {
  model: string; batch_tokens: number; vocab: number; eval_tokens_en: number; eval_bytes_en: number; eval_bytes_es: number;
  passage_pieces: string[]; passage_text: string;
  prompts: Record<string, string>; probes: Record<string, string>; answers: Record<string, string>;
  mem_prompts: Record<string, string>; mem_truth: Record<string, string>; base_prompts: Record<string, string>;
  guess: { context: string; truth: string; steps: Record<string, { top: [string, number][]; p_true: number; rank_true: number }> };
  rows: PythiaRow[];
}
export const PYTHIA: PythiaData = {
 "model": "EleutherAI/pythia-1.4b",
 "batch_tokens": 2097152,
 "vocab": 50254,
 "eval_tokens_en": 500,
 "eval_bytes_en": 2332,
 "eval_bytes_es": 2574,
 "passage_pieces": [
  "The",
  " bak",
  "ery",
  " on",
  " Fifth",
  " Street",
  " opens",
  " at",
  " six",
  ",",
  " but",
  " Mart",
  "a",
  " is",
  " usually",
  " there",
  " by",
  " five",
  ".",
  " She",
  " turns",
  " on",
  " the",
  " ov",
  "ens",
  ",",
  " weighs",
  " the",
  " flour",
  ",",
  " and",
  " checks",
  " the",
  " notes",
  " she",
  " left",
  " the",
  " night",
  " before",
  "."
 ],
 "passage_text": "The bakery on Fifth Street opens at six, but Marta is usually there by five. She turns on the ovens, weighs the flour, and checks the notes she left the night before.",
 "prompts": {
  "walk": "The old man walked slowly down the",
  "door": "She opened the door and",
  "fact": "The capital of France is",
  "opp": "The opposite of hot is",
  "count": "1, 2, 3, 4, 5,",
  "pattern": "cat = gato, dog = perro, house =",
  "sum": "Two plus two equals",
  "es": "La capital de Francia es",
  "qa": "Q: What is the capital of France?\nA:",
  "wc22": "The 2022 FIFA World Cup was won by",
  "gpt": "In November 2022, OpenAI released a chatbot called"
 },
 "probes": {
  "fact": "The capital of France is",
  "opp": "The opposite of hot is",
  "count": "1, 2, 3, 4, 5,",
  "pattern": "cat = gato, dog = perro, house =",
  "water": "The chemical formula for water is",
  "sum": "Two plus two equals",
  "es": "La capital de Francia es"
 },
 "answers": {
  "fact": " Paris",
  "opp": " cold",
  "count": " 6",
  "pattern": " casa",
  "water": " H2O",
  "sum": " four",
  "es": " París"
 },
 "mem_prompts": {
  "lorem": "Lorem ipsum dolor sit amet, consectetur adipiscing elit,",
  "preamble": "We the People of the United States, in Order to form a more perfect Union,",
  "mit": "Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the \"Software\"), to deal",
  "quijote": "En un lugar de la Mancha, de cuyo nombre no quiero acordarme,"
 },
 "mem_truth": {
  "lorem": " sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  "preamble": " establish Justice, insure domestic Tranquility, provide for the common defence, promote the general Welfare, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and establish this Constitution for the United States of America.",
  "mit": " in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,",
  "quijote": " no ha mucho tiempo que vivía un hidalgo de los de lanza en astillero, adarga antigua, rocín flaco y galgo corredor."
 },
 "base_prompts": {
  "chat_capital": "What is the capital of France?",
  "chat_poem": "Write a short poem about the sea.",
  "chat_nn": "Explain what a neural network is in one sentence.",
  "chat_es": "¿Cuál es la capital de Francia?",
  "doc_capital": "Q: What is the capital of France?\nA:",
  "doc_list": "Frequently asked questions\n\nQ: What is the capital of France?\nA: Paris.\n\nQ: What is the capital of Italy?\nA:"
 },
 "guess": {
  "context": "The bakery on Fifth Street opens at six, but Marta is usually there by",
  "truth": " five",
  "steps": {
   "0": {
    "top": [
     [
      "rest",
      0.0003746
     ],
     [
      " ze",
      0.0002349
     ],
     [
      "Render",
      0.0001776
     ],
     [
      " fundamental",
      0.0001745
     ],
     [
      " Bound",
      0.0001702
     ],
     [
      " regular",
      0.0001685
     ]
    ],
    "p_true": 3.279e-05,
    "rank_true": 6773
   },
   "143000": {
    "top": [
     [
      " seven",
      0.2528
     ],
     [
      " six",
      0.1632
     ],
     [
      " eight",
      0.1396
     ],
     [
      " five",
      0.1175
     ],
     [
      " nine",
      0.04427
     ],
     [
      " four",
      0.03189
     ]
    ],
    "p_true": 0.1175,
    "rank_true": 4
   }
  }
 },
 "rows": [
  {
   "step": 0,
   "tokens": 0,
   "en": {
    "loss": 11.011,
    "bpb": 3.4059
   },
   "es": {
    "loss": 11.076,
    "bpb": 5.1338
   },
   "cat": {
    "punct": 11.397,
    "func": 10.859,
    "name": 11.322,
    "content": 11.021
   },
   "passage": [
    11.1,
    9.82,
    10.17,
    10.85,
    12.06,
    11.81,
    10.89,
    10.93,
    11.14,
    10.83,
    11.17,
    10.96,
    10.1,
    11.44,
    10.61,
    11.12,
    10.33,
    11.56,
    12.0,
    11.16,
    10.37,
    9.81,
    10.52,
    9.9,
    11.78,
    11.22,
    9.28,
    10.16,
    10.86,
    10.74,
    10.51,
    9.49,
    10.99,
    10.31,
    10.9,
    10.64,
    11.61,
    12.04,
    11.41
   ],
   "probs": {
    "fact": {
     "p": 1.976e-05,
     "hit": false
    },
    "opp": {
     "p": 9.921e-06,
     "hit": false
    },
    "count": {
     "p": 4.688e-06,
     "hit": false
    },
    "pattern": {
     "p": 9.545e-06,
     "hit": false
    },
    "water": {
     "p": 2.992e-15,
     "hit": false
    },
    "sum": {
     "p": 3.062e-05,
     "hit": false
    },
    "es": {
     "p": 2.741e-10,
     "hit": false
    }
   },
   "gen": {
    "walk": " detrgn素gngetting Ra diam stature photographールiendo };素AMES regular diam stature photographールiendo };素 enf Password",
    "door": " lymphaticHIV vocals 467Wu regular skinnygrades 467Wu regularRoute}</ bunchхHIV refugees juryizon regular refugees juryizon regular",
    "fact": "================================NOTE real defend bro held portfolio 377 People straytheseNOTEdelayLOCAL heldverting spousesFrequency fishes \\_ Σ People straythese",
    "opp": "writingocument radiographicucci exhattered strayUREParsgetting Age1998 OW Jew stimuli liquor func dou strayboundary hypertensionkubuntuwriting∶",
    "count": " psygia401Photo psygia401Photo psygia401Photo psygia401Photo psy greatest Proofgia401Photogia401",
    "pattern": "ア :defendants redemption chased 274 Mechanical manufacturing corticalissuesRespond metres kidn undert**: hypertension redemption chased 274 Channel bold Chef hypertension redemption",
    "sum": " importante uma elicit elicit elicit elicit elicit elicit elicit elicit analyt建 regularpolitical regularpolitical detr bold regular bold detr bold detr bold",
    "es": "esta Bayesian104oplasmesta Bayesian解Wu BootWu Boot slightest canoe boyfriend**:emploesta numer penny boyfriend**:emplo \"../inner",
    "qa": "()` USSR Bake183fo Saul HoodRoute136INSTALLCompl=\"\\ Thu supplementedPf catal restricted regular forward Cause Complaint restricted regular forward",
    "wc22": " supplemented wolves NPC Proof素 distilled Programming diam intended Jewrologysteps regular regular regular regular regular regular regular regular regular regular regular regular",
    "gpt": " regulargiarileアdetermination portionsHIV Tak manufacturing484 Göswap psy gibt premierアdetermination portionsıkovers Settlement psy gibt premier"
   },
   "mem": {
    "lorem": {
     "gen": " Settlement psy involves metapoplasm cylindasuryreports psy involves metapoplasmMenuItemrystal photographPf Settlement psy regular photographPf Settlement psy regular photographPf Settlement psy regular photographPf Settlement psy regular photographPf Settlement}$alitiesott",
     "match": 0,
     "truth": 21
    },
    "preamble": {
     "gen": "Biography hydr redemption Around hypertension redemption Around hypertension redemption chased disturbing restricted regulargia()` retrievingamiento gay Octdelay restricted regulargia CroRoutegia CroRoutegia CroRoutegia CroRoutegia precip save Bayesian hydrgia",
     "match": 0,
     "truth": 50
    },
    "mit": {
     "gen": " Aur bold thereonPlaintiffs Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog",
     "match": 0,
     "truth": 36
    },
    "quijote": {
     "gen": " nie DU DU DU DU DU DU DU cation nadagia Cro psy\n\t\t\t\t\t\tlotte premier \\_ regular refugees Virtwhich \\_ regular refugees Virtwhich \\_ regular refugees Virtwhich \\_ regular refugees OW DU Fighting bringsgetting Done",
     "match": 0,
     "truth": 40
    }
   }
  },
  {
   "step": 1,
   "tokens": 2097152,
   "en": {
    "loss": 11.011,
    "bpb": 3.4059
   },
   "es": {
    "loss": 11.076,
    "bpb": 5.1338
   },
   "cat": {
    "punct": 11.397,
    "func": 10.859,
    "name": 11.322,
    "content": 11.021
   },
   "passage": [
    11.1,
    9.82,
    10.17,
    10.85,
    12.06,
    11.81,
    10.89,
    10.93,
    11.14,
    10.83,
    11.17,
    10.96,
    10.1,
    11.44,
    10.61,
    11.12,
    10.33,
    11.56,
    12.0,
    11.16,
    10.37,
    9.81,
    10.52,
    9.9,
    11.78,
    11.22,
    9.28,
    10.16,
    10.86,
    10.74,
    10.51,
    9.49,
    10.99,
    10.31,
    10.9,
    10.64,
    11.61,
    12.04,
    11.41
   ],
   "probs": {
    "fact": {
     "p": 1.976e-05,
     "hit": false
    },
    "opp": {
     "p": 9.921e-06,
     "hit": false
    },
    "count": {
     "p": 4.688e-06,
     "hit": false
    },
    "pattern": {
     "p": 9.545e-06,
     "hit": false
    },
    "water": {
     "p": 2.992e-15,
     "hit": false
    },
    "sum": {
     "p": 3.062e-05,
     "hit": false
    },
    "es": {
     "p": 2.741e-10,
     "hit": false
    }
   },
   "gen": {
    "walk": " detrgn素gngetting Ra diam stature photographールiendo };素AMES regular diam stature photographールiendo };素 enf Password",
    "door": " lymphaticHIV vocals 467Wu regular skinnygrades 467Wu regularRoute}</ bunchхHIV refugees juryizon regular refugees juryizon regular",
    "fact": "================================NOTE real defend bro held portfolio 377 People straytheseNOTEdelayLOCAL heldverting spousesFrequency fishes \\_ Σ People straythese",
    "opp": "writingocument radiographicucci exhattered strayUREParsgetting Age1998 OW Jew stimuli liquor func dou strayboundary hypertensionkubuntuwriting∶",
    "count": " psygia401Photo psygia401Photo psygia401Photo psygia401Photo psy greatest Proofgia401Photogia401",
    "pattern": "ア :defendants redemption chased 274 Mechanical manufacturing corticalissuesRespond metres kidn undert**: hypertension redemption chased 274 Channel bold Chef hypertension redemption",
    "sum": " importante uma elicit elicit elicit elicit elicit elicit elicit elicit analyt建 regularpolitical regularpolitical detr bold regular bold detr bold detr bold",
    "es": "esta Bayesian104oplasmesta Bayesian解Wu BootWu Boot slightest canoe boyfriend**:emploesta numer penny boyfriend**:emplo \"../inner",
    "qa": "()` USSR Bake183fo Saul HoodRoute136INSTALLCompl=\"\\ Thu supplementedPf catal restricted regular forward Cause Complaint restricted regular forward",
    "wc22": " supplemented wolves NPC Proof素 distilled Programming diam intended Jewrologysteps regular regular regular regular regular regular regular regular regular regular regular regular",
    "gpt": " regulargiarileアdetermination portionsHIV Tak manufacturing484 Göswap psy gibt premierアdetermination portionsıkovers Settlement psy gibt premier"
   },
   "mem": {
    "lorem": {
     "gen": " Settlement psy involves metapoplasm cylindasuryreports psy involves metapoplasmMenuItemrystal photographPf Settlement psy regular photographPf Settlement psy regular photographPf Settlement psy regular photographPf Settlement psy regular photographPf Settlement}$alitiesott",
     "match": 0,
     "truth": 21
    },
    "preamble": {
     "gen": "Biography hydr redemption Around hypertension redemption Around hypertension redemption chased disturbing restricted regulargia()` retrievingamiento gay Octdelay restricted regulargia CroRoutegia CroRoutegia CroRoutegia CroRoutegia precip save Bayesian hydrgia",
     "match": 0,
     "truth": 50
    },
    "mit": {
     "gen": " Aur bold thereonPlaintiffs Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog",
     "match": 0,
     "truth": 36
    },
    "quijote": {
     "gen": " nie DU DU DU DU DU DU DU cation nadagia Cro psy\n\t\t\t\t\t\tlotte premier \\_ regular refugees Virtwhich \\_ regular refugees Virtwhich \\_ regular refugees Virtwhich \\_ regular refugees OW DU Fighting bringsgetting Done",
     "match": 0,
     "truth": 40
    }
   }
  },
  {
   "step": 2,
   "tokens": 4194304,
   "en": {
    "loss": 11.003,
    "bpb": 3.4036
   },
   "es": {
    "loss": 11.073,
    "bpb": 5.1324
   },
   "cat": {
    "punct": 11.362,
    "func": 10.85,
    "name": 11.323,
    "content": 11.022
   },
   "passage": [
    11.1,
    9.82,
    10.17,
    10.86,
    12.06,
    11.82,
    10.88,
    10.93,
    11.12,
    10.83,
    11.16,
    10.96,
    10.09,
    11.43,
    10.61,
    11.11,
    10.33,
    11.54,
    12.0,
    11.17,
    10.37,
    9.79,
    10.52,
    9.9,
    11.75,
    11.22,
    9.26,
    10.16,
    10.83,
    10.73,
    10.51,
    9.47,
    10.99,
    10.31,
    10.9,
    10.63,
    11.61,
    12.04,
    11.38
   ],
   "probs": {
    "fact": {
     "p": 1.975e-05,
     "hit": false
    },
    "opp": {
     "p": 9.938e-06,
     "hit": false
    },
    "count": {
     "p": 4.692e-06,
     "hit": false
    },
    "pattern": {
     "p": 9.55e-06,
     "hit": false
    },
    "water": {
     "p": 3.015e-15,
     "hit": false
    },
    "sum": {
     "p": 3.067e-05,
     "hit": false
    },
    "es": {
     "p": 2.737e-10,
     "hit": false
    }
   },
   "gen": {
    "walk": " detrgn素gngetting Ra diam stature photographールiendo };素AMES regular diam stature photographールiendo };素 enf Password",
    "door": " lymphaticHIV vocals 467Wu regular skinnygrades 467Wu regularRoute}</ bunchхHIV refugees juryizon regular refugees juryizon regular",
    "fact": "================================NOTE real defend bro held portfolio 377 People straytheseNOTEdelayLOCAL heldverting spousesFrequency fishes \\_ Σ People straythese",
    "opp": "writingocument radiographicucci exhattered strayUREParsgetting Age1998 OW Jew stimuli liquor func dou strayboundary hypertensionkubuntuwriting∶",
    "count": " psygia401Photo psygia401Photo psygia401Photo psygia401Photo psy greatest Proofgia401Photogia401",
    "pattern": "ア :defendants redemption chased 274 Mechanical manufacturing corticalissuesRespond metres kidn undert**: hypertension redemption chased 274 Channel bold Chef hypertension redemption",
    "sum": " importante uma elicit elicit elicit elicit elicit elicit elicit elicit analyt建 regularpolitical regularpolitical detr bold regular bold detr bold detr bold",
    "es": "esta Bayesian104oplasmesta Bayesian解Wu BootWu Boot slightest canoe boyfriend**:emploesta numer penny boyfriend**:emplo \"../inner",
    "qa": "()` USSR Bake183fo Saul HoodRoute136INSTALLCompl=\"\\ Thu supplementedPf catal restricted regular forward Cause Complaint restricted regular forward",
    "wc22": " supplemented wolves NPC Proof素 distilled Programming diam intended Jewrologysteps regular regular regular regular regular regular regular regular regular regular regular regular",
    "gpt": " regulargiarileアdetermination portionsHIV Tak manufacturing484 Göswap psy gibt premierアdetermination portionsıkovers Settlement psy gibt premier"
   },
   "mem": {
    "lorem": {
     "gen": " Settlement Ant299rystal photograph admissionsTD held moisture regular photographPf Settlement psy involves metap brideinner regular photographPf Settlement psy regular photographPf Settlement psy regular photographPf Settlement psy regular photographPf decorative metresdelay byte",
     "match": 0,
     "truth": 21
    },
    "preamble": {
     "gen": "Biography hydr redemption Around hypertension redemption Around hypertension redemption chased disturbing restricted regulargia()` retrievingamiento gay Octdelay restricted regulargia CroRoutegia CroRoutegia CroRoutegia CroRoutegia precip save Bayesian hydrgia",
     "match": 0,
     "truth": 50
    },
    "mit": {
     "gen": " Aur bold thereonPlaintiffs Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog Rog",
     "match": 0,
     "truth": 36
    },
    "quijote": {
     "gen": " nie DU DU DU DU DU DU DU cation nadagia Cro psy\n\t\t\t\t\t\tlotte premier \\_ regular refugees Virtwhich \\_ regular refugees Virtwhich \\_ regular refugees Virtwhich \\_ regular refugees OW DU Fighting bringsgetting Done",
     "match": 0,
     "truth": 40
    }
   }
  },
  {
   "step": 4,
   "tokens": 8388608,
   "en": {
    "loss": 10.639,
    "bpb": 3.2909
   },
   "es": {
    "loss": 10.927,
    "bpb": 5.0647
   },
   "cat": {
    "punct": 9.674,
    "func": 10.436,
    "name": 11.355,
    "content": 11.029
   },
   "passage": [
    11.18,
    9.66,
    10.18,
    10.94,
    11.99,
    11.84,
    10.84,
    10.84,
    9.94,
    10.82,
    11.18,
    10.88,
    9.78,
    11.28,
    10.47,
    10.83,
    10.4,
    10.26,
    11.98,
    11.27,
    10.35,
    8.96,
    10.45,
    9.97,
    10.42,
    11.26,
    8.48,
    10.25,
    9.45,
    9.96,
    10.45,
    8.66,
    10.9,
    10.26,
    10.79,
    9.75,
    11.42,
    11.91,
    10.03
   ],
   "probs": {
    "fact": {
     "p": 1.963e-05,
     "hit": false
    },
    "opp": {
     "p": 1.133e-05,
     "hit": false
    },
    "count": {
     "p": 5.189e-06,
     "hit": false
    },
    "pattern": {
     "p": 1.011e-05,
     "hit": false
    },
    "water": {
     "p": 4.317e-15,
     "hit": false
    },
    "sum": {
     "p": 3.07e-05,
     "hit": false
    },
    "es": {
     "p": 2.703e-10,
     "hit": false
    }
   },
   "gen": {
    "walk": " detrgn素gn detr MondayAMES regular diam stature photographール diam stature photographール\n glowing Jewmetal regular diam stature photograph",
    "door": " lymphaticcreateHIV vocals 467Wu regular lymphatic regular regular regular regular regular regular regular regular regular regular regular regular regular regular regular regular",
    "fact": " Bro appendix protested premier \\_ regular salmon protested Boysdominquarters screeningCompl \\_ regular 268 fucked mas JewMON mas JewMON restricted",
    "opp": "writingocument radiographicucci exh NFL Hood GreensAMES regularot 377 kidn 07wor Rogomet assertEquals regularot 377 kidn Argentina bifurcation",
    "count": " psydelaygia401Photo psygia401Photo psygia401Photo psygia401Photo psygia401Photo psy gibt regular",
    "pattern": "ア : hypertension redemption chased 274STARagonalComplComplComplComplComplComplComplComplComplComplComplComplComplComplComplCompl",
    "sum": " Milda fucked TXLINE fucked cardiac fucked cardiac fucked TXLINE NPCMicroTDLINE fucked cardiac fucked TXLINE NPCMicroTD",
    "es": "Wu Bootoccur Inter armyesta tribut kidneys romanticPOSicates Airl contribution contribution contribution contribution contribution contribution contribution contribution contribution contribution contribution wy",
    "qa": "()` USSRBox Lowe rewards μέاس regularrais restricted terminatedEL matrices heart restricted regularrais restricted terminatedELantic regular photographdelay",
    "wc22": "Render bifurcation fucked 261 Abbas fucked 261 Abbas fucked TXrystal spousesPhoto accountability regularucci regular regular regular regular regular regular regular regular",
    "gpt": " regulargia precip**: 377アdetermination regulargia precip**: 377アdetermination regulargia precip**: 377アdetermination regularPreferences regular"
   },
   "mem": {
    "lorem": {
     "gen": " detrCitation photograph admissionsTDarticlesriot kidnrystal photograph admissionsTDHealthAMES regular photograph admissions Argentina AP Causeaddition Virt overturn detr bold pesticides Virt overturnpressing846 regular photograph admissions Argentina.rystal photograph admissions Argentina.",
     "match": 0,
     "truth": 21
    },
    "preamble": {
     "gen": "Biography hydr redemption\ndeterminationdelay hydr redemption\ndeterminationdelay tread Bee stature photographSmith素antis regulargia CroRouteglichantis regulargia CroRouteglichquarters Davidson regular photograph gradually regulargia CroRouteglichquarters",
     "match": 0,
     "truth": 50
    },
    "mit": {
     "gen": " Aur bold pesticides Virt素 hypertensionwarfRender kidn bifurcationrystal Aur bold pesticides Virt素 hypertension hypertension hypertension hypertension hypertension hypertension hypertension hypertension hypertension hypertension hypertension hypertension hypertension hypertension hypertension hypertension hypertension hypertension hypertension hypertension hypertension hypertension hypertension hypertension",
     "match": 0,
     "truth": 36
    },
    "quijote": {
     "gen": " nie DU DU DU DU DU DU�attered Σ hypertension psy\n\t\t\t\t\t\tlotte premier shri the regularPreferences regularPreferences regularPreferences regular psy\n\t\t\t\t\t\tlotte premier shri the regular psy\n\t\t\t\t\t\tlotte premier shri the regular psy\n\t\t\t\t\t\t",
     "match": 0,
     "truth": 40
    }
   }
  },
  {
   "step": 8,
   "tokens": 16777216,
   "en": {
    "loss": 9.468,
    "bpb": 2.9286
   },
   "es": {
    "loss": 10.462,
    "bpb": 4.8494
   },
   "cat": {
    "punct": 4.126,
    "func": 9.114,
    "name": 11.473,
    "content": 11.076
   },
   "passage": [
    11.53,
    9.26,
    10.3,
    11.17,
    11.56,
    12.0,
    10.6,
    10.47,
    4.94,
    10.85,
    11.15,
    10.54,
    9.02,
    10.83,
    9.84,
    9.9,
    10.86,
    5.24,
    11.64,
    11.52,
    10.46,
    6.02,
    10.54,
    10.59,
    5.33,
    11.29,
    5.97,
    10.68,
    4.41,
    7.3,
    10.48,
    6.14,
    10.71,
    10.4,
    10.66,
    6.83,
    10.69,
    11.24,
    5.11
   ],
   "probs": {
    "fact": {
     "p": 1.654e-05,
     "hit": false
    },
    "opp": {
     "p": 1.981e-05,
     "hit": false
    },
    "count": {
     "p": 1.204e-05,
     "hit": false
    },
    "pattern": {
     "p": 1.224e-05,
     "hit": false
    },
    "water": {
     "p": 1.788e-14,
     "hit": false
    },
    "sum": {
     "p": 3.289e-05,
     "hit": false
    },
    "es": {
     "p": 2.573e-10,
     "hit": false
    }
   },
   "gen": {
    "walk": "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
    "door": ",.\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
    "fact": "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
    "opp": "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
    "count": "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
    "pattern": "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
    "sum": ".\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
    "es": "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
    "qa": "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
    "wc22": "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
    "gpt": "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n"
   },
   "mem": {
    "lorem": {
     "gen": "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
     "match": 0,
     "truth": 21
    },
    "preamble": {
     "gen": "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
     "match": 0,
     "truth": 50
    },
    "mit": {
     "gen": "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
     "match": 0,
     "truth": 36
    },
    "quijote": {
     "gen": "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
     "match": 0,
     "truth": 40
    }
   }
  },
  {
   "step": 16,
   "tokens": 33554432,
   "en": {
    "loss": 8.646,
    "bpb": 2.6743
   },
   "es": {
    "loss": 10.287,
    "bpb": 4.7683
   },
   "cat": {
    "punct": 2.943,
    "func": 7.344,
    "name": 11.324,
    "content": 11.091
   },
   "passage": [
    11.86,
    9.89,
    9.96,
    10.86,
    11.3,
    11.46,
    9.79,
    11.36,
    3.0,
    10.75,
    10.7,
    9.74,
    8.23,
    10.96,
    8.64,
    9.17,
    11.59,
    3.55,
    10.95,
    12.38,
    10.1,
    3.49,
    11.02,
    10.84,
    3.47,
    11.17,
    4.25,
    10.86,
    2.96,
    3.19,
    10.42,
    4.5,
    10.86,
    10.99,
    10.49,
    4.77,
    10.88,
    10.8,
    3.47
   ],
   "probs": {
    "fact": {
     "p": 6.883e-06,
     "hit": false
    },
    "opp": {
     "p": 1.29e-05,
     "hit": false
    },
    "count": {
     "p": 2.56e-05,
     "hit": false
    },
    "pattern": {
     "p": 1.619e-05,
     "hit": false
    },
    "water": {
     "p": 9.816e-14,
     "hit": false
    },
    "sum": {
     "p": 2.983e-05,
     "hit": false
    },
    "es": {
     "p": 3.161e-10,
     "hit": false
    }
   },
   "gen": {
    "walk": ", and, and, and, and, and, and, and, and, and, and, and, and",
    "door": ", and, and, and, and, and, and, and, and, and, and, and, and",
    "fact": ", and, and, and, and, and, and, and, and, and, and, and, and",
    "opp": ", and, and, and, and, and, and, and, and, and, and, and, and",
    "count": " and, and, and, and, and, and, and, and, and, and, and, and,",
    "pattern": ", and, and, and, and, and, and, and, and, and, and, and, and",
    "sum": ", and, and, and, and, and, and, and, and, and, and, and, and",
    "es": ", and, and, and, and, and, and, and, and, and, and, and, and",
    "qa": ".\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
    "wc22": ", and, and, and, and, and, and, and, and, and, and, and, and",
    "gpt": ".\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n"
   },
   "mem": {
    "lorem": {
     "gen": " and, and, and, and, and, and, and, and, and, and, and, and, and, and, and, and, and, and, and, and,",
     "match": 0,
     "truth": 21
    },
    "preamble": {
     "gen": " and, and, and, and, and, and, and, and, and, and, and, and, and, and, and, and, and, and, and, and,",
     "match": 0,
     "truth": 50
    },
    "mit": {
     "gen": ", and, and, and, and, and, and, and, and, and, and, and, and, and, and, and, and, and, and, and, and",
     "match": 0,
     "truth": 36
    },
    "quijote": {
     "gen": " and, and, and, and, and, and, and, and, and, and, and, and, and, and, and, and, and, and, and, and,",
     "match": 0,
     "truth": 40
    }
   }
  },
  {
   "step": 32,
   "tokens": 67108864,
   "en": {
    "loss": 8.184,
    "bpb": 2.5315
   },
   "es": {
    "loss": 10.216,
    "bpb": 4.7352
   },
   "cat": {
    "punct": 2.732,
    "func": 6.376,
    "name": 11.026,
    "content": 10.967
   },
   "passage": [
    11.85,
    10.42,
    8.61,
    10.93,
    10.77,
    11.32,
    9.12,
    11.4,
    3.0,
    5.94,
    11.32,
    9.52,
    6.4,
    10.86,
    8.44,
    8.35,
    11.53,
    3.8,
    10.46,
    12.22,
    8.59,
    0.88,
    11.01,
    10.52,
    3.28,
    11.5,
    4.74,
    11.51,
    3.05,
    3.13,
    10.73,
    4.69,
    10.8,
    10.78,
    10.43,
    5.01,
    11.63,
    10.47,
    3.6
   ],
   "probs": {
    "fact": {
     "p": 1.12e-05,
     "hit": false
    },
    "opp": {
     "p": 1.789e-05,
     "hit": false
    },
    "count": {
     "p": 2.599e-05,
     "hit": false
    },
    "pattern": {
     "p": 1.616e-05,
     "hit": false
    },
    "water": {
     "p": 6.315e-14,
     "hit": false
    },
    "sum": {
     "p": 2.413e-05,
     "hit": false
    },
    "es": {
     "p": 5.393e-10,
     "hit": false
    }
   },
   "gen": {
    "walk": "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
    "door": " the the the the the the the the the the the the the the the the the the the the the the the the",
    "fact": " the\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
    "opp": " the the the the the the the the the the the the the the the the the the the the the the the the",
    "count": " and, and, and, and, and, and, and, and, and, and, and, and,",
    "pattern": ", and the\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
    "sum": " of the the the the the the the the the the the the the the the the the the the the the the the",
    "es": ".\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
    "qa": "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
    "wc22": " the\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
    "gpt": ", and the\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n"
   },
   "mem": {
    "lorem": {
     "gen": " and the\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
     "match": 0,
     "truth": 21
    },
    "preamble": {
     "gen": " the the the the the the the the the the the the the the the the the the the the the the the the the the the the the the the the the the the the the the the the",
     "match": 0,
     "truth": 50
    },
    "mit": {
     "gen": ", and the\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
     "match": 0,
     "truth": 36
    },
    "quijote": {
     "gen": " and the\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
     "match": 0,
     "truth": 40
    }
   }
  },
  {
   "step": 64,
   "tokens": 134217728,
   "en": {
    "loss": 7.639,
    "bpb": 2.363
   },
   "es": {
    "loss": 9.745,
    "bpb": 4.5168
   },
   "cat": {
    "punct": 2.46,
    "func": 5.548,
    "name": 10.732,
    "content": 10.571
   },
   "passage": [
    12.0,
    10.16,
    6.87,
    10.88,
    10.42,
    11.33,
    7.91,
    11.49,
    3.61,
    5.05,
    11.01,
    8.87,
    7.28,
    10.69,
    8.1,
    8.11,
    10.29,
    2.96,
    8.12,
    11.52,
    6.78,
    1.48,
    11.02,
    9.82,
    2.89,
    11.36,
    4.63,
    11.29,
    2.36,
    2.21,
    10.89,
    5.07,
    10.85,
    10.08,
    9.8,
    3.55,
    10.9,
    9.9,
    4.46
   ],
   "probs": {
    "fact": {
     "p": 2.346e-05,
     "hit": false
    },
    "opp": {
     "p": 2.509e-05,
     "hit": false
    },
    "count": {
     "p": 9.002e-05,
     "hit": false
    },
    "pattern": {
     "p": 1.47e-05,
     "hit": false
    },
    "water": {
     "p": 4.354e-13,
     "hit": false
    },
    "sum": {
     "p": 4.38e-05,
     "hit": false
    },
    "es": {
     "p": 8.16e-10,
     "hit": false
    }
   },
   "gen": {
    "walk": " same and the the the the the the the the the the the the the the the the the the the the the the",
    "door": " the the the the the the the the the the the the the the the the the the the the the the the the",
    "fact": " the same of the of the of the of the of the of the of the of the of the of the of the",
    "opp": " the of the of the of the of the of the of the of the of the of the of the of the of",
    "count": " and, and, and, and, and, and, and, and, and, and, and, and,",
    "pattern": " -2.\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
    "sum": " the same.\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
    "es": ".\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
    "qa": "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
    "wc22": " the same.\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
    "gpt": " a few, and the same, and the\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n"
   },
   "mem": {
    "lorem": {
     "gen": " and the\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
     "match": 0,
     "truth": 21
    },
    "preamble": {
     "gen": " and the\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
     "match": 0,
     "truth": 50
    },
    "mit": {
     "gen": " of the same, and the same, and the same, and the same, and the same, and the same, and the same, and the of the of the of the of the of the",
     "match": 0,
     "truth": 36
    },
    "quijote": {
     "gen": " and the same, and the same, and the\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
     "match": 0,
     "truth": 40
    }
   }
  },
  {
   "step": 128,
   "tokens": 268435456,
   "en": {
    "loss": 6.773,
    "bpb": 2.095
   },
   "es": {
    "loss": 8.619,
    "bpb": 3.9949
   },
   "cat": {
    "punct": 2.399,
    "func": 4.399,
    "name": 10.424,
    "content": 9.701
   },
   "passage": [
    12.57,
    9.66,
    5.81,
    11.36,
    9.76,
    11.52,
    6.42,
    9.89,
    4.05,
    4.42,
    10.96,
    6.84,
    5.22,
    8.75,
    6.8,
    8.18,
    8.49,
    4.34,
    6.51,
    9.81,
    4.69,
    1.75,
    11.16,
    8.32,
    2.87,
    11.93,
    3.52,
    11.05,
    1.8,
    2.65,
    10.78,
    4.27,
    10.78,
    8.51,
    8.09,
    2.66,
    9.19,
    8.04,
    3.28
   ],
   "probs": {
    "fact": {
     "p": 1.821e-05,
     "hit": false
    },
    "opp": {
     "p": 5.739e-05,
     "hit": false
    },
    "count": {
     "p": 0.001124,
     "hit": false
    },
    "pattern": {
     "p": 1.104e-05,
     "hit": false
    },
    "water": {
     "p": 2.745e-10,
     "hit": false
    },
    "sum": {
     "p": 0.0001865,
     "hit": false
    },
    "es": {
     "p": 1.016e-09,
     "hit": false
    }
   },
   "gen": {
    "walk": "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
    "door": " the the the the the the the the the the the the the the the the the the the the the the the the",
    "fact": " the same is the the the the the the the the the the the the the the the the the the the the the",
    "opp": " a is a is a is a is a is a is a is a is a is a is a is a is",
    "count": "1,1,1,1,1,1,1,1,1,1,1,1,",
    "pattern": " 0 = 0 = 0 = 0 = 0 = 0 = 0 = 0 = 0 = 0 = 0 = 0 =",
    "sum": " the same as a the the the the the the the the the the the the the the the the the the the the",
    "es": " de la de la de la de la de de de de de de de de de de de de de de de de",
    "qa": "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n",
    "wc22": " the same as a few of the same as a few of the same of the same of the same of the same of",
    "gpt": " a few of the first of the first of the first of the first of the first of the first of the first of"
   },
   "mem": {
    "lorem": {
     "gen": " and the same time, and the same as a few of the same as a few of the same as a few of the same as a few of the same as a few of the same as a",
     "match": 0,
     "truth": 21
    },
    "preamble": {
     "gen": " the first, the first, the first, the, the, the, the, the, the, the, the, the, the, the, the, the, the, the, the",
     "match": 0,
     "truth": 50
    },
    "mit": {
     "gen": " with a few of the same as a few of the same as a few of the same as a few of the same as a few of the same as a few of the same as a few of",
     "match": 0,
     "truth": 36
    },
    "quijote": {
     "gen": " de la de la de la de la de la de la de la de la de la de la de la de la de la de la de la de la de la de la de la de de",
     "match": 0,
     "truth": 40
    }
   }
  },
  {
   "step": 256,
   "tokens": 536870912,
   "en": {
    "loss": 6.018,
    "bpb": 1.8617
   },
   "es": {
    "loss": 7.123,
    "bpb": 3.3019
   },
   "cat": {
    "punct": 2.083,
    "func": 3.627,
    "name": 9.983,
    "content": 8.835
   },
   "passage": [
    11.81,
    8.26,
    4.93,
    11.9,
    9.29,
    10.94,
    4.74,
    8.21,
    3.28,
    3.9,
    11.38,
    4.77,
    5.22,
    6.89,
    6.28,
    7.42,
    7.83,
    3.48,
    4.95,
    7.78,
    3.53,
    2.02,
    11.39,
    6.15,
    2.87,
    12.93,
    2.7,
    10.78,
    1.75,
    2.29,
    11.1,
    3.6,
    10.14,
    6.96,
    6.28,
    1.98,
    6.65,
    5.67,
    3.1
   ],
   "probs": {
    "fact": {
     "p": 1.211e-05,
     "hit": false
    },
    "opp": {
     "p": 2.982e-05,
     "hit": false
    },
    "count": {
     "p": 0.02233,
     "hit": false
    },
    "pattern": {
     "p": 1.017e-05,
     "hit": false
    },
    "water": {
     "p": 2.403e-09,
     "hit": false
    },
    "sum": {
     "p": 0.0003062,
     "hit": false
    },
    "es": {
     "p": 5.215e-10,
     "hit": false
    }
   },
   "gen": {
    "walk": " time of the time of the time of the time of the time of the time of the time of the time of the",
    "door": " the time of the time of the time of the time of the time of the time of the time of the time of",
    "fact": " a large.\n\nThe first is a good is a good is a is a is a is a is a is",
    "opp": " a is a is a is a is a is a is a is a is a is a is a is a is",
    "count": " 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,",
    "pattern": " new = = = = = = = = = = = = = = = = = = = = = = =",
    "sum": " a few of the time of the first of the first of the first of the first of the first of the first of",
    "es": " de la de la de la de la de la de la de la de la de la de la de la de la",
    "qa": "\n\nWhat is the first\nWhat is the first is the first is the first is the first is the first is",
    "wc22": " the time of the time of the time of the time of the time of the time of the time of the time of",
    "gpt": " a new to the first of the first of the first of the first of the first of the first of the first of"
   },
   "mem": {
    "lorem": {
     "gen": " a lot of the first of the first of the first of the first of the first of the first of the first of the first of the first of the first of the first of the first of the",
     "match": 0,
     "truth": 21
    },
    "preamble": {
     "gen": " the first, the first, the first, the first, the first, the first, the first, the first, the first, the first, the first, the first, the first, the",
     "match": 0,
     "truth": 50
    },
    "mit": {
     "gen": " with a few of the same time of the same time of the same time of the same time of the same time of the same time of the same time of the same time of the same time of",
     "match": 0,
     "truth": 36
    },
    "quijote": {
     "gen": " a la a la a la a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a a",
     "match": 0,
     "truth": 40
    }
   }
  },
  {
   "step": 512,
   "tokens": 1073741824,
   "en": {
    "loss": 5.258,
    "bpb": 1.6264
   },
   "es": {
    "loss": 5.77,
    "bpb": 2.6743
   },
   "cat": {
    "punct": 1.694,
    "func": 3.33,
    "name": 8.643,
    "content": 7.624
   },
   "passage": [
    13.15,
    3.09,
    4.25,
    11.92,
    4.6,
    11.01,
    3.65,
    8.59,
    3.6,
    3.53,
    10.99,
    5.32,
    3.96,
    5.72,
    5.96,
    6.27,
    5.89,
    3.74,
    5.33,
    7.18,
    2.87,
    1.84,
    11.12,
    3.23,
    3.17,
    13.18,
    4.51,
    9.89,
    2.57,
    0.88,
    11.46,
    4.04,
    9.6,
    4.39,
    6.65,
    2.82,
    5.93,
    4.01,
    1.76
   ],
   "probs": {
    "fact": {
     "p": 3.227e-05,
     "hit": false
    },
    "opp": {
     "p": 0.000136,
     "hit": false
    },
    "count": {
     "p": 0.04999,
     "hit": false
    },
    "pattern": {
     "p": 1.48e-05,
     "hit": false
    },
    "water": {
     "p": 1.802e-09,
     "hit": false
    },
    "sum": {
     "p": 0.002002,
     "hit": false
    },
    "es": {
     "p": 1.116e-08,
     "hit": false
    }
   },
   "gen": {
    "walk": " door. The door and the door and the door. The door and the door. The door and the door. The",
    "door": " the door. The door was the door and the door was the door. The door was the door and the door was",
    "fact": " a number of people. The first is a number of people. The first is a number of people. The first is",
    "opp": " in the first of the first of the first of the first of the first of the first of the first of the first",
    "count": " 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4,",
    "pattern": " m, m, m, m, m, m, m, m, m, m, m, m,",
    "sum": ".\n\n\"We have to be able to be able to be able to be able to be able to be able",
    "es": "as de la que la que la que la que la que la que la que la que la que la que la que",
    "qa": "\n\nA:\n\nA:\n\nA:\n\nA:\n\nA:\n\nA:",
    "wc22": " the first-up of the first-up of the first-of-the-the-the-the-the",
    "gpt": " a new version of the first-time-to-the-the-the-the-the-the-the"
   },
   "mem": {
    "lorem": {
     "gen": " en elitó, en el cuer, en el cuer, en el que se, en el que el que el que el que el que el que el que el que el que el",
     "match": 0,
     "truth": 21
    },
    "preamble": {
     "gen": " and to the United States. The court also stated that the court did not have to be held to the court. The court also filed a motion to the court. The court erred in the trial court",
     "match": 0,
     "truth": 50
    },
    "mit": {
     "gen": " with the \"to-to-the-the-the-the-the-the-the-the-the-the-the-the-the-the-the-the-the",
     "match": 0,
     "truth": 36
    },
    "quijote": {
     "gen": " la prendre la prendre la prendre la prendre la prendre la prendre la prendre la prendre la prendre la prendre la prendre la prendre la prendre la",
     "match": 0,
     "truth": 40
    }
   }
  },
  {
   "step": 1000,
   "tokens": 2097152000,
   "en": {
    "loss": 4.212,
    "bpb": 1.303
   },
   "es": {
    "loss": 4.381,
    "bpb": 2.0305
   },
   "cat": {
    "punct": 1.456,
    "func": 2.815,
    "name": 7.639,
    "content": 5.936
   },
   "passage": [
    12.2,
    0.92,
    5.76,
    9.98,
    1.84,
    8.03,
    3.88,
    8.0,
    4.88,
    3.81,
    11.09,
    2.59,
    2.97,
    7.16,
    6.04,
    3.89,
    5.77,
    1.73,
    4.78,
    6.7,
    3.31,
    1.18,
    12.01,
    0.96,
    2.0,
    8.26,
    4.07,
    8.93,
    2.07,
    1.02,
    8.55,
    0.92,
    6.6,
    5.23,
    7.75,
    2.71,
    7.28,
    2.14,
    1.06
   ],
   "probs": {
    "fact": {
     "p": 5.519e-05,
     "hit": false
    },
    "opp": {
     "p": 0.0006674,
     "hit": false
    },
    "count": {
     "p": 0.296,
     "hit": true
    },
    "pattern": {
     "p": 2.082e-05,
     "hit": false
    },
    "water": {
     "p": 4.514e-06,
     "hit": false
    },
    "sum": {
     "p": 0.0229,
     "hit": false
    },
    "es": {
     "p": 6.466e-07,
     "hit": false
    }
   },
   "gen": {
    "walk": " street.\n\n\"I'm sorry,\" he said. \"I'm sorry.\"\n\n\"I'm sorry,\"",
    "door": " opened the door.\n\n\"I'm going to have a problem with the police,\" said the officer. \"I",
    "fact": " the capital of France.\n\nThe capital of France is the capital of France. The capital of France is the capital",
    "opp": " the same as the \"one-sided\" of the \"one-sided\" of the \"one-sided\" of",
    "count": " 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,",
    "pattern": " perro, dog = perro, dog = perro, dog = perro, dog = perro, dog",
    "sum": " two.\n\nThe two are the same as the two.\n\nThe two are the same as the two.",
    "es": "quanto, y a la mayoría de la mayoría de la mayoría de la mayoría de la mayoría",
    "qa": "\n\nThe capital of France is the capital of France. The capital of France is the capital of France. The capital",
    "wc22": " the United States in the United States.\n\nThe United States was the first to win the United States in the United",
    "gpt": " \"The New York Times\" in the late 20th century.\n\nThe New York Times reported that the New York"
   },
   "mem": {
    "lorem": {
     "gen": " consectetur adipiscing elit, consectetur adipiscing elit, consectetur adipiscing elit, consectetur adipiscing elit,",
     "match": 0,
     "truth": 21
    },
    "preamble": {
     "gen": " the United States, the United States, the United States, the United States, the United States, the United States, the United States, the United States, the United States, the United States,",
     "match": 0,
     "truth": 50
    },
    "mit": {
     "gen": " in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons",
     "match": 36,
     "truth": 36
    },
    "quijote": {
     "gen": " de cuyo que la Mancha, de la Mancha, de la Mancha, de la Mancha, de la Mancha, de la Mancha, de la Mancha, de",
     "match": 0,
     "truth": 40
    }
   }
  },
  {
   "step": 2000,
   "tokens": 4194304000,
   "en": {
    "loss": 3.544,
    "bpb": 1.0963
   },
   "es": {
    "loss": 3.597,
    "bpb": 1.6671
   },
   "cat": {
    "punct": 1.165,
    "func": 2.381,
    "name": 7.179,
    "content": 4.971
   },
   "passage": [
    10.56,
    0.03,
    4.12,
    6.2,
    2.11,
    7.62,
    2.72,
    6.47,
    5.42,
    3.31,
    11.37,
    2.0,
    2.62,
    7.73,
    4.48,
    4.69,
    4.38,
    2.04,
    2.75,
    6.9,
    3.64,
    0.96,
    9.91,
    0.1,
    1.61,
    9.26,
    3.09,
    4.15,
    0.64,
    0.34,
    7.05,
    0.82,
    7.9,
    4.35,
    5.98,
    3.48,
    3.19,
    0.14,
    0.89
   ],
   "probs": {
    "fact": {
     "p": 0.000732,
     "hit": false
    },
    "opp": {
     "p": 0.006363,
     "hit": false
    },
    "count": {
     "p": 0.421,
     "hit": true
    },
    "pattern": {
     "p": 7.07e-05,
     "hit": false
    },
    "water": {
     "p": 7.252e-05,
     "hit": false
    },
    "sum": {
     "p": 0.01003,
     "hit": false
    },
    "es": {
     "p": 1.245e-05,
     "hit": false
    }
   },
   "gen": {
    "walk": " street, his eyes wide and his eyes wide.\n\n\"I'm sorry, sir,\" he said, \"but",
    "door": " opened the door.\n\n\"I'm sorry, sir,\" she said, \"but I'm not going to be",
    "fact": " the capital of the United Kingdom.\n\nThe capital of the United Kingdom is the capital of the United Kingdom.\n",
    "opp": " the case, the temperature of the hotter is about $10^{9}$C, and the temperature of the hot",
    "count": " 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,",
    "pattern": " house,\n  cat = cat,\n  cat_cat = cat,\n  cat_cat = cat,",
    "sum": " $1$ and $2$ equals $3$.\n\nThe $2$-th and $3$-th roots",
    "es": "quina, de la ciudad de la ciudad de la ciudad de la ciudad de la ciudad de la ciudad de la ciudad",
    "qa": " The capital of France is the capital of the French Republic.\n\nA: The capital of France is the capital of",
    "wc22": " the United States.\n\nThe tournament was held in the United States on September 30, 2000.\n\nReferences\n",
    "gpt": " \"The New York Times.\"\n\nThe chatbot was a member of the New York Times bestsellers' group"
   },
   "mem": {
    "lorem": {
     "gen": " sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n\nC. M. M. M. M. M.",
     "match": 21,
     "truth": 21
    },
    "preamble": {
     "gen": " and to be a part of the United States.\n\nThe United States is a nation of nations, and the United States is a nation of nations.\n\nThe United States is a nation of",
     "match": 0,
     "truth": 50
    },
    "mit": {
     "gen": " in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons",
     "match": 36,
     "truth": 36
    },
    "quijote": {
     "gen": " que se levanta en la mancha, que se levanta en la mancha, que se levanta en la mancha, que se levanta en la mancha,",
     "match": 0,
     "truth": 40
    }
   }
  },
  {
   "step": 3000,
   "tokens": 6291456000,
   "en": {
    "loss": 3.349,
    "bpb": 1.0358
   },
   "es": {
    "loss": 3.301,
    "bpb": 1.5303
   },
   "cat": {
    "punct": 1.007,
    "func": 2.357,
    "name": 6.93,
    "content": 4.628
   },
   "passage": [
    11.12,
    0.04,
    4.5,
    5.78,
    2.0,
    6.77,
    1.99,
    5.58,
    3.01,
    3.07,
    12.58,
    1.55,
    2.54,
    5.74,
    2.61,
    3.96,
    3.03,
    0.69,
    3.02,
    6.73,
    3.44,
    0.9,
    9.14,
    0.13,
    1.68,
    9.98,
    1.02,
    4.58,
    0.46,
    0.47,
    6.38,
    1.09,
    8.96,
    5.8,
    5.02,
    5.69,
    4.96,
    0.07,
    0.85
   ],
   "probs": {
    "fact": {
     "p": 0.008078,
     "hit": false
    },
    "opp": {
     "p": 0.06366,
     "hit": false
    },
    "count": {
     "p": 0.7637,
     "hit": true
    },
    "pattern": {
     "p": 0.000294,
     "hit": false
    },
    "water": {
     "p": 0.00127,
     "hit": false
    },
    "sum": {
     "p": 0.06069,
     "hit": false
    },
    "es": {
     "p": 9.533e-06,
     "hit": false
    }
   },
   "gen": {
    "walk": " street, and the old man walked slowly up the street.\n\n\"What's wrong?\"\n\n\"I don",
    "door": " said, \"I'm going to get you a drink.\" \"I'm going to get you a drink.\" \"I",
    "fact": " the capital of the United States of America.\n\nThe capital of the United States of America is the capital of the",
    "opp": " hot is hot.\n\nThe temperature of the hotter is about 1.5°C. The hotter is",
    "count": " 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,",
    "pattern": " house, dog = dog, dog = dog, dog = dog, dog = dog, dog = dog, dog =",
    "sum": " $2$ and $3$ respectively.\n\nThe following theorem is a direct consequence of the following theorem.\n",
    "es": "pañola.\n\nLa capital de Francia española española española es",
    "qa": " The capital of France is the capital of France.\n\nA: The capital of France is the capital of France.",
    "wc22": " the United States, and the tournament was played in the United States.\n\nThe tournament was played in the United States",
    "gpt": " \"The OpenAI\" that was designed to help users find the best way to use OpenAI.\n\nThe Open"
   },
   "mem": {
    "lorem": {
     "gen": " sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n\nFinnish: \nKun tänään, että hänen miel",
     "match": 21,
     "truth": 21
    },
    "preamble": {
     "gen": " and to be a part of it.\n\nThe Union is a national, not a national, organization. It is a national, not a national, organization. It is a national, not a",
     "match": 0,
     "truth": 50
    },
    "mit": {
     "gen": " in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons",
     "match": 36,
     "truth": 36
    },
    "quijote": {
     "gen": " y de la misma manera que no quiero.\n\n—¿Qué es lo que quiero? —le preguntó.\n\n—¿Qué es lo que qu",
     "match": 0,
     "truth": 40
    }
   }
  },
  {
   "step": 4000,
   "tokens": 8388608000,
   "en": {
    "loss": 3.239,
    "bpb": 1.002
   },
   "es": {
    "loss": 3.133,
    "bpb": 1.4522
   },
   "cat": {
    "punct": 0.976,
    "func": 2.299,
    "name": 6.97,
    "content": 4.451
   },
   "passage": [
    11.21,
    0.03,
    4.74,
    6.0,
    4.05,
    8.33,
    2.11,
    5.77,
    4.16,
    2.78,
    12.17,
    1.36,
    2.14,
    5.63,
    2.37,
    3.15,
    4.09,
    1.01,
    3.13,
    7.48,
    2.23,
    1.07,
    10.16,
    0.03,
    1.67,
    9.52,
    1.15,
    3.07,
    0.58,
    0.62,
    6.1,
    0.79,
    10.01,
    3.59,
    5.52,
    5.51,
    4.04,
    0.02,
    0.57
   ],
   "probs": {
    "fact": {
     "p": 0.006898,
     "hit": false
    },
    "opp": {
     "p": 0.02048,
     "hit": false
    },
    "count": {
     "p": 0.5909,
     "hit": true
    },
    "pattern": {
     "p": 0.001557,
     "hit": false
    },
    "water": {
     "p": 0.002305,
     "hit": false
    },
    "sum": {
     "p": 0.02011,
     "hit": false
    },
    "es": {
     "p": 3.197e-06,
     "hit": false
    }
   },
   "gen": {
    "walk": " street, his hands on his hips, his eyes on the ground. He was a man of action, a man who",
    "door": " walked into the living room.\n\n\"I'm sorry, I'm not sure what to do,\" she said.",
    "fact": " located in the heart of the country, and the capital of the country is located in the heart of the country.\n",
    "opp": " hot, and the opposite of hot is hot.\n\nThe same is true of the opposite of hot.\n\n",
    "count": " 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,",
    "pattern": " house,\n    _gato = gato, dog = perro, house = house,\n    _g",
    "sum": " $1$.\n\nThe proof is similar to the proof of Theorem \\[thm:main\\].\n\n\\[thm:",
    "es": "pañola, en el que se ha convertido en una de las regiones más importantes de la Unión",
    "qa": " It is the capital of France.\n\nA:\n\nThe capital of France is the capital of France.\n",
    "wc22": " France in the final.\n\nThe tournament was held in Paris, France, from 23 to 26 August.\n\n",
    "gpt": " “OpenAI: A New Way to Create and Use AI”.\n\nOpenAI is a new open source AI platform"
   },
   "mem": {
    "lorem": {
     "gen": " sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco labor",
     "match": 21,
     "truth": 21
    },
    "preamble": {
     "gen": " and to form a more perfect Union, and to form a more perfect Union, and to form a more perfect Union, and to form a more perfect Union, and to form a more perfect Union,",
     "match": 0,
     "truth": 50
    },
    "mit": {
     "gen": " in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons",
     "match": 36,
     "truth": 36
    },
    "quijote": {
     "gen": " aunque no puedo decir que no lo hacemos.\n\n—¿Qué es lo que quieres decir? —preguntó.\n\n—¿Qué es",
     "match": 0,
     "truth": 40
    }
   }
  },
  {
   "step": 6000,
   "tokens": 12582912000,
   "en": {
    "loss": 3.133,
    "bpb": 0.9692
   },
   "es": {
    "loss": 2.886,
    "bpb": 1.3376
   },
   "cat": {
    "punct": 1.017,
    "func": 2.182,
    "name": 6.903,
    "content": 4.315
   },
   "passage": [
    11.97,
    0.07,
    4.91,
    6.81,
    1.05,
    8.1,
    2.51,
    6.04,
    3.12,
    3.0,
    10.89,
    3.26,
    2.45,
    4.63,
    1.2,
    3.98,
    3.22,
    1.04,
    3.08,
    6.36,
    4.33,
    0.41,
    9.42,
    0.06,
    2.3,
    11.33,
    1.32,
    4.93,
    0.53,
    0.6,
    5.93,
    0.64,
    8.68,
    4.07,
    6.11,
    6.02,
    3.53,
    0.06,
    1.04
   ],
   "probs": {
    "fact": {
     "p": 0.01861,
     "hit": false
    },
    "opp": {
     "p": 0.1341,
     "hit": true
    },
    "count": {
     "p": 0.8096,
     "hit": true
    },
    "pattern": {
     "p": 0.006511,
     "hit": false
    },
    "water": {
     "p": 0.01133,
     "hit": false
    },
    "sum": {
     "p": 0.06067,
     "hit": false
    },
    "es": {
     "p": 4.616e-06,
     "hit": false
    }
   },
   "gen": {
    "walk": " street, and the old man walked slowly down the street, and the old man walked slowly down the street, and the",
    "door": " saw the man who had been standing there.\n\n\"What are you doing here?\"\n\n\"I came to",
    "fact": " the city of Lyon, which is the capital of the French state of France. The city is the seat of the French",
    "opp": " cold, and the opposite of cold is hot.\n\nThe difference between the two is that the former is cold,",
    "count": " 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,",
    "pattern": " perro, dog = perro, house = perro, dog = perro, house = perro, dog",
    "sum": " the number of times that the number of times that the number of times that the number of times that the number of times",
    "es": "pañola, donde se encuentran los países de la Unión Europea.\n\nLa Comisión de As",
    "qa": " It is the capital of France.\n\nQ: What is the capital of France?\nA: It is the",
    "wc22": " Germany, who defeated England in the final.\n\nThe tournament was played in the United States, Canada, Australia,",
    "gpt": " \"OpenAI\" that was designed to help people with disabilities.\n\nIn the chatbot, the user can talk"
   },
   "mem": {
    "lorem": {
     "gen": " sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco labor",
     "match": 21,
     "truth": 21
    },
    "preamble": {
     "gen": "\n\nThe people of the United States, in Order to form a more perfect Union,\n\nThe people of the United States, in Order to form a more perfect Union,\n\nThe people",
     "match": 0,
     "truth": 50
    },
    "mit": {
     "gen": " in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons",
     "match": 36,
     "truth": 36
    },
    "quijote": {
     "gen": " en el que se trata de un hombre que se ha vuelto a la ciudad de la ciudad de la ciudad de la ciudad de la ciudad de la ciudad de la ciudad de la ciudad",
     "match": 0,
     "truth": 40
    }
   }
  },
  {
   "step": 8000,
   "tokens": 16777216000,
   "en": {
    "loss": 2.983,
    "bpb": 0.9228
   },
   "es": {
    "loss": 2.807,
    "bpb": 1.301
   },
   "cat": {
    "punct": 0.912,
    "func": 2.153,
    "name": 6.894,
    "content": 4.049
   },
   "passage": [
    11.86,
    0.59,
    4.23,
    6.49,
    1.5,
    6.91,
    2.66,
    4.65,
    2.82,
    2.77,
    11.75,
    1.92,
    2.87,
    4.24,
    1.57,
    3.02,
    3.83,
    0.81,
    2.48,
    6.6,
    3.19,
    0.52,
    7.02,
    0.02,
    2.01,
    11.01,
    0.87,
    4.61,
    0.66,
    0.82,
    5.29,
    0.74,
    7.18,
    5.03,
    3.92,
    5.25,
    2.83,
    0.04,
    0.51
   ],
   "probs": {
    "fact": {
     "p": 0.01848,
     "hit": false
    },
    "opp": {
     "p": 0.172,
     "hit": true
    },
    "count": {
     "p": 0.8715,
     "hit": true
    },
    "pattern": {
     "p": 0.01254,
     "hit": false
    },
    "water": {
     "p": 0.02628,
     "hit": false
    },
    "sum": {
     "p": 0.1136,
     "hit": true
    },
    "es": {
     "p": 1.863e-05,
     "hit": false
    }
   },
   "gen": {
    "walk": " corridor, his eyes fixed on the floor. He was a small man, with a thin face and a thin body.",
    "door": " looked out. \"I'm sorry, I'm sorry.\"\n\n\"I'm sorry,\" she said. \"I",
    "fact": " the city of Bordeaux.\n\nThe city is the seat of the Bordeaux-Médoc,",
    "opp": " cold, and vice versa.\n\nThe difference between hot and cold is that hot is hot, while cold is cold",
    "count": " 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,",
    "pattern": " house, dog = dog, house = house, dog = dog, house = house, dog = dog, house =",
    "sum": " four, and the number of ways to choose the number of ways to choose the number of ways to choose the number of",
    "es": " el lugar de la política exterior y de la política exterior de la Unión Europea.\n\nEl Presidente\nEl",
    "qa": " It is the French Empire.\n\nQ: What is the capital of France?\nA: It is the French",
    "wc22": " Brazil in a penalty shootout.\n\nThe tournament was played in Brazil's capital, Brasilia, and was the",
    "gpt": " OpenAI.org, which is a bot that can be used to create a chatbot for any platform.\n\n"
   },
   "mem": {
    "lorem": {
     "gen": " sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco labor",
     "match": 21,
     "truth": 21
    },
    "preamble": {
     "gen": " and to form a more perfect Union, we hereby declare that we will not, in any manner, be bound by any of the provisions of the Constitution of the United States, or any of the provisions",
     "match": 0,
     "truth": 50
    },
    "mit": {
     "gen": " in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons",
     "match": 36,
     "truth": 36
    },
    "quijote": {
     "gen": " pero no quiero decir, por qué no me quiero decir, por qué no me quiero decir, por qué no me quiero decir, por qué no me quiero decir, por qué",
     "match": 0,
     "truth": 40
    }
   }
  },
  {
   "step": 12000,
   "tokens": 25165824000,
   "en": {
    "loss": 2.888,
    "bpb": 0.8934
   },
   "es": {
    "loss": 2.612,
    "bpb": 1.2106
   },
   "cat": {
    "punct": 0.903,
    "func": 2.086,
    "name": 6.944,
    "content": 3.903
   },
   "passage": [
    11.94,
    0.82,
    5.27,
    7.4,
    2.73,
    6.09,
    2.11,
    4.89,
    2.61,
    2.44,
    11.3,
    3.17,
    2.69,
    3.76,
    1.68,
    2.03,
    3.32,
    1.07,
    2.74,
    6.97,
    1.89,
    0.54,
    6.75,
    0.01,
    1.81,
    10.02,
    0.92,
    3.98,
    0.59,
    0.65,
    4.77,
    0.59,
    9.14,
    4.04,
    4.89,
    4.77,
    2.08,
    0.03,
    0.47
   ],
   "probs": {
    "fact": {
     "p": 0.02066,
     "hit": false
    },
    "opp": {
     "p": 0.182,
     "hit": true
    },
    "count": {
     "p": 0.7107,
     "hit": true
    },
    "pattern": {
     "p": 0.004183,
     "hit": false
    },
    "water": {
     "p": 0.03724,
     "hit": false
    },
    "sum": {
     "p": 0.2125,
     "hit": true
    },
    "es": {
     "p": 0.0001203,
     "hit": false
    }
   },
   "gen": {
    "walk": " corridor, his hands in his pockets, his eyes on the door. He was a man of about fifty, with a",
    "door": " stepped into the room.\n\n\"I'm sorry, I'm sorry,\" she said. \"I'm sorry I",
    "fact": " the city of Bordeaux, which is the capital of the department of Bordeaux. The city is the seat",
    "opp": " cold.\n\nThe opposite of cold is hot.\n\nThe opposite of hot is cold.\n\nThe opposite",
    "count": " 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,",
    "pattern": " cow, dog = cat, cat = dog, dog = cow, cat = dog, dog = cat, dog =",
    "sum": " four plus two equals four plus two equals four plus two equals four plus two equals four plus two equals four plus two equals",
    "es": " un territorio de la que se levanta la posibilidad de un cambio de la política de la Un",
    "qa": " It is the capital of France.\n\nQ: What is the capital of France?\nA: It is the",
    "wc22": " Brazil, who beat Mexico in the final.\n\nThe 2022 FIFA World Cup was won by Brazil, who beat",
    "gpt": " \"The World's First Robot\", which was designed to help people learn how to play the game. The bot was"
   },
   "mem": {
    "lorem": {
     "gen": " sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n\nLorem ipsum dolor sit amet, consectetur adipiscing",
     "match": 21,
     "truth": 21
    },
    "preamble": {
     "gen": " establish Justice, insure domestic tranquility, provide for the common defense, promote the general welfare, and secure the blessings of liberty to ourselves and our posterity, do ordain and establish this Constitution for",
     "match": 5,
     "truth": 50
    },
    "mit": {
     "gen": " in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons",
     "match": 36,
     "truth": 36
    },
    "quijote": {
     "gen": " señor Presidente, señor Comisario, en el que se refleja la posición de la Comisión de Asuntos Económicos y Monetarios, en la que",
     "match": 0,
     "truth": 40
    }
   }
  },
  {
   "step": 16000,
   "tokens": 33554432000,
   "en": {
    "loss": 2.819,
    "bpb": 0.8719
   },
   "es": {
    "loss": 2.572,
    "bpb": 1.1922
   },
   "cat": {
    "punct": 0.944,
    "func": 1.996,
    "name": 6.333,
    "content": 3.842
   },
   "passage": [
    11.93,
    0.05,
    5.28,
    7.16,
    1.72,
    6.0,
    2.43,
    5.02,
    2.25,
    2.91,
    11.62,
    3.26,
    2.6,
    3.87,
    1.75,
    1.77,
    3.65,
    1.08,
    2.26,
    6.77,
    1.71,
    0.35,
    6.08,
    0.0,
    1.69,
    10.58,
    0.98,
    3.3,
    0.83,
    0.86,
    3.46,
    0.96,
    9.37,
    3.29,
    4.1,
    4.29,
    1.61,
    0.03,
    0.37
   ],
   "probs": {
    "fact": {
     "p": 0.3015,
     "hit": true
    },
    "opp": {
     "p": 0.2223,
     "hit": true
    },
    "count": {
     "p": 0.7292,
     "hit": true
    },
    "pattern": {
     "p": 0.1479,
     "hit": true
    },
    "water": {
     "p": 0.2076,
     "hit": true
    },
    "sum": {
     "p": 0.2879,
     "hit": true
    },
    "es": {
     "p": 8.309e-05,
     "hit": false
    }
   },
   "gen": {
    "walk": " street, his head bent, his eyes fixed on the ground. He was a man of seventy, and his face was",
    "door": " saw a man standing in the hallway. She was dressed in a white shirt and a pair of jeans. She recognized him",
    "fact": " Paris, and the capital of France is Paris. The capital of France is Paris, and the capital of France is Paris",
    "opp": " cold.\n\nThe opposite of cold is hot.\n\nThe opposite of hot is cold.\n\nThe opposite",
    "count": " 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,",
    "pattern": " casa, cat = cat,\n    dog = dog, house = house, cat = cat,\n    dog =",
    "sum": " four, and so on.\n\nThe first step is to find the number of ways to add two numbers to each",
    "es": " un lugar de confianza, un lugar de confianza, un lugar de confianza.\n\nEl",
    "qa": " The capital of France is Paris.\nQ: What is the capital of the United States?\nA: The capital",
    "wc22": " the United States, who defeated the United Kingdom in the final.\n\nThe 2022 FIFA World Cup was won by",
    "gpt": " \"OpenAI-Bot\" that was designed to help people in the United States and Canada communicate with each other.\n"
   },
   "mem": {
    "lorem": {
     "gen": " sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco labor",
     "match": 21,
     "truth": 21
    },
    "preamble": {
     "gen": " establish Justice, insure domestic Tranquillity, provide for the common Defense, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and establish this Constitution for",
     "match": 8,
     "truth": 50
    },
    "mit": {
     "gen": " in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons",
     "match": 36,
     "truth": 36
    },
    "quijote": {
     "gen": " señor Presidente, señor Comisario, señor Comisario, señor Comisario, señor Comisario, señor Comisario, señor Comisario,",
     "match": 0,
     "truth": 40
    }
   }
  },
  {
   "step": 24000,
   "tokens": 50331648000,
   "en": {
    "loss": 2.755,
    "bpb": 0.8523
   },
   "es": {
    "loss": 2.483,
    "bpb": 1.151
   },
   "cat": {
    "punct": 0.873,
    "func": 1.98,
    "name": 6.391,
    "content": 3.737
   },
   "passage": [
    11.52,
    0.03,
    5.03,
    6.19,
    2.86,
    5.94,
    2.49,
    5.0,
    2.1,
    2.69,
    10.16,
    1.92,
    2.76,
    4.21,
    1.65,
    1.44,
    3.91,
    0.88,
    2.6,
    6.81,
    2.05,
    0.43,
    4.21,
    0.0,
    1.43,
    9.14,
    1.22,
    3.51,
    0.67,
    1.09,
    4.78,
    0.55,
    10.2,
    4.19,
    4.63,
    4.09,
    1.96,
    0.08,
    0.37
   ],
   "probs": {
    "fact": {
     "p": 0.158,
     "hit": true
    },
    "opp": {
     "p": 0.7551,
     "hit": true
    },
    "count": {
     "p": 0.8007,
     "hit": true
    },
    "pattern": {
     "p": 0.06608,
     "hit": true
    },
    "water": {
     "p": 0.3912,
     "hit": true
    },
    "sum": {
     "p": 0.3317,
     "hit": true
    },
    "es": {
     "p": 5.995e-05,
     "hit": false
    }
   },
   "gen": {
    "walk": " hall, his head down, his eyes fixed on the floor. He stopped at the door to the kitchen and looked back",
    "door": " saw a man in a white coat standing in the doorway. He was a little older than her, and he was wearing",
    "fact": " Paris. The capital of the United States is New York.\n\nThe capital of the United Kingdom is London. The",
    "opp": " cold.\n\nThe opposite of cold is hot.\n\nThe opposite of hot is cold.\n\nThe opposite",
    "count": " 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,",
    "pattern": " casa, cat = cachorro, dog = perro, house = casa, cat = cachorro, dog",
    "sum": " four.\n\nA:\n\nThe problem is that you are using the wrong order of operations.\nThe first",
    "es": " un lugar de trabajo, pero también un lugar de miedo. La mayoría de los trabajadores de",
    "qa": " The capital of France is Paris.\nQ: What is the capital of the United States?\nA: The capital",
    "wc22": " Brazil, with the country's goalkeeper, Neymar, being named the tournament's best player.\n\nThe",
    "gpt": " \"Rabbit\" that was able to learn from human conversation. It was the first time that AI had been able to"
   },
   "mem": {
    "lorem": {
     "gen": " sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit",
     "match": 21,
     "truth": 21
    },
    "preamble": {
     "gen": " establish Justice, insure domestic Tranquility, provide for the common defence, promote the general Welfare, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and",
     "match": 40,
     "truth": 50
    },
    "mit": {
     "gen": " in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons",
     "match": 36,
     "truth": 36
    },
    "quijote": {
     "gen": " y que no quiero que me haya ocurrido, y que no quiero que me haya ocurrido, y que no quiero que me haya ocurrid",
     "match": 0,
     "truth": 40
    }
   }
  },
  {
   "step": 32000,
   "tokens": 67108864000,
   "en": {
    "loss": 2.734,
    "bpb": 0.8457
   },
   "es": {
    "loss": 2.434,
    "bpb": 1.128
   },
   "cat": {
    "punct": 0.859,
    "func": 1.984,
    "name": 6.146,
    "content": 3.703
   },
   "passage": [
    11.09,
    0.09,
    5.41,
    6.63,
    1.46,
    6.05,
    2.43,
    4.91,
    2.6,
    2.75,
    10.06,
    2.71,
    2.59,
    4.88,
    2.26,
    0.85,
    3.27,
    0.69,
    1.62,
    6.82,
    1.47,
    0.43,
    7.02,
    0.02,
    1.91,
    8.87,
    1.36,
    3.34,
    0.7,
    1.4,
    4.4,
    0.69,
    10.31,
    3.56,
    3.49,
    3.39,
    1.43,
    0.05,
    0.35
   ],
   "probs": {
    "fact": {
     "p": 0.2178,
     "hit": true
    },
    "opp": {
     "p": 0.5859,
     "hit": true
    },
    "count": {
     "p": 0.8619,
     "hit": true
    },
    "pattern": {
     "p": 0.3701,
     "hit": true
    },
    "water": {
     "p": 0.3337,
     "hit": true
    },
    "sum": {
     "p": 0.3066,
     "hit": true
    },
    "es": {
     "p": 3.848e-05,
     "hit": false
    }
   },
   "gen": {
    "walk": " steps, his head bowed. He was a tall man, with a long face and a long nose. He wore a",
    "door": " stepped into the room. She was wearing a long, black coat, and her hair was pulled back in a ponyt",
    "fact": " Paris. The city is the seat of the French government and the seat of the French Senate.\n\nHistory\n\n",
    "opp": " cold, and the opposite of cold is hot.\n\nThe opposite of hot is cold, and the opposite of cold",
    "count": " 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,",
    "pattern": " casa, cat = gato, dog = perro, house = casa, cat = gato, dog = per",
    "sum": " four.\n\nThe number of ways to arrange the numbers in the following table is:\n\nThe number of ways",
    "es": " la ciudad de la que se halla la mayoría de los habitantes. La ciudad de Francia es la capital",
    "qa": " The capital of France is Paris.\n\nA:\n\nThe capital of France is Paris.\n\nA:",
    "wc22": " the Netherlands, who beat the United States in the final.\n\nThe Netherlands have been the most successful team in the",
    "gpt": " \"Bots\" that can learn from human conversation. The bot is a chatbot that can learn from human conversation."
   },
   "mem": {
    "lorem": {
     "gen": " sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco labor",
     "match": 21,
     "truth": 21
    },
    "preamble": {
     "gen": " establish Justice, insure domestic Tranquility, provide for the common Defense, promote the general Welfare, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and",
     "match": 14,
     "truth": 50
    },
    "mit": {
     "gen": " in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons",
     "match": 36,
     "truth": 36
    },
    "quijote": {
     "gen": " se encuentra el barrio de la Mancha, que es el más grande de la ciudad, y que se encuentra en el norte de la ciudad.\n\nEn el bar",
     "match": 0,
     "truth": 40
    }
   }
  },
  {
   "step": 48000,
   "tokens": 100663296000,
   "en": {
    "loss": 2.665,
    "bpb": 0.8244
   },
   "es": {
    "loss": 2.352,
    "bpb": 1.09
   },
   "cat": {
    "punct": 0.84,
    "func": 1.922,
    "name": 6.076,
    "content": 3.615
   },
   "passage": [
    11.71,
    0.13,
    5.52,
    5.79,
    1.74,
    6.68,
    1.36,
    5.84,
    2.93,
    2.28,
    11.17,
    2.49,
    2.84,
    3.86,
    1.43,
    0.88,
    3.19,
    0.79,
    2.13,
    6.22,
    2.1,
    0.41,
    4.57,
    0.0,
    2.43,
    9.47,
    0.93,
    2.91,
    0.52,
    1.59,
    3.44,
    0.47,
    8.85,
    3.42,
    4.98,
    3.69,
    1.55,
    0.01,
    0.36
   ],
   "probs": {
    "fact": {
     "p": 0.1262,
     "hit": true
    },
    "opp": {
     "p": 0.6327,
     "hit": true
    },
    "count": {
     "p": 0.8219,
     "hit": true
    },
    "pattern": {
     "p": 0.3257,
     "hit": true
    },
    "water": {
     "p": 0.3457,
     "hit": true
    },
    "sum": {
     "p": 0.3731,
     "hit": true
    },
    "es": {
     "p": 5.33e-05,
     "hit": false
    }
   },
   "gen": {
    "walk": " street, his head bowed. He was a man of few words, but he had a strange, sad look in his",
    "door": " let in the cool night air.\n\n\"I'm sorry, I didn't mean to scare you.\"\n\n",
    "fact": " Paris.\n\nThe capital of France is Paris.\n\nThe capital of France is Paris.\n\nThe capital",
    "opp": " cold.\n\nThe opposite of cold is hot.\n\nThe opposite of hot is cold.\n\nThe opposite",
    "count": " 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,",
    "pattern": " casa, cat = cachorro, dog = perro, house = casa, cat = cachorro, dog",
    "sum": " four.\n\n**4.** Add the following to the previous step:\n\n**5.** Add the following to",
    "es": " un lugar de culto para los judíos, y en el año 1620, los judíos de",
    "qa": " The capital of France is Paris.\nQ: What is the capital of Germany?\nA: The capital of Germany",
    "wc22": " the Netherlands, who beat the United States in the final.\n\nThe Netherlands won the World Cup for the first time",
    "gpt": " \"Turing\" that was able to converse with humans.\n\nThe AI was able to answer questions like \"What"
   },
   "mem": {
    "lorem": {
     "gen": " sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n\nLorem ipsum dolor sit amet, consectetur adipiscing",
     "match": 21,
     "truth": 21
    },
    "preamble": {
     "gen": " establish Justice, insure domestic Tranquility, provide for the common defence, promote the general Welfare, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and",
     "match": 40,
     "truth": 50
    },
    "mit": {
     "gen": " in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons",
     "match": 36,
     "truth": 36
    },
    "quijote": {
     "gen": " se halla el pueblo de la Mancha, que se llama en su lugar el pueblo de la Mancha, y que se llama en su lugar el pueblo",
     "match": 0,
     "truth": 40
    }
   }
  },
  {
   "step": 64000,
   "tokens": 134217728000,
   "en": {
    "loss": 2.646,
    "bpb": 0.8184
   },
   "es": {
    "loss": 2.304,
    "bpb": 1.0682
   },
   "cat": {
    "punct": 0.81,
    "func": 1.923,
    "name": 6.59,
    "content": 3.561
   },
   "passage": [
    11.6,
    0.23,
    4.9,
    6.46,
    1.49,
    6.22,
    1.32,
    4.51,
    2.35,
    1.96,
    11.43,
    2.08,
    2.69,
    3.89,
    1.52,
    0.75,
    2.7,
    0.53,
    1.32,
    6.29,
    2.22,
    0.55,
    5.86,
    0.06,
    1.68,
    8.62,
    0.93,
    2.56,
    0.47,
    1.5,
    3.71,
    0.3,
    8.33,
    2.99,
    4.23,
    4.0,
    2.49,
    0.04,
    0.42
   ],
   "probs": {
    "fact": {
     "p": 0.5581,
     "hit": true
    },
    "opp": {
     "p": 0.6835,
     "hit": true
    },
    "count": {
     "p": 0.8095,
     "hit": true
    },
    "pattern": {
     "p": 0.4258,
     "hit": true
    },
    "water": {
     "p": 0.3727,
     "hit": true
    },
    "sum": {
     "p": 0.6169,
     "hit": true
    },
    "es": {
     "p": 2.196e-05,
     "hit": false
    }
   },
   "gen": {
    "walk": " street, his eyes fixed on the ground.\n\n\"I'm sorry,\" he said. \"I'm sorry.\"",
    "door": " stepped out into the hall.\n\n\"I'm sorry,\" she said. \"I didn't mean to frighten",
    "fact": " Paris.\n\nThe capital of France is Paris.\n\nThe capital of France is Paris.\n\nThe capital",
    "opp": " cold.\n\nThe opposite of cold is hot.\n\nThe opposite of hot is cold.\n\nThe opposite",
    "count": " 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,",
    "pattern": " casa, cat = gato, dog = perro, house = casa, cat = gato, dog = per",
    "sum": " four.\n\n\"I'm sorry, I didn't mean to interrupt.\"\n\n\"No, no, no",
    "es": " el centro de la economía europea.\n\nEl Gobierno francés ha decidido aceptar la prop",
    "qa": " The capital of France is Paris.\nQ: What is the capital of the United States?\nA: The capital",
    "wc22": " Germany, who beat Argentina 2–1 in the final.\n\nThe tournament was the first to be held in the",
    "gpt": " “Brain” that was able to play a video game.\n\nThe chatbot was able to play the game"
   },
   "mem": {
    "lorem": {
     "gen": " sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco labor",
     "match": 21,
     "truth": 21
    },
    "preamble": {
     "gen": " establish Justice, insure domestic Tranquility, provide for the common defence, promote the general Welfare, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and",
     "match": 40,
     "truth": 50
    },
    "mit": {
     "gen": " in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons",
     "match": 36,
     "truth": 36
    },
    "quijote": {
     "gen": " se encuentra el castillo de la ciudad de Toledo, que es el más antiguo de los castillos de la ciudad, y que, por lo demás, no es",
     "match": 0,
     "truth": 40
    }
   }
  },
  {
   "step": 100000,
   "tokens": 209715200000,
   "en": {
    "loss": 2.535,
    "bpb": 0.7842
   },
   "es": {
    "loss": 2.191,
    "bpb": 1.0155
   },
   "cat": {
    "punct": 0.813,
    "func": 1.846,
    "name": 5.898,
    "content": 3.416
   },
   "passage": [
    11.5,
    0.15,
    4.94,
    5.83,
    1.76,
    6.59,
    1.09,
    4.28,
    2.19,
    2.33,
    10.93,
    1.41,
    2.63,
    3.62,
    1.39,
    0.67,
    2.2,
    0.73,
    1.35,
    5.93,
    2.16,
    0.46,
    6.54,
    0.0,
    2.03,
    8.89,
    0.98,
    3.48,
    0.51,
    1.92,
    3.89,
    0.37,
    10.2,
    3.16,
    5.46,
    4.28,
    1.07,
    0.02,
    0.4
   ],
   "probs": {
    "fact": {
     "p": 0.6185,
     "hit": true
    },
    "opp": {
     "p": 0.6581,
     "hit": true
    },
    "count": {
     "p": 0.8922,
     "hit": true
    },
    "pattern": {
     "p": 0.8954,
     "hit": true
    },
    "water": {
     "p": 0.4736,
     "hit": true
    },
    "sum": {
     "p": 0.5738,
     "hit": true
    },
    "es": {
     "p": 3.574e-05,
     "hit": false
    }
   },
   "gen": {
    "walk": " street, his head bowed. He was a tall man, with a long, thin face, and a long, thin",
    "door": " stepped out into the hallway.\n\n\"I'm sorry,\" she said. \"I didn't mean to scare you",
    "fact": " Paris.\n\nThe capital of the United States is Washington, D.C.\n\nThe capital of the United",
    "opp": " cold.\n\nThe opposite of cold is hot.\n\nThe opposite of hot is cold.\n\nThe opposite",
    "count": " 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,",
    "pattern": " casa, cat = gato, dog = perro, house = casa, cat = gato, dog = per",
    "sum": " four.\" \"Four plus four equals eight.\" \"Eight plus eight equals sixteen.\" \"Eight plus eight equals sixteen.\" \"",
    "es": " un lugar de la cultura occidental, y la cultura occidental es una de las grandes fuentes de la",
    "qa": " The capital of France is Paris.\nQ: What is the capital of Germany?\nA: The capital of Germany",
    "wc22": " Brazil, who beat Germany in the final.\n\nThe tournament was held in Russia, and was won by the host",
    "gpt": " “Turing” that was able to answer questions about the history of the world, the history of the universe, and"
   },
   "mem": {
    "lorem": {
     "gen": " sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco labor",
     "match": 21,
     "truth": 21
    },
    "preamble": {
     "gen": " establish Justice, insure domestic Tranquility, provide for the common defence, promote the general Welfare, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and",
     "match": 40,
     "truth": 50
    },
    "mit": {
     "gen": " in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons",
     "match": 36,
     "truth": 36
    },
    "quijote": {
     "gen": " se encontraba el rey de España, Felipe II, que, como sucesor de Felipe I, había sido rey de Francia y de Inglaterra.\n",
     "match": 0,
     "truth": 40
    }
   }
  },
  {
   "step": 143000,
   "tokens": 299892736000,
   "en": {
    "loss": 2.521,
    "bpb": 0.7799
   },
   "es": {
    "loss": 2.139,
    "bpb": 0.9913
   },
   "cat": {
    "punct": 0.804,
    "func": 1.835,
    "name": 6.138,
    "content": 3.389
   },
   "passage": [
    11.72,
    0.22,
    5.48,
    6.38,
    1.44,
    6.54,
    1.14,
    4.78,
    2.24,
    2.06,
    11.59,
    1.61,
    2.8,
    3.32,
    1.68,
    0.87,
    2.15,
    0.63,
    1.68,
    6.4,
    2.14,
    0.34,
    4.64,
    0.0,
    2.8,
    7.87,
    0.74,
    3.46,
    0.45,
    1.84,
    3.71,
    0.38,
    9.42,
    3.36,
    5.17,
    3.5,
    0.82,
    0.03,
    0.46
   ],
   "probs": {
    "fact": {
     "p": 0.6078,
     "hit": true
    },
    "opp": {
     "p": 0.6627,
     "hit": true
    },
    "count": {
     "p": 0.8331,
     "hit": true
    },
    "pattern": {
     "p": 0.8203,
     "hit": true
    },
    "water": {
     "p": 0.6423,
     "hit": true
    },
    "sum": {
     "p": 0.6477,
     "hit": true
    },
    "es": {
     "p": 6.653e-05,
     "hit": false
    }
   },
   "gen": {
    "walk": " street, his eyes on the ground. He was a man of few words, but he had a way of looking at",
    "door": " stepped inside.\n\n\"I'm sorry,\" she said. \"I didn't mean to interrupt.\"\n\n\"",
    "fact": " Paris.\n\nThe capital of the United States is Washington, D.C.\n\nThe capital of the United",
    "opp": " cold, and the opposite of cold is hot.\n\nThe opposite of hot is cold, and the opposite of cold",
    "count": " 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,",
    "pattern": " casa, cat = gato, dog = perro, house = casa, cat = gato, dog = per",
    "sum": " four.\" \"Four plus four equals eight.\" \"Eight plus eight equals 16.\" \"Eight plus 16 equals 24.\" \"",
    "es": " un lugar de culto y de culto.\n\nEl primer ministro francés, François Hollande, ha",
    "qa": " The capital of France is Paris.\nQ: What is the capital of Germany?\nA: The capital of Germany",
    "wc22": " the United States, who defeated Qatar in the final.\n\nThe tournament was the first to be held in the United",
    "gpt": " “Turing” that was able to converse with humans.\n\n“Turing” was able to answer questions about"
   },
   "mem": {
    "lorem": {
     "gen": " sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco labor",
     "match": 21,
     "truth": 21
    },
    "preamble": {
     "gen": " establish Justice, insure domestic Tranquility, provide for the common defence, promote the general Welfare, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and",
     "match": 40,
     "truth": 50
    },
    "mit": {
     "gen": " in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons",
     "match": 36,
     "truth": 36
    },
    "quijote": {
     "gen": " se encontraba un hombre que se llamaba el _Caballero de la Mancha_. Era un hombre de aspecto muy hermoso, de aspecto de caballero",
     "match": 0,
     "truth": 40
    }
   },
   "final": {
    "chat_capital": "\n\nA:\n\nThe capital of France is Paris.\n\nA:\n\nThe capital of France is Paris.\n\nA:\n\nThe capital of France is Paris.\n\nA:\n\nThe capital of France is Paris.\n\nA:",
    "chat_poem": "\n\nI am a sea-sick,\n\nI am a sea-sick,\n\nI am a sea-sick,\n\nI am a sea-sick,\n\nI am a sea-sick,\n\nI am a sea",
    "chat_nn": "\n\nA:\n\nA neural network is a machine learning model that uses a set of input data to produce a set of output data.\n\nA:\n\nA neural network is a machine learning model that uses a set of input data to produce a set of output",
    "chat_es": "\n\n—La capital de Francia es París.\n\n—¿Y qué es París?\n\n—París es la capital de Francia.\n\n—¿Y qué es la capital de Francia?\n\n—La capital de Francia es",
    "doc_capital": " The capital of France is Paris.\nQ: What is the capital of Germany?\nA: The capital of Germany is Berlin.\nQ: What is the capital of Italy?\nA: The capital of Italy is Rome.\nQ: What is the capital of Spain",
    "doc_list": " Rome.\n\nQ: What is the capital of Germany?\nA: Berlin.\n\nQ: What is the capital of the United States?\nA: Washington, D.C.\n\nQ: What is the capital of the United Kingdom?\nA:"
   }
  }
 ]
};
