/**
 * AQA A-level Further Mathematics (7367) marking structure.
 *
 * Sources, all downloaded from AQA's file server and read as text:
 *  - Specification 7367, "A-level exams June 2019 onwards. Version 1.1; the cover says 20 October 2017 and the page footers say 19 October 2017".
 *  - Question papers 7367/1, /2 and the three Paper 3 booklets (Discrete, Mechanics, Statistics), June 2022 and June 2023.
 *    Mark schemes read "Version: 1.0 Final"; the June 2022 Paper 2 mark scheme was not at the usual AQA address.
 *
 * Topics are the specification's sections, with AQA's codes (A to J for the compulsory content; MA to ME, SA to SH and
 * DA to DG for the optional applications) and AQA's headings. The finer content items inside each section (77 in the compulsory
 * content alone) are not mapped one by one. Which question tests which section is our judgement; `confidence: "check"` marks
 * looser matches. `marks` is the total printed on the question paper for the part cited.
 */

export interface ALevelFurtherMathsTopic {
  code: string;
  /** Specification section number, e.g. "3.2.3". */
  specSection: string;
  group: string;
  title: string;
}

export interface ALevelFurtherMathsCoverage {
  code: string;
  series: "June 2022" | "June 2023";
  /** "7367/1" and "7367/2" are the pure papers; "7367/3D", "7367/3M" and "7367/3S" are the Paper 3 booklets. */
  paper: string;
  q: string;
  marks: number;
  confidence: "ok" | "check";
}

export const ALEVEL_FM_MARK_TYPES = [
  { code: "M", meaning: "Method mark" },
  { code: "A", meaning: "Accuracy mark, only awarded if the matching M mark is earned" },
  { code: "B", meaning: "Independent mark for method and accuracy" },
  { code: "R", meaning: "Reasoning mark" },
  { code: "E", meaning: "Explanation mark" },
  { code: "ft", meaning: "Follow through from an earlier wrong answer" },
] as const;

/** Paper 3 is two 50 mark booklets chosen from Discrete, Mechanics and Statistics. */
export const ALEVEL_FM_PAPERS = [
  { code: "7367/1", title: "Compulsory content A to J, assumed AS Maths", minutes: 120, marks: 100, weighting: "33 1/3% of the A level" },
  { code: "7367/2", title: "Compulsory content A to J, assumed AS Maths", minutes: 120, marks: 100, weighting: "33 1/3% of the A level" },
  { code: "7367/3", title: "Two booklets from Discrete, Mechanics, Statistics (50 marks each)", minutes: 120, marks: 100, weighting: "33 1/3% of the A level" },
] as const;

/** Overall approximate weightings, with the component split: Papers 1 and 2 are 55/25/20, Paper 3 is 40/25/35. */
export const ALEVEL_FM_AO_WEIGHTS = { AO1: 50, AO2: 25, AO3: 25 } as const;

export const ALEVEL_FM_TOPICS: ALevelFurtherMathsTopic[] = [
  { code: "A", specSection: "3.2.1", group: "Compulsory content", title: "Proof" },
  { code: "B", specSection: "3.2.2", group: "Compulsory content", title: "Complex numbers" },
  { code: "C", specSection: "3.2.3", group: "Compulsory content", title: "Matrices" },
  { code: "D", specSection: "3.2.4", group: "Compulsory content", title: "Further algebra and functions" },
  { code: "E", specSection: "3.2.5", group: "Compulsory content", title: "Further calculus" },
  { code: "F", specSection: "3.2.6", group: "Compulsory content", title: "Further vectors" },
  { code: "G", specSection: "3.2.7", group: "Compulsory content", title: "Polar coordinates" },
  { code: "H", specSection: "3.2.8", group: "Compulsory content", title: "Hyperbolic functions" },
  { code: "I", specSection: "3.2.9", group: "Compulsory content", title: "Differential equations" },
  { code: "J", specSection: "3.2.10", group: "Compulsory content", title: "Numerical methods" },
  { code: "MA", specSection: "3.3.1", group: "Optional application 1: mechanics", title: "Dimensional analysis" },
  { code: "MB", specSection: "3.3.2", group: "Optional application 1: mechanics", title: "Momentum and collisions" },
  { code: "MC", specSection: "3.3.3", group: "Optional application 1: mechanics", title: "Work, energy and power" },
  { code: "MD", specSection: "3.3.4", group: "Optional application 1: mechanics", title: "Circular motion" },
  { code: "ME", specSection: "3.3.5", group: "Optional application 1: mechanics", title: "Centres of mass and moments" },
  { code: "SA", specSection: "3.4.1", group: "Optional application 2: statistics", title: "Discrete random variables and expectation" },
  { code: "SB", specSection: "3.4.2", group: "Optional application 2: statistics", title: "Poisson distribution" },
  { code: "SC", specSection: "3.4.3", group: "Optional application 2: statistics", title: "Type I and Type II errors" },
  { code: "SD", specSection: "3.4.4", group: "Optional application 2: statistics", title: "Continuous random variables" },
  { code: "SE", specSection: "3.4.5", group: "Optional application 2: statistics", title: "Chi squared tests for association" },
  { code: "SF", specSection: "3.4.6", group: "Optional application 2: statistics", title: "Exponential distribution" },
  { code: "SG", specSection: "3.4.7", group: "Optional application 2: statistics", title: "Inference, one sample t-distribution" },
  { code: "SH", specSection: "3.4.8", group: "Optional application 2: statistics", title: "Confidence intervals" },
  { code: "DA", specSection: "3.5.1", group: "Optional application 3: discrete mathematics", title: "Graphs" },
  { code: "DB", specSection: "3.5.2", group: "Optional application 3: discrete mathematics", title: "Networks" },
  { code: "DC", specSection: "3.5.3", group: "Optional application 3: discrete mathematics", title: "Network flows" },
  { code: "DD", specSection: "3.5.4", group: "Optional application 3: discrete mathematics", title: "Linear programming" },
  { code: "DE", specSection: "3.5.5", group: "Optional application 3: discrete mathematics", title: "Critical path analysis" },
  { code: "DF", specSection: "3.5.6", group: "Optional application 3: discrete mathematics", title: "Game theory for zero-sum games" },
  { code: "DG", specSection: "3.5.7", group: "Optional application 3: discrete mathematics", title: "Binary operations" },
];

export const ALEVEL_FM_COVERAGE: ALevelFurtherMathsCoverage[] = [
  { code: "A", series: "June 2022", paper: "7367/2", q: "5", marks: 4, confidence: "ok" },
  { code: "A", series: "June 2023", paper: "7367/2", q: "12", marks: 6, confidence: "ok" },
  { code: "B", series: "June 2022", paper: "7367/1", q: "8c", marks: 5, confidence: "ok" },
  { code: "B", series: "June 2022", paper: "7367/1", q: "12c", marks: 5, confidence: "ok" },
  { code: "B", series: "June 2023", paper: "7367/2", q: "15a", marks: 2, confidence: "ok" },
  { code: "B", series: "June 2023", paper: "7367/1", q: "2", marks: 1, confidence: "ok" },
  { code: "C", series: "June 2022", paper: "7367/1", q: "7a", marks: 6, confidence: "ok" },
  { code: "C", series: "June 2022", paper: "7367/2", q: "11a", marks: 5, confidence: "ok" },
  { code: "C", series: "June 2023", paper: "7367/1", q: "6c", marks: 3, confidence: "ok" },
  { code: "C", series: "June 2023", paper: "7367/1", q: "10b", marks: 9, confidence: "ok" },
  { code: "D", series: "June 2022", paper: "7367/1", q: "5a", marks: 5, confidence: "ok" },
  { code: "D", series: "June 2023", paper: "7367/1", q: "5b", marks: 4, confidence: "ok" },
  { code: "D", series: "June 2022", paper: "7367/2", q: "8a", marks: 6, confidence: "ok" },
  { code: "D", series: "June 2023", paper: "7367/1", q: "13", marks: 5, confidence: "ok" },
  { code: "D", series: "June 2023", paper: "7367/2", q: "13c", marks: 5, confidence: "ok" },
  { code: "E", series: "June 2022", paper: "7367/2", q: "12b", marks: 7, confidence: "ok" },
  { code: "E", series: "June 2022", paper: "7367/2", q: "2", marks: 1, confidence: "ok" },
  { code: "F", series: "June 2022", paper: "7367/1", q: "10a", marks: 6, confidence: "ok" },
  { code: "F", series: "June 2023", paper: "7367/1", q: "9b", marks: 2, confidence: "ok" },
  { code: "F", series: "June 2023", paper: "7367/2", q: "11b", marks: 7, confidence: "ok" },
  { code: "G", series: "June 2022", paper: "7367/1", q: "9c", marks: 2, confidence: "ok" },
  { code: "G", series: "June 2023", paper: "7367/1", q: "14a", marks: 2, confidence: "ok" },
  { code: "H", series: "June 2022", paper: "7367/1", q: "6a", marks: 4, confidence: "ok" },
  { code: "H", series: "June 2023", paper: "7367/1", q: "12a", marks: 2, confidence: "ok" },
  { code: "H", series: "June 2022", paper: "7367/2", q: "4", marks: 1, confidence: "ok" },
  { code: "I", series: "June 2022", paper: "7367/2", q: "9b", marks: 9, confidence: "ok" },
  { code: "I", series: "June 2022", paper: "7367/1", q: "11b", marks: 14, confidence: "ok" },
  { code: "I", series: "June 2023", paper: "7367/1", q: "15", marks: 9, confidence: "ok" },
  { code: "J", series: "June 2023", paper: "7367/1", q: "8b", marks: 3, confidence: "ok" },
  { code: "J", series: "June 2022", paper: "7367/2", q: "9a", marks: 4, confidence: "ok" },
  { code: "MA", series: "June 2022", paper: "7367/3M", q: "4b", marks: 4, confidence: "ok" },
  { code: "MA", series: "June 2023", paper: "7367/3M", q: "1", marks: 1, confidence: "ok" },
  { code: "MB", series: "June 2023", paper: "7367/3M", q: "7a", marks: 8, confidence: "ok" },
  { code: "MB", series: "June 2022", paper: "7367/3M", q: "1", marks: 1, confidence: "ok" },
  { code: "MB", series: "June 2022", paper: "7367/3M", q: "7a", marks: 2, confidence: "check" },
  { code: "MC", series: "June 2022", paper: "7367/3M", q: "8a", marks: 4, confidence: "ok" },
  { code: "MC", series: "June 2022", paper: "7367/3M", q: "5a", marks: 2, confidence: "ok" },
  { code: "MC", series: "June 2023", paper: "7367/3M", q: "6a", marks: 3, confidence: "check" },
  { code: "MD", series: "June 2023", paper: "7367/3M", q: "4", marks: 2, confidence: "ok" },
  { code: "MD", series: "June 2023", paper: "7367/3M", q: "6c", marks: 6, confidence: "ok" },
  { code: "ME", series: "June 2022", paper: "7367/3M", q: "9a", marks: 2, confidence: "ok" },
  { code: "ME", series: "June 2023", paper: "7367/3M", q: "5a", marks: 5, confidence: "ok" },
  { code: "ME", series: "June 2022", paper: "7367/3M", q: "3", marks: 1, confidence: "ok" },
  { code: "SA", series: "June 2022", paper: "7367/3S", q: "1", marks: 1, confidence: "ok" },
  { code: "SA", series: "June 2023", paper: "7367/3S", q: "1", marks: 1, confidence: "ok" },
  { code: "SB", series: "June 2022", paper: "7367/3S", q: "4a", marks: 3, confidence: "ok" },
  { code: "SB", series: "June 2023", paper: "7367/3S", q: "7d", marks: 2, confidence: "ok" },
  { code: "SC", series: "June 2022", paper: "7367/3S", q: "7b", marks: 1, confidence: "ok" },
  { code: "SC", series: "June 2023", paper: "7367/3S", q: "7b", marks: 1, confidence: "ok" },
  { code: "SD", series: "June 2022", paper: "7367/3S", q: "8c", marks: 6, confidence: "ok" },
  { code: "SD", series: "June 2023", paper: "7367/3S", q: "8b", marks: 3, confidence: "ok" },
  { code: "SE", series: "June 2023", paper: "7367/3S", q: "5b", marks: 5, confidence: "ok" },
  { code: "SE", series: "June 2023", paper: "7367/3S", q: "5a", marks: 2, confidence: "ok" },
  { code: "SF", series: "June 2022", paper: "7367/3S", q: "3a", marks: 3, confidence: "ok" },
  { code: "SF", series: "June 2022", paper: "7367/3S", q: "3b", marks: 2, confidence: "ok" },
  { code: "SG", series: "June 2023", paper: "7367/3S", q: "4", marks: 5, confidence: "check" },
  { code: "SH", series: "June 2022", paper: "7367/3S", q: "5a", marks: 4, confidence: "ok" },
  { code: "DA", series: "June 2022", paper: "7367/3D", q: "1", marks: 1, confidence: "ok" },
  { code: "DA", series: "June 2023", paper: "7367/3D", q: "8c", marks: 3, confidence: "ok" },
  { code: "DB", series: "June 2023", paper: "7367/3D", q: "6a", marks: 6, confidence: "ok" },
  { code: "DB", series: "June 2022", paper: "7367/3D", q: "5a", marks: 4, confidence: "check" },
  { code: "DC", series: "June 2022", paper: "7367/3D", q: "8b", marks: 4, confidence: "ok" },
  { code: "DC", series: "June 2023", paper: "7367/3D", q: "4c", marks: 2, confidence: "ok" },
  { code: "DD", series: "June 2023", paper: "7367/3D", q: "5b", marks: 4, confidence: "ok" },
  { code: "DD", series: "June 2023", paper: "7367/3D", q: "3", marks: 1, confidence: "ok" },
  { code: "DE", series: "June 2022", paper: "7367/3D", q: "6a", marks: 4, confidence: "ok" },
  { code: "DE", series: "June 2023", paper: "7367/3D", q: "7a", marks: 3, confidence: "ok" },
  { code: "DF", series: "June 2022", paper: "7367/3D", q: "4b", marks: 3, confidence: "ok" },
  { code: "DF", series: "June 2022", paper: "7367/3D", q: "10b", marks: 3, confidence: "ok" },
  { code: "DG", series: "June 2022", paper: "7367/3D", q: "7a", marks: 2, confidence: "ok" },
  { code: "DG", series: "June 2023", paper: "7367/3D", q: "9a", marks: 3, confidence: "ok" },
];

export const ALEVEL_FM_NO_QUESTION_FOUND: string[] = [];
