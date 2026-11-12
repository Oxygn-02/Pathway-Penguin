# AQA GCSE English Language (8700) and English Literature (8702): check of the PR #37 marking structure

Status: **PR #37's structure checked against the real papers and mark schemes. One error found (below). The board (AQA) is an assumption** until the school confirms it.
This document does not change PR #37's code. It is the evidence for whether PR #37's numbers are right.

## Documents used

All downloaded from AQA's file server and read as full text.

| What | Document | Version line printed on it |
|---|---|---|
| Language specification | `AQA-8700-SP-2015.PDF` | GCSE exams June 2017 onwards. Version 1.5, 14 October 2021 |
| Literature specification | `AQA-8702-SP-2015.PDF` | Version 1.3, 28 September 2022 |
| Language Paper 1 (8700/1) and Paper 2 (8700/2) | question papers and mark schemes, June 2022 and June 2023 (`AQA-87001-QP-JUN22-CR.PDF`, `AQA-87001-MS-JUN22.PDF` and so on) | Mark schemes read "Version: 1.0 Final" |
| Literature Paper 1 (8702/1) | June 2023 question paper and mark scheme (June 2022 was not at the usual address) | "Version: 1.0 Final" |
| Literature Paper 2 (8702/2) | June 2022 and June 2023 question papers and mark schemes | "Version: 1.0 Final" |

## What was checked, and the result

| PR #37 item | What the papers say | Result |
|---|---|---|
| Language Paper 1: Q1 4 (AO1), Q2 8 (AO2), Q3 8 (AO2), Q4 20 (AO4), Q5 40 (AO5 24 + AO6 16); 80 marks | Same in June 2022 and June 2023 (paper totals 80) | Matches |
| Language Paper 2: Q1 4, Q2 8 (AO1), Q3 12 (AO2), Q4 16 (AO3), Q5 40; 80 marks | Same in both series | Matches |
| 8 mark bands 7-8, 5-6, 3-4, 1-2 | Same in all four Language mark schemes | Matches |
| 12 mark bands 10-12, 7-9, 4-6, 1-3 (Paper 2 Q3) | Same | Matches |
| 16 mark bands 13-16, 9-12, 5-8, 1-4 (Paper 2 Q4) | Same | Matches |
| 20 mark bands 16-20, 11-15, 6-10, 1-5 (Paper 1 Q4) | Same | Matches |
| Writing bands: AO5 19-24, 13-18, 7-12, 1-6; AO6 13-16, 9-12, 5-8, 1-4 | Same | Matches |
| Literature Paper 1: Shakespeare 30 + AO4 4, novel 30; 64 marks | June 2023 paper: 30 + 4 and 30; maximum 64 | Matches |
| Literature Paper 2: modern text 30 + AO4 4, poetry anthology 30, unseen poem 24 | June 2023 paper: same; maximum 96 | Matches |
| 30 mark bands 26-30, 21-25, 16-20, 11-15, 6-10, 1-5 | Same in every Literature mark scheme | Matches |
| 24 mark bands 21-24, 17-20, 13-16, 9-12, 5-8, 1-4 | Same | Matches |
| AO4 bands: 4 high, 2-3 intermediate, 1 threshold | Same; AO4 is assessed on Section A of Paper 1 and Section A of Paper 2 only | Matches |
| **Unseen poem comparison (8 marks) is AO1 4 + AO2 4** | **The mark scheme marks all 8 marks against AO2 only** (bands 7-8, 5-6, 3-4, 1-2). | **Wrong. Should be AO2 8.** |

How the AO2-only fact was cross-checked: Literature Paper 2 carries 60% of the qualification. The specification's AO weightings (AO1 22.5%, AO2 27.5%, AO3 7.5%) work out to AO1 36 marks and AO2 44 marks of the paper's 96. That only adds up if the 8 mark question is AO2: AO1 is 12 + 12 + 12 and AO2 is 12 + 12 + 12 + 8.

The fix is one line in `aqaEnglish.ts` (`lit-p2-unseen-2`: `aos: [ao("Lit-AO2", 8)]`), and PR #37's own tests will still pass because they only check that AO marks add up. I left PR #37 alone because it is not part of this branch.

## Other things found

- **June 2022 Literature Paper 2 was a reduced paper** (70 marks, 1 hour 45, six modern text questions only) because of the pandemic-era adaptations. June 2023 is the normal 96 mark paper (2 hours 15). The structure in PR #37 matches the normal paper.
- **Level descriptor wording** was not compared line by line. PR #37 paraphrases the descriptors, which is what we want, and the level names and mark bands are the same as AQA's. The wording of the descriptors themselves still needs your read.
- **Language Paper 2 Question 1** is four marks for choosing the true statements, and Paper 1 Question 1 is four marks for listing points, as PR #37 says.
- The exact topic list for English is the set texts and question types, not a topic-by-topic specification, so there is no topic coverage table here. Every question type in PR #37 maps to a real numbered question in the papers above.

## What to check

- Whether AQA is the right board for English (assumed).
- The paraphrased level descriptors in PR #37 against the mark schemes.
- That PR #37 gets the one-line AO2 fix before it merges.
