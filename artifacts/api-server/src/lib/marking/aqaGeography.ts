/**
 * AQA GCSE Geography (8035) marking structure.
 *
 * Sources, all downloaded from AQA's file server and read as text:
 *  - Specification 8035, "GCSE exams June 2018 onwards. Version 1.1 12 September 2023".
 *  - Question papers and mark schemes 8035/1, 8035/2 and 8035/3, June 2022 and June 2023.
 *    Mark schemes are "Version: 1.0 Final" (June 2023 Paper 1 confirmed; the others read the same way).
 *
 * Topic titles are AQA's own section headings. Which question tests which topic is our judgement;
 * `confidence: "check"` marks looser matches. The spec's finer bullet points are not mapped one by one.
 * `marks` is the content mark printed for the question. The 9 mark questions carry 3 further SPaG marks
 * (spelling, punctuation, grammar and specialist terms) on top of this, on the questions the paper indicates.
 */

export interface GeographyTopic {
  code: string;
  section: string;
  title: string;
}

export interface GeographyCoverage {
  code: string;
  series: "June 2022" | "June 2023";
  /** "80351" is Paper 1, "80352" Paper 2, "80353" Paper 3. */
  paper: string;
  q: string;
  marks: number;
  confidence: "ok" | "check";
}

export const GEOGRAPHY_TOPICS: GeographyTopic[] = [
  { code: "3.1.1.1", section: "Living with the physical environment: natural hazards", title: "Natural hazards" },
  { code: "3.1.1.2", section: "Living with the physical environment: natural hazards", title: "Tectonic hazards" },
  { code: "3.1.1.3", section: "Living with the physical environment: natural hazards", title: "Weather hazards" },
  { code: "3.1.1.4", section: "Living with the physical environment: natural hazards", title: "Climate change" },
  { code: "3.1.2.1", section: "Living with the physical environment: the living world", title: "Ecosystems" },
  { code: "3.1.2.2", section: "Living with the physical environment: the living world", title: "Tropical rainforests" },
  { code: "3.1.2.3", section: "Living with the physical environment: the living world", title: "Hot deserts" },
  { code: "3.1.2.4", section: "Living with the physical environment: the living world", title: "Cold environments" },
  { code: "3.1.3.1", section: "Living with the physical environment: physical landscapes in the UK", title: "UK physical landscapes" },
  { code: "3.1.3.2", section: "Living with the physical environment: physical landscapes in the UK", title: "Coastal landscapes in the UK" },
  { code: "3.1.3.3", section: "Living with the physical environment: physical landscapes in the UK", title: "River landscapes in the UK" },
  { code: "3.1.3.4", section: "Living with the physical environment: physical landscapes in the UK", title: "Glacial landscapes in the UK" },
  { code: "3.2.1", section: "Challenges in the human environment: urban issues", title: "Urban issues and challenges" },
  { code: "3.2.2", section: "Challenges in the human environment: changing economic world", title: "The changing economic world" },
  { code: "3.2.3.1", section: "Challenges in the human environment: resource management", title: "Resource management" },
  { code: "3.2.3.2", section: "Challenges in the human environment: resource management", title: "Food" },
  { code: "3.2.3.3", section: "Challenges in the human environment: resource management", title: "Water" },
  { code: "3.2.3.4", section: "Challenges in the human environment: resource management", title: "Energy" },
  { code: "3.3.1", section: "Geographical applications", title: "Issue evaluation" },
  { code: "3.3.2", section: "Geographical applications", title: "Fieldwork" },
  { code: "3.4.1", section: "Geographical skills", title: "Cartographic skills" },
  { code: "3.4.2", section: "Geographical skills", title: "Graphical skills" },
  { code: "3.4.3", section: "Geographical skills", title: "Numerical skills" },
  { code: "3.4.4", section: "Geographical skills", title: "Statistical skills" },
  { code: "3.4.5", section: "Geographical skills", title: "Use of qualitative and quantitative data" },
  { code: "3.4.6", section: "Geographical skills", title: "Formulate enquiry and argument" },
  { code: "3.4.7", section: "Geographical skills", title: "Literacy" },
];

export const GEOGRAPHY_PAPERS = [
  { code: "8035/1", title: "Living with the physical environment", minutes: 90, marks: 88, spagMarks: 3, weighting: "35% of the GCSE" },
  { code: "8035/2", title: "Challenges in the human environment", minutes: 90, marks: 88, spagMarks: 3, weighting: "35% of the GCSE" },
  { code: "8035/3", title: "Geographical applications", minutes: 90, marks: 76, spagMarks: 6, weighting: "30% of the GCSE" },
] as const;

/** Level bands used for the extended answers, read from the June 2023 Paper 1 mark scheme. */
export const GEOGRAPHY_LEVEL_BANDS = {
  4: [{ level: 2, label: "Clear", min: 3, max: 4 }, { level: 1, label: "Basic", min: 1, max: 2 }],
  6: [{ level: 3, label: "Detailed", min: 5, max: 6 }, { level: 2, label: "Clear", min: 3, max: 4 }, { level: 1, label: "Basic", min: 1, max: 2 }],
  9: [{ level: 3, label: "Detailed", min: 7, max: 9 }, { level: 2, label: "Clear", min: 4, max: 6 }, { level: 1, label: "Basic", min: 1, max: 3 }],
} as const;

/** SPaG: three marks on the indicated 9 mark questions (high 3, intermediate 2, threshold 1). */
export const GEOGRAPHY_SPAG_MAX = 3;

export const GEOGRAPHY_COVERAGE: GeographyCoverage[] = [
  { code: "3.1.1.1", series: "June 2023", paper: "80351", q: "1.10", marks: 6, confidence: "check" },
  { code: "3.1.1.2", series: "June 2022", paper: "80351", q: "1.9", marks: 4, confidence: "ok" },
  { code: "3.1.1.2", series: "June 2023", paper: "80351", q: "1.11", marks: 9, confidence: "ok" },
  { code: "3.1.1.3", series: "June 2022", paper: "80351", q: "1.8", marks: 6, confidence: "ok" },
  { code: "3.1.1.3", series: "June 2023", paper: "80351", q: "1.5", marks: 3, confidence: "ok" },
  { code: "3.1.1.4", series: "June 2023", paper: "80351", q: "1.4", marks: 4, confidence: "ok" },
  { code: "3.1.2.1", series: "June 2023", paper: "80351", q: "2.4", marks: 2, confidence: "ok" },
  { code: "3.1.2.2", series: "June 2022", paper: "80351", q: "2.4", marks: 6, confidence: "ok" },
  { code: "3.1.2.2", series: "June 2023", paper: "80351", q: "2.9", marks: 6, confidence: "ok" },
  { code: "3.1.2.3", series: "June 2022", paper: "80351", q: "2.9", marks: 9, confidence: "ok" },
  { code: "3.1.2.3", series: "June 2023", paper: "80351", q: "2.10", marks: 9, confidence: "ok" },
  { code: "3.1.2.4", series: "June 2022", paper: "80351", q: "2.9", marks: 9, confidence: "ok" },
  { code: "3.1.2.4", series: "June 2023", paper: "80351", q: "2.10", marks: 9, confidence: "ok" },
  { code: "3.1.3.1", series: "June 2022", paper: "80351", q: "5.2", marks: 1, confidence: "check" },
  { code: "3.1.3.2", series: "June 2022", paper: "80351", q: "3.6", marks: 4, confidence: "ok" },
  { code: "3.1.3.2", series: "June 2023", paper: "80351", q: "3.5", marks: 4, confidence: "ok" },
  { code: "3.1.3.3", series: "June 2022", paper: "80351", q: "4.6", marks: 4, confidence: "ok" },
  { code: "3.1.3.3", series: "June 2023", paper: "80351", q: "4.5", marks: 4, confidence: "ok" },
  { code: "3.1.3.4", series: "June 2022", paper: "80351", q: "5.6", marks: 4, confidence: "ok" },
  { code: "3.1.3.4", series: "June 2023", paper: "80351", q: "5.5", marks: 4, confidence: "ok" },
  { code: "3.2.1", series: "June 2022", paper: "80352", q: "1.10", marks: 9, confidence: "ok" },
  { code: "3.2.1", series: "June 2023", paper: "80352", q: "1.11", marks: 9, confidence: "ok" },
  { code: "3.2.2", series: "June 2022", paper: "80352", q: "2.11", marks: 6, confidence: "ok" },
  { code: "3.2.2", series: "June 2023", paper: "80352", q: "2.10", marks: 9, confidence: "ok" },
  { code: "3.2.3.1", series: "June 2023", paper: "80352", q: "3.2", marks: 2, confidence: "check" },
  { code: "3.2.3.2", series: "June 2022", paper: "80352", q: "4.7", marks: 6, confidence: "ok" },
  { code: "3.2.3.2", series: "June 2023", paper: "80352", q: "4.5", marks: 6, confidence: "ok" },
  { code: "3.2.3.3", series: "June 2022", paper: "80352", q: "5.7", marks: 6, confidence: "ok" },
  { code: "3.2.3.3", series: "June 2023", paper: "80352", q: "5.5", marks: 6, confidence: "ok" },
  { code: "3.2.3.4", series: "June 2022", paper: "80352", q: "6.7", marks: 6, confidence: "ok" },
  { code: "3.2.3.4", series: "June 2023", paper: "80352", q: "6.5", marks: 6, confidence: "ok" },
  { code: "3.3.1", series: "June 2022", paper: "80353", q: "3", marks: 9, confidence: "ok" },
  { code: "3.3.1", series: "June 2023", paper: "80353", q: "3", marks: 9, confidence: "ok" },
  { code: "3.3.2", series: "June 2023", paper: "80353", q: "5.4", marks: 9, confidence: "ok" },
  { code: "3.3.2", series: "June 2023", paper: "80353", q: "5.3", marks: 6, confidence: "ok" },
  { code: "3.4.1", series: "June 2023", paper: "80351", q: "3.3", marks: 1, confidence: "ok" },
  { code: "3.4.1", series: "June 2023", paper: "80352", q: "2.1", marks: 1, confidence: "ok" },
  { code: "3.4.2", series: "June 2022", paper: "80352", q: "4.1", marks: 1, confidence: "ok" },
  { code: "3.4.2", series: "June 2023", paper: "80353", q: "4.4", marks: 1, confidence: "ok" },
  { code: "3.4.3", series: "June 2022", paper: "80352", q: "2.7", marks: 1, confidence: "ok" },
  { code: "3.4.4", series: "June 2023", paper: "80351", q: "1.8", marks: 1, confidence: "ok" },
  { code: "3.4.4", series: "June 2023", paper: "80352", q: "2.8", marks: 2, confidence: "ok" },
  { code: "3.4.5", series: "June 2022", paper: "80353", q: "4.5", marks: 3, confidence: "check" },
  { code: "3.4.6", series: "June 2023", paper: "80353", q: "4.8", marks: 4, confidence: "ok" },
  { code: "3.4.7", series: "June 2023", paper: "80351", q: "1.11", marks: 9, confidence: "check" },
];

export const GEOGRAPHY_NO_QUESTION_FOUND: string[] = [];
