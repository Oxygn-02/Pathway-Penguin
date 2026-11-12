# Marking for every UTC Portsmouth subject: plan, sources and status

This is the overview. Each finished subject has its own document beside this one, written so you can check every mark against the exam board's own papers.

## Where the subject list comes from

From utcportsmouth.org (read 12 November 2026):

- **Years 10 and 11** ([curriculum page](https://www.utcportsmouth.org/year-10-curriculum)): GCSE Maths, Science (triple), English Language, English Literature, Statistics, Further Maths (taken alongside Statistics), Computer Science, Geography; OCR Cambridge National Certificates in Engineering Design, Engineering Manufacture, and Principles in Engineering Programmable Systems. Training, Enrichment, PSHE/RE and PE are not exam subjects.
- **Years 12 and 13** ([Sixth Form page](https://www.utcportsmouth.org/sixthform-curriculum)): A levels in Maths, Further Maths, Physics, Chemistry, Biology, Psychology, Computer Science, Geography, English Language and Literature, Product Design; a Level 3 Extended Certificate in Engineering; T Levels in Maintenance, Installation and Repair for Engineering and Manufacturing, and in Digital Production, Design and Development.

The school's [Exams page](https://www.utcportsmouth.org/exam) says it uses OCR, AQA, Edexcel/Pearson and WJEC. The table matching boards to subjects is an image, and none of the school's other pages name a board per subject. So a board is only "confirmed" below when the school's text or Kane says so.

## Status

| Subject | Level | Board | How the board is known | Marking status |
|---|---|---|---|---|
| English Language, English Literature | GCSE | AQA (8700, 8702) | Assumed; PR #37 is built on AQA | **Checked: [aqa-gcse-english.md](aqa-gcse-english.md).** PR #37's marks and bands match the papers except one error (unseen poem comparison should be AO2 8, not AO1 4 + AO2 4). |
| **Maths** | GCSE | AQA 8300 | Assumed | **Done in this batch: [aqa-gcse-maths.md](aqa-gcse-maths.md)** |
| **Statistics** | GCSE | AQA 8382 | Assumed | **Done: [aqa-gcse-statistics.md](aqa-gcse-statistics.md)** (55 of 72 topics matched to real questions) |
| **Computer Science** | GCSE | AQA 8525 | Assumed | **Done: [aqa-gcse-computer-science.md](aqa-gcse-computer-science.md)** (35 of 36 sections matched) |
| **Geography** | GCSE | AQA 8035 | Assumed | **Done: [aqa-gcse-geography.md](aqa-gcse-geography.md)** (27 of 27 sections matched) |
| **Further Maths** | Level 2 Certificate | AQA 8365 | Assumed | **Done: [aqa-l2-further-maths.md](aqa-l2-further-maths.md)** (55 of 57 items matched) |
| **Science (triple)**: Biology 8461, Chemistry 8462, Physics 8463 | GCSE | AQA | Assumed | **Done: [aqa-gcse-triple-science.md](aqa-gcse-triple-science.md)** (87 of 97, 115 of 124 and 72 of 81 topics matched, using AQA's own Spec Ref column) |
| Cambridge National Certificates (3) | Level 1/2 | OCR | Named by the school | Not started |
| **Maths** | A level | AQA 7357 | Assumed | **Done: [aqa-a-level-maths.md](aqa-a-level-maths.md)** (70 of 88 content items matched) |
| **Biology, Chemistry, Physics** | A level | AQA 7402, 7405, 7408 | Assumed | **Done: [aqa-a-level-sciences.md](aqa-a-level-sciences.md)** (35 of 39, 34 of 34 and 36 of 38 sections matched) |
| **Further Maths** | A level | AQA 7367 | Assumed | **Done: [aqa-a-level-further-maths.md](aqa-a-level-further-maths.md)** (30 of 30 sections matched) |
| **Computer Science** | A level | AQA 7517 | Assumed | **Done: [aqa-a-level-computer-science.md](aqa-a-level-computer-science.md)** (40 of 51 sections matched) |
| **Psychology** | A level | AQA 7182 | Assumed | **Done: [aqa-a-level-psychology.md](aqa-a-level-psychology.md)** (93 of 124 content statements matched) |
| **Geography** | A level | AQA 7037 | Assumed | **Done: [aqa-a-level-geography.md](aqa-a-level-geography.md)** (47 of 59 sections matched) |
| **English Language and Literature** | A level | AQA 7707 (combined course assumed) | Assumed | **Done: [aqa-a-level-english-language-literature.md](aqa-a-level-english-language-literature.md)** (21 of 27 topics matched; the five language-analysis areas and the NEA are not found) |
| **Product Design** | A level | AQA 7552 | Assumed | **Done: [aqa-a-level-product-design.md](aqa-a-level-product-design.md)** (22 of 24 sections matched) |
| Level 3 Extended Certificate in Engineering | Level 3 | not known | Not on the school's text pages | Not started |
| T Levels (2) | Level 3 | Pearson Edexcel | Kane, 12 November: "for now" | Not started |

## How the checking works

1. Download the specification and past papers and mark schemes from the board's own site, and read them as text.
2. Record the document names and the version line printed on each.
3. List every topic in the specification and attach at least one real past-paper question to each. Where no clear question exists, say so.
4. Descriptors are paraphrased, never copied. Anything that was a judgement call (for example which topic a question tests) is marked `check`.
5. Code tests check that marks add up (every paper, every question) and that every referenced topic code exists.

## Things I found while doing this

- A quick summary tool I tried first misread several questions and printed a wrong specification version. That is why everything here comes from the full text instead.
- AQA only publishes some series at predictable addresses. June 2018 to November 2022 and June 2023 worked; November 2023 and the 2024 and 2025 series did not at the addresses I tried.
- The code is separate from PR #37 and does not edit `routes/index.ts`, so the two do not conflict. A route for Maths marking can be added once #37 is merged.
