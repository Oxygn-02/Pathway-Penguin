# AQA Level 2 Certificate in Further Mathematics (8365): how Pip marks it, and what it is based on

Status: **fifth subject finished. The board (AQA) is an assumption** until the school confirms it. This is the qualification the school calls "GCSE Further Maths", and AQA's version is a Level 2 Certificate rather than a GCSE. Needs your check of the `check` rows.
Code: `artifacts/api-server/src/lib/marking/aqaFurtherMaths.ts`. Tests: `src/__tests__/aqaFurtherMaths.test.ts`.

## Documents used

All downloaded from AQA's file server and read as text.

| What | Document | Version line printed on it |
|---|---|---|
| Specification | AQA Level 2 Certificate in Further Mathematics 8365 (`filestore.aqa.org.uk/resources/mathematics/specifications/AQA-8365-SP-2018.PDF`) | For exams in May/June 2020 onwards. Version 1.4, November 2020 |
| Papers 8365/1 and 8365/2, June 2022 and June 2023 | `AQA-83651-QP-JUN22.PDF`, `AQA-83652-QP-JUN22.PDF`, `AQA-83651-QP-JUN23.PDF`, `AQA-83652-QP-JUN23.PDF` and the matching mark schemes `...-MS-...PDF` | June 2023 Paper 1 mark scheme: "Version: 1.0 Final" |

## How the exam is built (from the specification)

- Paper 1 (non-calculator) and Paper 2 (calculator): each 1 hour 45 minutes, 80 marks, 50% of the certificate. Any content can be assessed on either paper. Questions run from single-mark questions to multi-step problems.
- Assessment objectives (approximate overall): AO1 recall and use prescribed content for routine and multi-step procedures, 56 to 64%. AO2 apply reasoning and knowledge to solve problems, including rigorous justification and formal proof, 36 to 44%.
- Content areas: Number, Algebra, Coordinate geometry (2D), Calculus, Matrix transformations, Geometry. The specification numbers 57 items from 1.1 to 6.10.

## How a Further Maths answer is marked

The mark scheme uses the same mark types as GCSE Maths: **M** method, **A** accuracy (only after a correct method), **B** independent of method, **ft** follow-through and **SC** special case. Pip marks it with the same checked logic as Maths (`aqaMathsMarking.ts`): accuracy marks are dropped when there is no method mark, and the total can never exceed the question's marks. Proof questions (such as "show that" and "prove") need each step justified, so Pip should be given the official mark scheme wording for them.

## How the topics and questions were checked

- **Specification content.** The 57 numbered items were taken from the specification. Titles are ours.
- **Marks.** Each question's marks were read from the question paper's `[n marks]` labels, and each paper adds up to 80 (a test checks the structure; the paper totals were checked when the lists were built).
- **Topic tags are our judgement.** AQA does not publish a topic for each question. Rows marked `check` are loose matches.
- **Coverage is 55 of 57.** 3.6 (drawing a straight line) and 4.9 (sketching a curve from known turning points) had no clear question in the four papers read.

## Topic coverage

### Number

| Code | Topic | Question(s) | Marks | Confidence |
|---|---|---|---|---|
| 1.1 | Number and the number system | 8365/1 June 2022 Q1 | 3 | check |
| 1.2 | The product rule for counting | 8365/2 June 2022 Q7; 8365/2 June 2023 Q22 | 2, 3 | ok, ok |
| 1.3 | Manipulating surds | 8365/1 June 2022 Q10; 8365/1 June 2023 Q10 | 3, 4 | ok, ok |

### Algebra

| Code | Topic | Question(s) | Marks | Confidence |
|---|---|---|---|---|
| 2.1 | Basic processes of algebra | 8365/2 June 2023 Q1 | 3 | check |
| 2.2 | Definition of a function | 8365/1 June 2022 Q3a; 8365/1 June 2023 Q1a | 4, 2 | ok, ok |
| 2.3 | Domain and range of a function | 8365/2 June 2023 Q15 | 4 | ok |
| 2.4 | Composite functions | 8365/1 June 2023 Q1b | 2 | ok |
| 2.5 | Inverse functions | 8365/1 June 2022 Q3b | 2 | ok |
| 2.6 | Expanding brackets and collecting like terms | 8365/2 June 2022 Q19; 8365/2 June 2023 Q11 | 3, 4 | ok, ok |
| 2.7 | Binomial expansion of (a + b) to the n | 8365/1 June 2022 Q11; 8365/2 June 2023 Q16 | 4, 4 | ok, check |
| 2.8 | Factorising | 8365/2 June 2022 Q1; 8365/1 June 2023 Q2 | 2, 2 | ok, ok |
| 2.9 | Algebraic fractions | 8365/2 June 2022 Q15; 8365/2 June 2023 Q14 | 5, 4 | ok, ok |
| 2.10 | Using and rearranging formulae and expressions | 8365/1 June 2022 Q14; 8365/1 June 2023 Q9 | 3, 4 | ok, ok |
| 2.11 | Factor theorem for polynomials | 8365/2 June 2022 Q20a; 8365/2 June 2023 Q16 | 2, 4 | ok, ok |
| 2.12 | Completing the square | 8365/1 June 2022 Q19; 8365/1 June 2023 Q19 | 3, 3 | ok, ok |
| 2.13 | Drawing and sketching functions; interpreting graphs | 8365/2 June 2022 Q10 | 1 | ok |
| 2.14 | Solving linear and quadratic equations | 8365/2 June 2022 Q8b; 8365/1 June 2022 Q1 | 2, 3 | ok, ok |
| 2.15 | Simultaneous equations (linear and non-linear) | 8365/1 June 2022 Q16; 8365/1 June 2023 Q8 | 6, 6 | ok, ok |
| 2.16 | Linear equations in three unknowns | 8365/2 June 2022 Q17; 8365/1 June 2023 Q18 | 5, 5 | ok, ok |
| 2.17 | Linear and quadratic inequalities | 8365/2 June 2022 Q5; 8365/1 June 2023 Q14 | 3, 4 | ok, ok |
| 2.18 | Index laws including fractional and negative indices | 8365/1 June 2022 Q13; 8365/2 June 2022 Q22 | 3, 4 | ok, ok |
| 2.19 | Algebraic proof | 8365/2 June 2022 Q6; 8365/1 June 2023 Q5 | 3, 3 | ok, ok |
| 2.20 | Using nth terms; limiting values of sequences | 8365/1 June 2022 Q12b | 1 | ok |
| 2.21 | nth term of linear sequences | 8365/2 June 2023 Q2a | 2 | ok |
| 2.22 | nth term of quadratic sequences | 8365/1 June 2022 Q9a | 3 | ok |

### Coordinate geometry (2D)

| Code | Topic | Question(s) | Marks | Confidence |
|---|---|---|---|---|
| 3.1 | Definition of a gradient | 8365/1 June 2023 Q4a | 2 | ok |
| 3.2 | Gradients of parallel and perpendicular lines | 8365/2 June 2022 Q4; 8365/2 June 2023 Q10 | 4, 3 | ok, ok |
| 3.3 | Distance between two points | 8365/1 June 2023 Q4b | 3 | ok |
| 3.4 | Coordinates of a point on a line using ratio | 8365/2 June 2022 Q2; 8365/2 June 2023 Q4 | 2, 4 | ok, ok |
| 3.5 | Equation of a straight line | 8365/1 June 2022 Q2 | 2 | ok |
| 3.6 | Drawing a straight line from given information | not found |  | — |
| 3.7 | Equation of a circle, centre the origin | 8365/1 June 2023 Q8 | 6 | ok |
| 3.8 | Equation of a circle, centre (a, b) | 8365/2 June 2023 Q6; 8365/2 June 2022 Q13 | 2, 3 | ok, ok |
| 3.9 | Tangent to a circle at a point | 8365/1 June 2022 Q17b | 4 | ok |

### Calculus

| Code | Topic | Question(s) | Marks | Confidence |
|---|---|---|---|---|
| 4.1 | The gradient function and rate of change | 8365/2 June 2023 Q5 | 3 | ok |
| 4.2 | Gradient of a function as the gradient of the tangent | 8365/2 June 2022 Q12 | 5 | ok |
| 4.3 | Differentiating kx to the n | 8365/1 June 2022 Q6 | 3 | ok |
| 4.4 | Tangent and normal to a curve | 8365/1 June 2023 Q6 | 4 | ok |
| 4.5 | Increasing and decreasing functions | 8365/2 June 2023 Q17 | 4 | ok |
| 4.6 | Second derivative notation | 8365/1 June 2023 Q11 | 3 | ok |
| 4.7 | Maxima and minima by differentiation | 8365/1 June 2022 Q20 | 6 | ok |
| 4.8 | Calculus in simple optimisation problems | 8365/2 June 2023 Q9c | 3 | ok |
| 4.9 | Sketching a curve from its maximum and minimum points | not found |  | — |

### Matrix transformations

| Code | Topic | Question(s) | Marks | Confidence |
|---|---|---|---|---|
| 5.1 | Multiplying matrices | 8365/2 June 2022 Q3a | 3 | ok |
| 5.2 | The identity matrix | 8365/1 June 2023 Q3b | 2 | ok |
| 5.3 | Transformations of the unit square | 8365/1 June 2023 Q3a | 1 | ok |
| 5.4 | Combining transformations | 8365/1 June 2022 Q8 | 3 | ok |

### Geometry

| Code | Topic | Question(s) | Marks | Confidence |
|---|---|---|---|---|
| 6.1 | Perimeter, area and volume | 8365/1 June 2023 Q7 | 4 | ok |
| 6.2 | Geometrical proofs | 8365/1 June 2022 Q15 | 5 | ok |
| 6.3 | Sine and cosine rules; area of a triangle | 8365/2 June 2022 Q16; 8365/1 June 2023 Q20 | 4, 6 | ok, ok |
| 6.4 | Pythagoras in 2D and 3D | 8365/2 June 2022 Q18 | 5 | ok |
| 6.5 | Trigonometry in 2D and 3D problems | 8365/2 June 2023 Q12 | 3 | ok |
| 6.6 | Graphs of sine, cosine and tangent | 8365/1 June 2022 Q4b | 2 | ok |
| 6.7 | Trigonometric ratios for any angle | 8365/2 June 2023 Q18 | 3 | ok |
| 6.8 | Exact values from 30-60-90 and 45-45-90 triangles | 8365/1 June 2022 Q4a | 1 | ok |
| 6.9 | tan = sin over cos, and sin squared plus cos squared | 8365/1 June 2022 Q21; 8365/2 June 2023 Q20 | 3, 3 | ok, ok |
| 6.10 | Solving simple trigonometric equations | 8365/2 June 2022 Q21; 8365/1 June 2023 Q12b | 4, 3 | ok, ok |

## What to check

1. Rows marked `check`.
2. The two "not found" topics.
3. The school calls this "GCSE Further Maths". AQA's own qualification is a Level 2 Certificate. If the school uses a different board's Further Maths, tell me.
4. AQA as the board. I have not confirmed this with the school.
