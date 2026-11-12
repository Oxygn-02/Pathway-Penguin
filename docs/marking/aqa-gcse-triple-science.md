# AQA GCSE Biology (8461), Chemistry (8462) and Physics (8463): how Pip marks them, and what it is based on

Status: **sixth to eighth subjects finished (triple science). The board (AQA) is an assumption** until the school confirms it.
Code: `artifacts/api-server/src/lib/marking/aqaScience.ts`. Tests: `src/__tests__/aqaScience.test.ts`.

The three sciences are marked the same way, so they share one document and one code file.

## Documents used

All downloaded from AQA's file server and read as full text (not summaries).

| What | Document | Version line printed on it |
|---|---|---|
| Biology specification | `AQA-8461-SP-2016.PDF` | GCSE Biology (8461). For exams 2018 onwards. Version 1.0, 21 April 2016 |
| Chemistry specification | `AQA-8462-SP-2016.PDF` | GCSE exams June 2018 onwards. Version 1.1, 4 October 2019 |
| Physics specification | `AQA-8463-SP-2016.PDF` | GCSE exams June 2018 onwards. Version 1.1, 30 September 2019 |
| Question papers and mark schemes | `AQA-84611H`, `84611F`, `84612H`, `84612F` (Biology), `84621`/`84622` (Chemistry), `84631`/`84632` (Physics), each as `-QP-` and `-MS-`, series `JUN22` and `JUN23` | Every mark scheme reads "Version: 1.0 Final" |

That is 24 question papers and 24 mark schemes: three sciences, two papers, two tiers, two series.

## How the exam is built (from the specifications)

Each science has the same shape.

| Paper | Time | Marks | Weighting | Question types |
|---|---|---|---|---|
| Paper 1 | 1 hour 45 | 100 | 50% of the GCSE | Multiple choice, structured, closed short answer and open response |
| Paper 2 | 1 hour 45 | 100 | 50% of the GCSE | Same |

Both papers come in Foundation and Higher tier. Paper 1 and 2 cover:

- **Biology:** Paper 1 is cell biology, organisation, infection and response, bioenergetics. Paper 2 is homeostasis and response, inheritance, variation and evolution, ecology.
- **Chemistry:** Paper 1 is atomic structure and the periodic table, bonding, quantitative chemistry, chemical changes, energy changes. Paper 2 is rate and extent of chemical change, organic chemistry, chemical analysis, the atmosphere, using resources.
- **Physics:** Paper 1 is energy, electricity, particle model of matter, atomic structure. Paper 2 is forces, waves, magnetism and electromagnetism, space physics.

Assessment objectives, as overall weightings in all three specifications: AO1 (knowledge and understanding) 40%, AO2 (applying it) 40%, AO3 (analysing, evaluating and making judgements) 20%.

## How a science answer is marked

1. **Point-based marking** is used for most questions. Each mark is one creditable point. The mark scheme lists the answers it accepts, with extra information on what to allow or ignore. "Any two from" questions give one mark per different correct point.
2. **Lists follow a "right plus wrong" rule.** Where a question asks for a set number of answers and the student gives more, each wrong or contradicting one cancels a correct one. Pip applies this when a question asks for a fixed number of things.
3. **Calculations** are marked step by step, and the final answer is the last mark. Mark schemes also give an alternative route. Pip checks the working, not only the answer.
4. **Extended answers** (4 and 6 mark questions) use levels of response. Each level is worth two marks. Six mark questions have three levels (Level 3 is 5 to 6, Level 2 is 3 to 4, Level 1 is 1 to 2). Four mark questions have two levels (3 to 4 and 1 to 2). The examiner picks the best-fit level for the whole answer first, then the mark inside that level by how much of the level above or below the answer shows. An answer with nothing relevant gets zero. Full marks are only possible if nothing in the answer contradicts a correct statement. The indicative content is a guide, and the student does not need every point.
5. **Each question part is tagged** with the assessment objective it rewards and the specification section(s) it tests.

Pip follows the same pattern as in the other subjects: for extended answers best-fit level first, then the mark within the level; for short answers one mark per accepted point; for calculations marks for method and final answer. The official mark scheme for the question should be supplied to Pip whenever it is available.

## How the topics and questions were checked

- **Topics** are the leaf headings of each specification (the deepest numbered section, for example 4.1.1.1 "Eukaryotes and prokaryotes"). Titles are AQA's own headings. Section "Key ideas" is left out because it is not examined as a topic on its own. Totals: Biology 97, Chemistry 124, Physics 81.
- **The topic of each question is AQA's, not ours.** Every row in these mark schemes has a "Spec. Ref." column that lists the specification section(s) the part tests. This is the first subject where the tags come straight from the board, so there are no `check` rows. A part can list several sections; where there was a choice we preferred parts with three or fewer.
- **Marks were checked twice.** Each part's marks come from the question paper (`[n marks]`), and the mark scheme's own mark column had to give the same number for the row to be used. Fifteen parts disagreed because of how the mark scheme text extracts, and those were not used. Every paper's parts add up to 100 marks.
- **Selection.** For each topic I used up to two parts, one per series where possible, preferring parts with few references, then parts worth 2 to 6 marks, then the Higher tier. Foundation parts therefore appear where they were the cleaner match.
- **Not found.** Topics with no part in the two series I could download are listed as not found rather than matched to something loose. Other series may cover them. Biology 10 of 97, Chemistry 9 of 124, Physics 9 of 81.
- **Required practicals** are assessed in these papers but are not mapped here as separate topics.

Coverage: **Biology 87 of 97, Chemistry 115 of 124, Physics 72 of 81** topics matched to real questions. Question numbers are written as the paper prints them, for example "8461/1H June 2023 Q2.8" is Biology Paper 1 Higher, June 2023, question 2 part 8.

## Biology topic coverage

| Code | Topic | Question(s) | Marks |
|---|---|---|---|
| 4.1.1.1 | Eukaryotes and prokaryotes | 8461/1H June 2022 Q1.1; 8461/1H June 2023 Q5.2 | 3, 3 |
| 4.1.1.2 | Animal and plant cells | 8461/1H June 2022 Q3.4 | 2 |
| 4.1.1.3 | Cell specialisation | 8461/1F June 2022 Q5.2 | 3 |
| 4.1.1.4 | Cell differentiation | 8461/1H June 2022 Q4.5; 8461/1H June 2023 Q1.2 | 1, 1 |
| 4.1.1.5 | Microscopy | 8461/1H June 2022 Q3.2 | 3 |
| 4.1.1.6 | Culturing microorganisms (biology only) | 8461/1H June 2023 Q3.3; 8461/1H June 2022 Q2.3 | 2, 2 |
| 4.1.2.1 | Chromosomes | not found in the sampled papers | |
| 4.1.2.2 | Mitosis and the cell cycle | 8461/1H June 2022 Q4.4; 8461/1H June 2023 Q5.6 | 4, 3 |
| 4.1.2.3 | Stem cells | 8461/1H June 2022 Q4.5; 8461/1H June 2023 Q1.2 | 1, 1 |
| 4.1.3.1 | Diffusion | 8461/1H June 2022 Q6.1 | 3 |
| 4.1.3.2 | Osmosis | 8461/1H June 2022 Q1.6; 8461/1H June 2023 Q3.9 | 2, 3 |
| 4.1.3.3 | Active transport | 8461/2F June 2022 Q6.5 | 1 |
| 4.2.1 | Principles of organisation | 8461/1H June 2023 Q1.1 | 1 |
| 4.2.2.1 | The human digestive system | 8461/2H June 2023 Q4.5; 8461/1H June 2022 Q2.4 | 3, 1 |
| 4.2.2.2 | The heart and blood vessels | 8461/1H June 2023 Q2.4; 8461/1F June 2022 Q2.6 | 2, 1 |
| 4.2.2.3 | Blood | 8461/1H June 2023 Q5.3 | 2 |
| 4.2.2.4 | Coronary heart disease: a non-communicable disease | 8461/1H June 2023 Q2.9; 8461/1F June 2022 Q2.7 | 2, 1 |
| 4.2.2.5 | Health issues | 8461/1H June 2023 Q5.7; 8461/1H June 2022 Q2.6 | 2, 6 |
| 4.2.2.6 | The effect of lifestyle on some non-communicable diseases | 8461/1H June 2022 Q2.6 | 6 |
| 4.2.2.7 | Cancer | 8461/1F June 2023 Q2.4 | 2 |
| 4.2.3.1 | Plant tissues | 8461/1H June 2022 Q5.2; 8461/1H June 2023 Q1.4 | 2, 1 |
| 4.2.3.2 | Plant organ system | 8461/1H June 2022 Q5.2; 8461/2H June 2023 Q4.1 | 2, 6 |
| 4.3.1.1 | Communicable (infectious) diseases | 8461/1H June 2022 Q7.2; 8461/2F June 2023 Q4.8 | 2, 2 |
| 4.3.1.2 | Viral diseases | 8461/1H June 2022 Q7.4; 8461/1H June 2023 Q1.6 | 3, 1 |
| 4.3.1.3 | Bacterial diseases | 8461/1H June 2023 Q3.2 | 4 |
| 4.3.1.4 | Fungal diseases | 8461/1H June 2022 Q2.2; 8461/1H June 2023 Q1.6 | 1, 1 |
| 4.3.1.5 | Protist diseases | 8461/1H June 2023 Q5.2 | 3 |
| 4.3.1.6 | Human defence systems | 8461/1H June 2022 Q7.6; 8461/1F June 2023 Q2.2 | 4, 2 |
| 4.3.1.7 | Vaccination | 8461/1H June 2023 Q3.2; 8461/1H June 2022 Q7.6 | 4, 4 |
| 4.3.1.8 | Antibiotics and painkillers | 8461/1H June 2023 Q3.9; 8461/1F June 2022 Q1.6 | 3, 1 |
| 4.3.1.9 | Discovery and development of drugs | 8461/1H June 2023 Q1.7; 8461/1F June 2022 Q1.7 | 2, 2 |
| 4.3.2.1 | Producing monoclonal antibodies | 8461/1H June 2022 Q7.7; 8461/1H June 2023 Q4.5 | 4, 3 |
| 4.3.2.2 | Uses of monoclonal antibodies | 8461/1H June 2022 Q7.8; 8461/1H June 2023 Q4.8 | 3, 2 |
| 4.3.3.1 | Detection and identification of plant diseases | 8461/1H June 2023 Q1.5 | 4 |
| 4.3.3.2 | Plant defence responses | 8461/1H June 2022 Q4.1 | 2 |
| 4.4.1.1 | Photosynthetic reaction | 8461/1H June 2023 Q6.4; 8461/1H June 2022 Q5.5 | 2, 2 |
| 4.4.1.2 | Rate of photosynthesis | 8461/1H June 2023 Q6.4; 8461/1H June 2022 Q5.5 | 2, 2 |
| 4.4.1.3 | Uses of glucose from photosynthesis | 8461/2F June 2022 Q6.4; 8461/2H June 2023 Q4.1 | 1, 6 |
| 4.4.2.1 | Aerobic and anaerobic respiration | 8461/1H June 2023 Q4.1; 8461/2H June 2022 Q8.3 | 4, 2 |
| 4.4.2.2 | Response to exercise | 8461/1H June 2023 Q4.2; 8461/2F June 2022 Q6.5 | 6, 1 |
| 4.4.2.3 | Metabolism | 8461/1H June 2022 Q6.4; 8461/1H June 2023 Q5.3 | 4, 2 |
| 4.5.1 | Homeostasis | 8461/2H June 2022 Q8.1 | 2 |
| 4.5.2.1 | Structure and function | 8461/2H June 2023 Q2.6; 8461/2F June 2022 Q2.3 | 4, 2 |
| 4.5.2.2 | The brain (biology only) | not found in the sampled papers | |
| 4.5.2.3 | The eye (biology only) | 8461/2H June 2023 Q2.5 | 2 |
| 4.5.2.4 | Control of body temperature (biology only) | 8461/2H June 2022 Q8.4 | 3 |
| 4.5.3.1 | Human endocrine system | 8461/2H June 2023 Q5.1 | 3 |
| 4.5.3.2 | Control of blood glucose concentration | 8461/2H June 2022 Q3.2; 8461/2H June 2023 Q5.1 | 3, 3 |
| 4.5.3.3 | Maintaining water and nitrogen balance in the body (biology only) | 8461/2H June 2022 Q5.5; 8461/2H June 2023 Q5.3 | 2, 4 |
| 4.5.3.4 | Hormones in human reproduction | 8461/2H June 2023 Q7.3; 8461/2F June 2022 Q5.1 | 2, 2 |
| 4.5.3.5 | Contraception | 8461/2F June 2023 Q1.9; 8461/2F June 2022 Q5.4 | 2, 6 |
| 4.5.3.6 | The use of hormones to treat infertility (HT only) | 8461/2H June 2023 Q7.2 | 5 |
| 4.5.3.7 | Negative feedback (HT only) | 8461/2H June 2023 Q5.1 | 3 |
| 4.5.4.1 | Control and coordination | 8461/2H June 2022 Q9.1 | 2 |
| 4.5.4.2 | Use of plant hormones (HT only) | not found in the sampled papers | |
| 4.6.1.1 | Sexual and asexual reproduction | 8461/2H June 2022 Q1.1; 8461/1H June 2023 Q5.4 | 2, 3 |
| 4.6.1.2 | Meiosis | 8461/2H June 2022 Q1.4; 8461/2H June 2023 Q8.2 | 2, 2 |
| 4.6.1.3 | Advantages and disadvantages of sexual and asexual reproduction (biology only) | 8461/2H June 2023 Q3.1 | 1 |
| 4.6.1.4 | DNA and the genome | 8461/2F June 2022 Q1.8 | 1 |
| 4.6.1.5 | DNA structure (biology only) | 8461/2H June 2022 Q5.6; 8461/2H June 2023 Q8.5 | 3, 1 |
| 4.6.1.6 | Genetic inheritance | 8461/2H June 2023 Q7.5; 8461/2H June 2022 Q5.2 | 3, 4 |
| 4.6.1.7 | Inherited disorders | 8461/2H June 2022 Q5.2; 8461/2H June 2023 Q7.4 | 4, 3 |
| 4.6.1.8 | Sex determination | 8461/2H June 2023 Q3.5 | 3 |
| 4.6.2.1 | Variation | 8461/2H June 2023 Q3.4 | 1 |
| 4.6.2.2 | Evolution | 8461/2H June 2023 Q1.3 | 1 |
| 4.6.2.3 | Selective breeding | 8461/2H June 2023 Q3.7 | 2 |
| 4.6.2.4 | Genetic engineering | not found in the sampled papers | |
| 4.6.2.5 | Cloning (biology only) | 8461/2H June 2023 Q3.3 | 1 |
| 4.6.3.1 | Theory of evolution (biology only) | not found in the sampled papers | |
| 4.6.3.2 | Speciation (biology only) | not found in the sampled papers | |
| 4.6.3.3 | The understanding of genetics (biology only) | not found in the sampled papers | |
| 4.6.3.4 | Evidence for evolution | 8461/2F June 2022 Q7.4 | 2 |
| 4.6.3.5 | Fossils | 8461/2F June 2022 Q7.5 | 3 |
| 4.6.3.6 | Extinction | 8461/2F June 2022 Q7.6 | 3 |
| 4.6.3.7 | Resistant bacteria | 8461/2F June 2023 Q4.8 | 2 |
| 4.6.4 | Classification of living organisms | 8461/2F June 2022 Q7.1; 8461/2H June 2023 Q1.2 | 2, 1 |
| 4.7.1.1 | Communities | 8461/2H June 2023 Q1.4; 8461/2H June 2022 Q2.1 | 3, 4 |
| 4.7.1.2 | Abiotic factors | 8461/2H June 2022 Q2.1; 8461/2H June 2023 Q3.4 | 4, 1 |
| 4.7.1.3 | Biotic factors | 8461/2H June 2022 Q2.1; 8461/2F June 2023 Q3.4 | 4, 2 |
| 4.7.1.4 | Adaptations | 8461/2H June 2023 Q1.5 | 1 |
| 4.7.2.1 | Levels of organisation | 8461/2H June 2022 Q2.2; 8461/2F June 2023 Q2.1 | 6, 2 |
| 4.7.2.2 | How materials are cycled | 8461/2H June 2022 Q6.1; 8461/2H June 2023 Q6.1 | 1, 4 |
| 4.7.2.3 | Decomposition (biology only) | 8461/2H June 2023 Q4.3 | 3 |
| 4.7.2.4 | Impact of environmental change (biology only) (HT only) | 8461/2H June 2023 Q6.2 | 2 |
| 4.7.3.1 | Biodiversity | 8461/2H June 2023 Q6.5 | 2 |
| 4.7.3.2 | Waste management | 8461/2H June 2022 Q4.2 | 3 |
| 4.7.3.3 | Land use | 8461/2H June 2023 Q6.2 | 2 |
| 4.7.3.4 | Deforestation | 8461/2H June 2023 Q6.2 | 2 |
| 4.7.3.5 | Global warming | 8461/2H June 2022 Q4.3 | 6 |
| 4.7.3.6 | Maintaining biodiversity | 8461/2H June 2023 Q6.5 | 2 |
| 4.7.4.1 | Trophic levels | 8461/2F June 2023 Q3.2 | 3 |
| 4.7.4.2 | Pyramids of biomass | not found in the sampled papers | |
| 4.7.4.3 | Transfer of biomass | 8461/2H June 2022 Q6.4; 8461/2F June 2023 Q3.7 | 5, 2 |
| 4.7.5.1 | Factors affecting food security | 8461/2H June 2022 Q6.6 | 2 |
| 4.7.5.2 | Farming techniques | 8461/2H June 2022 Q6.5; 8461/2F June 2023 Q4.2 | 2, 2 |
| 4.7.5.3 | Sustainable fisheries | not found in the sampled papers | |
| 4.7.5.4 | Role of biotechnology | not found in the sampled papers | |

## Chemistry topic coverage

| Code | Topic | Question(s) | Marks |
|---|---|---|---|
| 4.1.1.1 | Atoms, elements and compounds | 8462/1H June 2022 Q5.3; 8462/1H June 2023 Q8.5 | 3, 3 |
| 4.1.1.2 | Mixtures | 8462/2H June 2022 Q5.3 | 2 |
| 4.1.1.3 | The development of the model of the atom (common content with physics) | 8462/1H June 2023 Q1.1 | 2 |
| 4.1.1.4 | Relative electrical charges of subatomic particles | 8462/1F June 2022 Q1.1; 8462/1F June 2023 Q1.5 | 2, 4 |
| 4.1.1.5 | Size and mass of atoms | 8462/1F June 2022 Q1.2; 8462/1F June 2023 Q3.2 | 2, 2 |
| 4.1.1.6 | Relative atomic mass | 8462/1H June 2022 Q5.5; 8462/1H June 2023 Q1.5 | 3, 3 |
| 4.1.1.7 | Electronic structure | 8462/1F June 2023 Q1.5; 8462/1H June 2022 Q1.4 | 4, 1 |
| 4.1.2.1 | The periodic table | 8462/1H June 2023 Q1.3 | 2 |
| 4.1.2.2 | Development of the periodic table | 8462/1H June 2023 Q1.4; 8462/1F June 2022 Q4.1 | 1, 1 |
| 4.1.2.3 | Metals and non-metals | 8462/1H June 2023 Q8.1; 8462/1H June 2022 Q1.1 | 2, 1 |
| 4.1.2.4 | Group 0 | 8462/1H June 2023 Q8.1; 8462/1H June 2022 Q5.4 | 2, 1 |
| 4.1.2.5 | Group 1 | 8462/1H June 2022 Q5.2; 8462/1F June 2023 Q6.2 | 3, 2 |
| 4.1.2.6 | Group 7 | 8462/1H June 2023 Q1.3; 8462/1F June 2022 Q4.7 | 2, 2 |
| 4.1.3.1 | Comparison with Group 1 elements | 8462/1H June 2022 Q1.3; 8462/1F June 2023 Q6.3 | 2, 2 |
| 4.1.3.2 | Typical properties | 8462/1H June 2022 Q1.3 | 2 |
| 4.2.1.1 | Chemical bonds | 8462/1H June 2022 Q1.7; 8462/1H June 2023 Q8.1 | 4, 2 |
| 4.2.1.2 | Ionic bonding | 8462/1H June 2022 Q1.7; 8462/1H June 2023 Q5.7 | 4, 1 |
| 4.2.1.3 | Ionic compounds | 8462/1F June 2023 Q7.1 | 2 |
| 4.2.1.4 | Covalent bonding | 8462/1H June 2023 Q4.4; 8462/1H June 2022 Q7.5 | 2, 1 |
| 4.2.1.5 | Metallic bonding | 8462/1H June 2022 Q1.5; 8462/1H June 2023 Q6.2 | 3, 3 |
| 4.2.2.1 | The three states of matter | 8462/1H June 2022 Q3.2; 8462/2F June 2023 Q6.1 | 3, 2 |
| 4.2.2.2 | State symbols | 8462/1H June 2022 Q4.1 | 1 |
| 4.2.2.3 | Properties of ionic compounds | 8462/1F June 2022 Q8.3 | 1 |
| 4.2.2.4 | Properties of small molecules | 8462/1H June 2023 Q4.5 | 4 |
| 4.2.2.5 | Polymers | 8462/1H June 2023 Q4.5; 8462/1F June 2022 Q6.2 | 4, 1 |
| 4.2.2.6 | Giant covalent structures | 8462/1H June 2022 Q3.2 | 3 |
| 4.2.2.7 | Properties of metals and alloys | 8462/1H June 2023 Q6.3 | 2 |
| 4.2.2.8 | Metals as conductors | 8462/1H June 2022 Q1.5; 8462/1H June 2023 Q6.2 | 3, 3 |
| 4.2.3.1 | Diamond | 8462/1H June 2022 Q3.1 | 3 |
| 4.2.3.2 | Graphite | 8462/1F June 2023 Q3.5; 8462/1F June 2022 Q6.1 | 2, 1 |
| 4.2.3.3 | Graphene and fullerenes | 8462/1H June 2022 Q3.3; 8462/1F June 2023 Q3.4 | 1, 1 |
| 4.2.4.1 | Sizes of particles and their properties | 8462/1F June 2022 Q7.2; 8462/1F June 2023 Q5.3 | 4, 4 |
| 4.2.4.2 | Uses of nanoparticles | 8462/1H June 2023 Q10.1; 8462/1F June 2022 Q7.4 | 2, 2 |
| 4.3.1.1 | Conservation of mass and balanced chemical equations | 8462/1H June 2022 Q5.3; 8462/2H June 2023 Q5.1 | 3, 2 |
| 4.3.1.2 | Relative formula mass | 8462/2H June 2023 Q5.2; 8462/1H June 2022 Q7.4 | 3, 5 |
| 4.3.1.3 | Mass changes when a reactant or product is a gas | 8462/2H June 2022 Q2.2; 8462/2H June 2023 Q7.2 | 2, 2 |
| 4.3.1.4 | Chemical measurements | 8462/1H June 2023 Q2.5 | 2 |
| 4.3.2.1 | Moles (HT only) | 8462/1H June 2022 Q3.5; 8462/1H June 2023 Q9.2 | 3, 1 |
| 4.3.2.2 | Amounts of substances in equations (HT only) | 8462/1H June 2022 Q7.4; 8462/1H June 2023 Q9.2 | 5, 1 |
| 4.3.2.3 | Using moles to balance equations (HT only) | not found in the sampled papers | |
| 4.3.2.4 | Limiting reactants (HT only) | 8462/1H June 2022 Q7.6 | 4 |
| 4.3.2.5 | Concentration of solutions | 8462/1H June 2022 Q8.1; 8462/1F June 2023 Q2.7 | 4, 3 |
| 4.3.3.1 | Percentage yield | not found in the sampled papers | |
| 4.3.3.2 | Atom economy | 8462/1H June 2023 Q9.6; 8462/1F June 2022 Q8.7 | 4, 2 |
| 4.3.4 | Using concentrations of solutions in mol/dm3 (chemistry only) | 8462/1H June 2022 Q8.3; 8462/2H June 2023 Q7.4 | 4, 2 |
| 4.3.5 | Use of amount of substance in relation to volumes of gases | 8462/1H June 2022 Q7.6; 8462/1H June 2023 Q7.5 | 4, 1 |
| 4.4.1.1 | Metal oxides | 8462/1H June 2023 Q9.1 | 2 |
| 4.4.1.2 | The reactivity series | 8462/1H June 2022 Q5.2; 8462/1H June 2023 Q9.5 | 3, 3 |
| 4.4.1.3 | Extraction of metals and reduction | 8462/1H June 2022 Q7.1; 8462/1F June 2023 Q6.1 | 2, 1 |
| 4.4.1.4 | Oxidation and reduction in terms of electrons (HT only) | 8462/1H June 2023 Q9.3; 8462/1H June 2022 Q4.5 | 1, 1 |
| 4.4.2.1 | Reactions of acids with metals | 8462/1H June 2023 Q8.5; 8462/1F June 2022 Q5.6 | 3, 3 |
| 4.4.2.2 | Neutralisation of acids and salt production | 8462/1H June 2023 Q3.1; 8462/1F June 2022 Q3.3 | 6, 2 |
| 4.4.2.3 | Soluble salts | 8462/1H June 2022 Q4.4; 8462/1H June 2023 Q3.2 | 2, 2 |
| 4.4.2.4 | The pH scale and neutralisation | 8462/1H June 2022 Q8.1; 8462/1F June 2023 Q2.1 | 4, 2 |
| 4.4.2.5 | Titrations (chemistry only) | 8462/1H June 2022 Q8.2; 8462/1H June 2023 Q5.3 | 2, 2 |
| 4.4.2.6 | Strong and weak acids (HT only) | 8462/1H June 2022 Q8.1; 8462/1H June 2023 Q5.1 | 4, 1 |
| 4.4.3.1 | The process of electrolysis | 8462/1F June 2023 Q7.2; 8462/1F June 2022 Q8.3 | 1, 1 |
| 4.4.3.2 | Electrolysis of molten ionic compounds | 8462/1F June 2022 Q8.4; 8462/1F June 2023 Q7.3 | 2, 2 |
| 4.4.3.3 | Using electrolysis to extract metals | 8462/1H June 2022 Q7.2; 8462/1H June 2023 Q9.5 | 2, 3 |
| 4.4.3.4 | Electrolysis of aqueous solutions | 8462/1H June 2022 Q6.4; 8462/1H June 2023 Q7.3 | 2, 4 |
| 4.4.3.5 | Representation of reactions at electrodes as half equations (HT only) | 8462/1H June 2022 Q6.1; 8462/1H June 2023 Q7.1 | 1, 1 |
| 4.5.1.1 | Energy transfer during exothermic and endothermic reactions | 8462/1H June 2022 Q2.1; 8462/1H June 2023 Q2.1 | 6, 2 |
| 4.5.1.2 | Reaction profiles | 8462/1H June 2022 Q2.5; 8462/1H June 2023 Q4.3 | 2, 3 |
| 4.5.1.3 | The energy change of reactions (HT only) | 8462/1H June 2023 Q4.2 | 2 |
| 4.5.2.1 | Cells and batteries | 8462/1H June 2022 Q4.7 | 3 |
| 4.5.2.2 | Fuel cells | not found in the sampled papers | |
| 4.6.1.1 | Calculating rates of reactions | 8462/2H June 2022 Q8.2; 8462/2H June 2023 Q1.2 | 5, 5 |
| 4.6.1.2 | Factors which affect the rates of chemical reactions | 8462/2H June 2022 Q8.5; 8462/2H June 2023 Q1.3 | 2, 2 |
| 4.6.1.3 | Collision theory and activation energy | 8462/2H June 2023 Q7.1; 8462/2F June 2022 Q6.7 | 2, 2 |
| 4.6.1.4 | Catalysts | 8462/2H June 2023 Q7.1; 8462/2H June 2022 Q7.6 | 2, 6 |
| 4.6.2.1 | Reversible reactions | 8462/2F June 2023 Q4.1 | 2 |
| 4.6.2.2 | Energy changes and reversible reactions | 8462/2H June 2023 Q9.2; 8462/2H June 2022 Q2.2 | 2, 2 |
| 4.6.2.3 | Equilibrium | 8462/2H June 2023 Q9.6 | 1 |
| 4.6.2.4 | The effect of changing conditions on equilibrium (HT only) | 8462/2H June 2023 Q9.5 | 2 |
| 4.6.2.5 | The effect of changing concentration (HT only) | 8462/2H June 2023 Q9.7 | 1 |
| 4.6.2.6 | The effect of temperature changes on equilibrium (HT only) | 8462/2H June 2023 Q9.3; 8462/2H June 2022 Q7.6 | 1, 6 |
| 4.6.2.7 | The effect of pressure changes on equilibrium (HT only) | 8462/2H June 2023 Q9.5; 8462/2H June 2022 Q7.6 | 2, 6 |
| 4.7.1.1 | Crude oil, hydrocarbons and alkanes | 8462/2F June 2022 Q2.6 | 1 |
| 4.7.1.2 | Fractional distillation and petrochemicals | 8462/2H June 2022 Q4.1; 8462/2F June 2023 Q2.6 | 4, 3 |
| 4.7.1.3 | Properties of hydrocarbons | 8462/2H June 2022 Q4.5 | 2 |
| 4.7.1.4 | Cracking and alkenes | 8462/2H June 2022 Q4.6; 8462/2F June 2023 Q2.6 | 3, 3 |
| 4.7.2.1 | Structure and formulae of alkenes | 8462/2F June 2023 Q2.7; 8462/2H June 2022 Q4.7 | 2, 1 |
| 4.7.2.2 | Reactions of alkenes | not found in the sampled papers | |
| 4.7.2.3 | Alcohols | 8462/2H June 2023 Q2.1; 8462/2F June 2022 Q4.5 | 2, 3 |
| 4.7.2.4 | Carboxylic acids | 8462/2H June 2023 Q2.8 | 2 |
| 4.7.3.1 | Addition polymerisation | 8462/2H June 2022 Q1.1; 8462/2H June 2023 Q8.2 | 2, 3 |
| 4.7.3.2 | Condensation polymerisation (HT only) | not found in the sampled papers | |
| 4.7.3.3 | Amino acids (HT only) | 8462/2H June 2023 Q8.5 | 2 |
| 4.7.3.4 | DNA (deoxyribonucleic acid) and other naturally occurring polymers | 8462/2H June 2023 Q8.7 | 1 |
| 4.8.1.1 | Pure substances | 8462/2F June 2022 Q1.1; 8462/2F June 2023 Q3.3 | 2, 1 |
| 4.8.1.2 | Formulations | 8462/2F June 2022 Q7.6 | 1 |
| 4.8.1.3 | Chromatography | 8462/2H June 2023 Q6.1; 8462/2F June 2022 Q4.3 | 2, 4 |
| 4.8.2.1 | Test for hydrogen | 8462/2H June 2023 Q1.4 | 2 |
| 4.8.2.2 | Test for oxygen | 8462/2F June 2023 Q1.6 | 1 |
| 4.8.2.3 | Test for carbon dioxide | 8462/2H June 2023 Q2.4 | 1 |
| 4.8.2.4 | Test for chlorine | not found in the sampled papers | |
| 4.8.3.1 | Flame tests | 8462/2H June 2023 Q3.1; 8462/2F June 2022 Q1.6 | 6, 1 |
| 4.8.3.2 | Metal hydroxides | 8462/2H June 2023 Q5.3; 8462/2F June 2022 Q8.5 | 2, 2 |
| 4.8.3.3 | Carbonates | not found in the sampled papers | |
| 4.8.3.4 | Halides | 8462/2H June 2023 Q3.1; 8462/2F June 2022 Q1.7 | 6, 1 |
| 4.8.3.5 | Sulfates | not found in the sampled papers | |
| 4.8.3.6 | Instrumental methods | 8462/2H June 2023 Q3.3 | 1 |
| 4.8.3.7 | Flame emission spectroscopy | 8462/2H June 2023 Q3.2 | 1 |
| 4.9.1.1 | The proportions of different gases in the atmosphere | 8462/2F June 2023 Q5.5; 8462/2F June 2022 Q3.1 | 3, 1 |
| 4.9.1.2 | The Earth's early atmosphere | 8462/2H June 2022 Q6.1; 8462/2F June 2023 Q1.1 | 2, 1 |
| 4.9.1.3 | How oxygen increased | 8462/2F June 2023 Q1.3; 8462/2F June 2022 Q4.6 | 2, 3 |
| 4.9.1.4 | How carbon dioxide decreased | 8462/2H June 2022 Q6.5 | 3 |
| 4.9.2.1 | Greenhouse gases | 8462/2F June 2023 Q5.1 | 2 |
| 4.9.2.2 | Human activities which contribute to an increase in greenhouse gases in the atmosphere | 8462/2H June 2023 Q4.2; 8462/2F June 2022 Q4.6 | 2, 3 |
| 4.9.2.3 | Global climate change | 8462/2H June 2023 Q4.4 | 2 |
| 4.9.2.4 | The carbon footprint and its reduction | 8462/2F June 2023 Q6.7; 8462/2F June 2022 Q4.6 | 3, 3 |
| 4.9.3.1 | Atmospheric pollutants from fuels | 8462/2H June 2022 Q4.4; 8462/2F June 2023 Q6.2 | 2, 2 |
| 4.9.3.2 | Properties and effects of atmospheric pollutants | 8462/2H June 2022 Q4.4; 8462/2F June 2023 Q6.3 | 2, 1 |
| 4.10.1.1 | Using the Earth's resources and sustainable development | 8462/2H June 2022 Q1.4; 8462/2H June 2023 Q9.8 | 2, 2 |
| 4.10.1.2 | Potable water | 8462/2H June 2022 Q5.4 | 2 |
| 4.10.1.3 | Waste water treatment | 8462/2H June 2022 Q5.1 | 4 |
| 4.10.1.4 | Alternative methods of extracting metals (HT only) | 8462/2H June 2023 Q5.4 | 2 |
| 4.10.2.1 | Life cycle assessment | 8462/2H June 2022 Q3.1 | 6 |
| 4.10.2.2 | Ways of reducing the use of resources | 8462/2H June 2022 Q1.3; 8462/2H June 2023 Q9.8 | 2, 2 |
| 4.10.3.1 | Corrosion and its prevention | not found in the sampled papers | |
| 4.10.3.2 | Alloys as useful materials | 8462/2F June 2023 Q7.2 | 2 |
| 4.10.3.3 | Ceramics, polymers and composites | 8462/2H June 2023 Q8.3 | 1 |
| 4.10.4.1 | The Haber process | 8462/2H June 2022 Q7.1 | 2 |
| 4.10.4.2 | Production and uses of NPK fertilisers | 8462/2H June 2023 Q10.6; 8462/2F June 2022 Q7.2 | 2, 2 |

## Physics topic coverage

| Code | Topic | Question(s) | Marks |
|---|---|---|---|
| 4.1.1.1 | Energy stores and systems | 8463/1H June 2023 Q7.2; 8463/1H June 2022 Q9.3 | 3, 1 |
| 4.1.1.2 | Changes in energy | 8463/1H June 2022 Q10.1; 8463/1H June 2023 Q4.1 | 6, 4 |
| 4.1.1.3 | Energy changes in systems | 8463/1H June 2023 Q2.2; 8463/1F June 2022 Q8.3 | 4, 4 |
| 4.1.1.4 | Power | 8463/1H June 2023 Q4.2; 8463/1H June 2022 Q9.1 | 5, 5 |
| 4.1.2.1 | Energy transfers in a system | 8463/1H June 2022 Q4.1; 8463/1F June 2023 Q5.4 | 2, 4 |
| 4.1.2.2 | Efficiency | 8463/1H June 2023 Q1.5; 8463/1H June 2022 Q1.3 | 3, 3 |
| 4.1.3 | National and global energy resources | 8463/1H June 2022 Q1.1; 8463/1H June 2023 Q4.3 | 2, 2 |
| 4.2.1.1 | Standard circuit diagram symbols | 8463/2F June 2023 Q3.4; 8463/1H June 2022 Q11.1 | 2, 1 |
| 4.2.1.2 | Electrical charge and current | 8463/1F June 2022 Q7.4; 8463/1F June 2023 Q1.4 | 4, 2 |
| 4.2.1.3 | Current, resistance and potential difference | 8463/1H June 2023 Q6.2 | 3 |
| 4.2.1.4 | Resistors | 8463/1H June 2023 Q6.1 | 6 |
| 4.2.2 | Series and parallel circuits | 8463/1H June 2022 Q11.4; 8463/1F June 2023 Q1.3 | 3, 3 |
| 4.2.3.1 | Direct and alternating potential difference | 8463/1H June 2023 Q3.1 | 1 |
| 4.2.3.2 | Mains electricity | not found in the sampled papers | |
| 4.2.4.1 | Power | 8463/1H June 2022 Q3.2; 8463/1H June 2023 Q1.3 | 3, 3 |
| 4.2.4.2 | Energy transfers in everyday appliances | 8463/1H June 2022 Q6.3; 8463/1H June 2023 Q3.3 | 4, 3 |
| 4.2.4.3 | The National Grid | 8463/1H June 2022 Q6.1; 8463/1H June 2023 Q1.1 | 4, 2 |
| 4.2.5.1 | Static charge | 8463/1H June 2022 Q5.1; 8463/1H June 2023 Q8.2 | 3, 2 |
| 4.2.5.2 | Electric fields | 8463/1H June 2022 Q5.4; 8463/1H June 2023 Q8.2 | 3, 2 |
| 4.3.1.1 | Density of materials | 8463/1H June 2022 Q2.1; 8463/1H June 2023 Q3.5 | 6, 6 |
| 4.3.1.2 | Changes of state | not found in the sampled papers | |
| 4.3.2.1 | Internal energy | 8463/1H June 2023 Q3.5 | 6 |
| 4.3.2.2 | Temperature changes in a system and specific heat capacity | not found in the sampled papers | |
| 4.3.2.3 | Changes of state and specific latent heat | 8463/1H June 2022 Q8.3; 8463/1H June 2023 Q3.4 | 5, 3 |
| 4.3.3.1 | Particle motion in gases | 8463/1H June 2023 Q9.3 | 4 |
| 4.3.3.2 | Pressure in gases (physics only) | 8463/1H June 2023 Q9.2 | 2 |
| 4.3.3.3 | Increasing the pressure of a gas (physics only) (HT only) | not found in the sampled papers | |
| 4.4.1.1 | The structure of an atom | 8463/1H June 2023 Q5.1 | 3 |
| 4.4.1.2 | Mass number, atomic number and isotopes | 8463/1F June 2023 Q3.1 | 2 |
| 4.4.1.3 | The development of the model of the atom (common content with chemistry) | 8463/1H June 2023 Q8.1 | 2 |
| 4.4.2.1 | Radioactive decay and nuclear radiation | 8463/1H June 2023 Q5.7; 8463/1F June 2022 Q4.4 | 2, 3 |
| 4.4.2.2 | Nuclear equations | 8463/1H June 2022 Q7.2 | 2 |
| 4.4.2.3 | Half-lives and the random nature of radioactive decay | 8463/1H June 2023 Q5.3 | 2 |
| 4.4.2.4 | Radioactive contamination | 8463/1H June 2022 Q7.3; 8463/1H June 2023 Q5.5 | 5, 2 |
| 4.4.3.1 | Background radiation | 8463/1H June 2023 Q5.8; 8463/1F June 2022 Q4.7 | 3, 2 |
| 4.4.3.2 | Different half-lives of radioactive isotopes | not found in the sampled papers | |
| 4.4.3.3 | Uses of nuclear radiation | 8463/1H June 2023 Q5.4 | 3 |
| 4.4.4.1 | Nuclear fission | 8463/1F June 2023 Q3.7 | 2 |
| 4.4.4.2 | Nuclear fusion | 8463/1F June 2023 Q3.7 | 2 |
| 4.5.1.1 | Scalar and vector quantities | 8463/2H June 2023 Q6.3 | 3 |
| 4.5.1.2 | Contact and non-contact forces | 8463/2H June 2022 Q8.1; 8463/2H June 2023 Q2.4 | 3, 1 |
| 4.5.1.3 | Gravity | 8463/2H June 2022 Q5.2; 8463/2F June 2023 Q1.3 | 3, 2 |
| 4.5.1.4 | Resultant forces | 8463/2H June 2023 Q2.2; 8463/2F June 2022 Q2.6 | 1, 1 |
| 4.5.2 | Work done and energy transfer | 8463/2H June 2022 Q1.1 | 2 |
| 4.5.3 | Forces and elasticity | 8463/2H June 2022 Q5.3; 8463/2F June 2023 Q1.5 | 3, 2 |
| 4.5.4 | Moments, levers and gears (physics only) | 8463/2H June 2023 Q3.1 | 1 |
| 4.5.5.1 | Pressure in a fluid | 8463/2H June 2023 Q1.7; 8463/2H June 2022 Q8.1 | 4, 3 |
| 4.5.5.2 | Atmospheric pressure | 8463/2H June 2023 Q2.6; 8463/2F June 2022 Q6.5 | 2, 2 |
| 4.5.6.1 | Describing motion along a line | 8463/2H June 2022 Q1.3; 8463/2H June 2023 Q3.3 | 3, 3 |
| 4.5.6.2 | Forces, accelerations and Newton's Laws of motion | 8463/2F June 2023 Q2.5 | 2 |
| 4.5.6.3 | Forces and braking | 8463/2H June 2022 Q3.1; 8463/2H June 2023 Q3.5 | 2, 2 |
| 4.5.7.1 | Momentum is a property of moving objects | 8463/2H June 2023 Q3.2 | 4 |
| 4.5.7.2 | Conservation of momentum | 8463/2H June 2023 Q5.1 | 1 |
| 4.5.7.3 | Changes in momentum (physics only) | 8463/2H June 2022 Q4.6; 8463/2H June 2023 Q5.3 | 3, 2 |
| 4.6.1.1 | Transverse and longitudinal waves | 8463/2H June 2023 Q1.1 | 1 |
| 4.6.1.2 | Properties of waves | 8463/2H June 2023 Q6.2; 8463/2F June 2022 Q7.1 | 5, 2 |
| 4.6.1.3 | Reflection of waves (physics only) | 8463/2H June 2022 Q2.1; 8463/2H June 2023 Q7.3 | 6, 2 |
| 4.6.1.4 | Sound waves (physics only) (HT only) | not found in the sampled papers | |
| 4.6.1.5 | Waves for detection and exploration (physics only) (HT only) | not found in the sampled papers | |
| 4.6.2.1 | Types of electromagnetic waves | 8463/2F June 2022 Q5.2 | 2 |
| 4.6.2.2 | Properties of electromagnetic waves 1 | 8463/2H June 2023 Q7.6 | 3 |
| 4.6.2.3 | Properties of electromagnetic waves 2 | 8463/2F June 2022 Q5.4 | 4 |
| 4.6.2.4 | Uses and applications of electromagnetic waves | 8463/2F June 2023 Q5.3 | 1 |
| 4.6.2.5 | Lenses (physics only) | 8463/2F June 2023 Q8.2 | 2 |
| 4.6.2.6 | Visible light (physics only) | 8463/2F June 2022 Q5.6; 8463/2H June 2023 Q7.1 | 2, 1 |
| 4.6.3.1 | Emission and absorption of infrared radiation | 8463/2H June 2023 Q1.3 | 2 |
| 4.6.3.2 | Perfect black bodies and radiation | not found in the sampled papers | |
| 4.7.1.1 | Poles of a magnet | 8463/2F June 2022 Q1.1; 8463/2H June 2023 Q4.3 | 2, 1 |
| 4.7.1.2 | Magnetic fields | 8463/2H June 2023 Q9.1; 8463/2F June 2022 Q1.2 | 5, 2 |
| 4.7.2.1 | Electromagnetism | 8463/2F June 2023 Q3.4; 8463/2F June 2022 Q1.4 | 2, 1 |
| 4.7.2.2 | Fleming's left-hand rule (HT only) | 8463/2H June 2022 Q7.5; 8463/2H June 2023 Q4.5 | 4, 4 |
| 4.7.2.3 | Electric motors (HT only) | not found in the sampled papers | |
| 4.7.2.4 | Loudspeakers (physics only) (HT only) | 8463/2H June 2023 Q4.4 | 1 |
| 4.7.3.1 | Induced potential (HT only) | 8463/2H June 2023 Q9.3 | 3 |
| 4.7.3.2 | Uses of the generator effect (HT only) | 8463/2H June 2023 Q9.1 | 5 |
| 4.7.3.3 | Microphones (HT only) | 8463/2H June 2023 Q4.1 | 1 |
| 4.7.3.4 | Transformers (HT only) | 8463/2H June 2022 Q7.1; 8463/2H June 2023 Q8.1 | 2, 2 |
| 4.8.1.1 | Our solar system | 8463/2H June 2022 Q6.1; 8463/2F June 2023 Q4.4 | 6, 2 |
| 4.8.1.2 | The life cycle of a star | 8463/2H June 2022 Q6.1; 8463/2F June 2023 Q4.5 | 6, 2 |
| 4.8.1.3 | Orbital motion, natural and artificial satellites | 8463/2H June 2023 Q6.3; 8463/2F June 2022 Q3.5 | 3, 2 |
| 4.8.2 | Red-shift (physics only) | 8463/2H June 2022 Q6.2; 8463/2H June 2023 Q6.4 | 2, 3 |

## What to check

- Whether AQA is the right board for science at the school (assumed).
- Whether the level bands and the "right plus wrong" rule match how you want Pip to behave.
- Higher-tier-only topics (marked "HT only" in the title) are tested only on Higher papers; Foundation students should not be marked on them.
