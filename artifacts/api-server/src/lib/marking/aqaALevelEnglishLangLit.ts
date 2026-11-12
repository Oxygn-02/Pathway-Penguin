/**
 * AQA A-level English Language and Literature (7707) marking structure.
 *
 * ASSUMPTION: the school lists "English Language and Literature" as one A level. This file assumes the combined AQA course 7707. If the school
 * actually teaches separate English Language (7702) and English Literature (7712 or 7717) A levels, these need to be redone.
 *
 * Sources, all downloaded from AQA's file server and read as text:
 *  - Specification 7707, "A-level exams June 2017 onwards. Version 1.4 8 December 2021".
 *  - Question papers and mark schemes 7707/1 (Telling stories) and 7707/2 (Exploring conflict), June 2022 and June 2023, mark schemes "Version: 1.0 Final".
 *
 * This course is built around set texts, so a topic here is a specification section for one set text or anthology (for example the drama text
 * Othello under 3.2.4). Each topic is tested by named questions in both series, so there is no guesswork about which question belongs where.
 * The five areas of language analysis in 3.1.1 are tested inside every question, never alone, so they are listed as not found.
 * `marks` is the total printed on the question paper for that numbered question.
 */

export interface ALevelEngLangLitTopic {
  code: string;
  specSection: string;
  group: string;
  title: string;
}

export interface ALevelEngLangLitCoverage {
  code: string;
  series: "June 2022" | "June 2023";
  paper: "7707/1" | "7707/2";
  q: string;
  marks: number;
  confidence: "ok" | "check";
}

export const ALEVEL_ELL_PAPERS = [
  { code: "7707/1", title: "Telling stories: A Paris anthology comparison (40), B prose set text (35), C poetry set text (25)", minutes: 180, marks: 100, weighting: "40% of the A level" },
  { code: "7707/2", title: "Exploring conflict: A re-creative writing (25) and commentary (30), B drama set text (45)", minutes: 150, marks: 100, weighting: "40% of the A level" },
  { code: "NEA", title: "Making connections: investigation of 2,500 to 3,000 words", minutes: 0, marks: 50, weighting: "20% of the A level" },
] as const;

/** Overall weightings from the specification (approx %): AO1 28, AO2 28, AO3 20, AO4 12, AO5 12. */
export const ALEVEL_ELL_AO_WEIGHTS = { AO1: 28, AO2: 28, AO3: 20, AO4: 12, AO5: 12 } as const;

/** Marks per assessment objective for each question type, from the "Distribution of Assessment Objectives" table in the June 2022 mark schemes. */
export const ALEVEL_ELL_QUESTION_AOS = [
  { paper: "7707/1", questions: "1", marks: 40, aos: { AO1: 15, AO3: 15, AO4: 10 } },
  { paper: "7707/1", questions: "2 to 9", marks: 35, aos: { AO1: 10, AO2: 10, AO3: 15 } },
  { paper: "7707/1", questions: "10 to 17", marks: 25, aos: { AO1: 15, AO2: 10 } },
  { paper: "7707/2", questions: "1, 3, 5, 7", marks: 25, aos: { AO5: 25 } },
  { paper: "7707/2", questions: "2, 4, 6, 8", marks: 30, aos: { AO2: 15, AO4: 10, AO5: 5 } },
  { paper: "7707/2", questions: "9 to 16", marks: 45, aos: { AO1: 15, AO2: 20, AO3: 10 } },
] as const;

/** Level of response, five levels. Mark ranges for the strands whose top levels were read from the June 2022 mark schemes. */
export const ALEVEL_ELL_LEVELS = [
  { strand: "15 mark strand", levels: { 5: "13-15", 4: "10-12" } },
  { strand: "10 mark strand", levels: { 5: "9-10", 4: "7-8" } },
  { strand: "25 mark creative writing (AO5)", levels: { 5: "21-25", 4: "16-20", 3: "11-15", 2: "6-10", 1: "1-5" } },
] as const;

export const ALEVEL_ELL_TOPICS: ALevelEngLangLitTopic[] = [
  { code: "3.1.1a", specSection: "3.1.1", group: "Telling stories", title: "Methods of language analysis: Phonetics, phonology and prosodics" },
  { code: "3.1.1b", specSection: "3.1.1", group: "Telling stories", title: "Methods of language analysis: Lexis and semantics" },
  { code: "3.1.1c", specSection: "3.1.1", group: "Telling stories", title: "Methods of language analysis: Grammar" },
  { code: "3.1.1d", specSection: "3.1.1", group: "Telling stories", title: "Methods of language analysis: Pragmatics" },
  { code: "3.1.1e", specSection: "3.1.1", group: "Telling stories", title: "Methods of language analysis: Discourse" },
  { code: "3.1.2", specSection: "3.1.2", group: "Telling stories", title: "Remembered places: AQA Anthology Paris" },
  { code: "3.1.3a", specSection: "3.1.3", group: "Telling stories", title: "Imagined worlds: Frankenstein, Mary Shelley" },
  { code: "3.1.3b", specSection: "3.1.3", group: "Telling stories", title: "Imagined worlds: Dracula, Bram Stoker" },
  { code: "3.1.3c", specSection: "3.1.3", group: "Telling stories", title: "Imagined worlds: The Handmaid's Tale, Margaret Atwood" },
  { code: "3.1.3d", specSection: "3.1.3", group: "Telling stories", title: "Imagined worlds: The Lovely Bones, Alice Sebold" },
  { code: "3.1.4a", specSection: "3.1.4", group: "Telling stories", title: "Poetic voices: John Donne" },
  { code: "3.1.4b", specSection: "3.1.4", group: "Telling stories", title: "Poetic voices: Robert Browning" },
  { code: "3.1.4c", specSection: "3.1.4", group: "Telling stories", title: "Poetic voices: Carol Ann Duffy" },
  { code: "3.1.4d", specSection: "3.1.4", group: "Telling stories", title: "Poetic voices: Seamus Heaney" },
  { code: "3.2.2a", specSection: "3.2.2", group: "Exploring conflict", title: "Writing about society, re-creative writing: Into the Wild, Jon Krakauer" },
  { code: "3.2.2b", specSection: "3.2.2", group: "Exploring conflict", title: "Writing about society, re-creative writing: The Suspicions of Mr Whicher, Kate Summerscale" },
  { code: "3.2.2c", specSection: "3.2.2", group: "Exploring conflict", title: "Writing about society, re-creative writing: The Great Gatsby, F. Scott Fitzgerald" },
  { code: "3.2.2d", specSection: "3.2.2", group: "Exploring conflict", title: "Writing about society, re-creative writing: The Kite Runner, Khaled Hosseini" },
  { code: "3.2.3a", specSection: "3.2.3", group: "Exploring conflict", title: "Critical commentary: Into the Wild, Jon Krakauer" },
  { code: "3.2.3b", specSection: "3.2.3", group: "Exploring conflict", title: "Critical commentary: The Suspicions of Mr Whicher, Kate Summerscale" },
  { code: "3.2.3c", specSection: "3.2.3", group: "Exploring conflict", title: "Critical commentary: The Great Gatsby, F. Scott Fitzgerald" },
  { code: "3.2.3d", specSection: "3.2.3", group: "Exploring conflict", title: "Critical commentary: The Kite Runner, Khaled Hosseini" },
  { code: "3.2.4a", specSection: "3.2.4", group: "Exploring conflict", title: "Dramatic encounters: Othello, William Shakespeare" },
  { code: "3.2.4b", specSection: "3.2.4", group: "Exploring conflict", title: "Dramatic encounters: All My Sons, Arthur Miller" },
  { code: "3.2.4c", specSection: "3.2.4", group: "Exploring conflict", title: "Dramatic encounters: A Streetcar Named Desire, Tennessee Williams" },
  { code: "3.2.4d", specSection: "3.2.4", group: "Exploring conflict", title: "Dramatic encounters: The Herd, Rory Kinnear" },
  { code: "3.3.2", specSection: "3.3.2", group: "Making connections", title: "Investigation (non-exam assessment)" },
];

export const ALEVEL_ELL_COVERAGE: ALevelEngLangLitCoverage[] = [
  { code: "3.1.2", series: "June 2022", paper: "7707/1", q: "1", marks: 40, confidence: "ok" },
  { code: "3.1.2", series: "June 2023", paper: "7707/1", q: "1", marks: 40, confidence: "ok" },
  { code: "3.1.3a", series: "June 2022", paper: "7707/1", q: "2", marks: 35, confidence: "ok" },
  { code: "3.1.3a", series: "June 2023", paper: "7707/1", q: "2", marks: 35, confidence: "ok" },
  { code: "3.1.3a", series: "June 2022", paper: "7707/1", q: "3", marks: 35, confidence: "ok" },
  { code: "3.1.3a", series: "June 2023", paper: "7707/1", q: "3", marks: 35, confidence: "ok" },
  { code: "3.1.3b", series: "June 2022", paper: "7707/1", q: "4", marks: 35, confidence: "ok" },
  { code: "3.1.3b", series: "June 2023", paper: "7707/1", q: "4", marks: 35, confidence: "ok" },
  { code: "3.1.3b", series: "June 2022", paper: "7707/1", q: "5", marks: 35, confidence: "ok" },
  { code: "3.1.3b", series: "June 2023", paper: "7707/1", q: "5", marks: 35, confidence: "ok" },
  { code: "3.1.3c", series: "June 2022", paper: "7707/1", q: "6", marks: 35, confidence: "ok" },
  { code: "3.1.3c", series: "June 2023", paper: "7707/1", q: "6", marks: 35, confidence: "ok" },
  { code: "3.1.3c", series: "June 2022", paper: "7707/1", q: "7", marks: 35, confidence: "ok" },
  { code: "3.1.3c", series: "June 2023", paper: "7707/1", q: "7", marks: 35, confidence: "ok" },
  { code: "3.1.3d", series: "June 2022", paper: "7707/1", q: "8", marks: 35, confidence: "ok" },
  { code: "3.1.3d", series: "June 2023", paper: "7707/1", q: "8", marks: 35, confidence: "ok" },
  { code: "3.1.3d", series: "June 2022", paper: "7707/1", q: "9", marks: 35, confidence: "ok" },
  { code: "3.1.3d", series: "June 2023", paper: "7707/1", q: "9", marks: 35, confidence: "ok" },
  { code: "3.1.4a", series: "June 2022", paper: "7707/1", q: "10", marks: 25, confidence: "ok" },
  { code: "3.1.4a", series: "June 2023", paper: "7707/1", q: "10", marks: 25, confidence: "ok" },
  { code: "3.1.4a", series: "June 2022", paper: "7707/1", q: "11", marks: 25, confidence: "ok" },
  { code: "3.1.4a", series: "June 2023", paper: "7707/1", q: "11", marks: 25, confidence: "ok" },
  { code: "3.1.4b", series: "June 2022", paper: "7707/1", q: "12", marks: 25, confidence: "ok" },
  { code: "3.1.4b", series: "June 2023", paper: "7707/1", q: "12", marks: 25, confidence: "ok" },
  { code: "3.1.4b", series: "June 2022", paper: "7707/1", q: "13", marks: 25, confidence: "ok" },
  { code: "3.1.4b", series: "June 2023", paper: "7707/1", q: "13", marks: 25, confidence: "ok" },
  { code: "3.1.4c", series: "June 2022", paper: "7707/1", q: "14", marks: 25, confidence: "ok" },
  { code: "3.1.4c", series: "June 2023", paper: "7707/1", q: "14", marks: 25, confidence: "ok" },
  { code: "3.1.4c", series: "June 2022", paper: "7707/1", q: "15", marks: 25, confidence: "ok" },
  { code: "3.1.4c", series: "June 2023", paper: "7707/1", q: "15", marks: 25, confidence: "ok" },
  { code: "3.1.4d", series: "June 2022", paper: "7707/1", q: "16", marks: 25, confidence: "ok" },
  { code: "3.1.4d", series: "June 2023", paper: "7707/1", q: "16", marks: 25, confidence: "ok" },
  { code: "3.1.4d", series: "June 2022", paper: "7707/1", q: "17", marks: 25, confidence: "ok" },
  { code: "3.1.4d", series: "June 2023", paper: "7707/1", q: "17", marks: 25, confidence: "ok" },
  { code: "3.2.2a", series: "June 2022", paper: "7707/2", q: "1", marks: 25, confidence: "ok" },
  { code: "3.2.2a", series: "June 2023", paper: "7707/2", q: "1", marks: 25, confidence: "ok" },
  { code: "3.2.2b", series: "June 2022", paper: "7707/2", q: "3", marks: 25, confidence: "ok" },
  { code: "3.2.2b", series: "June 2023", paper: "7707/2", q: "3", marks: 25, confidence: "ok" },
  { code: "3.2.2c", series: "June 2022", paper: "7707/2", q: "5", marks: 25, confidence: "ok" },
  { code: "3.2.2c", series: "June 2023", paper: "7707/2", q: "5", marks: 25, confidence: "ok" },
  { code: "3.2.2d", series: "June 2022", paper: "7707/2", q: "7", marks: 25, confidence: "ok" },
  { code: "3.2.2d", series: "June 2023", paper: "7707/2", q: "7", marks: 25, confidence: "ok" },
  { code: "3.2.3a", series: "June 2022", paper: "7707/2", q: "2", marks: 30, confidence: "ok" },
  { code: "3.2.3a", series: "June 2023", paper: "7707/2", q: "2", marks: 30, confidence: "ok" },
  { code: "3.2.3b", series: "June 2022", paper: "7707/2", q: "4", marks: 30, confidence: "ok" },
  { code: "3.2.3b", series: "June 2023", paper: "7707/2", q: "4", marks: 30, confidence: "ok" },
  { code: "3.2.3c", series: "June 2022", paper: "7707/2", q: "6", marks: 30, confidence: "ok" },
  { code: "3.2.3c", series: "June 2023", paper: "7707/2", q: "6", marks: 30, confidence: "ok" },
  { code: "3.2.3d", series: "June 2022", paper: "7707/2", q: "8", marks: 30, confidence: "ok" },
  { code: "3.2.3d", series: "June 2023", paper: "7707/2", q: "8", marks: 30, confidence: "ok" },
  { code: "3.2.4a", series: "June 2022", paper: "7707/2", q: "9", marks: 45, confidence: "ok" },
  { code: "3.2.4a", series: "June 2023", paper: "7707/2", q: "9", marks: 45, confidence: "ok" },
  { code: "3.2.4a", series: "June 2022", paper: "7707/2", q: "10", marks: 45, confidence: "ok" },
  { code: "3.2.4a", series: "June 2023", paper: "7707/2", q: "10", marks: 45, confidence: "ok" },
  { code: "3.2.4b", series: "June 2022", paper: "7707/2", q: "11", marks: 45, confidence: "ok" },
  { code: "3.2.4b", series: "June 2023", paper: "7707/2", q: "11", marks: 45, confidence: "ok" },
  { code: "3.2.4b", series: "June 2022", paper: "7707/2", q: "12", marks: 45, confidence: "ok" },
  { code: "3.2.4b", series: "June 2023", paper: "7707/2", q: "12", marks: 45, confidence: "ok" },
  { code: "3.2.4c", series: "June 2022", paper: "7707/2", q: "13", marks: 45, confidence: "ok" },
  { code: "3.2.4c", series: "June 2023", paper: "7707/2", q: "13", marks: 45, confidence: "ok" },
  { code: "3.2.4c", series: "June 2022", paper: "7707/2", q: "14", marks: 45, confidence: "ok" },
  { code: "3.2.4c", series: "June 2023", paper: "7707/2", q: "14", marks: 45, confidence: "ok" },
  { code: "3.2.4d", series: "June 2022", paper: "7707/2", q: "15", marks: 45, confidence: "ok" },
  { code: "3.2.4d", series: "June 2023", paper: "7707/2", q: "15", marks: 45, confidence: "ok" },
  { code: "3.2.4d", series: "June 2022", paper: "7707/2", q: "16", marks: 45, confidence: "ok" },
  { code: "3.2.4d", series: "June 2023", paper: "7707/2", q: "16", marks: 45, confidence: "ok" },
];

export const ALEVEL_ELL_NO_QUESTION_FOUND: string[] = ["3.1.1a", "3.1.1b", "3.1.1c", "3.1.1d", "3.1.1e", "3.3.2"];
