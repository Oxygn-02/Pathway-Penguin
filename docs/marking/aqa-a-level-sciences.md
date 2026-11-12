# AQA A-level Biology (7402), Chemistry (7405) and Physics (7408): how Pip marks them, and what they are based on

Status: **A level sciences finished. The board (AQA) is an assumption** until the school confirms it. Needs your check of the `check` rows.
Code: `artifacts/api-server/src/lib/marking/aqaALevelScience.ts`. Tests: `src/__tests__/aqaALevelScience.test.ts`.

The three A level sciences share one document and one code file, as the GCSE sciences do.

## Documents used

All downloaded from AQA's file server and read as full text.

| What | Document | Version line printed on it |
|---|---|---|
| Biology specification | `AQA-7401-7402-SP-2015.PDF` | Version 1.5, 26 November 2021 |
| Chemistry specification | `AQA-7404-7405-SP-2015.PDF` | Version 1.1, 1 December 2015 |
| Physics specification | `AQA-7407-7408-SP-2015.PDF` | Version 1.3, 1 June 2017 |
| Question papers and mark schemes, June 2022 and June 2023 | Biology `AQA-74021`, `74022`, `74023`; Chemistry `AQA-74051`, `74052`, `74053`; Physics `AQA-74081`, `74082`, `74083A` and the five options `74083BA` to `74083BE`, each as `-QP-` and `-MS-` | Mark schemes read "Version: 1.0 Final" |

## How the exams are built (from the specifications)

All papers are written and last 2 hours.

| Subject | Paper | Content | Marks | Weighting |
|---|---|---|---|---|
| Biology | 1 | Topics 1 to 4: 76 marks short and long answers, 15 extended response | 91 | 35% |
| Biology | 2 | Topics 5 to 8: 76 marks short and long answers, 15 comprehension | 91 | 35% |
| Biology | 3 | Any content: 38 structured (including practical techniques), 15 data analysis, 25 essay from a choice of two | 78 | 30% |
| Chemistry | 1 | Inorganic chemistry and relevant physical chemistry | 105 | 35% |
| Chemistry | 2 | Organic chemistry and relevant physical chemistry | 105 | 35% |
| Chemistry | 3 | Any content: 40 practical techniques and data, 20 across the specification, 30 multiple choice | 90 | 30% |
| Physics | 1 | Sections 1 to 5 and 6.1: 60 short and long answer, 25 multiple choice | 85 | 34% |
| Physics | 2 | Sections 6.2, 7 and 8 plus earlier content: 60 short and long answer, 25 multiple choice | 85 | 34% |
| Physics | 3 | Section A practical skills and data analysis (45) plus one optional topic from astrophysics, medical, engineering, turning points or electronics (35) | 80 | 32% |

Assessment objectives, overall approximate weightings: Biology AO1 30 to 35%, AO2 40 to 45%, AO3 25 to 30%. Chemistry AO1 30%, AO2 45%, AO3 25%. Physics AO1 33%, AO2 42%, AO3 25%. AO1 is knowledge and understanding, AO2 is applying it, AO3 is analysing, interpreting and evaluating, including practical design.

## How an A level science answer is marked

1. **Point-based marking** covers most questions. The mark scheme lists the accepted points, and each part is tagged with its assessment objectives, for example "2 x AO1". Alternatives are shown with "or", and a separate comments column says what to accept or ignore.
2. **Calculations** carry marks for the method and the answer. In Physics, the final answer mark is tied to quoting the answer correctly.
3. **Extended answers in Chemistry and Physics** use levels of response with three levels. In Physics there are two marks in each level. The mark scheme asks for a best fit: start at the lowest level and climb, judge the overall quality rather than picking at small flaws, then use how much of the next level the answer shows to choose the mark inside the level. Chemistry descriptors each contain a chemistry content statement and a communication statement. An answer with nothing relevant gets no marks.
4. **The Biology essay** (Paper 3, 25 marks) uses five bands: 21 to 25, 16 to 20, 11 to 15, 6 to 10 and 1 to 5, with 0 for nothing relevant. The top bands reward an answer that links several topics to the question's theme, with correct, detailed content and no significant errors. The middle bands reward correct content that is not linked up, and the bottom band covers an answer that only addresses the theme indirectly. Marking notes say the answer should draw on at least four topics for a synoptic response.
5. **Practical skills** are examined in the written papers (Chemistry Paper 3 and Physics Paper 3 Section A are mostly practical and data analysis).

Pip follows the same pattern as the other subjects: best-fit level first, then the mark within the level; one mark per accepted point; method and answer marks for calculations. The official mark scheme for the question should be supplied to Pip whenever it is available.

## How the topics and questions were checked

- **Topics** are AQA's section headings at the 3.x.y level (Biology 39, Chemistry 34, Physics 38), with AQA's own titles. The numbered sub-sections below these are not mapped one by one.
- **Marks** are the `[n marks]` printed on the question paper for the part cited. For Biology and Chemistry the paper totals reconcile (Biology Papers 1 and 2: 91 each, Paper 3: 78 once the unused essay is set aside; Chemistry Papers 1 and 2: 105 each, Paper 3: 90). Physics Paper 3 Section A reads as 45 and each option as 35. Physics 7408/2 June 2023 reads as 84 of 85 in my reader, so one mark on one question there was not picked up; marks cited from that paper are worth a glance.
- **Topic tags are our judgement.** Unlike the GCSE sciences, these mark schemes tag assessment objectives but not specification sections, so which section a question tests is our decision. Rows marked `check` are looser matches. Chemistry rows were also checked against which paper may examine which section (for example, section 3.1.9 is only on Paper 2).
- **Coverage:** Biology 35 of 39, Chemistry 34 of 34, Physics 36 of 38 sections matched to at least one real question.
- **Not found:** Biology 3.1.3, 3.1.7, 3.1.8, 3.4.7; Physics 3.1.3, 3.13.1. Physics Paper 3 optional sections are only examined if a student enters that option, and only the sampled series were searched.

## Biology topic coverage

| Code | Topic | Question(s) | Marks | Confidence |
|---|---|---|---|---|
| 3.1.1 | Monomers and polymers | 7402/1 June 2023 Q2.1 | 3 | check |
| 3.1.2 | Carbohydrates | 7402/1 June 2022 Q9.2; 7402/1 June 2023 Q2.1 | 6, 3 | ok, ok |
| 3.1.3 | Lipids | not found in the sampled papers | | |
| 3.1.4 | Proteins | 7402/1 June 2022 Q5.1; 7402/1 June 2023 Q10.1; 7402/3 June 2022 Q1.1 | 1, 5, 2 | ok, ok, ok |
| 3.1.5 | Nucleic acids are important information-carrying molecules | 7402/1 June 2022 Q7.1; 7402/1 June 2023 Q10.2 | 3, 6 | ok, ok |
| 3.1.6 | ATP | 7402/2 June 2023 Q10.1; 7402/3 June 2022 Q6.1 | 2, 25 | ok, ok |
| 3.1.7 | Water | not found in the sampled papers | | |
| 3.1.8 | Inorganic ions | not found in the sampled papers | | |
| 3.2.1 | Cell structure | 7402/1 June 2022 Q1.1; 7402/1 June 2023 Q3.2 | 4, 2 | ok, ok |
| 3.2.2 | All cells arise from other cells | 7402/1 June 2022 Q4.1; 7402/1 June 2023 Q1.1; 7402/3 June 2022 Q3.3 | 3, 2, 2 | ok, ok, ok |
| 3.2.3 | Transport across cell membranes | 7402/3 June 2023 Q7.2; 7402/2 June 2023 Q6.1 | 25, 3 | ok, check |
| 3.2.4 | Cell recognition and the immune system | 7402/1 June 2023 Q4.2; 7402/1 June 2023 Q9.3; 7402/3 June 2023 Q6.1 | 3, 2, 2 | ok, ok, ok |
| 3.3.1 | Surface area to volume ratio | 7402/1 June 2022 Q8.2 | 2 | ok |
| 3.3.2 | Gas exchange | 7402/1 June 2022 Q8.3 | 3 | check |
| 3.3.3 | Digestion and absorption | 7402/1 June 2022 Q9.3 | 4 | ok |
| 3.3.4 | Mass transport | 7402/1 June 2022 Q9.1; 7402/1 June 2022 Q6.1 | 5, 4 | ok, ok |
| 3.4.1 | DNA, genes and chromosomes | 7402/1 June 2023 Q10.2 | 6 | ok |
| 3.4.2 | DNA and protein synthesis | 7402/1 June 2022 Q7.1; 7402/1 June 2022 Q7.3 | 3, 3 | check, check |
| 3.4.3 | Genetic diversity can arise as a result of mutation or during | 7402/1 June 2022 Q4.3; 7402/1 June 2023 Q10.3 | 2, 4 | ok, ok |
| 3.4.4 | Genetic diversity and adaptation | 7402/1 June 2023 Q3.5 | 4 | check |
| 3.4.5 | Species and taxonomy | 7402/1 June 2023 Q6.2; 7402/1 June 2023 Q6.3 | 3, 1 | ok, ok |
| 3.4.6 | Biodiversity within a community | 7402/1 June 2022 Q1.4; 7402/3 June 2023 Q5.2 | 2, 2 | ok, ok |
| 3.4.7 | Investigating diversity | not found in the sampled papers | | |
| 3.5.1 | Photosynthesis | 7402/2 June 2022 Q1.2; 7402/2 June 2023 Q1.1; 7402/3 June 2022 Q5.3 | 6, 4, 4 | ok, ok, ok |
| 3.5.2 | Respiration | 7402/2 June 2022 Q4.2; 7402/3 June 2023 Q2.5 | 3, 2 | ok, ok |
| 3.5.3 | Energy and ecosystems | 7402/2 June 2022 Q2.4; 7402/2 June 2023 Q7.3 | 2, 3 | ok, ok |
| 3.5.4 | Nutrient cycles | 7402/2 June 2022 Q3.3; 7402/2 June 2023 Q3.1 | 2, 2 | ok, ok |
| 3.6.1 | Stimuli, both internal and external, are detected and lead to a | 7402/3 June 2023 Q1.1; 7402/2 June 2023 Q5.1 | 3, 3 | ok, ok |
| 3.6.2 | Nervous coordination | 7402/2 June 2022 Q7.1; 7402/3 June 2023 Q1.2; 7402/2 June 2023 Q2.1 | 2, 2, 5 | ok, ok, ok |
| 3.6.3 | Skeletal muscles are stimulated to contract by nerves and act as | 7402/2 June 2022 Q7.3; 7402/2 June 2023 Q10.1 | 2, 2 | ok, ok |
| 3.6.4 | Homeostasis is the maintenance of a stable internal | 7402/2 June 2022 Q9.3; 7402/2 June 2022 Q8.3; 7402/2 June 2023 Q6.4 | 3, 5, 3 | ok, ok, ok |
| 3.7.1 | Inheritance | 7402/2 June 2022 Q6.3; 7402/2 June 2023 Q4.3 | 2, 3 | ok, ok |
| 3.7.2 | Populations | 7402/2 June 2022 Q6.4; 7402/2 June 2023 Q4.4 | 1, 2 | ok, ok |
| 3.7.3 | Evolution may lead to speciation | 7402/2 June 2022 Q5.2; 7402/2 June 2023 Q5.3 | 5, 5 | ok, ok |
| 3.7.4 | Populations in ecosystems | 7402/2 June 2022 Q5.3; 7402/2 June 2023 Q7.2 | 1, 2 | ok, ok |
| 3.8.1 | Alteration of the sequence of bases in DNA can alter the | 7402/2 June 2022 Q10.1; 7402/2 June 2023 Q8.1 | 3, 3 | ok, ok |
| 3.8.2 | Gene expression is controlled by a number of features (A-level | 7402/2 June 2022 Q10.5; 7402/3 June 2022 Q4.4 | 3, 2 | ok, ok |
| 3.8.3 | Using genome projects | 7402/3 June 2022 Q4.1; 7402/1 June 2023 Q6.1 | 2, 2 | ok, check |
| 3.8.4 | Gene technologies allow the study and alteration of gene | 7402/3 June 2022 Q4.5; 7402/2 June 2023 Q9.2; 7402/2 June 2023 Q9.4 | 1, 2, 2 | ok, ok, ok |

## Chemistry topic coverage

| Code | Topic | Question(s) | Marks | Confidence |
|---|---|---|---|---|
| 3.1.1 | Atomic structure | 7405/1 June 2022 Q2.1; 7405/1 June 2022 Q2.4; 7405/1 June 2023 Q9.2 | 2, 5, 5 | ok, ok, ok |
| 3.1.2 | Amount of substance | 7405/1 June 2023 Q6.1; 7405/2 June 2023 Q7.1; 7405/3 June 2022 Q2 | 1, 4, 6 | ok, ok, ok |
| 3.1.3 | Bonding | 7405/1 June 2022 Q5.7; 7405/1 June 2023 Q1.2; 7405/3 June 2023 Q5.2 | 6, 2, 4 | ok, ok, check |
| 3.1.4 | Energetics | 7405/3 June 2022 Q1.3; 7405/2 June 2023 Q8.2 | 3, 5 | ok, ok |
| 3.1.5 | Kinetics | 7405/2 June 2023 Q9.4; 7405/3 June 2023 Q11 | 5, 1 | ok, ok |
| 3.1.6 | Chemical equilibria, Le Chatelier’s principle and Kc | 7405/1 June 2022 Q1.1; 7405/2 June 2022 Q2.4 | 2, 3 | ok, ok |
| 3.1.7 | Oxidation, reduction and redox equations | 7405/1 June 2022 Q3.1; 7405/1 June 2022 Q3.4 | 5, 5 | ok, ok |
| 3.1.8 | Thermodynamics | 7405/1 June 2023 Q5.7; 7405/1 June 2023 Q5.4; 7405/3 June 2022 Q1.7 | 6, 2, 4 | ok, ok, ok |
| 3.1.9 | Rate equations | 7405/2 June 2022 Q1.2; 7405/3 June 2022 Q4.5; 7405/2 June 2023 Q2.1 | 3, 2, 3 | ok, ok, check |
| 3.1.10 | Equilibrium constant Kp for homogeneous systems (A-level | 7405/1 June 2022 Q1.6; 7405/1 June 2023 Q4.1 | 2, 3 | ok, ok |
| 3.1.11 | Electrode potentials and electrochemical cells | 7405/1 June 2022 Q8.4; 7405/1 June 2023 Q2.1 | 2, 2 | ok, ok |
| 3.1.12 | Acids and bases | 7405/1 June 2022 Q4.1; 7405/1 June 2023 Q10.3; 7405/1 June 2022 Q4.5 | 3, 4, 5 | ok, ok, ok |
| 3.2.1 | Periodicity | 7405/3 June 2022 Q16; 7405/1 June 2023 Q9.1 | 1, 1 | ok, check |
| 3.2.2 | Group 2, the alkaline earth metals | 7405/1 June 2022 Q5.1; 7405/1 June 2023 Q3.4; 7405/1 June 2022 Q4.2 | 1, 2, 3 | ok, ok, check |
| 3.2.3 | Group 7(17), the halogens | 7405/1 June 2022 Q6.3; 7405/1 June 2022 Q6.5 | 2, 3 | ok, ok |
| 3.2.4 | Properties of Period 3 elements and their oxides | 7405/1 June 2022 Q5.2; 7405/1 June 2023 Q3.2 | 1, 1 | ok, ok |
| 3.2.5 | Transition metals | 7405/1 June 2022 Q7.1; 7405/1 June 2023 Q1.6 | 2, 3 | ok, ok |
| 3.2.6 | Reactions of ions in aqueous solution | 7405/1 June 2023 Q7.3; 7405/1 June 2023 Q7.5; 7405/1 June 2022 Q5.3 | 2, 2, 3 | ok, ok, ok |
| 3.3.1 | Introduction to organic chemistry | 7405/2 June 2022 Q1.1; 7405/3 June 2022 Q3.2; 7405/3 June 2023 Q2.1 | 2, 2, 1 | ok, ok, ok |
| 3.3.2 | Alkanes | 7405/3 June 2022 Q5.1 | 2 | ok |
| 3.3.3 | Halogenoalkanes | 7405/3 June 2022 Q3.4; 7405/3 June 2022 Q3.7; 7405/2 June 2022 Q2.5 | 3, 2, 2 | ok, ok, ok |
| 3.3.4 | Alkenes | 7405/2 June 2022 Q3.1; 7405/2 June 2022 Q3.2 | 5, 3 | ok, ok |
| 3.3.5 | Alcohols | 7405/3 June 2023 Q2.5; 7405/2 June 2022 Q5.6 | 3, 4 | ok, check |
| 3.3.6 | Organic analysis | 7405/2 June 2023 Q6.3 | 8 | check |
| 3.3.7 | Optical isomerism | 7405/3 June 2022 Q3.6; 7405/3 June 2022 Q3.5 | 2, 2 | ok, ok |
| 3.3.8 | Aldehydes and ketones | 7405/2 June 2022 Q1.8 | 5 | ok |
| 3.3.9 | Carboxylic acids and derivatives | 7405/2 June 2022 Q7.1; 7405/2 June 2022 Q8.1 | 3, 2 | ok, ok |
| 3.3.10 | Aromatic chemistry | 7405/2 June 2022 Q8.3; 7405/2 June 2022 Q8.2 | 3, 2 | ok, ok |
| 3.3.11 | Amines | 7405/2 June 2022 Q10.4; 7405/2 June 2022 Q10.5 | 2, 2 | ok, ok |
| 3.3.12 | Polymers | 7405/2 June 2022 Q3.4; 7405/2 June 2023 Q4.5 | 2, 2 | ok, ok |
| 3.3.13 | Amino acids, proteins and DNA | 7405/2 June 2022 Q4.4; 7405/3 June 2023 Q3.3 | 4, 2 | ok, ok |
| 3.3.14 | Organic synthesis | 7405/2 June 2022 Q10.1; 7405/2 June 2023 Q4.3 | 3, 2 | ok, ok |
| 3.3.15 | Nuclear magnetic resonance spectroscopy | 7405/2 June 2023 Q5.4 | 5 | ok |
| 3.3.16 | Chromatography | 7405/3 June 2023 Q3.4; 7405/3 June 2023 Q3.7 | 3, 7 | ok, ok |

## Physics topic coverage

| Code | Topic | Question(s) | Marks | Confidence |
|---|---|---|---|---|
| 3.1.1 | Use of SI units and their prefixes | 7408/1 June 2022 Q8; 7408/1 June 2022 Q7 | 2, 1 | ok, ok |
| 3.1.2 | Limitation of physical measurements | 7408/3A June 2022 Q3.3; 7408/3A June 2022 Q3.1 | 4, 1 | ok, ok |
| 3.1.3 | Estimation of physical quantities | not found in the sampled papers | | |
| 3.2.1 | Particles | 7408/1 June 2022 Q2.1; 7408/1 June 2023 Q1.1; 7408/1 June 2023 Q1.2 | 1, 1, 2 | ok, ok, ok |
| 3.2.2 | Electromagnetic radiation and quantum phenomena | 7408/1 June 2022 Q1.4; 7408/1 June 2022 Q1.5; 7408/1 June 2023 Q13 | 3, 3, 6 | ok, ok, ok |
| 3.3.1 | Progressive and stationary waves | 7408/3A June 2022 Q1.2 | 3 | check |
| 3.3.2 | Refraction, diffraction and interference | 7408/1 June 2022 Q6.2; 7408/1 June 2023 Q4.2 | 2, 2 | ok, ok |
| 3.4.1 | Force, energy and momentum | 7408/1 June 2022 Q3.2; 7408/1 June 2023 Q2.3 | 2, 4 | ok, ok |
| 3.4.2 | Materials | 7408/1 June 2023 Q5.4; 7408/1 June 2022 Q3.1 | 5, 3 | ok, ok |
| 3.5.1 | Current electricity | 7408/1 June 2022 Q4.2; 7408/1 June 2023 Q3.4 | 3, 4 | ok, ok |
| 3.6.1 | Periodic motion | 7408/1 June 2023 Q6.1; 7408/1 June 2023 Q6.3; 7408/1 June 2022 Q5.3 | 2, 2, 2 | ok, ok, ok |
| 3.6.2 | Thermal physics | 7408/2 June 2022 Q2.3; 7408/2 June 2023 Q1.4; 7408/2 June 2023 Q2.1 | 3, 2, 5 | ok, ok, ok |
| 3.7.1 | Fields | 7408/2 June 2023 Q3.1 | 2 | check |
| 3.7.2 | Gravitational fields | 7408/2 June 2022 Q4.6; 7408/2 June 2023 Q3.5 | 4, 4 | ok, ok |
| 3.7.3 | Electric fields | 7408/2 June 2022 Q16; 7408/2 June 2023 Q4.2 | 3, 2 | ok, ok |
| 3.7.4 | Capacitance | 7408/2 June 2022 Q3.3; 7408/2 June 2023 Q5.2 | 3, 4 | ok, ok |
| 3.7.5 | Magnetic fields | 7408/2 June 2022 Q5.1; 7408/2 June 2022 Q14 | 3, 2 | ok, ok |
| 3.8.1 | Radioactivity | 7408/1 June 2022 Q1.1; 7408/2 June 2022 Q6.1; 7408/2 June 2023 Q7.2 | 4, 5, 2 | ok, ok, ok |
| 3.9.1 | Telescopes | 7408/3BA June 2022 Q1.2; 7408/3BA June 2023 Q2.5 | 3, 3 | ok, ok |
| 3.9.2 | Classification of stars | 7408/3BA June 2023 Q1.3; 7408/3BA June 2023 Q1.4 | 2, 1 | ok, ok |
| 3.9.3 | Cosmology | 7408/3BA June 2022 Q4; 7408/3BA June 2023 Q5.1 | 6, 3 | ok, ok |
| 3.10.1 | Physics of the eye | 7408/3BB June 2022 Q1.3; 7408/3BB June 2022 Q1.2 | 4, 3 | ok, ok |
| 3.10.2 | Physics of the ear | 7408/3BB June 2022 Q3.3; 7408/3BB June 2023 Q3.3 | 8, 2 | ok, ok |
| 3.10.3 | Biological measurement | 7408/3BB June 2023 Q4.3; 7408/3BB June 2023 Q4.2 | 4, 3 | ok, ok |
| 3.10.4 | Non-ionising imaging | 7408/3BB June 2022 Q5.2; 7408/3BB June 2023 Q4.1 | 2, 1 | ok, ok |
| 3.10.5 | X-ray imaging | 7408/3BB June 2022 Q2.2; 7408/3BB June 2023 Q5.1 | 5, 6 | ok, ok |
| 3.10.6 | Radionuclide imaging and therapy | 7408/3BB June 2023 Q1 | 2 | ok |
| 3.11.1 | Rotational dynamics | 7408/3BC June 2022 Q1.3; 7408/3BC June 2023 Q1.2 | 3, 2 | ok, ok |
| 3.11.2 | Thermodynamics and engines | 7408/3BC June 2022 Q3.2; 7408/3BC June 2023 Q3.3 | 2, 3 | ok, ok |
| 3.12.1 | The discovery of the electron | 7408/3BD June 2022 Q2.2; 7408/3BD June 2023 Q1.4 | 3, 6 | ok, ok |
| 3.12.2 | Wave-particle duality | 7408/3BD June 2022 Q1.3; 7408/3BD June 2023 Q3.3 | 3, 3 | ok, ok |
| 3.12.3 | Special relativity | 7408/3BD June 2022 Q4.2; 7408/3BD June 2023 Q4.3 | 3, 3 | ok, ok |
| 3.13.1 | Discrete semiconductor devices | not found in the sampled papers | | |
| 3.13.2 | Analogue and digital signals | 7408/3BE June 2023 Q5 | 6 | check |
| 3.13.3 | Analogue signal processing | 7408/3BE June 2022 Q4.1; 7408/3BE June 2023 Q2.1 | 3, 3 | check, check |
| 3.13.4 | Operational amplifier in: | 7408/3BE June 2022 Q1.2; 7408/3BE June 2023 Q4.2 | 2, 2 | ok, ok |
| 3.13.5 | Digital signal processing | 7408/3BE June 2022 Q2.3; 7408/3BE June 2023 Q1.4 | 2, 3 | ok, ok |
| 3.13.6 | Data communication systems | 7408/3BE June 2022 Q3.5; 7408/3BE June 2023 Q3.4 | 2, 2 | ok, ok |

## What to check

- Whether AQA is the right board for the sciences (assumed).
- The `check` rows, which are my judgement calls.
- The not found items. Other series (June 2018, 2019, 2024 and so on) may cover them.
