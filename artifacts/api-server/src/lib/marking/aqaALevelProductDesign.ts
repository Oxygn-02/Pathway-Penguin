/**
 * AQA A-level Design and Technology: Product Design (7552) marking structure.
 *
 * Sources, all downloaded from AQA's file server and read as text:
 *  - Specification 7552, "A-level exams June 2019 onwards. Version 1.4 27 June 2022".
 *  - Question papers and mark schemes 7552/1 (technical principles) and 7552/2 (designing and making principles), June 2022 and June 2023,
 *    mark schemes "Version: 1.0 Final".
 *
 * Topics are the specification's numbered content sections 3.1.1 to 3.1.14 and 3.2.1 to 3.2.10 with AQA's headings. Which question tests
 * which section is our judgement; `confidence: "check"` marks looser matches. `marks` is the total printed on the paper for that
 * numbered question, including questions whose parts are "[2 x 2 marks]". The non-exam assessment (100 marks, 50%) has no past papers.
 */

export interface ALevelProductDesignTopic {
  code: string;
  group: string;
  title: string;
}

export interface ALevelProductDesignCoverage {
  code: string;
  series: "June 2022" | "June 2023";
  paper: "7552/1" | "7552/2";
  q: string;
  marks: number;
  confidence: "ok" | "check";
}

export const ALEVEL_PD_PAPERS = [
  { code: "7552/1", title: "Technical principles: short answer and extended response", minutes: 150, marks: 120, weighting: "30% of the A level" },
  { code: "7552/2", title: "Designing and making principles: A product analysis (30), B commercial manufacture (50)", minutes: 90, marks: 80, weighting: "20% of the A level" },
  { code: "NEA", title: "Substantial design and make project", minutes: 0, marks: 100, weighting: "50% of the A level" },
] as const;

/** Overall weightings from section 4.2.1 of the specification (approx %): AO1 15, AO2 25, AO3 25, AO4 35. The written papers carry only AO3 and AO4. */
export const ALEVEL_PD_AO_WEIGHTS = { AO1: 15, AO2: 25, AO3: 25, AO4: 35 } as const;

/** Mark structure of the written papers, read from the June 2022 mark schemes. */
export const ALEVEL_PD_QUESTION_TYPES = [
  { marks: "1 to 4", method: "point marked: one mark per relevant point; the indicative content is not exhaustive and other valid answers are credited" },
  { marks: 6, method: "levels of response: 5-6, 3-4, 1-2" },
  { marks: 9, method: "levels of response: 7-9, 4-6, 1-3" },
  { marks: 12, method: "levels of response: 9-12, 5-8, 1-4" },
] as const;

export const ALEVEL_PD_TOPICS: ALevelProductDesignTopic[] = [
  { code: "3.1.1", group: "Technical principles", title: "Materials and their applications" },
  { code: "3.1.2", group: "Technical principles", title: "Performance characteristics of materials" },
  { code: "3.1.3", group: "Technical principles", title: "Enhancement of materials" },
  { code: "3.1.4", group: "Technical principles", title: "Forming, redistribution and addition processes" },
  { code: "3.1.5", group: "Technical principles", title: "The use of finishes" },
  { code: "3.1.6", group: "Technical principles", title: "Modern industrial and commercial practice" },
  { code: "3.1.7", group: "Technical principles", title: "Digital design and manufacture" },
  { code: "3.1.8", group: "Technical principles", title: "The requirements for product design and development" },
  { code: "3.1.9", group: "Technical principles", title: "Health and safety" },
  { code: "3.1.10", group: "Technical principles", title: "Protecting designs and intellectual property" },
  { code: "3.1.11", group: "Technical principles", title: "Design for manufacturing, maintenance, repair and disposal" },
  { code: "3.1.12", group: "Technical principles", title: "Feasibility studies" },
  { code: "3.1.13", group: "Technical principles", title: "Enterprise and marketing in the development of products" },
  { code: "3.1.14", group: "Technical principles", title: "Design communication" },
  { code: "3.2.1", group: "Designing and making principles", title: "Design methods and processes" },
  { code: "3.2.2", group: "Designing and making principles", title: "Design theory" },
  { code: "3.2.3", group: "Designing and making principles", title: "How technology and cultural changes can impact on the work of designers" },
  { code: "3.2.4", group: "Designing and making principles", title: "Design processes" },
  { code: "3.2.5", group: "Designing and making principles", title: "Critical analysis and evaluation" },
  { code: "3.2.6", group: "Designing and making principles", title: "Selecting appropriate tools, equipment and processes" },
  { code: "3.2.7", group: "Designing and making principles", title: "Accuracy in design and manufacture" },
  { code: "3.2.8", group: "Designing and making principles", title: "Responsible design" },
  { code: "3.2.9", group: "Designing and making principles", title: "Design for manufacture and project management" },
  { code: "3.2.10", group: "Designing and making principles", title: "National and international standards in product design" },
];

export const ALEVEL_PD_COVERAGE: ALevelProductDesignCoverage[] = [
  { code: "3.1.2", series: "June 2022", paper: "7552/1", q: "1", marks: 3, confidence: "ok" },
  { code: "3.1.1", series: "June 2022", paper: "7552/1", q: "2", marks: 4, confidence: "check" },
  { code: "3.1.1", series: "June 2022", paper: "7552/1", q: "3", marks: 6, confidence: "ok" },
  { code: "3.1.5", series: "June 2022", paper: "7552/1", q: "3", marks: 6, confidence: "check" },
  { code: "3.1.7", series: "June 2022", paper: "7552/1", q: "4", marks: 9, confidence: "ok" },
  { code: "3.1.7", series: "June 2022", paper: "7552/1", q: "5", marks: 3, confidence: "check" },
  { code: "3.1.8", series: "June 2022", paper: "7552/1", q: "6", marks: 7, confidence: "check" },
  { code: "3.1.5", series: "June 2022", paper: "7552/1", q: "7", marks: 6, confidence: "ok" },
  { code: "3.1.1", series: "June 2022", paper: "7552/1", q: "8", marks: 3, confidence: "ok" },
  { code: "3.1.1", series: "June 2022", paper: "7552/1", q: "9", marks: 3, confidence: "ok" },
  { code: "3.1.2", series: "June 2022", paper: "7552/1", q: "10", marks: 6, confidence: "ok" },
  { code: "3.1.4", series: "June 2022", paper: "7552/1", q: "11", marks: 6, confidence: "ok" },
  { code: "3.1.3", series: "June 2022", paper: "7552/1", q: "12", marks: 4, confidence: "check" },
  { code: "3.1.5", series: "June 2022", paper: "7552/1", q: "13", marks: 2, confidence: "ok" },
  { code: "3.1.4", series: "June 2022", paper: "7552/1", q: "14", marks: 6, confidence: "ok" },
  { code: "3.1.6", series: "June 2022", paper: "7552/1", q: "15", marks: 6, confidence: "ok" },
  { code: "3.1.7", series: "June 2022", paper: "7552/1", q: "16", marks: 6, confidence: "check" },
  { code: "3.1.4", series: "June 2022", paper: "7552/1", q: "17", marks: 12, confidence: "ok" },
  { code: "3.1.2", series: "June 2022", paper: "7552/1", q: "18", marks: 6, confidence: "ok" },
  { code: "3.2.7", series: "June 2022", paper: "7552/1", q: "19", marks: 4, confidence: "ok" },
  { code: "3.1.7", series: "June 2022", paper: "7552/1", q: "20", marks: 6, confidence: "ok" },
  { code: "3.1.2", series: "June 2022", paper: "7552/1", q: "21", marks: 6, confidence: "ok" },
  { code: "3.1.13", series: "June 2022", paper: "7552/1", q: "22", marks: 6, confidence: "ok" },
  { code: "3.1.4", series: "June 2023", paper: "7552/1", q: "1", marks: 2, confidence: "check" },
  { code: "3.1.2", series: "June 2023", paper: "7552/1", q: "2", marks: 3, confidence: "ok" },
  { code: "3.1.14", series: "June 2023", paper: "7552/1", q: "3", marks: 4, confidence: "check" },
  { code: "3.1.2", series: "June 2023", paper: "7552/1", q: "4", marks: 6, confidence: "ok" },
  { code: "3.1.2", series: "June 2023", paper: "7552/1", q: "5", marks: 6, confidence: "ok" },
  { code: "3.1.4", series: "June 2023", paper: "7552/1", q: "7", marks: 6, confidence: "ok" },
  { code: "3.1.7", series: "June 2023", paper: "7552/1", q: "8", marks: 6, confidence: "ok" },
  { code: "3.1.11", series: "June 2023", paper: "7552/1", q: "9", marks: 9, confidence: "ok" },
  { code: "3.1.2", series: "June 2023", paper: "7552/1", q: "10", marks: 6, confidence: "ok" },
  { code: "3.1.2", series: "June 2023", paper: "7552/1", q: "11", marks: 3, confidence: "check" },
  { code: "3.2.5", series: "June 2023", paper: "7552/1", q: "12", marks: 6, confidence: "ok" },
  { code: "3.1.5", series: "June 2023", paper: "7552/1", q: "13", marks: 6, confidence: "ok" },
  { code: "3.1.5", series: "June 2023", paper: "7552/1", q: "14", marks: 6, confidence: "ok" },
  { code: "3.1.3", series: "June 2023", paper: "7552/1", q: "15", marks: 2, confidence: "ok" },
  { code: "3.1.1", series: "June 2023", paper: "7552/1", q: "16", marks: 3, confidence: "ok" },
  { code: "3.1.5", series: "June 2023", paper: "7552/1", q: "17", marks: 3, confidence: "ok" },
  { code: "3.1.10", series: "June 2023", paper: "7552/1", q: "18", marks: 9, confidence: "ok" },
  { code: "3.1.2", series: "June 2023", paper: "7552/1", q: "19", marks: 7, confidence: "check" },
  { code: "3.1.6", series: "June 2023", paper: "7552/1", q: "20", marks: 6, confidence: "ok" },
  { code: "3.2.10", series: "June 2023", paper: "7552/1", q: "21", marks: 6, confidence: "check" },
  { code: "3.1.1", series: "June 2023", paper: "7552/1", q: "22", marks: 3, confidence: "ok" },
  { code: "3.1.4", series: "June 2023", paper: "7552/1", q: "23", marks: 6, confidence: "ok" },
  { code: "3.2.5", series: "June 2022", paper: "7552/2", q: "1", marks: 12, confidence: "ok" },
  { code: "3.2.4", series: "June 2022", paper: "7552/2", q: "2", marks: 4, confidence: "check" },
  { code: "3.1.1", series: "June 2022", paper: "7552/2", q: "3", marks: 4, confidence: "check" },
  { code: "3.2.2", series: "June 2022", paper: "7552/2", q: "4", marks: 6, confidence: "ok" },
  { code: "3.2.10", series: "June 2022", paper: "7552/2", q: "5", marks: 4, confidence: "ok" },
  { code: "3.2.3", series: "June 2022", paper: "7552/2", q: "6", marks: 4, confidence: "check" },
  { code: "3.2.8", series: "June 2022", paper: "7552/2", q: "7", marks: 6, confidence: "ok" },
  { code: "3.2.7", series: "June 2022", paper: "7552/2", q: "8", marks: 4, confidence: "check" },
  { code: "3.2.9", series: "June 2022", paper: "7552/2", q: "9", marks: 6, confidence: "check" },
  { code: "3.2.2", series: "June 2022", paper: "7552/2", q: "10", marks: 4, confidence: "ok" },
  { code: "3.2.3", series: "June 2022", paper: "7552/2", q: "11", marks: 4, confidence: "ok" },
  { code: "3.2.3", series: "June 2022", paper: "7552/2", q: "12", marks: 2, confidence: "ok" },
  { code: "3.1.14", series: "June 2022", paper: "7552/2", q: "13", marks: 2, confidence: "ok" },
  { code: "3.2.1", series: "June 2022", paper: "7552/2", q: "14", marks: 2, confidence: "check" },
  { code: "3.2.5", series: "June 2022", paper: "7552/2", q: "15", marks: 6, confidence: "ok" },
  { code: "3.2.8", series: "June 2022", paper: "7552/2", q: "16", marks: 6, confidence: "check" },
  { code: "3.2.10", series: "June 2022", paper: "7552/2", q: "17", marks: 4, confidence: "ok" },
  { code: "3.2.5", series: "June 2023", paper: "7552/2", q: "1", marks: 6, confidence: "ok" },
  { code: "3.1.8", series: "June 2023", paper: "7552/2", q: "2", marks: 4, confidence: "check" },
  { code: "3.2.9", series: "June 2023", paper: "7552/2", q: "3", marks: 4, confidence: "ok" },
  { code: "3.2.7", series: "June 2023", paper: "7552/2", q: "4", marks: 4, confidence: "ok" },
  { code: "3.1.7", series: "June 2023", paper: "7552/2", q: "5", marks: 6, confidence: "ok" },
  { code: "3.2.5", series: "June 2023", paper: "7552/2", q: "6", marks: 6, confidence: "check" },
  { code: "3.1.13", series: "June 2023", paper: "7552/2", q: "7", marks: 4, confidence: "ok" },
  { code: "3.2.1", series: "June 2023", paper: "7552/2", q: "7", marks: 4, confidence: "check" },
  { code: "3.1.9", series: "June 2023", paper: "7552/2", q: "8", marks: 4, confidence: "ok" },
  { code: "3.2.7", series: "June 2023", paper: "7552/2", q: "9", marks: 6, confidence: "ok" },
  { code: "3.1.1", series: "June 2023", paper: "7552/2", q: "10", marks: 3, confidence: "check" },
  { code: "3.2.8", series: "June 2023", paper: "7552/2", q: "11", marks: 12, confidence: "ok" },
  { code: "3.1.8", series: "June 2023", paper: "7552/2", q: "12", marks: 3, confidence: "ok" },
  { code: "3.1.7", series: "June 2023", paper: "7552/2", q: "13", marks: 4, confidence: "check" },
  { code: "3.2.9", series: "June 2023", paper: "7552/2", q: "14", marks: 2, confidence: "ok" },
  { code: "3.2.9", series: "June 2023", paper: "7552/2", q: "15", marks: 6, confidence: "ok" },
  { code: "3.1.8", series: "June 2023", paper: "7552/2", q: "16", marks: 3, confidence: "ok" },
  { code: "3.2.2", series: "June 2023", paper: "7552/2", q: "17", marks: 3, confidence: "ok" },
];

export const ALEVEL_PD_NO_QUESTION_FOUND: string[] = ["3.1.12", "3.2.6"];
