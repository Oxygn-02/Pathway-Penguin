# AQA GCSE Computer Science (8525): how Pip marks it, and what it is based on

Status: **third subject finished. The board (AQA) is an assumption** until the school confirms it. Needs your check of the `check` rows.
Code: `artifacts/api-server/src/lib/marking/aqaComputerScience.ts`. Tests: `src/__tests__/aqaComputerScience.test.ts`.

## Documents used

All downloaded from AQA's file server and read as text.

| What | Document | Version line printed on it |
|---|---|---|
| Specification | AQA GCSE Computer Science 8525 (`filestore.aqa.org.uk/resources/computing/specifications/AQA-8525-SP-2020.PDF`) | GCSE exams June 2022 onwards. Version 1.2, 29 November 2022 |
| Paper 1 (Python version), June 2022 and June 2023 | `AQA-85251B-QP-JUN22.PDF`, `AQA-85251B-QP-JUN23.PDF`, mark schemes `AQA-85251-MS-JUN22.PDF`, `AQA-85251-MS-JUN23.PDF` | Question papers; mark scheme versions as printed |
| Paper 2, June 2022 and June 2023 | `AQA-85252-QP-JUN22.PDF`, `AQA-85252-QP-JUN23.PDF`, mark schemes `AQA-85252-MS-JUN22.PDF` ("Version:1.0 Final") and the June 2023 one | As printed |

Paper 1 comes in three language versions (A is C#, B is Python, C is VB.NET) with the same structure. I cited the Python version, because that is the one UTC students are most likely to sit; that is an assumption, so tell me if the school uses another.

## How the exam is built (from the specification)

- Paper 1, Computational thinking and programming skills: written exam, 2 hours, 90 marks, 50% of the GCSE.
- Paper 2, Computing concepts: written exam, 1 hour 45 minutes, 90 marks, 50% of the GCSE.
- Assessment objectives, approximate overall weighting: AO1 knowledge and understanding about 30% (4.4% of Paper 1, 25.6% of Paper 2); AO2 apply knowledge about 40% (20% of each paper); AO3 analyse problems and design, program, evaluate and refine solutions about 30% (25.6% of Paper 1, 4.4% of Paper 2).

## How a Computer Science answer is marked

The mark scheme works in two ways:

1. **Point-based marks** for short questions. Each mark scheme entry says which assessment objective the mark is for, for example "2 marks for AO2 (apply)". Marks are given for each valid point, often a point plus a suitable expansion, and the scheme lists accepted and rejected alternatives. Tracing, trace tables and "state/define" questions are all marked this way.
2. **Level of response** for the long answers (the 6, 9, 12 and 14 mark questions). The mark scheme explains the process: first decide a level by treating the levels as a ladder and taking a best fit for the answer overall, then decide the mark inside that level using how strong the answer is within the level and a Lead Examiner's example answers. Indicative content is a guide and other valid points must be credited. A student does not need every point to reach the top level.

Pip follows the same two steps for the long answers: best-fit level first, then the mark within it. For short answers Pip should be given the official mark scheme wording, because the accepted and rejected phrases are the whole scheme.

## How the topics and questions were checked

- **Topics** are the specification's numbered sections (36 of them, from 3.1.1 to 3.8). The titles are AQA's own section headings. The finer bullet points inside each section are not listed here.
- **Marks.** For every cited question, the marks from the question paper were compared with the marks in the matching mark scheme. All 52 cited questions agree.
- **Topic tags are our judgement.** AQA does not publish a topic for each question, apart from the AO it states. Rows marked `check` are loose matches.
- **Coverage is 35 of 36 sections.** 3.6.2.1 Social engineering had no clear question in the four papers read.

## Topic coverage

| Code | Topic | Question(s) | Marks | Confidence |
|---|---|---|---|---|
| 3.1.1 | Representing algorithms | 8525/1 (Python) June 2023 Q1.1; 8525/1 (Python) June 2023 Q5 | 2, 3 | ok, ok |
| 3.1.2 | Efficiency of algorithms | 8525/1 (Python) June 2022 Q4.2 | 2 | check |
| 3.1.3 | Searching algorithms | 8525/1 (Python) June 2023 Q12.1 | 4 | ok |
| 3.1.4 | Sorting algorithms | 8525/1 (Python) June 2023 Q8 | 4 | ok |
| 3.2.1 | Data types | 8525/1 (Python) June 2022 Q2.3 | 2 | ok |
| 3.2.2 | Programming concepts | 8525/1 (Python) June 2022 Q1.1; 8525/1 (Python) June 2023 Q2.1 | 1, 1 | ok, ok |
| 3.2.3 | Arithmetic operations in a programming language | 8525/1 (Python) June 2023 Q2.3 | 1 | check |
| 3.2.4 | Relational operations in a programming language | 8525/1 (Python) June 2022 Q1.4 | 1 | ok |
| 3.2.5 | Boolean operations in a programming language | 8525/1 (Python) June 2022 Q2.1 | 2 | check |
| 3.2.6 | Data structures | 8525/1 (Python) June 2022 Q5.3; 8525/1 (Python) June 2023 Q9.1 | 1, 1 | ok, check |
| 3.2.7 | Input/output | 8525/1 (Python) June 2022 Q2.1 | 2 | check |
| 3.2.8 | String handling operations in a programming language | 8525/1 (Python) June 2023 Q1.4; 8525/1 (Python) June 2022 Q3.1 | 1, 1 | ok, ok |
| 3.2.9 | Random number generation in a programming language | 8525/1 (Python) June 2022 Q5 | 5 | check |
| 3.2.10 | Structured programming and subroutines (procedures and functions) | 8525/1 (Python) June 2022 Q11.3; 8525/1 (Python) June 2022 Q11.2 | 3, 1 | ok, ok |
| 3.2.11 | Robust and secure programming | 8525/1 (Python) June 2023 Q4.2 | 1 | check |
| 3.3.1 | Number bases | 8525/2 June 2023 Q1.1 | 1 | ok |
| 3.3.2 | Converting between number bases | 8525/2 June 2022 Q1.1; 8525/2 June 2022 Q1.2 | 1, 2 | ok, ok |
| 3.3.3 | Units of information | 8525/2 June 2022 Q10; 8525/2 June 2023 Q4 | 2, 2 | ok, ok |
| 3.3.4 | Binary arithmetic | 8525/2 June 2022 Q2.1; 8525/2 June 2022 Q2.2 | 2, 1 | ok, ok |
| 3.3.5 | Character encoding | 8525/2 June 2022 Q11 | 2 | ok |
| 3.3.6 | Representing images | 8525/2 June 2022 Q12; 8525/2 June 2023 Q7.1 | 3, 1 | ok, ok |
| 3.3.7 | Representing sound | 8525/2 June 2022 Q13.1; 8525/2 June 2023 Q6.1 | 1, 1 | ok, ok |
| 3.3.8 | Data compression | 8525/2 June 2022 Q17.1 | 2 | ok |
| 3.4.1 | Hardware and software | 8525/2 June 2023 Q8.1 | 1 | ok |
| 3.4.2 | Boolean logic | 8525/2 June 2022 Q3.1; 8525/2 June 2022 Q3.2 | 1, 3 | ok, ok |
| 3.4.3 | Software classification | 8525/2 June 2022 Q4.1; 8525/2 June 2023 Q9.2 | 2, 1 | ok, ok |
| 3.4.4 | Classification of programming languages and translators | 8525/2 June 2022 Q7.1; 8525/2 June 2022 Q6 | 1, 2 | ok, ok |
| 3.4.5 | Systems architecture | 8525/2 June 2023 Q10.1; 8525/2 June 2022 Q8 | 2, 2 | ok, ok |
| 3.5 | Fundamentals of computer networks | 8525/2 June 2022 Q14.2; 8525/2 June 2023 Q13.3 | 2, 2 | ok, ok |
| 3.6.1 | Fundamentals of cyber security | 8525/2 June 2023 Q16.1 | 2 | ok |
| 3.6.2.1 | Social engineering | not found |  | — |
| 3.6.2.2 | Malicious code (malware) | 8525/2 June 2023 Q16.2 | 1 | ok |
| 3.6.3 | Methods to detect and prevent cyber security threats | 8525/2 June 2022 Q15.2; 8525/2 June 2022 Q16.1 | 2, 2 | ok, ok |
| 3.7.1 | Relational databases | 8525/2 June 2022 Q18.1 | 2 | ok |
| 3.7.2 | Structured query language (SQL) | 8525/2 June 2022 Q18.5; 8525/2 June 2023 Q14.5 | 6, 2 | ok, check |
| 3.8 | Ethical, legal and environmental impacts of digital technology on wider society, including issues of privacy | 8525/2 June 2022 Q5; 8525/2 June 2023 Q15 | 6, 9 | ok, ok |
## What to check

1. Rows marked `check`.
2. Which Paper 1 language version the school uses.
3. AQA as the board. I have not confirmed this with the school. OCR's Computer Science (J277) is the main alternative.
4. The finer bullet points inside each section are not individually mapped to questions yet. Tell me if you want that level.
