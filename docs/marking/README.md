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
| English Language, English Literature | GCSE | AQA (8700, 8702) | Assumed; PR #37 is built on AQA | PR #37 bands re-checked against the Language Paper 1 June 2023 mark scheme for Q2 to Q5 only. Rest not yet re-checked. |
| **Maths** | GCSE | AQA 8300 | Assumed | **Done in this batch: [aqa-gcse-maths.md](aqa-gcse-maths.md)** |
| **Statistics** | GCSE | AQA 8382 | Assumed | **Done: [aqa-gcse-statistics.md](aqa-gcse-statistics.md)** (55 of 72 topics matched to real questions) |
| **Computer Science** | GCSE | AQA 8525 | Assumed | **Done: [aqa-gcse-computer-science.md](aqa-gcse-computer-science.md)** (35 of 36 sections matched) |
| **Geography** | GCSE | AQA 8035 | Assumed | **Done: [aqa-gcse-geography.md](aqa-gcse-geography.md)** (27 of 27 sections matched) |
| **Further Maths** | Level 2 Certificate | AQA 8365 | Assumed | **Done: [aqa-l2-further-maths.md](aqa-l2-further-maths.md)** (55 of 57 items matched) |
| Science (triple) | GCSE | proposed AQA | Assumed, not on the school's text pages | Not started |
| Cambridge National Certificates (3) | Level 1/2 | OCR | Named by the school | Not started |
| Maths, Further Maths, Physics, Chemistry, Biology, Psychology, Computer Science, Geography, English Language and Literature, Product Design | A level | not known | Not on the school's text pages | Not started |
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
