# AQA GCSE Geography (8035): how Pip marks it, and what it is based on

Status: **fourth subject finished. The board (AQA) is an assumption** until the school confirms it. Needs your check of the `check` rows.
Code: `artifacts/api-server/src/lib/marking/aqaGeography.ts`. Tests: `src/__tests__/aqaGeography.test.ts`.

## Documents used

All downloaded from AQA's file server and read as text.

| What | Document | Version line printed on it |
|---|---|---|
| Specification | AQA GCSE Geography 8035 (`filestore.aqa.org.uk/resources/geography/specifications/AQA-8035-SP-2016.PDF`) | GCSE exams June 2018 onwards. Version 1.1, 12 September 2023 |
| Papers 8035/1, 2, 3, June 2022 and June 2023 | `AQA-80351-QP-JUN23-CR.PDF`, `AQA-80352-QP-JUN22-CR.PDF`, `AQA-80352-QP-JUN23-CR.PDF`, `AQA-80351-QP-JUN22.PDF`, `AQA-80353-QP-JUN22.PDF`, `AQA-80353-QP-JUN23.PDF`, plus mark schemes `AQA-80351-MS-JUN23.PDF` and the same pattern for the other papers and June 2022 | June 2023 Paper 1 mark scheme: "Version: 1.0 Final" |

## How the exam is built (from the specification)

| Paper | Content | Time | Marks | Weighting |
|---|---|---|---|---|
| 1 | Living with the physical environment: natural hazards, the living world, physical landscapes in the UK | 1 hour 30 | 88, including 3 for SPaG | 35% |
| 2 | Challenges in the human environment: urban issues, the changing economic world, resource management | 1 hour 30 | 88, including 3 for SPaG | 35% |
| 3 | Geographical applications: issue evaluation and fieldwork | 1 hour 30 | 76, including 6 for SPaG | 30% |

Paper 1 Section C and Paper 2 Section C let the student choose which questions to answer, so the marks printed across a whole paper add up to more than the paper's marks. Assessment objectives, overall: AO1 knowledge of places and processes 15%, AO2 geographical understanding 25%, AO3 apply, interpret and evaluate 35%, AO4 geographical skills 25%.

## How a Geography answer is marked

1. **Short answers** (1 to 3 marks) are point-based. The mark scheme gives the accepted answers and each question is tagged with the objective it rewards, such as "AO4 – 1 mark" for reading a figure.
2. **Extended answers** use **levels of response**. The levels and mark bands in the June 2023 Paper 1 mark scheme are:
   - 4 mark questions: Level 2 (Clear) 3 to 4 marks, Level 1 (Basic) 1 to 2.
   - 6 mark questions: Level 3 (Detailed) 5 to 6, Level 2 (Clear) 3 to 4, Level 1 (Basic) 1 to 2.
   - 9 mark questions: Level 3 (Detailed) 7 to 9, Level 2 (Clear) 4 to 6, Level 1 (Basic) 1 to 3.
   - Each level descriptor is written against the objectives the question tests (AO1 knowledge, AO2 understanding, AO3 application and evaluation). A "Detailed" answer is developed and evaluative, a "Clear" answer has linked statements, a "Basic" answer is simple statements. Mark schemes also cap some answers, for example a purely generic answer with no case study stays at Level 2.
3. **SPaG** adds up to 3 marks on the indicated 9 mark questions: high performance 3, intermediate 2, threshold 1. The student still earns SPaG marks if their content scores 0, as long as it is a genuine attempt.

Pip follows the same pattern: best-fit level first, then the mark within the level, then the SPaG mark on the indicated questions. The official indicative content for each question should be supplied to Pip, because it decides what counts as a valid point.

## How the topics and questions were checked

- **Topics** are the specification's numbered sections (27 of them, from 3.1.1.1 to 3.4.7). The titles are AQA's own headings. The finer bullet points inside each section are not mapped one by one yet.
- **Marks.** Each cited question's marks were read from the mark scheme's "Total marks" column, and the question paper gave the same numbers.
- **Topic tags are our judgement.** AQA does not publish a topic for each question. Rows marked `check` are loose matches.
- **Coverage is 27 of 27**, using two series (June 2022 and June 2023) and all three papers, but note that the case-study content (named places) is not captured by this table.

## Topic coverage

| Code | Topic | Question(s) | Marks | Confidence |
|---|---|---|---|---|
| 3.1.1.1 | Natural hazards | 8035/1 June 2023 Q1.10 | 6 | check |
| 3.1.1.2 | Tectonic hazards | 8035/1 June 2022 Q1.9; 8035/1 June 2023 Q1.11 | 4, 9 | ok, ok |
| 3.1.1.3 | Weather hazards | 8035/1 June 2022 Q1.8; 8035/1 June 2023 Q1.5 | 6, 3 | ok, ok |
| 3.1.1.4 | Climate change | 8035/1 June 2023 Q1.4 | 4 | ok |
| 3.1.2.1 | Ecosystems | 8035/1 June 2023 Q2.4 | 2 | ok |
| 3.1.2.2 | Tropical rainforests | 8035/1 June 2022 Q2.4; 8035/1 June 2023 Q2.9 | 6, 6 | ok, ok |
| 3.1.2.3 | Hot deserts | 8035/1 June 2022 Q2.9; 8035/1 June 2023 Q2.10 | 9, 9 | ok, ok |
| 3.1.2.4 | Cold environments | 8035/1 June 2022 Q2.9; 8035/1 June 2023 Q2.10 | 9, 9 | ok, ok |
| 3.1.3.1 | UK physical landscapes | 8035/1 June 2022 Q5.2 | 1 | check |
| 3.1.3.2 | Coastal landscapes in the UK | 8035/1 June 2022 Q3.6; 8035/1 June 2023 Q3.5 | 4, 4 | ok, ok |
| 3.1.3.3 | River landscapes in the UK | 8035/1 June 2022 Q4.6; 8035/1 June 2023 Q4.5 | 4, 4 | ok, ok |
| 3.1.3.4 | Glacial landscapes in the UK | 8035/1 June 2022 Q5.6; 8035/1 June 2023 Q5.5 | 4, 4 | ok, ok |
| 3.2.1 | Urban issues and challenges | 8035/2 June 2022 Q1.10; 8035/2 June 2023 Q1.11 | 9, 9 | ok, ok |
| 3.2.2 | The changing economic world | 8035/2 June 2022 Q2.11; 8035/2 June 2023 Q2.10 | 6, 9 | ok, ok |
| 3.2.3.1 | Resource management | 8035/2 June 2023 Q3.2 | 2 | check |
| 3.2.3.2 | Food | 8035/2 June 2022 Q4.7; 8035/2 June 2023 Q4.5 | 6, 6 | ok, ok |
| 3.2.3.3 | Water | 8035/2 June 2022 Q5.7; 8035/2 June 2023 Q5.5 | 6, 6 | ok, ok |
| 3.2.3.4 | Energy | 8035/2 June 2022 Q6.7; 8035/2 June 2023 Q6.5 | 6, 6 | ok, ok |
| 3.3.1 | Issue evaluation | 8035/3 June 2022 Q3; 8035/3 June 2023 Q3 | 9, 9 | ok, ok |
| 3.3.2 | Fieldwork | 8035/3 June 2023 Q5.4; 8035/3 June 2023 Q5.3 | 9, 6 | ok, ok |
| 3.4.1 | Cartographic skills | 8035/1 June 2023 Q3.3; 8035/2 June 2023 Q2.1 | 1, 1 | ok, ok |
| 3.4.2 | Graphical skills | 8035/2 June 2022 Q4.1; 8035/3 June 2023 Q4.4 | 1, 1 | ok, ok |
| 3.4.3 | Numerical skills | 8035/2 June 2022 Q2.7 | 1 | ok |
| 3.4.4 | Statistical skills | 8035/1 June 2023 Q1.8; 8035/2 June 2023 Q2.8 | 1, 2 | ok, ok |
| 3.4.5 | Use of qualitative and quantitative data | 8035/3 June 2022 Q4.5 | 3 | check |
| 3.4.6 | Formulate enquiry and argument | 8035/3 June 2023 Q4.8 | 4 | ok |
| 3.4.7 | Literacy | 8035/1 June 2023 Q1.11 | 9 | check |
## What to check

1. Rows marked `check`, and especially 3.4.7 Literacy, which is really the SPaG marks rather than a single question.
2. The case studies. GCSE Geography rewards named places and examples, which the school chooses. Pip cannot know which ones UTC teaches until we are told.
3. AQA as the board. I have not confirmed this with the school.
