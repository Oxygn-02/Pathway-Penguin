/**
 * AQA A-level Computer Science (7517) marking structure.
 *
 * Sources, all downloaded from AQA's file server and read as text:
 *  - Specification 7516 and 7517, "Version 1.6 31 July 2023".
 *  - Question papers and mark schemes 7517/1 (on-screen) and 7517/2 (written), June 2022 and June 2023, mark schemes "Version: 1.0 Final".
 *
 * Topics are the specification's numbered subsections 4.1.1 to 4.13.1 with AQA's headings. Which question tests which subsection
 * is our judgement; `confidence: "check"` marks looser matches. `marks` is the total printed on the paper for the part cited.
 * The non-exam assessment (75 marks, 20%) is not covered by past papers.
 */

export interface ALevelComputerScienceTopic {
  /** Specification subsection, e.g. "4.3.1". */
  code: string;
  group: string;
  title: string;
}

export interface ALevelComputerScienceCoverage {
  code: string;
  series: "June 2022" | "June 2023";
  paper: "7517/1" | "7517/2";
  q: string;
  marks: number;
  confidence: "ok" | "check";
}

export const ALEVEL_CS_PAPERS = [
  { code: "7517/1", title: "On-screen exam: programming, data structures, algorithms, theory of computation, computer systems", minutes: 150, marks: 100, weighting: "40% of the A level" },
  { code: "7517/2", title: "Written exam: data representation, computer systems, organisation, networking, databases, big data, functional programming", minutes: 150, marks: 100, weighting: "40% of the A level" },
  { code: "NEA", title: "Computing practical project", minutes: 0, marks: 75, weighting: "20% of the A level" },
] as const;

/** A-level overall weightings from section 5.2 of the specification (component split: AO1 8/22/0, AO2 12/16/2, AO3 20/2/18). */
export const ALEVEL_CS_AO_WEIGHTS = { AO1: 30, AO2: 30, AO3: 40 } as const;

/** Extended answers are marked by level of response; the mark scheme gives each level a descriptor and a mark range. */
export const ALEVEL_CS_LEVEL_OF_RESPONSE = {
  steps: ["Pick the level by working up from the lowest and taking the best fit for the whole answer", "Pick the mark inside the level using the variability of the answer and the Lead Examiner's standardising examples"],
  examples: [
    { paper: "7517/1", series: "June 2022", q: "5.1", marks: 12, ao: "4 marks AO3 design, 8 marks AO3 programming", levels: ["10-12", "7-9", "4-6", "1-3"] },
    { paper: "7517/2", series: "June 2022", q: "6", marks: 12, ao: "all AO1", levels: ["10-12", "7-9", "4-6", "1-3"] },
    { paper: "7517/2", series: "June 2022", q: "13.3", marks: 4, ao: "all AO1", levels: ["3-4", "1-2"] },
  ],
} as const;

export const ALEVEL_CS_TOPICS: ALevelComputerScienceTopic[] = [
  { code: "4.1.1", group: "Fundamentals of programming", title: "Programming" },
  { code: "4.1.2", group: "Fundamentals of programming", title: "Programming paradigms" },
  { code: "4.2.1", group: "Fundamentals of data structures", title: "Data structures and abstract data types" },
  { code: "4.2.2", group: "Fundamentals of data structures", title: "Queues" },
  { code: "4.2.3", group: "Fundamentals of data structures", title: "Stacks" },
  { code: "4.2.4", group: "Fundamentals of data structures", title: "Graphs" },
  { code: "4.2.5", group: "Fundamentals of data structures", title: "Trees" },
  { code: "4.2.6", group: "Fundamentals of data structures", title: "Hash tables" },
  { code: "4.2.7", group: "Fundamentals of data structures", title: "Dictionaries" },
  { code: "4.2.8", group: "Fundamentals of data structures", title: "Vectors" },
  { code: "4.3.1", group: "Fundamentals of algorithms", title: "Graph-traversal" },
  { code: "4.3.2", group: "Fundamentals of algorithms", title: "Tree-traversal" },
  { code: "4.3.3", group: "Fundamentals of algorithms", title: "Reverse Polish" },
  { code: "4.3.4", group: "Fundamentals of algorithms", title: "Searching algorithms" },
  { code: "4.3.5", group: "Fundamentals of algorithms", title: "Sorting algorithms" },
  { code: "4.3.6", group: "Fundamentals of algorithms", title: "Optimisation algorithms" },
  { code: "4.4.1", group: "Theory of computation", title: "Abstraction and automation" },
  { code: "4.4.2", group: "Theory of computation", title: "Regular languages" },
  { code: "4.4.3", group: "Theory of computation", title: "Context-free languages" },
  { code: "4.4.4", group: "Theory of computation", title: "Classification of algorithms" },
  { code: "4.4.5", group: "Theory of computation", title: "A model of computation" },
  { code: "4.5.1", group: "Fundamentals of data representation", title: "Number systems" },
  { code: "4.5.2", group: "Fundamentals of data representation", title: "Number bases" },
  { code: "4.5.3", group: "Fundamentals of data representation", title: "Units of information" },
  { code: "4.5.4", group: "Fundamentals of data representation", title: "Binary number system" },
  { code: "4.5.5", group: "Fundamentals of data representation", title: "Information coding systems" },
  { code: "4.5.6", group: "Fundamentals of data representation", title: "Representing images, sound and other data" },
  { code: "4.6.1", group: "Fundamentals of computer systems", title: "Hardware and software" },
  { code: "4.6.2", group: "Fundamentals of computer systems", title: "Classification of programming languages" },
  { code: "4.6.3", group: "Fundamentals of computer systems", title: "Types of program translator" },
  { code: "4.6.4", group: "Fundamentals of computer systems", title: "Logic gates" },
  { code: "4.6.5", group: "Fundamentals of computer systems", title: "Boolean algebra" },
  { code: "4.7.1", group: "Fundamentals of computer organisation and", title: "Internal hardware components of a computer" },
  { code: "4.7.2", group: "Fundamentals of computer organisation and", title: "The stored program concept" },
  { code: "4.7.3", group: "Fundamentals of computer organisation and", title: "Structure and role of the processor and its components" },
  { code: "4.7.4", group: "Fundamentals of computer organisation and", title: "External hardware devices" },
  { code: "4.8.1", group: "Consequences of uses of computing", title: "Individual (moral), social (ethical), legal and cultural issues and" },
  { code: "4.9.1", group: "Fundamentals of communication and networking", title: "Communication" },
  { code: "4.9.2", group: "Fundamentals of communication and networking", title: "Networking" },
  { code: "4.9.3", group: "Fundamentals of communication and networking", title: "The Internet" },
  { code: "4.9.4", group: "Fundamentals of communication and networking", title: "The Transmission Control Protocol/Internet Protocol (TCP/IP)" },
  { code: "4.10.1", group: "Fundamentals of databases", title: "Conceptual data models and entity relationship modelling" },
  { code: "4.10.2", group: "Fundamentals of databases", title: "Relational databases" },
  { code: "4.10.3", group: "Fundamentals of databases", title: "Database design and normalisation techniques" },
  { code: "4.10.4", group: "Fundamentals of databases", title: "Structured Query Language (SQL)" },
  { code: "4.10.5", group: "Fundamentals of databases", title: "Client server databases" },
  { code: "4.11.1", group: "Big Data", title: "Big Data" },
  { code: "4.12.1", group: "Fundamentals of functional programming", title: "Functional programming paradigm" },
  { code: "4.12.2", group: "Fundamentals of functional programming", title: "Writing functional programs" },
  { code: "4.12.3", group: "Fundamentals of functional programming", title: "Lists in functional programming" },
  { code: "4.13.1", group: "Systematic approach to problem solving", title: "Aspects of software development" },
];

export const ALEVEL_CS_COVERAGE: ALevelComputerScienceCoverage[] = [
  { code: "4.1.1", series: "June 2022", paper: "7517/1", q: "5.1", marks: 12, confidence: "ok" },
  { code: "4.1.1", series: "June 2023", paper: "7517/1", q: "6.1", marks: 12, confidence: "ok" },
  { code: "4.1.2", series: "June 2022", paper: "7517/1", q: "6.3", marks: 2, confidence: "ok" },
  { code: "4.1.2", series: "June 2022", paper: "7517/1", q: "6.4", marks: 1, confidence: "ok" },
  { code: "4.1.2", series: "June 2023", paper: "7517/1", q: "8", marks: 2, confidence: "ok" },
  { code: "4.2.1", series: "June 2022", paper: "7517/1", q: "2.2", marks: 3, confidence: "ok" },
  { code: "4.2.2", series: "June 2023", paper: "7517/1", q: "1", marks: 5, confidence: "ok" },
  { code: "4.2.2", series: "June 2023", paper: "7517/1", q: "9.1", marks: 1, confidence: "check" },
  { code: "4.2.3", series: "June 2022", paper: "7517/1", q: "2.5", marks: 2, confidence: "ok" },
  { code: "4.2.3", series: "June 2022", paper: "7517/1", q: "2.3", marks: 1, confidence: "ok" },
  { code: "4.2.4", series: "June 2022", paper: "7517/1", q: "4.4", marks: 1, confidence: "ok" },
  { code: "4.2.4", series: "June 2022", paper: "7517/1", q: "4.8", marks: 1, confidence: "ok" },
  { code: "4.2.5", series: "June 2023", paper: "7517/1", q: "3.2", marks: 4, confidence: "ok" },
  { code: "4.2.5", series: "June 2023", paper: "7517/1", q: "3.1", marks: 2, confidence: "ok" },
  { code: "4.2.6", series: "June 2022", paper: "7517/1", q: "7.3", marks: 3, confidence: "ok" },
  { code: "4.2.7", series: "June 2022", paper: "7517/1", q: "7.4", marks: 1, confidence: "ok" },
  { code: "4.3.1", series: "June 2022", paper: "7517/1", q: "4.5", marks: 6, confidence: "ok" },
  { code: "4.3.1", series: "June 2022", paper: "7517/1", q: "4.7", marks: 1, confidence: "ok" },
  { code: "4.3.4", series: "June 2023", paper: "7517/1", q: "3.3", marks: 1, confidence: "ok" },
  { code: "4.3.4", series: "June 2023", paper: "7517/1", q: "3.4", marks: 1, confidence: "ok" },
  { code: "4.4.2", series: "June 2023", paper: "7517/1", q: "4.2", marks: 2, confidence: "ok" },
  { code: "4.4.2", series: "June 2023", paper: "7517/1", q: "4.1", marks: 3, confidence: "ok" },
  { code: "4.4.3", series: "June 2023", paper: "7517/1", q: "4.1", marks: 3, confidence: "check" },
  { code: "4.4.4", series: "June 2022", paper: "7517/1", q: "1", marks: 3, confidence: "ok" },
  { code: "4.4.4", series: "June 2023", paper: "7517/1", q: "3.6", marks: 2, confidence: "ok" },
  { code: "4.4.4", series: "June 2023", paper: "7517/1", q: "3.5", marks: 1, confidence: "ok" },
  { code: "4.4.5", series: "June 2023", paper: "7517/1", q: "5.1", marks: 5, confidence: "ok" },
  { code: "4.4.5", series: "June 2023", paper: "7517/1", q: "5.3", marks: 2, confidence: "ok" },
  { code: "4.5.2", series: "June 2022", paper: "7517/2", q: "1.1", marks: 2, confidence: "ok" },
  { code: "4.5.2", series: "June 2022", paper: "7517/2", q: "1.2", marks: 1, confidence: "ok" },
  { code: "4.5.4", series: "June 2022", paper: "7517/2", q: "5.4", marks: 3, confidence: "ok" },
  { code: "4.5.4", series: "June 2023", paper: "7517/2", q: "6.2", marks: 3, confidence: "ok" },
  { code: "4.5.4", series: "June 2023", paper: "7517/2", q: "6.3", marks: 2, confidence: "ok" },
  { code: "4.5.6", series: "June 2022", paper: "7517/2", q: "10.1", marks: 3, confidence: "ok" },
  { code: "4.5.6", series: "June 2023", paper: "7517/2", q: "1.1", marks: 2, confidence: "ok" },
  { code: "4.5.6", series: "June 2022", paper: "7517/2", q: "10.2", marks: 3, confidence: "ok" },
  { code: "4.6.1", series: "June 2022", paper: "7517/2", q: "4.3", marks: 2, confidence: "ok" },
  { code: "4.6.1", series: "June 2022", paper: "7517/2", q: "4.1", marks: 1, confidence: "ok" },
  { code: "4.6.2", series: "June 2022", paper: "7517/2", q: "9.4", marks: 2, confidence: "ok" },
  { code: "4.6.3", series: "June 2022", paper: "7517/2", q: "9.5", marks: 1, confidence: "ok" },
  { code: "4.6.4", series: "June 2023", paper: "7517/2", q: "9.1", marks: 3, confidence: "ok" },
  { code: "4.6.4", series: "June 2022", paper: "7517/2", q: "3.1", marks: 1, confidence: "ok" },
  { code: "4.6.5", series: "June 2022", paper: "7517/2", q: "3.3", marks: 4, confidence: "ok" },
  { code: "4.6.5", series: "June 2023", paper: "7517/2", q: "9.3", marks: 4, confidence: "ok" },
  { code: "4.7.1", series: "June 2022", paper: "7517/2", q: "13.1", marks: 1, confidence: "check" },
  { code: "4.7.3", series: "June 2023", paper: "7517/2", q: "4.1", marks: 12, confidence: "ok" },
  { code: "4.7.3", series: "June 2022", paper: "7517/2", q: "9.2", marks: 5, confidence: "ok" },
  { code: "4.7.3", series: "June 2023", paper: "7517/2", q: "4.2", marks: 2, confidence: "ok" },
  { code: "4.7.4", series: "June 2022", paper: "7517/2", q: "13.3", marks: 4, confidence: "ok" },
  { code: "4.7.4", series: "June 2022", paper: "7517/2", q: "13.2", marks: 2, confidence: "ok" },
  { code: "4.8.1", series: "June 2022", paper: "7517/2", q: "6", marks: 12, confidence: "check" },
  { code: "4.9.1", series: "June 2022", paper: "7517/2", q: "2.1", marks: 2, confidence: "ok" },
  { code: "4.9.1", series: "June 2022", paper: "7517/2", q: "2.4", marks: 1, confidence: "ok" },
  { code: "4.9.1", series: "June 2023", paper: "7517/2", q: "10.1", marks: 1, confidence: "ok" },
  { code: "4.9.2", series: "June 2022", paper: "7517/2", q: "8.1", marks: 3, confidence: "ok" },
  { code: "4.9.2", series: "June 2022", paper: "7517/2", q: "11", marks: 3, confidence: "ok" },
  { code: "4.9.2", series: "June 2023", paper: "7517/2", q: "2.3", marks: 2, confidence: "ok" },
  { code: "4.9.3", series: "June 2023", paper: "7517/2", q: "5.5", marks: 1, confidence: "ok" },
  { code: "4.9.3", series: "June 2022", paper: "7517/2", q: "8.3", marks: 3, confidence: "check" },
  { code: "4.9.4", series: "June 2023", paper: "7517/2", q: "11.1", marks: 3, confidence: "ok" },
  { code: "4.9.4", series: "June 2023", paper: "7517/2", q: "11.3", marks: 4, confidence: "ok" },
  { code: "4.10.1", series: "June 2022", paper: "7517/2", q: "7.2", marks: 2, confidence: "ok" },
  { code: "4.10.2", series: "June 2022", paper: "7517/2", q: "7.1", marks: 1, confidence: "check" },
  { code: "4.10.2", series: "June 2023", paper: "7517/2", q: "5.3", marks: 2, confidence: "check" },
  { code: "4.10.3", series: "June 2023", paper: "7517/2", q: "5.1", marks: 5, confidence: "ok" },
  { code: "4.10.3", series: "June 2022", paper: "7517/2", q: "7.5", marks: 2, confidence: "ok" },
  { code: "4.10.4", series: "June 2022", paper: "7517/2", q: "7.4", marks: 7, confidence: "ok" },
  { code: "4.10.4", series: "June 2022", paper: "7517/2", q: "7.3", marks: 3, confidence: "ok" },
  { code: "4.10.5", series: "June 2023", paper: "7517/2", q: "5.2", marks: 2, confidence: "check" },
  { code: "4.11.1", series: "June 2023", paper: "7517/2", q: "8.2", marks: 3, confidence: "ok" },
  { code: "4.11.1", series: "June 2023", paper: "7517/2", q: "8.3", marks: 2, confidence: "ok" },
  { code: "4.12.1", series: "June 2022", paper: "7517/2", q: "12.1", marks: 1, confidence: "ok" },
  { code: "4.12.2", series: "June 2022", paper: "7517/2", q: "12.3", marks: 4, confidence: "ok" },
  { code: "4.12.2", series: "June 2023", paper: "7517/2", q: "12.1", marks: 3, confidence: "ok" },
  { code: "4.12.3", series: "June 2023", paper: "7517/2", q: "12.2", marks: 1, confidence: "check" },
];

export const ALEVEL_CS_NO_QUESTION_FOUND: string[] = ["4.2.8", "4.3.2", "4.3.3", "4.3.5", "4.3.6", "4.4.1", "4.5.1", "4.5.3", "4.5.5", "4.7.2", "4.13.1"];
