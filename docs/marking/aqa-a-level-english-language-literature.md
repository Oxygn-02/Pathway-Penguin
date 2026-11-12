# AQA A-level English Language and Literature (7707): how Pip marks it, and what it is based on

Status: **A level English Language and Literature finished, on two assumptions.** First, the school lists "English Language and Literature" as one A level, so this is the combined AQA course 7707. If the school actually teaches separate English Language and English Literature A levels, this needs redoing. Second, the board (AQA) is unconfirmed.
Code: `artifacts/api-server/src/lib/marking/aqaALevelEnglishLangLit.ts`. Tests: `src/__tests__/aqaALevelEnglishLangLit.test.ts`.

## Documents used

All downloaded from AQA's file server and read as full text.

| What | Document | Version line printed on it |
|---|---|---|
| Specification | A-level English Language and Literature 7707 | A-level exams June 2017 onwards. Version 1.4, 8 December 2021 |
| Papers 7707/1 and 7707/2: question papers | June 2022 and June 2023 | not applicable |
| Papers 7707/1 and 7707/2: mark schemes | June 2022 and June 2023 | "Version: 1.0 Final" |

## How the exam is built (from the specification)

| Component | Content | Time | Marks | Weighting |
|---|---|---|---|---|
| Paper 1 Telling stories | A: one compulsory comparison on the Paris anthology, closed book (40). B: one prose set text from a choice of two (35). C: one poetry question from a choice of two (25) | 3 hours | 100 | 40% |
| Paper 2 Exploring conflict | A: re-creative writing using a set text (25) and a commentary on it (30). B: one drama question from a choice of two (45) | 2 hours 30 | 100 | 40% |
| Non-exam assessment | Making connections: investigation, 2,500 to 3,000 words | n/a | 50 | 20% |

Assessment objectives, overall: AO1 28%, AO2 28%, AO3 20%, AO4 12%, AO5 12%. AO1 is applying linguistic and literary concepts and methods, AO2 is analysing how meanings are shaped, AO3 is the influence of contexts, AO4 is making connections across texts, and AO5 is creative use of English.

## Marks by assessment objective (from the June 2022 mark schemes)

| Paper | Questions | Marks | Split |
|---|---|---|---|
| 1 | 1 (Paris comparison) | 40 | AO1 15, AO3 15, AO4 10 |
| 1 | 2 to 9 (prose) | 35 | AO1 10, AO2 10, AO3 15 |
| 1 | 10 to 17 (poetry) | 25 | AO1 15, AO2 10 |
| 2 | 1, 3, 5, 7 (re-creative writing) | 25 | AO5 25 |
| 2 | 2, 4, 6, 8 (commentary) | 30 | AO2 15, AO4 10, AO5 5 |
| 2 | 9 to 16 (drama) | 45 | AO1 15, AO2 20, AO3 10 |

## How an A level English Language and Literature answer is marked

1. **Every written answer is marked by levels, one set of levels for each assessment objective.** There are five levels. The marker works up from the lowest level to find the best fit, then uses how varied the answer is to place the mark within the level.
2. **Top levels as read.** For a 15 mark strand Level 5 is 13 to 15 and Level 4 is 10 to 12. For a 10 mark strand Level 5 is 9 to 10 and Level 4 is 7 to 8. For the 25 mark creative writing Level 5 is 21 to 25, Level 4 16 to 20, Level 3 11 to 15, Level 2 6 to 10 and Level 1 1 to 5. The lower levels of the 15 and 10 mark strands follow the same five-level pattern but their ranges were not copied out here.
3. **What the levels reward** (paraphrased). AO1: selecting language levels with relevance, using terminology accurately, and writing in a clear academic style. AO2: close analysis of how meanings are shaped by the writer's choices. AO3: how genre, mode and the contexts of production and reception influence the text. AO4: connecting the two texts evenly, with an uneven treatment of the texts holding the mark down. AO5: originality, sustained style and convincing use of the base text.
4. **Indicative content is a guide.** The mark schemes say other valid points must be credited and that a student need not cover every listed point to reach the top level.
5. **Pip's feedback** gives a level and a comment for each assessment objective separately, mirroring the way the mark scheme asks examiners to annotate, and says what would reach the next level. It stays positive in tone, as the mark scheme asks for examiners.

## How the topics and questions were checked

- **Topics** are the specification sections that carry questions (3.1.2, 3.1.3, 3.1.4, 3.2.2, 3.2.3, 3.2.4) split by set text or anthology, 27 topics in all, plus the language-analysis areas of 3.1.1 and the NEA investigation.
- **Question to topic** is straightforward here because every question names its set text. Each set text is cited in both June 2022 and June 2023. There are no `check` rows.
- **Marks** are the `[n marks]` printed on the papers. They agree with the mark schemes: Paper 1 is 40, 35 and 25, and Paper 2 is 25 and 30 for Section A and 45 for Section B.
- The five language-analysis areas of 3.1.1 (phonetics and phonology, lexis and semantics, grammar, pragmatics, discourse) are assessed through every question and no question isolates one, so they are listed as not found. The NEA investigation has no past papers.

## Coverage by topic

| Code | Topic | Questions | Marks |
|---|---|---|---|
| 3.1.1a | Methods of language analysis: Phonetics, phonology and prosodics | not found | |
| 3.1.1b | Methods of language analysis: Lexis and semantics | not found | |
| 3.1.1c | Methods of language analysis: Grammar | not found | |
| 3.1.1d | Methods of language analysis: Pragmatics | not found | |
| 3.1.1e | Methods of language analysis: Discourse | not found | |
| 3.1.2 | Remembered places: AQA Anthology Paris | 7707/1 June 2022 Q1; 7707/1 June 2023 Q1 | 40, 40 |
| 3.1.3a | Imagined worlds: Frankenstein, Mary Shelley | 7707/1 June 2022 Q2; 7707/1 June 2023 Q2; 7707/1 June 2022 Q3; 7707/1 June 2023 Q3 | 35, 35, 35, 35 |
| 3.1.3b | Imagined worlds: Dracula, Bram Stoker | 7707/1 June 2022 Q4; 7707/1 June 2023 Q4; 7707/1 June 2022 Q5; 7707/1 June 2023 Q5 | 35, 35, 35, 35 |
| 3.1.3c | Imagined worlds: The Handmaid's Tale, Margaret Atwood | 7707/1 June 2022 Q6; 7707/1 June 2023 Q6; 7707/1 June 2022 Q7; 7707/1 June 2023 Q7 | 35, 35, 35, 35 |
| 3.1.3d | Imagined worlds: The Lovely Bones, Alice Sebold | 7707/1 June 2022 Q8; 7707/1 June 2023 Q8; 7707/1 June 2022 Q9; 7707/1 June 2023 Q9 | 35, 35, 35, 35 |
| 3.1.4a | Poetic voices: John Donne | 7707/1 June 2022 Q10; 7707/1 June 2023 Q10; 7707/1 June 2022 Q11; 7707/1 June 2023 Q11 | 25, 25, 25, 25 |
| 3.1.4b | Poetic voices: Robert Browning | 7707/1 June 2022 Q12; 7707/1 June 2023 Q12; 7707/1 June 2022 Q13; 7707/1 June 2023 Q13 | 25, 25, 25, 25 |
| 3.1.4c | Poetic voices: Carol Ann Duffy | 7707/1 June 2022 Q14; 7707/1 June 2023 Q14; 7707/1 June 2022 Q15; 7707/1 June 2023 Q15 | 25, 25, 25, 25 |
| 3.1.4d | Poetic voices: Seamus Heaney | 7707/1 June 2022 Q16; 7707/1 June 2023 Q16; 7707/1 June 2022 Q17; 7707/1 June 2023 Q17 | 25, 25, 25, 25 |
| 3.2.2a | Writing about society, re-creative writing: Into the Wild, Jon Krakauer | 7707/2 June 2022 Q1; 7707/2 June 2023 Q1 | 25, 25 |
| 3.2.2b | Writing about society, re-creative writing: The Suspicions of Mr Whicher, Kate Summerscale | 7707/2 June 2022 Q3; 7707/2 June 2023 Q3 | 25, 25 |
| 3.2.2c | Writing about society, re-creative writing: The Great Gatsby, F. Scott Fitzgerald | 7707/2 June 2022 Q5; 7707/2 June 2023 Q5 | 25, 25 |
| 3.2.2d | Writing about society, re-creative writing: The Kite Runner, Khaled Hosseini | 7707/2 June 2022 Q7; 7707/2 June 2023 Q7 | 25, 25 |
| 3.2.3a | Critical commentary: Into the Wild, Jon Krakauer | 7707/2 June 2022 Q2; 7707/2 June 2023 Q2 | 30, 30 |
| 3.2.3b | Critical commentary: The Suspicions of Mr Whicher, Kate Summerscale | 7707/2 June 2022 Q4; 7707/2 June 2023 Q4 | 30, 30 |
| 3.2.3c | Critical commentary: The Great Gatsby, F. Scott Fitzgerald | 7707/2 June 2022 Q6; 7707/2 June 2023 Q6 | 30, 30 |
| 3.2.3d | Critical commentary: The Kite Runner, Khaled Hosseini | 7707/2 June 2022 Q8; 7707/2 June 2023 Q8 | 30, 30 |
| 3.2.4a | Dramatic encounters: Othello, William Shakespeare | 7707/2 June 2022 Q9; 7707/2 June 2023 Q9; 7707/2 June 2022 Q10; 7707/2 June 2023 Q10 | 45, 45, 45, 45 |
| 3.2.4b | Dramatic encounters: All My Sons, Arthur Miller | 7707/2 June 2022 Q11; 7707/2 June 2023 Q11; 7707/2 June 2022 Q12; 7707/2 June 2023 Q12 | 45, 45, 45, 45 |
| 3.2.4c | Dramatic encounters: A Streetcar Named Desire, Tennessee Williams | 7707/2 June 2022 Q13; 7707/2 June 2023 Q13; 7707/2 June 2022 Q14; 7707/2 June 2023 Q14 | 45, 45, 45, 45 |
| 3.2.4d | Dramatic encounters: The Herd, Rory Kinnear | 7707/2 June 2022 Q15; 7707/2 June 2023 Q15; 7707/2 June 2022 Q16; 7707/2 June 2023 Q16 | 45, 45, 45, 45 |
| 3.3.2 | Investigation (non-exam assessment) | not found | |

## Not found in the four papers read

3.1.1a to 3.1.1e (language-analysis areas, assessed through all questions) and 3.3.2 (the NEA investigation).

## What to check

- Whether the school teaches the combined course (7707) or separate Language and Literature A levels.
- Whether the school uses AQA at all for this subject.
- Which set texts the school has chosen: the questions in the papers span all of them, the school will study only one per section.
