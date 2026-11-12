/**
 * AQA GCSE Computer Science (8525) marking structure.
 *
 * Sources, all downloaded from AQA's file server and read as text:
 *  - Specification 8525, "GCSE exams June 2022 onwards. Version 1.2 29 November 2022".
 *  - Question papers 8525/1B (Paper 1, Python version) and 8525/2 (Paper 2), June 2022 and June 2023,
 *    with the June 2022 and June 2023 mark schemes downloaded alongside.
 *
 * Paper 1 comes in three language versions (A is C#, B is Python, C is VB.NET) with the same
 * structure; the Python version is the one cited here. Topic units are the numbered spec sections
 * (3.1.1 and so on). Which question tests which topic is our judgement, and `check` marks looser matches.
 */

export interface ComputerScienceTopic {
  code: string;
  section: string;
  /** The specification's own heading for the section. */
  title: string;
}

export interface ComputerScienceCoverage {
  code: string;
  series: "June 2022" | "June 2023";
  /** "85251B" is Paper 1 (Python), "85252" is Paper 2. */
  paper: string;
  q: string;
  marks: number;
  confidence: "ok" | "check";
}

export const COMPUTER_SCIENCE_TOPICS: ComputerScienceTopic[] = [
  { code: "3.1.1", section: "Fundamentals of algorithms", title: "Representing algorithms" },
  { code: "3.1.2", section: "Fundamentals of algorithms", title: "Efficiency of algorithms" },
  { code: "3.1.3", section: "Fundamentals of algorithms", title: "Searching algorithms" },
  { code: "3.1.4", section: "Fundamentals of algorithms", title: "Sorting algorithms" },
  { code: "3.2.1", section: "Programming", title: "Data types" },
  { code: "3.2.2", section: "Programming", title: "Programming concepts" },
  { code: "3.2.3", section: "Programming", title: "Arithmetic operations in a programming language" },
  { code: "3.2.4", section: "Programming", title: "Relational operations in a programming language" },
  { code: "3.2.5", section: "Programming", title: "Boolean operations in a programming language" },
  { code: "3.2.6", section: "Programming", title: "Data structures" },
  { code: "3.2.7", section: "Programming", title: "Input/output" },
  { code: "3.2.8", section: "Programming", title: "String handling operations in a programming language" },
  { code: "3.2.9", section: "Programming", title: "Random number generation in a programming language" },
  { code: "3.2.10", section: "Programming", title: "Structured programming and subroutines (procedures and functions)" },
  { code: "3.2.11", section: "Programming", title: "Robust and secure programming" },
  { code: "3.3.1", section: "Fundamentals of data representation", title: "Number bases" },
  { code: "3.3.2", section: "Fundamentals of data representation", title: "Converting between number bases" },
  { code: "3.3.3", section: "Fundamentals of data representation", title: "Units of information" },
  { code: "3.3.4", section: "Fundamentals of data representation", title: "Binary arithmetic" },
  { code: "3.3.5", section: "Fundamentals of data representation", title: "Character encoding" },
  { code: "3.3.6", section: "Fundamentals of data representation", title: "Representing images" },
  { code: "3.3.7", section: "Fundamentals of data representation", title: "Representing sound" },
  { code: "3.3.8", section: "Fundamentals of data representation", title: "Data compression" },
  { code: "3.4.1", section: "Computer systems", title: "Hardware and software" },
  { code: "3.4.2", section: "Computer systems", title: "Boolean logic" },
  { code: "3.4.3", section: "Computer systems", title: "Software classification" },
  { code: "3.4.4", section: "Computer systems", title: "Classification of programming languages and translators" },
  { code: "3.4.5", section: "Computer systems", title: "Systems architecture" },
  { code: "3.5", section: "Fundamentals of computer networks", title: "Fundamentals of computer networks" },
  { code: "3.6.1", section: "Cyber security", title: "Fundamentals of cyber security" },
  { code: "3.6.2.1", section: "Cyber security", title: "Social engineering" },
  { code: "3.6.2.2", section: "Cyber security", title: "Malicious code (malware)" },
  { code: "3.6.3", section: "Cyber security", title: "Methods to detect and prevent cyber security threats" },
  { code: "3.7.1", section: "Relational databases and SQL", title: "Relational databases" },
  { code: "3.7.2", section: "Relational databases and SQL", title: "Structured query language (SQL)" },
  { code: "3.8", section: "Ethical, legal and environmental impacts", title: "Ethical, legal and environmental impacts of digital technology on wider society, including issues of privacy" },
];

export const COMPUTER_SCIENCE_PAPERS = [
  { code: "8525/1", title: "Computational thinking and programming skills", minutes: 120, marks: 90, weighting: "50% of the GCSE" },
  { code: "8525/2", title: "Computing concepts", minutes: 105, marks: 90, weighting: "50% of the GCSE" },
] as const;

/** Assessment objective weightings from the specification (approximate, overall). */
export const COMPUTER_SCIENCE_AO_WEIGHTS = {
  AO1: { meaning: "Demonstrate knowledge and understanding of key concepts and principles of computer science", paper1: 4.4, paper2: 25.6, overall: 30 },
  AO2: { meaning: "Apply knowledge and understanding of key concepts and principles of computer science", paper1: 20, paper2: 20, overall: 40 },
  AO3: { meaning: "Analyse problems in computational terms to make reasoned judgements, and design, program, evaluate and refine solutions", paper1: 25.6, paper2: 4.4, overall: 30 },
} as const;

export const COMPUTER_SCIENCE_COVERAGE: ComputerScienceCoverage[] = [
  { code: "3.1.1", series: "June 2023", paper: "85251B", q: "1.1", marks: 2, confidence: "ok" },
  { code: "3.1.1", series: "June 2023", paper: "85251B", q: "5", marks: 3, confidence: "ok" },
  { code: "3.1.2", series: "June 2022", paper: "85251B", q: "4.2", marks: 2, confidence: "check" },
  { code: "3.1.3", series: "June 2023", paper: "85251B", q: "12.1", marks: 4, confidence: "ok" },
  { code: "3.1.4", series: "June 2023", paper: "85251B", q: "8", marks: 4, confidence: "ok" },
  { code: "3.2.1", series: "June 2022", paper: "85251B", q: "2.3", marks: 2, confidence: "ok" },
  { code: "3.2.2", series: "June 2022", paper: "85251B", q: "1.1", marks: 1, confidence: "ok" },
  { code: "3.2.2", series: "June 2023", paper: "85251B", q: "2.1", marks: 1, confidence: "ok" },
  { code: "3.2.3", series: "June 2023", paper: "85251B", q: "2.3", marks: 1, confidence: "check" },
  { code: "3.2.4", series: "June 2022", paper: "85251B", q: "1.4", marks: 1, confidence: "ok" },
  { code: "3.2.5", series: "June 2022", paper: "85251B", q: "2.1", marks: 2, confidence: "check" },
  { code: "3.2.6", series: "June 2022", paper: "85251B", q: "5.3", marks: 1, confidence: "ok" },
  { code: "3.2.6", series: "June 2023", paper: "85251B", q: "9.1", marks: 1, confidence: "check" },
  { code: "3.2.7", series: "June 2022", paper: "85251B", q: "2.1", marks: 2, confidence: "check" },
  { code: "3.2.8", series: "June 2023", paper: "85251B", q: "1.4", marks: 1, confidence: "ok" },
  { code: "3.2.8", series: "June 2022", paper: "85251B", q: "3.1", marks: 1, confidence: "ok" },
  { code: "3.2.9", series: "June 2022", paper: "85251B", q: "5", marks: 5, confidence: "check" },
  { code: "3.2.10", series: "June 2022", paper: "85251B", q: "11.3", marks: 3, confidence: "ok" },
  { code: "3.2.10", series: "June 2022", paper: "85251B", q: "11.2", marks: 1, confidence: "ok" },
  { code: "3.2.11", series: "June 2023", paper: "85251B", q: "4.2", marks: 1, confidence: "check" },
  { code: "3.3.1", series: "June 2023", paper: "85252", q: "1.1", marks: 1, confidence: "ok" },
  { code: "3.3.2", series: "June 2022", paper: "85252", q: "1.1", marks: 1, confidence: "ok" },
  { code: "3.3.2", series: "June 2022", paper: "85252", q: "1.2", marks: 2, confidence: "ok" },
  { code: "3.3.3", series: "June 2022", paper: "85252", q: "10", marks: 2, confidence: "ok" },
  { code: "3.3.3", series: "June 2023", paper: "85252", q: "4", marks: 2, confidence: "ok" },
  { code: "3.3.4", series: "June 2022", paper: "85252", q: "2.1", marks: 2, confidence: "ok" },
  { code: "3.3.4", series: "June 2022", paper: "85252", q: "2.2", marks: 1, confidence: "ok" },
  { code: "3.3.5", series: "June 2022", paper: "85252", q: "11", marks: 2, confidence: "ok" },
  { code: "3.3.6", series: "June 2022", paper: "85252", q: "12", marks: 3, confidence: "ok" },
  { code: "3.3.6", series: "June 2023", paper: "85252", q: "7.1", marks: 1, confidence: "ok" },
  { code: "3.3.7", series: "June 2022", paper: "85252", q: "13.1", marks: 1, confidence: "ok" },
  { code: "3.3.7", series: "June 2023", paper: "85252", q: "6.1", marks: 1, confidence: "ok" },
  { code: "3.3.8", series: "June 2022", paper: "85252", q: "17.1", marks: 2, confidence: "ok" },
  { code: "3.4.1", series: "June 2023", paper: "85252", q: "8.1", marks: 1, confidence: "ok" },
  { code: "3.4.2", series: "June 2022", paper: "85252", q: "3.1", marks: 1, confidence: "ok" },
  { code: "3.4.2", series: "June 2022", paper: "85252", q: "3.2", marks: 3, confidence: "ok" },
  { code: "3.4.3", series: "June 2022", paper: "85252", q: "4.1", marks: 2, confidence: "ok" },
  { code: "3.4.3", series: "June 2023", paper: "85252", q: "9.2", marks: 1, confidence: "ok" },
  { code: "3.4.4", series: "June 2022", paper: "85252", q: "7.1", marks: 1, confidence: "ok" },
  { code: "3.4.4", series: "June 2022", paper: "85252", q: "6", marks: 2, confidence: "ok" },
  { code: "3.4.5", series: "June 2023", paper: "85252", q: "10.1", marks: 2, confidence: "ok" },
  { code: "3.4.5", series: "June 2022", paper: "85252", q: "8", marks: 2, confidence: "ok" },
  { code: "3.5", series: "June 2022", paper: "85252", q: "14.2", marks: 2, confidence: "ok" },
  { code: "3.5", series: "June 2023", paper: "85252", q: "13.3", marks: 2, confidence: "ok" },
  { code: "3.6.1", series: "June 2023", paper: "85252", q: "16.1", marks: 2, confidence: "ok" },
  { code: "3.6.2.2", series: "June 2023", paper: "85252", q: "16.2", marks: 1, confidence: "ok" },
  { code: "3.6.3", series: "June 2022", paper: "85252", q: "15.2", marks: 2, confidence: "ok" },
  { code: "3.6.3", series: "June 2022", paper: "85252", q: "16.1", marks: 2, confidence: "ok" },
  { code: "3.7.1", series: "June 2022", paper: "85252", q: "18.1", marks: 2, confidence: "ok" },
  { code: "3.7.2", series: "June 2022", paper: "85252", q: "18.5", marks: 6, confidence: "ok" },
  { code: "3.7.2", series: "June 2023", paper: "85252", q: "14.5", marks: 2, confidence: "check" },
  { code: "3.8", series: "June 2022", paper: "85252", q: "5", marks: 6, confidence: "ok" },
  { code: "3.8", series: "June 2023", paper: "85252", q: "15", marks: 9, confidence: "ok" },
];

/** Topics with no clear question in the June 2022 and June 2023 papers checked. */
export const COMPUTER_SCIENCE_NO_QUESTION_FOUND = ["3.6.2.1"];
