# AQA A-level Computer Science (7517): how Pip marks it, and what it is based on

Status: **A level Computer Science finished. The board (AQA) is an assumption** until the school confirms it. Needs your check of the `check` rows.
Code: `artifacts/api-server/src/lib/marking/aqaALevelComputerScience.ts`. Tests: `src/__tests__/aqaALevelComputerScience.test.ts`.

## Documents used

All downloaded from AQA's file server and read as full text.

| What | Document | Version line printed on it |
|---|---|---|
| Specification | AS and A-level Computer Science, 7516 and 7517 | Version 1.6, 31 July 2023 |
| Papers 7517/1 and 7517/2: question papers | June 2022 and June 2023 | not applicable |
| Papers 7517/1 and 7517/2: mark schemes | June 2022 and June 2023 | "Version: 1.0 Final" |

## How the exam is built (from the specification)

| Component | Content | Time | Marks | Weighting |
|---|---|---|---|---|
| Paper 1 (on-screen) | Programming, data structures, algorithms, theory of computation, computer systems | 2 hours 30 | 100 | 40% |
| Paper 2 (written) | Data representation, computer systems, organisation, networking, databases, big data, functional programming | 2 hours 30 | 100 | 40% |
| Non-exam assessment | Computing practical project | n/a | 75 | 20% |

Assessment objectives, overall: AO1 knowledge and understanding 30%, AO2 applying it 30%, AO3 designing, programming and evaluating 40%. By component: AO1 8/22/0, AO2 12/16/2, AO3 20/2/18 (Paper 1 / Paper 2 / NEA).

## How an A level Computer Science answer is marked

1. **Short answers are point-based.** The mark scheme lists the creditable points, and each correct point earns a mark up to the maximum. Alternative valid wording is credited, and the mark scheme says where a specific term is required.
2. **Programming questions** (Paper 1) are marked on whether the code does what the question asks, not on exact wording. Trace tables and pseudo-code are marked point by point.
3. **Extended answers use level of response.** Longer questions (for example 12 marks, and 4 marks for some explanations) have levels, each with a descriptor and a mark range. The marker works up from the lowest level to find the best fit for the whole answer, then picks a mark within the level using how varied the answer is and the Lead Examiner's standardising examples. The indicative content is a guide and other valid points are credited.
   - 7517/1 June 2022 Q5.1 (12 marks: 4 AO3 design and 8 AO3 programming): four levels, 10–12, 7–9, 4–6, 1–3.
   - 7517/2 June 2022 Q6 (12 marks, all AO1): four levels, 10–12, 7–9, 4–6, 1–3.
   - 7517/2 June 2022 Q13.3 (4 marks, all AO1): two levels, 3–4 and 1–2.
4. **Pip's feedback** names the level reached or the points missed, and states what would move the answer up.

## How the topics and questions were checked

- **Topics** are the specification's 51 numbered subsections, 4.1.1 to 4.13.1, with AQA's headings.
- **Marks.** Each cited part's marks are the `[n marks]` printed on the question paper; Papers 1 and 2 each add up to 100.
- **Question to topic.** AQA does not publish a topic tag per question, so which question tests which subsection is our judgement. Loose matches are flagged `check` (9 of 75).
- Subsections with no clear question in the four papers are listed as not found rather than matched to a poor fit.

## Coverage by topic

| Code | Topic | Questions | Marks | Confidence |
|---|---|---|---|---|
| 4.1.1 | Programming | 7517/1 June 2022 Q5.1; 7517/1 June 2023 Q6.1 | 12, 12 | ok, ok |
| 4.1.2 | Programming paradigms | 7517/1 June 2022 Q6.3; 7517/1 June 2022 Q6.4; 7517/1 June 2023 Q8 | 2, 1, 2 | ok, ok, ok |
| 4.2.1 | Data structures and abstract data types | 7517/1 June 2022 Q2.2 | 3 | ok |
| 4.2.2 | Queues | 7517/1 June 2023 Q1; 7517/1 June 2023 Q9.1 | 5, 1 | ok, check |
| 4.2.3 | Stacks | 7517/1 June 2022 Q2.5; 7517/1 June 2022 Q2.3 | 2, 1 | ok, ok |
| 4.2.4 | Graphs | 7517/1 June 2022 Q4.4; 7517/1 June 2022 Q4.8 | 1, 1 | ok, ok |
| 4.2.5 | Trees | 7517/1 June 2023 Q3.2; 7517/1 June 2023 Q3.1 | 4, 2 | ok, ok |
| 4.2.6 | Hash tables | 7517/1 June 2022 Q7.3 | 3 | ok |
| 4.2.7 | Dictionaries | 7517/1 June 2022 Q7.4 | 1 | ok |
| 4.2.8 | Vectors | not found | | |
| 4.3.1 | Graph-traversal | 7517/1 June 2022 Q4.5; 7517/1 June 2022 Q4.7 | 6, 1 | ok, ok |
| 4.3.2 | Tree-traversal | not found | | |
| 4.3.3 | Reverse Polish | not found | | |
| 4.3.4 | Searching algorithms | 7517/1 June 2023 Q3.3; 7517/1 June 2023 Q3.4 | 1, 1 | ok, ok |
| 4.3.5 | Sorting algorithms | not found | | |
| 4.3.6 | Optimisation algorithms | not found | | |
| 4.4.1 | Abstraction and automation | not found | | |
| 4.4.2 | Regular languages | 7517/1 June 2023 Q4.2; 7517/1 June 2023 Q4.1 | 2, 3 | ok, ok |
| 4.4.3 | Context-free languages | 7517/1 June 2023 Q4.1 | 3 | check |
| 4.4.4 | Classification of algorithms | 7517/1 June 2022 Q1; 7517/1 June 2023 Q3.6; 7517/1 June 2023 Q3.5 | 3, 2, 1 | ok, ok, ok |
| 4.4.5 | A model of computation | 7517/1 June 2023 Q5.1; 7517/1 June 2023 Q5.3 | 5, 2 | ok, ok |
| 4.5.1 | Number systems | not found | | |
| 4.5.2 | Number bases | 7517/2 June 2022 Q1.1; 7517/2 June 2022 Q1.2 | 2, 1 | ok, ok |
| 4.5.3 | Units of information | not found | | |
| 4.5.4 | Binary number system | 7517/2 June 2022 Q5.4; 7517/2 June 2023 Q6.2; 7517/2 June 2023 Q6.3 | 3, 3, 2 | ok, ok, ok |
| 4.5.5 | Information coding systems | not found | | |
| 4.5.6 | Representing images, sound and other data | 7517/2 June 2022 Q10.1; 7517/2 June 2023 Q1.1; 7517/2 June 2022 Q10.2 | 3, 2, 3 | ok, ok, ok |
| 4.6.1 | Hardware and software | 7517/2 June 2022 Q4.3; 7517/2 June 2022 Q4.1 | 2, 1 | ok, ok |
| 4.6.2 | Classification of programming languages | 7517/2 June 2022 Q9.4 | 2 | ok |
| 4.6.3 | Types of program translator | 7517/2 June 2022 Q9.5 | 1 | ok |
| 4.6.4 | Logic gates | 7517/2 June 2023 Q9.1; 7517/2 June 2022 Q3.1 | 3, 1 | ok, ok |
| 4.6.5 | Boolean algebra | 7517/2 June 2022 Q3.3; 7517/2 June 2023 Q9.3 | 4, 4 | ok, ok |
| 4.7.1 | Internal hardware components of a computer | 7517/2 June 2022 Q13.1 | 1 | check |
| 4.7.2 | The stored program concept | not found | | |
| 4.7.3 | Structure and role of the processor and its components | 7517/2 June 2023 Q4.1; 7517/2 June 2022 Q9.2; 7517/2 June 2023 Q4.2 | 12, 5, 2 | ok, ok, ok |
| 4.7.4 | External hardware devices | 7517/2 June 2022 Q13.3; 7517/2 June 2022 Q13.2 | 4, 2 | ok, ok |
| 4.8.1 | Individual (moral), social (ethical), legal and cultural issues and | 7517/2 June 2022 Q6 | 12 | check |
| 4.9.1 | Communication | 7517/2 June 2022 Q2.1; 7517/2 June 2022 Q2.4; 7517/2 June 2023 Q10.1 | 2, 1, 1 | ok, ok, ok |
| 4.9.2 | Networking | 7517/2 June 2022 Q8.1; 7517/2 June 2022 Q11; 7517/2 June 2023 Q2.3 | 3, 3, 2 | ok, ok, ok |
| 4.9.3 | The Internet | 7517/2 June 2023 Q5.5; 7517/2 June 2022 Q8.3 | 1, 3 | ok, check |
| 4.9.4 | The Transmission Control Protocol/Internet Protocol (TCP/IP) | 7517/2 June 2023 Q11.1; 7517/2 June 2023 Q11.3 | 3, 4 | ok, ok |
| 4.10.1 | Conceptual data models and entity relationship modelling | 7517/2 June 2022 Q7.2 | 2 | ok |
| 4.10.2 | Relational databases | 7517/2 June 2022 Q7.1; 7517/2 June 2023 Q5.3 | 1, 2 | check, check |
| 4.10.3 | Database design and normalisation techniques | 7517/2 June 2023 Q5.1; 7517/2 June 2022 Q7.5 | 5, 2 | ok, ok |
| 4.10.4 | Structured Query Language (SQL) | 7517/2 June 2022 Q7.4; 7517/2 June 2022 Q7.3 | 7, 3 | ok, ok |
| 4.10.5 | Client server databases | 7517/2 June 2023 Q5.2 | 2 | check |
| 4.11.1 | Big Data | 7517/2 June 2023 Q8.2; 7517/2 June 2023 Q8.3 | 3, 2 | ok, ok |
| 4.12.1 | Functional programming paradigm | 7517/2 June 2022 Q12.1 | 1 | ok |
| 4.12.2 | Writing functional programs | 7517/2 June 2022 Q12.3; 7517/2 June 2023 Q12.1 | 4, 3 | ok, ok |
| 4.12.3 | Lists in functional programming | 7517/2 June 2023 Q12.2 | 1 | check |
| 4.13.1 | Aspects of software development | not found | | |

## Not found in the four papers read

4.2.8, 4.3.2, 4.3.3, 4.3.5, 4.3.6, 4.4.1, 4.5.1, 4.5.3, 4.5.5, 4.7.2, 4.13.1. The finer content items inside each subsection are not mapped one by one.

## What to check

- Whether AQA is the right board for Computer Science (assumed).
- The `check` rows.
- Whether you want the NEA marking (75 marks) added; it has no past papers.
