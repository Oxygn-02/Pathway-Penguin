# AQA A-level Further Mathematics (7367): how Pip marks it, and what it is based on

Status: **A level Further Maths finished. The board (AQA) is an assumption** until the school confirms it. Needs your check of the `check` rows.
Code: `artifacts/api-server/src/lib/marking/aqaALevelFurtherMaths.ts`. Tests: `src/__tests__/aqaALevelFurtherMaths.test.ts`.

## Documents used

All downloaded from AQA's file server and read as full text.

| What | Document | Version line printed on it |
|---|---|---|
| Specification | `AQA-7367-SP-2017.PDF` | A-level exams June 2019 onwards. Version 1.1 (cover dated 20 October 2017, page footers 19 October 2017) |
| Papers 7367/1, 7367/2: question papers | June 2022 and June 2023 (`AQA-73671-QP-JUN22.PDF` and so on) | not applicable |
| Paper 3 booklets: question papers and mark schemes | Discrete `AQA-73673D-...`, Mechanics `73673M`, Statistics `73673S`, June 2022 and June 2023 | Mark schemes read "Version: 1.0 Final" |
| Mark schemes for Papers 1 and 2 | June 2022 Paper 1, June 2023 Papers 1 and 2 | "Version: 1.0 Final". The June 2022 Paper 2 mark scheme was not at the usual AQA address |

## How the exam is built (from the specification)

| Paper | Content | Time | Marks | Weighting |
|---|---|---|---|---|
| 1 | Compulsory content, sections A to J, plus assumed AS Maths | 2 hours | 100 | 33 1/3% |
| 2 | Same | 2 hours | 100 | 33 1/3% |
| 3 | Two 50 mark booklets, chosen from Discrete mathematics, Mechanics and Statistics | 2 hours | 100 | 33 1/3% |

Assessment objectives, approximate weightings: Papers 1 and 2 are AO1 55%, AO2 25%, AO3 20%; Paper 3 is AO1 40%, AO2 25%, AO3 35%; overall AO1 50%, AO2 25%, AO3 25%.

## How an A level Further Maths answer is marked

Marking works the same way as A level Maths.

1. **Mark types** from the mark schemes' own key: **M** method, **A** accuracy that depends on the M mark, **B** independent method and accuracy, **R** reasoning, **E** explanation. Follow through (**ft**) lets a later mark be earned from an earlier wrong answer.
2. **Method before accuracy.** Pip checks the method first and removes any A marks that have no M mark.
3. **"Show that" and "prove" questions** carry a mark for each step, and the result must follow from valid steps. Proof by induction is marked on its structure: base case, assumption, inductive step and conclusion.
4. **Modelling questions** earn marks for the assumptions and for the limitations of the model.
5. **Paper 3.** Each booklet is marked as its own 50 marks. Pip should be told which booklet a question comes from.

## How the topics and questions were checked

- **Topics** are the specification's sections: A to J (compulsory), MA to ME (mechanics), SA to SH (statistics) and DA to DG (discrete), 30 in total, with AQA's codes and headings. The 77 finer content items in the compulsory part, and the finer items in each option, are not mapped one by one yet.
- **Marks.** Each cited part's marks are the `[n marks]` printed on the question paper. Papers 1 and 2 add up to 100 and each Paper 3 booklet to 50.
- **Topic tags are our judgement.** AQA does not publish a topic for each question in Maths. Rows marked `check` are looser matches. A test checks that each optional section is only cited from the right booklet.
- **Coverage is 30 of 30 sections**, using June 2022 and June 2023.

## Topic coverage

| Code | Topic | Question(s) | Marks | Confidence |
|---|---|---|---|---|
| A | Proof | 7367/2 June 2022 Q5; 7367/2 June 2023 Q12 | 4, 6 | ok, ok |
| B | Complex numbers | 7367/1 June 2022 Q8c; 7367/1 June 2022 Q12c; 7367/2 June 2023 Q15a; 7367/1 June 2023 Q2 | 5, 5, 2, 1 | ok, ok, ok, ok |
| C | Matrices | 7367/1 June 2022 Q7a; 7367/2 June 2022 Q11a; 7367/1 June 2023 Q6c; 7367/1 June 2023 Q10b | 6, 5, 3, 9 | ok, ok, ok, ok |
| D | Further algebra and functions | 7367/1 June 2022 Q5a; 7367/1 June 2023 Q5b; 7367/2 June 2022 Q8a; 7367/1 June 2023 Q13; 7367/2 June 2023 Q13c | 5, 4, 6, 5, 5 | ok, ok, ok, ok, ok |
| E | Further calculus | 7367/2 June 2022 Q12b; 7367/2 June 2022 Q2 | 7, 1 | ok, ok |
| F | Further vectors | 7367/1 June 2022 Q10a; 7367/1 June 2023 Q9b; 7367/2 June 2023 Q11b | 6, 2, 7 | ok, ok, ok |
| G | Polar coordinates | 7367/1 June 2022 Q9c; 7367/1 June 2023 Q14a | 2, 2 | ok, ok |
| H | Hyperbolic functions | 7367/1 June 2022 Q6a; 7367/1 June 2023 Q12a; 7367/2 June 2022 Q4 | 4, 2, 1 | ok, ok, ok |
| I | Differential equations | 7367/2 June 2022 Q9b; 7367/1 June 2022 Q11b; 7367/1 June 2023 Q15 | 9, 14, 9 | ok, ok, ok |
| J | Numerical methods | 7367/1 June 2023 Q8b; 7367/2 June 2022 Q9a | 3, 4 | ok, ok |
| MA | Dimensional analysis | 7367/3M June 2022 Q4b; 7367/3M June 2023 Q1 | 4, 1 | ok, ok |
| MB | Momentum and collisions | 7367/3M June 2023 Q7a; 7367/3M June 2022 Q1; 7367/3M June 2022 Q7a | 8, 1, 2 | ok, ok, check |
| MC | Work, energy and power | 7367/3M June 2022 Q8a; 7367/3M June 2022 Q5a; 7367/3M June 2023 Q6a | 4, 2, 3 | ok, ok, check |
| MD | Circular motion | 7367/3M June 2023 Q4; 7367/3M June 2023 Q6c | 2, 6 | ok, ok |
| ME | Centres of mass and moments | 7367/3M June 2022 Q9a; 7367/3M June 2023 Q5a; 7367/3M June 2022 Q3 | 2, 5, 1 | ok, ok, ok |
| SA | Discrete random variables and expectation | 7367/3S June 2022 Q1; 7367/3S June 2023 Q1 | 1, 1 | ok, ok |
| SB | Poisson distribution | 7367/3S June 2022 Q4a; 7367/3S June 2023 Q7d | 3, 2 | ok, ok |
| SC | Type I and Type II errors | 7367/3S June 2022 Q7b; 7367/3S June 2023 Q7b | 1, 1 | ok, ok |
| SD | Continuous random variables | 7367/3S June 2022 Q8c; 7367/3S June 2023 Q8b | 6, 3 | ok, ok |
| SE | Chi squared tests for association | 7367/3S June 2023 Q5b; 7367/3S June 2023 Q5a | 5, 2 | ok, ok |
| SF | Exponential distribution | 7367/3S June 2022 Q3a; 7367/3S June 2022 Q3b | 3, 2 | ok, ok |
| SG | Inference, one sample t-distribution | 7367/3S June 2023 Q4 | 5 | check |
| SH | Confidence intervals | 7367/3S June 2022 Q5a | 4 | ok |
| DA | Graphs | 7367/3D June 2022 Q1; 7367/3D June 2023 Q8c | 1, 3 | ok, ok |
| DB | Networks | 7367/3D June 2023 Q6a; 7367/3D June 2022 Q5a | 6, 4 | ok, check |
| DC | Network flows | 7367/3D June 2022 Q8b; 7367/3D June 2023 Q4c | 4, 2 | ok, ok |
| DD | Linear programming | 7367/3D June 2023 Q5b; 7367/3D June 2023 Q3 | 4, 1 | ok, ok |
| DE | Critical path analysis | 7367/3D June 2022 Q6a; 7367/3D June 2023 Q7a | 4, 3 | ok, ok |
| DF | Game theory for zero-sum games | 7367/3D June 2022 Q4b; 7367/3D June 2022 Q10b | 3, 3 | ok, ok |
| DG | Binary operations | 7367/3D June 2022 Q7a; 7367/3D June 2023 Q9a | 2, 3 | ok, ok |

## What to check

- Whether AQA is the right board for Further Maths (assumed).
- The `check` rows.
- Whether you want the finer content items mapped as well, which would take a further pass.
