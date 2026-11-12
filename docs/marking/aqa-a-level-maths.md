# AQA A-level Mathematics (7357): how Pip marks it, and what it is based on

Status: **first A level finished. The board (AQA) is an assumption** until the school confirms it. Needs your check of the `check` rows.
Code: `artifacts/api-server/src/lib/marking/aqaALevelMaths.ts`. Tests: `src/__tests__/aqaALevelMaths.test.ts`.

## Documents used

All downloaded from AQA's file server and read as full text.

| What | Document | Version line printed on it |
|---|---|---|
| Specification | `AQA-7357-SP-2017.PDF` | A-level exams June 2018 onwards. Version 1.3, 31 January 2018 |
| Papers 7357/1, 2, 3, June 2022 and June 2023: question papers and mark schemes | `AQA-73571-QP-JUN22.PDF`, `AQA-73571-MS-JUN22.PDF` and the same for papers 2 and 3 and for JUN23 | Mark schemes read "Version: 1.0 Final" or "Version: 1.1 Final" |
| Papers 7357/1, 2, 3, June 2018 and June 2019: question papers only | `AQA-73571-QP-JUN18.PDF` and so on | The mark schemes for these two series were not at the usual AQA address, so these papers are cited from the question paper alone |

## How the exam is built (from the specification)

| Paper | Content | Time | Marks | Weighting |
|---|---|---|---|---|
| 1 | Pure: proof, algebra and functions, coordinate geometry, sequences and series, trigonometry, exponentials and logarithms, differentiation, integration, numerical methods | 2 hours | 100 | 33 1/3% |
| 2 | Paper 1 content plus vectors, quantities and units, kinematics, forces and Newton's laws, moments | 2 hours | 100 | 33 1/3% |
| 3 | Paper 1 content plus statistical sampling, data, probability, distributions, hypothesis testing | 2 hours | 100 | 33 1/3% |

Question styles range from one mark multiple choice to multi-step problems. Assessment objectives, approximate weighting on every paper: AO1 (use and apply standard techniques) 50%, AO2 (reason, interpret and communicate mathematically) 25%, AO3 (solve problems, including in context and by modelling) 25%.

## How an A level Maths answer is marked

1. **Mark types** (from the mark schemes' own key): **M** is a method mark, **A** is an accuracy mark that depends on the M mark, **B** is an independent mark for method and accuracy, **R** is a reasoning mark and **E** is an explanation mark. Follow through (**ft**) lets a mark be earned from an earlier wrong answer if the later method is right.
2. **Method before accuracy.** An A mark is never awarded without its M mark. Pip checks the method first and removes any A marks that have no M mark.
3. **"Show that" and "prove" questions** carry marks for each step of the argument, and the printed result must be reached from valid steps. Pip does not accept a jump to the given answer.
4. **Modelling questions** earn marks for stating assumptions and limitations (B or E marks), as well as for the calculation.
5. **Calculator answers.** Where a question says give an exact answer, a decimal does not earn the final mark.

Pip follows the same pattern as the GCSE Maths marking: method, then accuracy, then independent marks, capped at the marks available. The official mark scheme for the question should be supplied to Pip whenever it is available.

## How the topics and questions were checked

- **Topics** are AQA's content items, coded A1 to S1 (88 of them) in the specification. The codes and the grouping into sections are AQA's. The short titles are our own labels, because the specification's statements are long sentences and many contain formulae.
- **Marks.** Each cited part's marks are the `[n marks]` printed on the question paper, and the parts of every paper add up to 100. For June 2022 and June 2023 the mark schemes were available alongside.
- **Topic tags are our judgement.** AQA does not publish a topic for each question in Maths. Rows marked `check` are looser matches.
- **Coverage.** 70 of 88 content items are matched to at least one real question across twelve papers (four series, three papers). The 18 not found are listed rather than matched to something loose.
- **Not found:** B4, C4, D3, D6, E9, F1, F3, F5, H1, H4, H6, H8, I4, J3, M3, P1, Q1, R1.

## Topic coverage

| Code | Topic | Question(s) | Marks | Confidence |
|---|---|---|---|---|
| A1 | Structure of mathematical proof, including by deduction, exhaustion, contradiction and disproof | 7357/2 June 2022 Q6c; 7357/2 June 2023 Q10c; 7357/3 June 2022 Q9b | 2, 3, 3 | ok, ok, ok |
| B1 | Laws of indices for rational exponents | 7357/3 June 2023 Q4 | 2 | ok |
| B2 | Surds and rationalising the denominator | 7357/1 June 2023 Q7a | 3 | check |
| B3 | Quadratic functions, graphs and the discriminant | 7357/1 June 2022 Q4; 7357/2 June 2023 Q1 | 1, 1 | ok, ok |
| B4 | Simultaneous equations, including one linear and one quadratic | not found in the twelve papers | | |
| B5 | Linear and quadratic inequalities and regions | 7357/3 June 2022 Q2 | 1 | ok |
| B6 | Polynomials, factor theorem and algebraic division | 7357/1 June 2022 Q11a; 7357/3 June 2023 Q6b | 3, 6 | ok, ok |
| B7 | Graphs of functions, sketching curves, modulus functions | 7357/3 June 2023 Q1; 7357/3 June 2023 Q6a | 1, 3 | check, ok |
| B8 | Composite and inverse functions | 7357/2 June 2023 Q7c; 7357/3 June 2022 Q3 | 3, 1 | ok, ok |
| B9 | Transformations of graphs | 7357/1 June 2023 Q3; 7357/2 June 2022 Q8b | 1, 3 | ok, ok |
| B10 | Partial fractions | 7357/1 June 2023 Q16a | 3 | ok |
| B11 | Using functions in modelling and their limitations | 7357/1 June 2022 Q13c | 1 | ok |
| C1 | Straight line equations, parallel and perpendicular lines | 7357/1 June 2022 Q8a | 7 | check |
| C2 | Circles: equation, tangents and chords | 7357/1 June 2022 Q8b; 7357/2 June 2023 Q3; 7357/2 June 2022 Q1 | 4, 1, 1 | ok, ok, ok |
| C3 | Parametric equations of curves | 7357/1 June 2022 Q1; 7357/3 June 2022 Q6b | 1, 7 | ok, check |
| C4 | Parametric equations in modelling | not found in the twelve papers | | |
| D1 | Binomial expansion | 7357/1 June 2023 Q1; 7357/2 June 2023 Q9a; 7357/3 June 2022 Q1 | 1, 2, 1 | ok, ok, ok |
| D2 | Sequences: nth term, recurrence, increasing, decreasing, periodic | 7357/1 June 2022 Q2; 7357/1 June 2023 Q11b | 1, 6 | ok, ok |
| D3 | Sigma notation | not found in the twelve papers | | |
| D4 | Arithmetic sequences and series | 7357/1 June 2022 Q9a; 7357/2 June 2023 Q5b | 3, 6 | ok, ok |
| D5 | Geometric sequences and series, sum to infinity | 7357/1 June 2022 Q12a | 4 | ok |
| D6 | Sequences and series in modelling | not found in the twelve papers | | |
| E1 | Definitions of sin, cos, tan; sine and cosine rules; radians, arc length, sector area | 7357/2 June 2022 Q4 | 3 | ok |
| E2 | Small angle approximations | 7357/1 June 2023 Q4; 7357/1 June 2022 Q6b | 1, 4 | ok, ok |
| E3 | Trigonometric functions and their graphs, exact values and transformations | 7357/1 June 2023 Q10b; 7357/3 June 2022 Q5a | 5, 2 | ok, ok |
| E4 | Secant, cosecant, cotangent and inverse functions | 7357/1 June 2022 Q7; 7357/1 June 2022 Q15a | 3, 7 | ok, check |
| E5 | Pythagorean identities | 7357/3 June 2018 Q8a | 3 | ok |
| E6 | Compound and double angle formulae; R cos(x+a) | 7357/1 June 2023 Q12b; 7357/1 June 2018 Q14 | 5, 7 | ok, ok |
| E7 | Solving trigonometric equations | 7357/2 June 2023 Q8b | 3 | check |
| E8 | Proofs involving trigonometric identities | 7357/2 June 2023 Q8a | 4 | ok |
| E9 | Trigonometry in context | not found in the twelve papers | | |
| F1 | Exponential functions and natural logarithms | not found in the twelve papers | | |
| F2 | Gradient of e^kx and a^kx | 7357/1 June 2023 Q14a; 7357/3 June 2023 Q5 | 3, 3 | check, check |
| F3 | Exponential and logarithmic functions as inverses | not found in the twelve papers | | |
| F4 | Laws of logarithms | 7357/1 June 2023 Q6; 7357/2 June 2022 Q9; 7357/3 June 2018 Q7b | 5, 4, 1 | ok, ok, ok |
| F5 | Solving equations of the form a^x = b | not found in the twelve papers | | |
| F6 | Logarithmic graphs to estimate parameters | 7357/2 June 2023 Q6a; 7357/3 June 2022 Q7a | 2, 5 | ok, ok |
| F7 | Exponential growth and decay in modelling | 7357/2 June 2023 Q6b | 1 | ok |
| G1 | Derivative as gradient; differentiation from first principles | 7357/2 June 2022 Q2; 7357/1 June 2019 Q11 | 1, 4 | ok, ok |
| G2 | Differentiating standard functions | 7357/1 June 2023 Q2 | 1 | ok |
| G3 | Tangents, normals, stationary points, increasing and decreasing, convex and concave | 7357/1 June 2022 Q5; 7357/2 June 2022 Q7b; 7357/3 June 2023 Q7b; 7357/3 June 2023 Q3 | 3, 6, 8, 1 | ok, ok, ok, ok |
| G4 | Product, quotient and chain rules | 7357/3 June 2022 Q8a | 4 | check |
| G5 | Implicit and parametric differentiation, rates of change | 7357/1 June 2018 Q5; 7357/1 June 2019 Q15a | 6, 5 | ok, ok |
| G6 | Constructing differential equations | 7357/2 June 2022 Q10b; 7357/1 June 2023 Q16b | 10, 11 | ok, check |
| H1 | Fundamental Theorem of Calculus | not found in the twelve papers | | |
| H2 | Integrating standard functions | 7357/3 June 2022 Q4; 7357/2 June 2022 Q5c | 2, 2 | ok, ok |
| H3 | Definite integrals and area under a curve | 7357/2 June 2023 Q2; 7357/1 June 2022 Q14b | 1, 6 | ok, ok |
| H4 | Integration as the limit of a sum | not found in the twelve papers | | |
| H5 | Integration by substitution and by parts | 7357/1 June 2023 Q8; 7357/1 June 2022 Q15b; 7357/3 June 2023 Q8 | 6, 9, 7 | ok, ok, ok |
| H6 | Integrating using partial fractions | not found in the twelve papers | | |
| H7 | Solving first order differential equations | 7357/2 June 2019 Q5 | 7 | ok |
| H8 | Interpreting differential equation solutions in context | not found in the twelve papers | | |
| I1 | Locating roots by change of sign | 7357/1 June 2022 Q10b | 2 | ok |
| I2 | Iterative methods, including Newton-Raphson | 7357/1 June 2022 Q10c; 7357/1 June 2023 Q13c; 7357/1 June 2019 Q7d | 6, 3, 4 | ok, ok, ok |
| I3 | Numerical integration, trapezium rule | 7357/1 June 2022 Q14a; 7357/1 June 2023 Q5a; 7357/3 June 2023 Q2 | 3, 3, 1 | ok, ok, ok |
| I4 | Numerical methods in context | not found in the twelve papers | | |
| J1 | Vectors in two and three dimensions | 7357/2 June 2018 Q14 | 6 | check |
| J2 | Magnitude and direction of a vector | 7357/2 June 2023 Q18a | 1 | check |
| J3 | Adding vectors; multiplying by a scalar | not found in the twelve papers | | |
| J4 | Position vectors and distance between points | 7357/2 June 2019 Q15; 7357/2 June 2018 Q14 | 9, 6 | ok, ok |
| J5 | Vectors in problem solving and context | 7357/2 June 2022 Q16b | 4 | check |
| K1 | Population, sample and sampling techniques | 7357/3 June 2022 Q15b; 7357/3 June 2023 Q15c; 7357/3 June 2022 Q13 | 2, 3, 2 | ok, ok, check |
| L1 | Interpreting diagrams for single variable data, histograms | 7357/3 June 2018 Q12 | 1 | ok |
| L2 | Scatter diagrams, regression lines, correlation | 7357/3 June 2023 Q10 | 1 | ok |
| L3 | Measures of central tendency and variation, standard deviation | 7357/3 June 2022 Q18c | 3 | ok |
| L4 | Outliers | 7357/3 June 2023 Q15a | 4 | check |
| M1 | Mutually exclusive and independent events | 7357/3 June 2023 Q11; 7357/3 June 2022 Q16c | 1, 2 | ok, ok |
| M2 | Conditional probability, tree and Venn diagrams | 7357/3 June 2023 Q13b; 7357/3 June 2022 Q16b | 2, 5 | ok, ok |
| M3 | Modelling with probability | not found in the twelve papers | | |
| N1 | Discrete probability distributions, binomial distribution | 7357/3 June 2022 Q14b; 7357/3 June 2023 Q15b | 5, 4 | ok, ok |
| N2 | Normal distribution | 7357/3 June 2022 Q11; 7357/3 June 2023 Q16a | 1, 3 | ok, ok |
| N3 | Choosing a distribution for a context | 7357/3 June 2022 Q14a; 7357/3 June 2023 Q12a | 2, 1 | ok, ok |
| O1 | Language of hypothesis testing | 7357/3 June 2019 Q16c | 2 | ok |
| O2 | Hypothesis test for a binomial proportion | 7357/3 June 2022 Q19; 7357/3 June 2023 Q17; 7357/3 June 2022 Q14c | 6, 6, 3 | ok, ok, ok |
| O3 | Hypothesis test for the mean of a Normal distribution | 7357/3 June 2023 Q14b | 7 | ok |
| P1 | SI units and modelling assumptions | not found in the twelve papers | | |
| Q1 | Language of kinematics | not found in the twelve papers | | |
| Q2 | Kinematics graphs | 7357/2 June 2022 Q15 | 4 | ok |
| Q3 | Constant acceleration formulae | 7357/2 June 2022 Q12 | 1 | ok |
| Q4 | Calculus in kinematics | 7357/2 June 2022 Q17; 7357/2 June 2023 Q14 | 7, 4 | ok, ok |
| Q5 | Projectiles and motion under gravity | 7357/2 June 2022 Q13a; 7357/2 June 2023 Q13a | 3, 2 | ok, ok |
| R1 | Force and Newton's first law | not found in the twelve papers | | |
| R2 | Newton's second law in a straight line | 7357/2 June 2018 Q17 | 14 | ok |
| R3 | Weight and motion under gravity | 7357/2 June 2022 Q11 | 1 | ok |
| R4 | Newton's third law, equilibrium, connected particles | 7357/2 June 2022 Q18a; 7357/2 June 2023 Q11 | 4, 1 | ok, check |
| R5 | Resultant forces, dynamics using vectors | 7357/2 June 2023 Q16 | 4 | ok |
| R6 | Friction | 7357/2 June 2022 Q19a; 7357/2 June 2023 Q15 | 7, 4 | ok, ok |
| S1 | Moments in static contexts | 7357/2 June 2022 Q14a; 7357/2 June 2023 Q17a; 7357/2 June 2018 Q11 | 3, 4, 1 | ok, ok, ok |

## What to check

- Whether AQA is the right board for A level Maths (assumed).
- The `check` rows.
- The not found items. Other series may cover them (AQA's earlier series and new ones I could not reach).
