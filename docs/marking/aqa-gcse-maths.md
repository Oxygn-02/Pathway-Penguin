# AQA GCSE Mathematics (8300): how Pip marks it, and what it is based on

Status: **first subject finished in this batch. Needs your check** (see "What to check" at the end).
Code: `artifacts/api-server/src/lib/marking/aqaMaths.ts` and `aqaMathsMarking.ts`. Tests: `src/__tests__/aqaMaths.test.ts`.

## Documents used

Every AQA document below was downloaded from AQA's own file server and read as text, word for word. None was read from memory or from a third-party summary.

| What | Document | Version line printed on it |
|---|---|---|
| Specification | AQA GCSE Mathematics 8300 specification (`filestore.aqa.org.uk/resources/mathematics/specifications/AQA-8300-SP-2015.PDF`) | Version 1.0, 12 September 2014 (exams May/June 2017 onwards) |
| Papers and mark schemes, main set | 8300/1F, 2F, 3F, 1H, 2H, 3H, June 2023 | Mark schemes "Version: Final 1.0" |
| Extra questions for topics June 2023 does not test | Question papers June 2018, June 2019, November 2020, June 2022, November 2022 (same file server, same naming, e.g. `AQA-83002H-QP-JUN22.PDF`) | Question papers; the matching mark schemes were downloaded too |

Question-paper and mark-scheme links follow the pattern `https://filestore.aqa.org.uk/sample-papers-and-mark-schemes/<year>/<month>/AQA-<code>-<QP or MS>-<MONTHYY>.PDF`. The full list for June 2023 is in `MATHS_SOURCES` in the code.

## How the exam is built (from the specification)

- Two tiers: Foundation (grades 1 to 5) and Higher (grades 4 to 9). A student takes all three papers at one tier.
- Three papers, each 1 hour 30 minutes, 80 marks, 33⅓% of the GCSE. Paper 1 is non-calculator, Papers 2 and 3 allow a calculator. Any content can appear on any paper.
- Assessment objectives:

| AO | What it rewards | Foundation | Higher |
|---|---|---|---|
| AO1 | Use and apply standard techniques | 50% overall (40 to 60% per paper) | 40% overall (30 to 50% per paper) |
| AO2 | Reason, interpret and communicate mathematically | 25% (15 to 35%) | 30% (20 to 40%) |
| AO3 | Solve problems within mathematics and in other contexts | 25% (15 to 35%) | 30% (20 to 40%) |

## How a Maths answer is marked

Maths mark schemes do not use levels. They award separate marks for each step. The June 2023 mark schemes define these mark types (paraphrased here):

- **M**: method mark. A sound method, even if the answer ends up wrong.
- **A**: accuracy mark. A correct answer, but only after a correct method.
- **B**: mark given independent of method.
- **ft**: follow-through. Correct working that uses an earlier wrong answer still earns marks.
- **SC**: special case. A common misreading that still shows some maths worth rewarding.

Pip follows the same idea, with checks the server enforces so the number cannot drift from the rules:

1. If the official mark scheme wording for the question is supplied, Pip marks against it. If not, Pip works out the answer first and marks against that.
2. Pip reports method marks, accuracy marks and independent (B) marks as whole numbers.
3. **Accuracy marks are removed if no method mark was given**, because the mark scheme only gives A marks after a correct method.
4. **The total can never exceed the marks printed on the question.**
5. Feedback is short and for the student: what earned marks, what lost marks, and one next step.
6. The question, mark scheme and student answer are treated as untrusted text, so instructions hidden in an answer are ignored.

## How the topics and questions were checked

- **Specification content.** All 97 content codes (N1 to N16, A1 to A25, R1 to R16, G1 to G25, P1 to P9, S1 to S6) were checked against the specification text. The short titles are ours, written from AQA's content statements.
- **Marks per question.** Each of the six June 2023 papers was tagged question by question. Tagged marks add up to 80 for every paper, and every question's marks match the `[n marks]` printed on the paper. A test (`aqaMaths.test.ts`) enforces this.
- **Topic tags.** AQA does not publish a topic code for each question, so **we assigned them from the question text**. Rows marked `check` are ones where symbols did not extract cleanly from the PDF, or the match is loose.
- **Coverage.** The June 2023 papers touch 78 of the 97 topics. For the other 19, a question from another series was found for 18 of them (table below). **R15 (instantaneous and average rates of change) has no clear question** in the papers checked, and is listed as not found rather than filled in. P9 (conditional probability) and G23 (area of a triangle using sine) have only loose matches, marked `check`.

## Specification content (97 codes)


**Number: Structure and calculation**

- N1: Ordering integers, decimals and fractions
- N2: The four operations and place value
- N3: Inverse operations and order of operations
- N4: Primes, factors, multiples and prime factorisation
- N5: Systematic listing strategies
- N6: Powers and roots
- N7: Calculating with roots and indices
- N8: Exact calculation with fractions, pi and surds
- N9: Standard form

**Number: Fractions, decimals and percentages**

- N10: Terminating and recurring decimals and fractions
- N11: Fractions in ratio problems
- N12: Fractions and percentages as operators

**Number: Measures and accuracy**

- N13: Standard units of measure
- N14: Estimation and checking
- N15: Rounding and degrees of accuracy
- N16: Limits of accuracy (bounds)

**Algebra: Notation, vocabulary and manipulation**

- A1: Algebraic notation
- A2: Substituting into formulae and expressions
- A3: Vocabulary of expressions, equations, formulae, inequalities and identities
- A4: Simplifying and manipulating expressions
- A5: Using and rearranging formulae
- A6: Equations versus identities; algebraic proof
- A7: Functions, inverse functions and composite functions

**Algebra: Graphs**

- A8: Coordinates in all four quadrants
- A9: Straight-line graphs; parallel and perpendicular lines
- A10: Gradients and intercepts
- A11: Roots, intercepts and turning points of quadratics
- A12: Recognising and sketching graphs of functions
- A13: Translations and reflections of functions
- A14: Graphs of real-life and non-standard functions
- A15: Gradients and areas under graphs
- A16: Equations of circles and tangents

**Algebra: Solving equations and inequalities**

- A17: Linear equations
- A18: Quadratic equations
- A19: Simultaneous equations
- A20: Iterative methods
- A21: Translating situations into equations and solving them
- A22: Linear and quadratic inequalities

**Algebra: Sequences**

- A23: Generating terms from term-to-term or position-to-term rules
- A24: Special sequences
- A25: nth term of sequences

**Ratio, proportion and rates of change: Ratio, proportion and rates of change**

- R1: Converting between units, including compound units
- R2: Scale factors, scale diagrams and maps
- R3: Expressing one quantity as a fraction of another
- R4: Ratio notation and simplest form
- R5: Dividing quantities in a ratio and applying ratio in context
- R6: Multiplicative relationships as ratios or fractions
- R7: Proportion as equality of ratios
- R8: Relating ratios to fractions and linear functions
- R9: Percentages, percentage change and financial maths
- R10: Direct and inverse proportion
- R11: Compound units such as speed, density and pressure
- R12: Comparing lengths, areas and volumes
- R13: Equations describing direct and inverse proportion
- R14: Gradient as a rate of change; proportion graphs
- R15: Instantaneous and average rates of change
- R16: Growth and decay, compound interest and iterative processes

**Geometry and measures: Properties and constructions**

- G1: Geometric terminology, notation and diagrams
- G2: Ruler and compass constructions and loci
- G3: Angle properties
- G4: Properties of quadrilaterals, triangles and polygons
- G5: Congruence criteria for triangles
- G6: Geometric reasoning and proof
- G7: Congruence and similarity through transformations
- G8: Combined transformations and invariance
- G9: Circle definitions and properties
- G10: Circle theorems
- G11: Geometry on coordinate axes
- G12: Properties of 3D shapes
- G13: Plans and elevations

**Geometry and measures: Mensuration and calculation**

- G14: Standard units and related concepts
- G15: Measuring lines and angles; bearings and scale drawings
- G16: Areas and volumes of triangles, parallelograms, trapezia and prisms
- G17: Circles, composite shapes, spheres, cones and pyramids
- G18: Arc lengths, sector angles and sector areas
- G19: Similarity and the relationships between lengths, areas and volumes
- G20: Pythagoras' theorem and trigonometry
- G21: Exact trigonometric values
- G22: Sine and cosine rules
- G23: Area of a triangle using sine

**Geometry and measures: Vectors**

- G24: Translations as 2D vectors
- G25: Vector operations and geometric proof

**Probability: Probability**

- P1: Frequency of outcomes; tables and frequency trees
- P2: Randomness, fairness and expected outcomes
- P3: Relative expected frequency and theoretical probability
- P4: Probabilities of exhaustive outcomes sum to 1
- P5: Empirical and theoretical distributions as sample size grows
- P6: Systematic enumeration of sets and combinations
- P7: Possibility spaces and theoretical probabilities
- P8: Independent and dependent combined events
- P9: Conditional probability

**Statistics: Statistics**

- S1: Inferring population properties from samples, and sampling limitations
- S2: Tables, charts and diagrams for categorical and time series data
- S3: Histograms and cumulative frequency graphs
- S4: Comparing distributions (graphs, box plots, averages and spread)
- S5: Describing a population
- S6: Scatter graphs, correlation and lines of best fit

## June 2023 papers: every question, its marks and the topics it tests


### 8300/1F (foundation Paper 1, non-calculator)

| Q | Marks | Topics | Tag confidence |
|---|---|---|---|
| 1a | 1 | N4 | ok |
| 1b | 1 | N6 | ok |
| 1c | 1 | N2 | ok |
| 1d | 1 | N2 | ok |
| 2a | 1 | G15 | ok |
| 2b | 1 | G15 | ok |
| 2c | 1 | G16 | ok |
| 2d | 1 | G16 | ok |
| 3a | 1 | N2 | ok |
| 3b | 1 | N2 | ok |
| 3c | 1 | N6 | ok |
| 3d | 1 | N6 | ok |
| 4 | 2 | R3 | ok |
| 5 | 4 | R9, N2 | ok |
| 6a | 1 | N8 | ok |
| 6b | 1 | N10 | ok |
| 7 | 4 | S2 | ok |
| 8a | 2 | A2 | ok |
| 8b | 3 | A5 | ok |
| 9 | 3 | N3 | ok |
| 10 | 3 | N3 | ok |
| 11 | 2 | R1 | ok |
| 12 | 1 | R9 | ok |
| 13 | 3 | R5 | ok |
| 14 | 3 | S4 | ok |
| 15 | 3 | R9, G16 | ok |
| 16 | 3 | R11 | ok |
| 17 | 3 | R5, G3 | ok |
| 18 | 3 | N4 | ok |
| 19 | 4 | R5, N12 | ok |
| 20a | 1 | S6 | ok |
| 20b | 6 | R9, N2 | ok |
| 22 | 2 | A4 | ok |
| 23 | 2 | A12 | ok |
| 24 | 5 | A21 | ok |
| 25 | 4 | N8 | ok |

### 8300/2F (foundation Paper 2, calculator)

| Q | Marks | Topics | Tag confidence |
|---|---|---|---|
| 1a | 1 | N1 | ok |
| 1b | 1 | N1 | ok |
| 2 | 4 | A4 | ok |
| 3a | 2 | G16 | ok |
| 3b | 1 | G5 | ok |
| 3c | 1 | G4 | ok |
| 3d | 2 | G7 | ok |
| 4a | 1 | A8 | ok |
| 4b | 1 | A8, G4 | ok |
| 5a | 2 | N2 | ok |
| 5b | 4 | R7 | ok |
| 6 | 2 | P6 | ok |
| 7a | 2 | N4 | ok |
| 7b | 2 | N4 | ok |
| 7c | 2 | N6, N4 | ok |
| 8a | 3 | P1 | ok |
| 8b | 2 | P3 | ok |
| 9a | 2 | N2 | ok |
| 9b | 3 | N13 | ok |
| 10a | 2 | N12 | ok |
| 10b | 1 | R6 | ok |
| 10c | 2 | R3, R9 | ok |
| 11a | 2 | P7 | ok |
| 11b | 1 | P7 | ok |
| 11c | 1 | A21 | ok |
| 12 | 2 | R4 | ok |
| 13 | 4 | R9 | ok |
| 14 | 1 | A4 | ok |
| 15 | 2 | A22 | ok |
| 16 | 2 | A25 | ok |
| 17 | 4 | A21, N12 | ok |
| 18a | 2 | P7 | ok |
| 18b | 1 | P7 | ok |
| 18c | 2 | P3 | ok |
| 19a | 2 | G4 | ok |
| 19b | 1 | G4 | ok |
| 20 | 2 | G24 | ok |
| 21 | 4 | G17, R11 | ok |
| 22 | 2 | G7 | ok |
| 23 | 2 | A4, R1 | check |

### 8300/3F (foundation Paper 3, calculator)

| Q | Marks | Topics | Tag confidence |
|---|---|---|---|
| 1a | 1 | A17 | ok |
| 1b | 1 | A17 | ok |
| 1c | 1 | A17 | ok |
| 2a | 1 | S5 | ok |
| 2b | 2 | S5 | ok |
| 2c | 1 | S5 | ok |
| 3a | 2 | P2 | ok |
| 3b | 2 | P7 | ok |
| 4 | 3 | N13, R3 | ok |
| 5a | 2 | A23 | ok |
| 5b | 2 | A23 | ok |
| 6a | 1 | R11, A14 | ok |
| 6b | 1 | A14 | ok |
| 6c | 2 | R11 | ok |
| 7 | 4 | R9 | ok |
| 8 | 3 | N16 | ok |
| 9 | 3 | A3 | ok |
| 10a | 1 | A1 | ok |
| 10b | 2 | A4 | ok |
| 11 | 2 | R5, G3 | ok |
| 12a | 2 | A22 | ok |
| 12b | 2 | A22 | ok |
| 13 | 2 | G3 | ok |
| 14 | 3 | A3 | ok |
| 15 | 4 | R5 | ok |
| 16 | 3 | G16, A17 | ok |
| 17 | 2 | A24 | ok |
| 18 | 3 | R16 | ok |
| 19 | 2 | R12 | ok |
| 20a | 2 | A12 | ok |
| 20b | 2 | A12 | ok |
| 21 | 4 | R5 | ok |
| 22 | 3 | S2 | ok |
| 23 | 3 | G20 | ok |
| 24a | 2 | N14 | ok |
| 24b | 1 | N14 | ok |
| 25a | 2 | A4 | ok |
| 25b | 1 | A18 | ok |

### 8300/1H (higher Paper 1, non-calculator)

| Q | Marks | Topics | Tag confidence |
|---|---|---|---|
| 1a | 1 | N2 | ok |
| 1b | 1 | N8 | ok |
| 1c | 1 | N2 | ok |
| 2 | 1 | A22 | ok |
| 3 | 1 | N7 | check |
| 4 | 3 | R5, G3 | ok |
| 5 | 3 | N4 | ok |
| 6 | 4 | R5, N12 | ok |
| 7 | 3 | N4, N7 | ok |
| 8 | 2 | A4 | ok |
| 9 | 2 | A12 | ok |
| 10 | 5 | A21, N14 | ok |
| 11a | 1 | P7 | ok |
| 11b | 1 | P7 | ok |
| 11c | 1 | P7 | ok |
| 12a | 1 | N9 | ok |
| 12b | 2 | N9 | ok |
| 13a | 2 | A7, A6 | ok |
| 13b | 2 | A7, R10 | ok |
| 14 | 2 | S4 | ok |
| 15 | 4 | G5, G7, G4 | ok |
| 16 | 4 | A19 | ok |
| 17 | 3 | G17, R12 | ok |
| 18 | 1 | N6 | check |
| 19 | 2 | N5, P6 | ok |
| 20 | 3 | A21 | ok |
| 21 | 2 | A11 | ok |
| 22 | 3 | N8 | check |
| 23 | 3 | N10 | ok |
| 24 | 5 | A9, G11 | ok |
| 25 | 4 | G21, N8 | ok |
| 26 | 4 | G9, G20 | ok |
| 27 | 3 | R11, A4 | ok |

### 8300/2H (higher Paper 2, calculator)

| Q | Marks | Topics | Tag confidence |
|---|---|---|---|
| 1 | 1 | R4 | ok |
| 2 | 1 | A24 | ok |
| 3 | 1 | N3 | ok |
| 4 | 2 | R9 | ok |
| 5 | 4 | A21, N12 | ok |
| 6a | 2 | G4 | ok |
| 6b | 1 | G4 | ok |
| 7a | 2 | P7 | ok |
| 7b | 1 | P7 | ok |
| 7c | 2 | P3 | ok |
| 8 | 2 | A6 | ok |
| 9 | 4 | G11, G16 | ok |
| 10 | 2 | G24 | ok |
| 11 | 4 | G17, R11 | ok |
| 12 | 2 | G7 | ok |
| 13 | 2 | A4, R1 | check |
| 14a | 3 | S4, S1 | ok |
| 14b | 1 | S1 | ok |
| 14c | 3 | S5 | ok |
| 14d | 1 | S5 | ok |
| 15 | 2 | A4 | ok |
| 16 | 3 | A9 | ok |
| 17 | 4 | G10, G3 | ok |
| 18 | 3 | A5 | ok |
| 19 | 4 | A25 | ok |
| 20a | 1 | G10 | ok |
| 20b | 1 | G10 | ok |
| 20c | 1 | G10 | ok |
| 21 | 3 | R16 | ok |
| 22a | 2 | A20 | ok |
| 22b | 1 | A20 | ok |
| 23 | 4 | P8 | ok |
| 24 | 3 | N16 | ok |
| 25 | 3 | A4 | ok |
| 26a | 1 | A13 | ok |
| 26b | 1 | A13 | ok |
| 26c | 2 | A13 | ok |

### 8300/3H (higher Paper 3, calculator)

| Q | Marks | Topics | Tag confidence |
|---|---|---|---|
| 1 | 1 | A9 | ok |
| 2 | 1 | N10 | ok |
| 3 | 2 | A17 | ok |
| 4 | 2 | R2 | ok |
| 5 | 3 | R16 | ok |
| 6 | 2 | R12 | ok |
| 7a | 2 | A12 | ok |
| 7b | 2 | A12 | ok |
| 8 | 4 | R5 | ok |
| 9 | 3 | S2 | ok |
| 10 | 3 | G20 | ok |
| 11a | 2 | N14 | ok |
| 11b | 1 | N14 | ok |
| 12a | 1 | P5 | ok |
| 12b | 1 | P5 | ok |
| 12c | 2 | P3 | ok |
| 13 | 4 | R11 | ok |
| 14 | 4 | R9 | ok |
| 15a | 3 | S3 | ok |
| 15b | 3 | S3, S5 | ok |
| 16 | 4 | G20, R4 | ok |
| 17 | 4 | A17 | ok |
| 18a | 3 | A7 | ok |
| 18b | 3 | A7, A18 | ok |
| 19 | 3 | A6 | ok |
| 20a | 1 | R10 | ok |
| 20b | 4 | R13 | ok |
| 21 | 3 | G13 | ok |
| 22 | 3 | G8 | ok |
| 23a | 2 | G20, G22 | ok |
| 23b | 4 | G15, G22 | ok |

## Questions from other series (to reference topics June 2023 does not test)

| Topic | Series | Paper | Q | Marks | Confidence | Note |
|---|---|---|---|---|---|---|
| N11 | November 2022 | 8300/1H | 18 | 3 | ok |  |
| N15 | June 2022 | 8300/2F | 5c | 1 | ok |  |
| A10 | June 2022 | 8300/2F | 19c | 1 | ok |  |
| A15 | November 2022 | 8300/2H | 26 | 4 | ok | Area under a speed-time graph. |
| A15 | June 2022 | 8300/1H | 25b | 2 | ok | Total distance from a speed-time graph. |
| A16 | November 2022 | 8300/1H | 22 | 5 | ok | Tangent to a circle at a point. |
| A16 | November 2022 | 8300/3H | 19 | 1 | ok | Equation of a circle. |
| R8 | June 2019 | 8300/2F | 27 | 1 | ok |  |
| R14 | June 2022 | 8300/1H | 25a | 1 | ok | Acceleration read as the gradient of a speed-time graph. |
| G1 | June 2022 | 8300/1F | 17 | 1 | ok | Naming the shaded part of a circle. |
| G2 | June 2022 | 8300/1H | 10 | 3 | ok | Ruler and compasses. |
| G6 | June 2022 | 8300/2H | 28 | 4 | ok | Geometric proof. |
| G12 | June 2022 | 8300/1H | 15 | 1 | ok | Faces of a prism. |
| G14 | November 2022 | 8300/2H | 15 | 1 | ok | Area unit conversions. |
| G18 | November 2022 | 8300/3H | 11 | 4 | check | Arc of a semicircle. |
| G19 | June 2022 | 8300/2H | 13b | 3 | ok | Similar solids. |
| G23 | June 2023 | 8300/3H | 16 | 4 | check | The mark scheme's Alternative method 2 uses the half ab sin C formula; the main question is solvable without it. |
| G25 | June 2022 | 8300/1H | 21 | 4 | ok | Vectors. |
| P4 | November 2022 | 8300/3H | 13a | 1 | ok |  |
| P9 | November 2020 | 8300/1H | 7 | 4 | check | Closest match found: a Venn diagram built from a stated fraction of a group. Not a clear conditional probability question. |

## What to check

1. Topic tags marked `check`, and the loose matches for G18, G23 and P9.
2. Whether you want Foundation-only students to see only Foundation topics. The code keeps one list of 97 codes. The specification itself marks which content is Higher only.
3. This is June 2023 mainly. Newer series (2024 and 2025) are not on AQA's file server at the addresses I tried. The 2024 and 2025 papers would need a different route.
4. The school has not confirmed that Maths is AQA. The exam boards table on the school's Exams page is an image I could not read. Treat the board as an assumption until you confirm it.
