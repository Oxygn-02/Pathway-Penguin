# AQA GCSE Statistics (8382): how Pip marks it, and what it is based on

Status: **second subject finished. The board (AQA) is an assumption** until the school confirms it. Needs your check of the `check` rows.
Code: `artifacts/api-server/src/lib/marking/aqaStatistics.ts`. Tests: `src/__tests__/aqaStatistics.test.ts`.

## Documents used

All downloaded from AQA's file server and read as text.

| What | Document | Version line printed on it |
|---|---|---|
| Specification | AQA GCSE Statistics 8382 (`filestore.aqa.org.uk/resources/mathematics/specifications/AQA-8382-SP-2017.PDF`) | GCSE exams June 2019 onwards. Version 1.1, 26 February 2018 |
| Papers 8382/1H, 2H, 1F, 2F, June 2022 | `AQA-83821H-QP-JUN22.PDF` and the same pattern for 83822H, 83821F, 83822F, with matching mark schemes `...-MS-JUN22.PDF` | Mark scheme "Version: 1.0 Final" |
| Papers 8382/1H, 2H, 2F, June 2023 | `AQA-83821H-QP-JUN23.PDF`, `83822H`, `83822F` | Question papers (the 1F paper would not download) |

All the links follow `https://filestore.aqa.org.uk/sample-papers-and-mark-schemes/<year>/june/<file>`.

## How the exam is built (from the specification)

- Two tiers, Foundation (grades 1 to 5) and Higher (grades 4 to 9). Both papers must be taken at the same tier.
- Paper 1 and Paper 2 are each 1 hour 45 minutes, 80 marks, 50% of the GCSE. Both assess all the content. Questions are multiple choice, short answer and a Statistical Enquiry Cycle (SEC) question.
- Assessment objectives (same for both tiers, plus or minus 3%): AO1 knowledge of standard techniques, about 55%. AO2 interpret information and reason statistically, about 25%. AO3 assess the appropriateness of methods and conclusions, about 20%.

## How a Statistics answer is marked

The mark scheme glossary uses the same mark types as GCSE Maths: **M** (method), **A** (accuracy, only after a correct method), **B** (independent of method), **ft** (follow-through), **SC** (special case), plus dependent marks and "or equivalent". Pip marks Statistics with the same checked logic as Maths (`aqaMathsMarking.ts`): accuracy marks are dropped if there is no method mark, and the total can never exceed the question's marks.

Many Statistics questions ask for a comment or reason in context rather than a calculation. For these, the mark scheme gives B marks for specific valid points. Pip should be given the official mark scheme wording where we have it, because the valid points are the whole mark scheme.

## How the topics and questions were checked

- **Specification content.** 72 content codes (A1 to E13b) were taken from the specification text. Titles are ours.
- **Questions.** Each cited question's marks were read from the paper's `[n marks]` labels, and tests check that every cited topic code exists and that every topic is either covered or listed as not found.
- **Topic tags are our judgement.** AQA does not publish which question tests which code. Rows marked `check` are loose matches.
- **Coverage is 55 of 72.** 17 topics had no clear question in the June 2022 and June 2023 papers I read. They are listed as "not found", not filled in. Other series would likely cover most of them.

## Topic coverage


### Planning an investigation (Section A)

| Code | Topic | Question(s) | Marks | Confidence |
|---|---|---|---|---|
| A1 | Hypotheses are tested by collecting and analysing data | 8382/1H June 2022 Q15a | 1 | ok |
| A2 | Constraints on designing an investigation | 8382/1H June 2022 Q15b | 2 | check |
| A3 | Strategies for problems during an enquiry | not found |  | — |

### Collecting data (Section B)

| Code | Topic | Question(s) | Marks | Confidence |
|---|---|---|---|---|
| B1a | Types of data and the terms for them | 8382/1F June 2022 Q5a; 8382/1F June 2022 Q5b | 1, 2 | ok, ok |
| B1b | Merging categories and grouping into class intervals | not found |  | — |
| B1c | Explanatory and response variables | 8382/2F June 2023 Q10 | 6 | check |
| B2a | Primary and secondary data | 8382/1F June 2022 Q10c | 2 | ok |
| B2b | Data sources: experiments, simulation, surveys | 8382/1H June 2022 Q14b; 8382/2F June 2022 Q16 | 2, 7 | check, ok |
| B2c | Reliability and validity | 8382/2H June 2022 Q4; 8382/2F June 2022 Q16b | 1, 1 | ok, ok |
| B2d | Factors that cause bias | 8382/2H June 2022 Q6b | 2 | check |
| B3a | Population, sample frame and sample | not found |  | — |
| B3b | What "population" means in context | not found |  | — |
| B3c | Judgement and convenience sampling and bias | 8382/2H June 2022 Q6e | 4 | ok |
| B3d | Random, systematic, stratified and other sampling | 8382/2H June 2022 Q3; 8382/2H June 2022 Q6d | 1, 2 | ok, ok |
| B3e | Sample size and sampling methods in context | not found |  | — |
| B3f | Stratification before sampling | 8382/1H June 2022 Q4 | 1 | check |
| B4 | Planning data collection and questions | 8382/2H June 2022 Q6b; 8382/2H June 2022 Q6c | 2, 1 | ok, ok |
| B5a | Problems with collected data | not found |  | — |
| B5b | Cleaning data | 8382/1F June 2022 Q2 | 2 | ok |
| B5c | Control groups and extraneous variables | 8382/1H June 2022 Q14c | 2 | ok |

### Presenting data (Section C)

| Code | Topic | Question(s) | Marks | Confidence |
|---|---|---|---|---|
| C1a | Representing data: charts and diagrams | 8382/2F June 2022 Q10; 8382/1F June 2022 Q5c | 4, 4 | ok, check |
| C1b | Interpreting and comparing displayed data | 8382/1F June 2022 Q13b | 7 | ok |
| C2 | Histograms, cumulative frequency and box plots | 8382/1H June 2022 Q11a; 8382/2F June 2022 Q11b | 3, 3 | ok, ok |
| C3a | Choosing and producing accurate visualisations | 8382/1F June 2022 Q8b | 1 | ok |
| C3b | Spotting misleading graphs | 8382/1F June 2022 Q14 | 2 | ok |
| C4a | Comparing data in different formats | not found |  | — |
| C4b | Choosing a suitable representation | 8382/1F June 2022 Q8b | 1 | check |

### Summarising data (Section D)

| Code | Topic | Question(s) | Marks | Confidence |
|---|---|---|---|---|
| D1a | Calculating averages | 8382/1H June 2022 Q13a; 8382/2F June 2022 Q6b | 3, 2 | ok, ok |
| D1b | Choosing an average | 8382/2F June 2023 Q4c | 1 | check |
| D2 | Skewness | 8382/2H June 2022 Q14b | 6 | ok |
| D3a | Measures of spread | 8382/2F June 2022 Q1 | 1 | ok |
| D3b | Identifying outliers | not found |  | — |
| D4 | Trends and moving averages | 8382/2H June 2022 Q7c | 2 | ok |
| D5 | Line of best fit | 8382/2F June 2022 Q6c | 2 | ok |
| D6 | Standard deviation and related measures | 8382/2H June 2022 Q14b | 6 | check |
| D7 | Estimating probabilities from data | not found |  | — |

### Interpreting and analysing data (Section E)

| Code | Topic | Question(s) | Marks | Confidence |
|---|---|---|---|---|
| E1a | Comparing probabilities on a scale | 8382/1F June 2022 Q1 | 1 | ok |
| E1b | Expected frequency | 8382/2F June 2022 Q13 | 1 | ok |
| E1c | Relative and absolute risk | 8382/1H June 2022 Q7a | 5 | ok |
| E2a | Experimental versus theoretical results and bias | not found |  | — |
| E2b | Experimental probability tends to theoretical with more trials | not found |  | — |
| E2c | Two-way tables, sample spaces, tree and Venn diagrams | 8382/1H June 2022 Q10a; 8382/2F June 2022 Q8a | 4, 3 | ok, ok |
| E3a | Interpreting and comparing data in tables | 8382/1F June 2022 Q6b | 2 | check |
| E3b | Comparing data sets | 8382/1H June 2022 Q8c | 2 | ok |
| E3c | Comparing with median and interquartile range, or mean and standard deviation | 8382/2H June 2022 Q10a | 4 | check |
| E3d | Interpreting tabular data | 8382/1F June 2022 Q13a | 2 | check |
| E4a | Independent events and notation | 8382/1H June 2023 Q4 | 1 | ok |
| E4b | Conditional probability and notation | 8382/1H June 2023 Q4; 8382/1H June 2022 Q3 | 1, 1 | ok, check |
| E5a | Interpreting skewness | 8382/2H June 2022 Q14c | 1 | ok |
| E5b | Commenting on outliers | not found |  | — |
| E6 | Seasonal and cyclic trends | 8382/1H June 2023 Q18b | 6 | ok |
| E7a | Rates of change over time | 8382/1F June 2022 Q10f | 4 | ok |
| E7b | Calculating rates from tables | 8382/2F June 2022 Q15b | 3 | ok |
| E7c | Index numbers (CPI, RPI and others) | 8382/1H June 2022 Q8d | 3 | ok |
| E8a | Vocabulary of correlation | 8382/2F June 2022 Q12a | 1 | check |
| E8b | Strength of correlation | 8382/1F June 2022 Q12 | 1 | ok |
| E8c | Correlation is not causation | 8382/1F June 2022 Q12 | 1 | ok |
| E9a | Spearman rank correlation | 8382/1H June 2022 Q1; 8382/2H June 2022 Q13a | 1, 1 | ok, ok |
| E9b | Pearson product moment correlation | 8382/1H June 2022 Q12b | 2 | ok |
| E9c | Interpreting correlation coefficients | 8382/1H June 2022 Q12c | 2 | ok |
| E10a | Experimental and theoretical values and bias | not found |  | — |
| E10b | Binomial distribution | 8382/2H June 2022 Q12b | 4 | ok |
| E11a | Normal distribution | 8382/1H June 2023 Q17 | 3 | ok |
| E11b | Normal distribution: unusual values and the 95% rule | not found |  | — |
| E11c | Action and warning lines in quality assurance | 8382/1H June 2022 Q2; 8382/2H June 2023 Q13b | 1, 2 | ok, ok |
| E11d | Standardised scores | 8382/2H June 2023 Q14a | 2 | ok |
| E12a | Estimating population characteristics from samples | not found |  | — |
| E12b | Estimating population values from sample statistics | not found |  | — |
| E12c | Predicting population proportions | 8382/2F June 2022 Q13 | 1 | ok |
| E12d | Capture-recapture estimates | 8382/2H June 2022 Q10c | 2 | ok |
| E13a | Sample size, reliability and replication | 8382/1F June 2022 Q4 | 1 | ok |
| E13b | Distribution of sample means | not found |  | — |
## What to check

1. Rows marked `check`.
2. The 17 "not found" topics: tell me whether to search more series (June 2019 Foundation Paper 2 exists on the file server; I did not find 2018 or 2020 to 2021 papers).
3. AQA as the board. I have not confirmed this with the school.
