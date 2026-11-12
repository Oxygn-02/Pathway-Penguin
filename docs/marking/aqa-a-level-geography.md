# AQA A-level Geography (7037): how Pip marks it, and what it is based on

Status: **A level Geography finished. The board (AQA) is an assumption** until the school confirms it. Needs your check of the `check` rows.
Code: `artifacts/api-server/src/lib/marking/aqaALevelGeography.ts`. Tests: `src/__tests__/aqaALevelGeography.test.ts`.

## Documents used

All downloaded from AQA's file server and read as full text.

| What | Document | Version line printed on it |
|---|---|---|
| Specification | A-level Geography 7037 | A-level exams June 2018 onwards. Version 1.2, 2 September 2019 |
| Papers 7037/1 and 7037/2: question papers | June 2022 and June 2023 | not applicable |
| Papers 7037/1 and 7037/2: mark schemes | June 2022 and June 2023 | "Version: 1.0 Final" |

## How the exam is built (from the specification)

| Component | Content | Time | Marks | Weighting |
|---|---|---|---|---|
| 1 Physical geography | A: water and carbon cycles (36). B: one of hot deserts, coasts, glaciers (36). C: one of hazards, ecosystems under stress (48) | 2 hours 30 | 120 | 40% |
| 2 Human geography | A: global systems and global governance (36). B: changing places (36). C: one of urban, population and environment, resource security (48) | 2 hours 30 | 120 | 40% |
| 3 Fieldwork investigation | Student's own question, 3,000 to 4,000 words, marked by teachers | n/a | 60 | 20% |

Assessment objectives, overall: AO1 30 to 40%, AO2 30 to 40%, AO3 20 to 30% (AO3 includes the fieldwork skills, so it is a small part of the written papers).

## How an A level Geography answer is marked

Each section is built the same way, and the printed totals check out at 36, 36 and 48 per section.

1. **4 marks, point marked (AO1).** One mark per valid point, with an extra mark where a point is developed. The notes for answers are not exhaustive, so other valid points are credited.
2. **6 marks (data parts).** Two levels, Level 2 at 4 to 6 and Level 1 at 1 to 3. For data analysis (AO3) the level depends on how clear the analysis is and whether the figures are used as evidence and connected to each other. For "Figure and own knowledge" parts the split is AO1 2 and AO2 4: knowledge, then applying it to the new situation.
3. **9 marks.** Three levels, 7 to 9, 4 to 6 and 1 to 3, with the split AO1 4 and AO2 5.
4. **20 marks (the evaluative question).** Four levels, Level 4 at 16 to 20, Level 3 at 11 to 15, Level 2 at 6 to 10 and Level 1 at 1 to 5, with AO1 10 and AO2 10. The grid rewards a reasoned evaluative conclusion, analysis tied to the question, links between knowledge and the context, accuracy and detail of place knowledge and concepts, and awareness of scale and change over time.
5. **Pip's feedback** names the level reached, separates knowledge (AO1) from application and evaluation (AO2) or data analysis (AO3), and says what would reach the next level, for example adding a named example or a clear judgement.

## How the topics and questions were checked

- **Topics** are the specification's numbered content sections, 59 in all, with AQA's headings and codes. Skills sections, case-study sections and parent headings with no content of their own are not topics.
- **Marks.** Each cited part's marks are the `[n marks]` printed on the question paper. In all four papers the sections add up to 36, 36, 36, 36, 48 and 48 (Paper 1) and 36, 36, 48, 48, 48 (Paper 2).
- **Question to topic.** AQA does not publish a topic tag per question, so which question tests which section is our judgement. 16 of the 86 matches are flagged `check`. Some of the specification's terms were looked up in the specification text to place a question (for example fjords and eustatic change in 3.1.3.3, kames in 3.1.4.4, mudflows in 3.1.5.3).
- Data-response parts whose figures are pictures could not be read from the text, so they are not mapped. Sections with no clear question are listed as not found.

## Coverage by topic

### 3.1.1 Water and carbon cycles

| Code | Topic | Questions | Marks | Confidence |
|---|---|---|---|---|
| 3.1.1.1 | Water and carbon cycles as natural systems | not found | | |
| 3.1.1.2 | The water cycle | 7037/1 June 2022 Q1.2; 7037/1 June 2023 Q1.1; 7037/1 June 2023 Q1.2 | 6, 4, 6 | ok, ok, ok |
| 3.1.1.3 | The carbon cycle | 7037/1 June 2022 Q1.1; 7037/1 June 2022 Q1.3; 7037/1 June 2023 Q1.3; 7037/1 June 2023 Q1.4 | 4, 6, 6, 20 | ok, check, ok, ok |
| 3.1.1.4 | Water, carbon, climate and life on Earth | 7037/1 June 2022 Q1.4 | 20 | ok |

### 3.1.2 Hot desert systems and landscapes

| Code | Topic | Questions | Marks | Confidence |
|---|---|---|---|---|
| 3.1.2.1 | Deserts as natural systems | 7037/1 June 2022 Q2.1; 7037/1 June 2022 Q2.2 | 4, 6 | ok, check |
| 3.1.2.2 | Systems and processes | 7037/1 June 2022 Q2.3; 7037/1 June 2023 Q2.1; 7037/1 June 2023 Q2.3 | 6, 4, 6 | ok, ok, ok |
| 3.1.2.3 | Arid landscape development in contrasting settings | 7037/1 June 2022 Q2.3; 7037/1 June 2023 Q2.4 | 6, 20 | check, ok |
| 3.1.2.4 | Desertification | 7037/1 June 2022 Q2.4; 7037/1 June 2023 Q2.2 | 20, 6 | ok, check |

### 3.1.3 Coastal systems and landscapes

| Code | Topic | Questions | Marks | Confidence |
|---|---|---|---|---|
| 3.1.3.1 | Coasts as natural systems | not found | | |
| 3.1.3.2 | Systems and processes | 7037/1 June 2022 Q3.3; 7037/1 June 2023 Q3.1 | 6, 4 | ok, ok |
| 3.1.3.3 | Coastal landscape development | 7037/1 June 2022 Q3.1; 7037/1 June 2022 Q3.2; 7037/1 June 2023 Q3.4 | 4, 6, 20 | ok, ok, ok |
| 3.1.3.4 | Coastal management | 7037/1 June 2022 Q3.4; 7037/1 June 2023 Q3.3 | 20, 6 | check, check |

### 3.1.4 Glacial systems and landscapes

| Code | Topic | Questions | Marks | Confidence |
|---|---|---|---|---|
| 3.1.4.1 | Glaciers as natural systems | not found | | |
| 3.1.4.2 | The nature and distribution of cold environments | 7037/1 June 2023 Q4.3 | 6 | check |
| 3.1.4.3 | Systems and processes | 7037/1 June 2022 Q4.3; 7037/1 June 2023 Q4.1 | 6, 4 | ok, ok |
| 3.1.4.4 | Glaciated landscape development | 7037/1 June 2022 Q4.1; 7037/1 June 2023 Q4.4 | 4, 20 | ok, ok |
| 3.1.4.5 | Human impacts on cold environments | 7037/1 June 2022 Q4.4 | 20 | ok |

### 3.1.5 Hazards

| Code | Topic | Questions | Marks | Confidence |
|---|---|---|---|---|
| 3.1.5.1 | The concept of hazard in a geographical context | 7037/1 June 2023 Q5.1; 7037/1 June 2023 Q5.5 | 4, 20 | ok, check |
| 3.1.5.2 | Plate tectonics | not found | | |
| 3.1.5.3 | Volcanic hazards | 7037/1 June 2022 Q5.1; 7037/1 June 2022 Q5.5; 7037/1 June 2023 Q5.4 | 4, 20, 9 | ok, check, ok |
| 3.1.5.4 | Seismic hazards | 7037/1 June 2022 Q5.5; 7037/1 June 2023 Q5.3 | 20, 9 | ok, ok |
| 3.1.5.5 | Storm hazards | 7037/1 June 2022 Q5.3 | 9 | ok |
| 3.1.5.6 | Fires in nature | 7037/1 June 2022 Q5.4; 7037/1 June 2023 Q5.2 | 9, 6 | ok, ok |

### 3.1.6 Ecosystems under stress

| Code | Topic | Questions | Marks | Confidence |
|---|---|---|---|---|
| 3.1.6.1 | Ecosystems and sustainability | not found | | |
| 3.1.6.2 | Ecosystems and processes | 7037/1 June 2022 Q6.1; 7037/1 June 2023 Q6.1; 7037/1 June 2023 Q6.4 | 4, 4, 9 | ok, ok, check |
| 3.1.6.3 | Biomes | 7037/1 June 2022 Q6.3; 7037/1 June 2023 Q6.5 | 9, 20 | ok, ok |
| 3.1.6.4 | Ecosystems in the British Isles over time | 7037/1 June 2022 Q6.4 | 9 | ok |
| 3.1.6.5 | Marine ecosystems | not found | | |
| 3.1.6.6 | Local ecosystems | 7037/1 June 2022 Q6.5; 7037/1 June 2023 Q6.3 | 20, 9 | ok, ok |

### 3.2.1 Global systems and global governance

| Code | Topic | Questions | Marks | Confidence |
|---|---|---|---|---|
| 3.2.1.1 | Globalisation | 7037/2 June 2022 Q1.3; 7037/2 June 2023 Q1.1 | 6, 4 | ok, ok |
| 3.2.1.2 | Global systems | not found | | |
| 3.2.1.3 | International trade and access to markets | 7037/2 June 2022 Q1.4 | 20 | ok |
| 3.2.1.4 | Global governance | not found | | |
| 3.2.1.5.1 | Antarctica as a global common | 7037/2 June 2022 Q1.1; 7037/2 June 2023 Q1.4 | 4, 20 | ok, ok |
| 3.2.1.6 | Globalisation critique | 7037/2 June 2023 Q1.3 | 6 | check |

### 3.2.2 Changing places

| Code | Topic | Questions | Marks | Confidence |
|---|---|---|---|---|
| 3.2.2.1 | The nature and importance of places | 7037/2 June 2022 Q2.1 | 4 | ok |
| 3.2.2.2.1 | Relationships and connections | 7037/2 June 2022 Q2.3; 7037/2 June 2023 Q2.4 | 6, 20 | ok, check |
| 3.2.2.2.2 | Meaning and representation | 7037/2 June 2022 Q2.4; 7037/2 June 2023 Q2.3 | 20, 6 | ok, ok |
| 3.2.2.4 | Place studies | 7037/2 June 2023 Q2.1 | 4 | ok |

### 3.2.3 Contemporary urban environments

| Code | Topic | Questions | Marks | Confidence |
|---|---|---|---|---|
| 3.2.3.1 | Urbanisation | 7037/2 June 2022 Q3.3; 7037/2 June 2023 Q3.1 | 9, 4 | ok, ok |
| 3.2.3.2 | Urban forms | 7037/2 June 2022 Q3.5 | 20 | ok |
| 3.2.3.3 | Social and economic issues associated with urbanisation | 7037/2 June 2023 Q3.5 | 20 | ok |
| 3.2.3.4 | Urban climate | 7037/2 June 2022 Q3.1 | 4 | ok |
| 3.2.3.5 | Urban drainage | 7037/2 June 2022 Q3.2 | 6 | ok |
| 3.2.3.6 | Urban waste and its disposal | 7037/2 June 2022 Q3.4; 7037/2 June 2023 Q3.4 | 9, 9 | ok, ok |
| 3.2.3.7 | Other contemporary urban environmental issues | 7037/2 June 2023 Q3.3 | 9 | ok |
| 3.2.3.8 | Sustainable urban development | not found | | |

### 3.2.4 Population and the environment

| Code | Topic | Questions | Marks | Confidence |
|---|---|---|---|---|
| 3.2.4.1 | Introduction | not found | | |
| 3.2.4.2 | Environment and population | 7037/2 June 2022 Q4.3; 7037/2 June 2022 Q4.4; 7037/2 June 2023 Q4.1 | 9, 9, 4 | ok, check, ok |
| 3.2.4.3 | Environment, health and well-being | 7037/2 June 2022 Q4.5; 7037/2 June 2023 Q4.3; 7037/2 June 2023 Q4.4; 7037/2 June 2023 Q4.5 | 20, 9, 9, 20 | ok, ok, ok, check |
| 3.2.4.4 | Population change | 7037/2 June 2023 Q4.2 | 6 | check |
| 3.2.4.5 | Principles of population ecology and their application to human populations | 7037/2 June 2022 Q4.1 | 4 | ok |
| 3.2.4.6 | Global population futures | not found | | |

### 3.2.5 Resource security

| Code | Topic | Questions | Marks | Confidence |
|---|---|---|---|---|
| 3.2.5.1 | Resource development | 7037/2 June 2022 Q5.1; 7037/2 June 2023 Q5.1 | 4, 4 | ok, ok |
| 3.2.5.2 | Natural resource issues | 7037/2 June 2023 Q5.3 | 9 | ok |
| 3.2.5.3 | Water security | 7037/2 June 2022 Q5.4; 7037/2 June 2023 Q5.5 | 9, 20 | check, ok |
| 3.2.5.4 | Energy security | 7037/2 June 2022 Q5.5 | 20 | ok |
| 3.2.5.5 | Mineral security | 7037/2 June 2022 Q5.3; 7037/2 June 2023 Q5.4 | 9, 9 | ok, ok |
| 3.2.5.6 | Resource futures | not found | | |

## Not found in the four papers read

3.1.1.1, 3.1.3.1, 3.1.4.1, 3.1.5.2, 3.1.6.1, 3.1.6.5, 3.2.1.2, 3.2.1.4, 3.2.3.8, 3.2.4.1, 3.2.4.6, 3.2.5.6. Most of these are introductory "as a system" sections or sections covered only through data figures in the papers read.

## What to check

- Whether AQA is the right board for Geography (assumed).
- The `check` rows.
- Whether you want the fieldwork investigation (60 marks, 20%) marking added; it has no past papers, but the specification gives a mark scheme grid.
