# AQA A-level Design and Technology: Product Design (7552): how Pip marks it, and what it is based on

Status: **A level Product Design finished. The board (AQA) is an assumption** until the school confirms it. Needs your check of the `check` rows.
Code: `artifacts/api-server/src/lib/marking/aqaALevelProductDesign.ts`. Tests: `src/__tests__/aqaALevelProductDesign.test.ts`.

## Documents used

All downloaded from AQA's file server and read as full text.

| What | Document | Version line printed on it |
|---|---|---|
| Specification | A-level Design and Technology: Product Design 7552 | A-level exams June 2019 onwards. Version 1.4, 27 June 2022 |
| Papers 7552/1 and 7552/2: question papers | June 2022 and June 2023 (the June 2023 Paper 1 paper was only available under AQA's "-CR" file name) | not applicable |
| Papers 7552/1 and 7552/2: mark schemes | June 2022 and June 2023 | "Version: 1.0 Final" |

## How the exam is built (from the specification)

| Component | Content | Time | Marks | Weighting |
|---|---|---|---|---|
| Paper 1 | Technical principles, short answer and extended response | 2 hours 30 | 120 | 30% |
| Paper 2 | Designing and making principles. A: product analysis (30). B: commercial manufacture (50) | 1 hour 30 | 80 | 20% |
| Non-exam assessment | Substantial design and make project, with a portfolio and photographs of the prototype | n/a | 100 | 50% |

Assessment objectives, overall: AO1 identify and investigate design possibilities 15%, AO2 design and make prototypes 25%, AO3 analyse and evaluate 25%, AO4 technical and designing-and-making knowledge 35%. The written papers carry only AO3 (7.5% each) and AO4 (22.5% and 12.5%); AO1 and AO2 are marked in the project.

## How an A level Product Design answer is marked

1. **Short answers (1 to 4 marks) are point marked.** One mark per relevant point. The indicative content is a guide, and the mark scheme says other valid answers are credited.
2. **Calculation questions** are marked for the method and for the final answer with units, following the working shown.
3. **Extended answers use levels of response** with a mark range per level:
   - 6 marks: 5–6 (detailed, thorough), 3–4 (good), 1–2 (basic).
   - 9 marks: 7–9, 4–6, 1–3.
   - 12 marks: 9–12, 5–8, 1–4.
4. **What the levels reward** (paraphrased). The top level needs a detailed analysis or evaluation tied to the product or situation given, using the properties or characteristics of the material, process or finish; lower levels are descriptive, general or cover only one of the things asked for. Analyse-and-evaluate (AO3) questions reward the judgement; explain (AO4) questions reward correct technical understanding applied to the product shown.
5. **Pip's feedback** names the level reached, says which part of the question was missed (for example only the material and not the finish), and prompts the student to link each property to the use shown.

## How the topics and questions were checked

- **Topics** are the specification's 24 numbered content sections (3.1.1 to 3.1.14 and 3.2.1 to 3.2.10) with AQA's headings. The unnumbered sub-headings inside each section are not mapped one by one.
- **Marks.** Each cited number's marks are the `[n marks]` printed on the question paper, including questions printed as "[2 x 2 marks]" or "[3 × 2 marks]". The papers add up to 120 and 80.
- **Question to topic.** AQA does not publish a topic tag per question, so which question tests which section is our judgement. Some terms were looked up in the specification text to place a question (for example galvanising and anodising in 3.1.5, rapid prototyping and FEA in 3.1.7, open design in 3.1.10). 23 of the 80 matches are flagged `check`, more than in other subjects, because many questions cross several sections.
- Sections with no clear question are listed as not found.

## Coverage by topic

| Code | Topic | Questions | Marks | Confidence |
|---|---|---|---|---|
| 3.1.1 | Materials and their applications | 7552/1 June 2022 Q2; 7552/1 June 2022 Q3; 7552/1 June 2022 Q8; 7552/1 June 2022 Q9; 7552/1 June 2023 Q16; 7552/1 June 2023 Q22; 7552/2 June 2022 Q3; 7552/2 June 2023 Q10 | 4, 6, 3, 3, 3, 3, 4, 3 | check, ok, ok, ok, ok, ok, check, check |
| 3.1.2 | Performance characteristics of materials | 7552/1 June 2022 Q1; 7552/1 June 2022 Q10; 7552/1 June 2022 Q18; 7552/1 June 2022 Q21; 7552/1 June 2023 Q2; 7552/1 June 2023 Q4; 7552/1 June 2023 Q5; 7552/1 June 2023 Q10; 7552/1 June 2023 Q11; 7552/1 June 2023 Q19 | 3, 6, 6, 6, 3, 6, 6, 6, 3, 7 | ok, ok, ok, ok, ok, ok, ok, ok, check, check |
| 3.1.3 | Enhancement of materials | 7552/1 June 2022 Q12; 7552/1 June 2023 Q15 | 4, 2 | check, ok |
| 3.1.4 | Forming, redistribution and addition processes | 7552/1 June 2022 Q11; 7552/1 June 2022 Q14; 7552/1 June 2022 Q17; 7552/1 June 2023 Q1; 7552/1 June 2023 Q7; 7552/1 June 2023 Q23 | 6, 6, 12, 2, 6, 6 | ok, ok, ok, check, ok, ok |
| 3.1.5 | The use of finishes | 7552/1 June 2022 Q3; 7552/1 June 2022 Q7; 7552/1 June 2022 Q13; 7552/1 June 2023 Q13; 7552/1 June 2023 Q14; 7552/1 June 2023 Q17 | 6, 6, 2, 6, 6, 3 | check, ok, ok, ok, ok, ok |
| 3.1.6 | Modern industrial and commercial practice | 7552/1 June 2022 Q15; 7552/1 June 2023 Q20 | 6, 6 | ok, ok |
| 3.1.7 | Digital design and manufacture | 7552/1 June 2022 Q4; 7552/1 June 2022 Q5; 7552/1 June 2022 Q16; 7552/1 June 2022 Q20; 7552/1 June 2023 Q8; 7552/2 June 2023 Q5; 7552/2 June 2023 Q13 | 9, 3, 6, 6, 6, 6, 4 | ok, check, check, ok, ok, ok, check |
| 3.1.8 | The requirements for product design and development | 7552/1 June 2022 Q6; 7552/2 June 2023 Q2; 7552/2 June 2023 Q12; 7552/2 June 2023 Q16 | 7, 4, 3, 3 | check, check, ok, ok |
| 3.1.9 | Health and safety | 7552/2 June 2023 Q8 | 4 | ok |
| 3.1.10 | Protecting designs and intellectual property | 7552/1 June 2023 Q18 | 9 | ok |
| 3.1.11 | Design for manufacturing, maintenance, repair and disposal | 7552/1 June 2023 Q9 | 9 | ok |
| 3.1.12 | Feasibility studies | not found | | |
| 3.1.13 | Enterprise and marketing in the development of products | 7552/1 June 2022 Q22; 7552/2 June 2023 Q7 | 6, 4 | ok, ok |
| 3.1.14 | Design communication | 7552/1 June 2023 Q3; 7552/2 June 2022 Q13 | 4, 2 | check, ok |
| 3.2.1 | Design methods and processes | 7552/2 June 2022 Q14; 7552/2 June 2023 Q7 | 2, 4 | check, check |
| 3.2.2 | Design theory | 7552/2 June 2022 Q4; 7552/2 June 2022 Q10; 7552/2 June 2023 Q17 | 6, 4, 3 | ok, ok, ok |
| 3.2.3 | How technology and cultural changes can impact on the work of designers | 7552/2 June 2022 Q6; 7552/2 June 2022 Q11; 7552/2 June 2022 Q12 | 4, 4, 2 | check, ok, ok |
| 3.2.4 | Design processes | 7552/2 June 2022 Q2 | 4 | check |
| 3.2.5 | Critical analysis and evaluation | 7552/1 June 2023 Q12; 7552/2 June 2022 Q1; 7552/2 June 2022 Q15; 7552/2 June 2023 Q1; 7552/2 June 2023 Q6 | 6, 12, 6, 6, 6 | ok, ok, ok, ok, check |
| 3.2.6 | Selecting appropriate tools, equipment and processes | not found | | |
| 3.2.7 | Accuracy in design and manufacture | 7552/1 June 2022 Q19; 7552/2 June 2022 Q8; 7552/2 June 2023 Q4; 7552/2 June 2023 Q9 | 4, 4, 4, 6 | ok, check, ok, ok |
| 3.2.8 | Responsible design | 7552/2 June 2022 Q7; 7552/2 June 2022 Q16; 7552/2 June 2023 Q11 | 6, 6, 12 | ok, check, ok |
| 3.2.9 | Design for manufacture and project management | 7552/2 June 2022 Q9; 7552/2 June 2023 Q3; 7552/2 June 2023 Q14; 7552/2 June 2023 Q15 | 6, 4, 2, 6 | check, ok, ok, ok |
| 3.2.10 | National and international standards in product design | 7552/1 June 2023 Q21; 7552/2 June 2022 Q5; 7552/2 June 2022 Q17 | 6, 4, 4 | check, ok, ok |

## Not found in the four papers read

3.1.12, 3.2.6.

## What to check

- Whether AQA is the right board for Product Design (assumed), and whether the school's course is 7552 (Product Design) and not a different D&T specification.
- The `check` rows.
- Whether you want the NEA marking criteria added; the specification has the full grid but there are no past papers.
