/**
 * AQA GCSE Statistics (8382) marking structure.
 *
 * Sources, all downloaded from AQA's file server and read as text:
 *  - Specification 8382, "GCSE exams June 2019 onwards. Version 1.1 26 February 2018".
 *  - Question papers 8382/1H, 2H, 1F, 2F, June 2022, and mark schemes "Version: 1.0 Final".
 *  - Question papers 8382/1H, 2H and 2F, June 2023 (the 1F paper could not be downloaded).
 *
 * Topic titles are ours, written from AQA's content statements. Which question tests which topic
 * is our judgement (AQA does not publish it); `confidence: "check"` marks the looser matches.
 * Topics with no clear question in the papers checked are listed in STATISTICS_NO_QUESTION_FOUND.
 */

export interface StatisticsTopic {
  code: string;
  section: string;
  /** Short title written by us from the specification's content statement. */
  title: string;
}

export interface StatisticsCoverage {
  code: string;
  series: "June 2022" | "June 2023";
  /** AQA paper code, e.g. "83821H" is 8382/1H. */
  paper: string;
  q: string;
  marks: number;
  confidence: "ok" | "check";
}

export const STATISTICS_TOPICS: StatisticsTopic[] = [
  { code: "A1", section: "Planning an investigation (Section A)", title: "Hypotheses are tested by collecting and analysing data" },
  { code: "A2", section: "Planning an investigation (Section A)", title: "Constraints on designing an investigation" },
  { code: "A3", section: "Planning an investigation (Section A)", title: "Strategies for problems during an enquiry" },
  { code: "B1a", section: "Collecting data (Section B)", title: "Types of data and the terms for them" },
  { code: "B1b", section: "Collecting data (Section B)", title: "Merging categories and grouping into class intervals" },
  { code: "B1c", section: "Collecting data (Section B)", title: "Explanatory and response variables" },
  { code: "B2a", section: "Collecting data (Section B)", title: "Primary and secondary data" },
  { code: "B2b", section: "Collecting data (Section B)", title: "Data sources: experiments, simulation, surveys" },
  { code: "B2c", section: "Collecting data (Section B)", title: "Reliability and validity" },
  { code: "B2d", section: "Collecting data (Section B)", title: "Factors that cause bias" },
  { code: "B3a", section: "Collecting data (Section B)", title: "Population, sample frame and sample" },
  { code: "B3b", section: "Collecting data (Section B)", title: "What the word population means in context" },
  { code: "B3c", section: "Collecting data (Section B)", title: "Judgement and convenience sampling and bias" },
  { code: "B3d", section: "Collecting data (Section B)", title: "Random, systematic, stratified and other sampling" },
  { code: "B3e", section: "Collecting data (Section B)", title: "Sample size and sampling methods in context" },
  { code: "B3f", section: "Collecting data (Section B)", title: "Stratification before sampling" },
  { code: "B4", section: "Collecting data (Section B)", title: "Planning data collection and questions" },
  { code: "B5a", section: "Collecting data (Section B)", title: "Problems with collected data" },
  { code: "B5b", section: "Collecting data (Section B)", title: "Cleaning data" },
  { code: "B5c", section: "Collecting data (Section B)", title: "Control groups and extraneous variables" },
  { code: "C1a", section: "Presenting data (Section C)", title: "Representing data: charts and diagrams" },
  { code: "C1b", section: "Presenting data (Section C)", title: "Interpreting and comparing displayed data" },
  { code: "C2", section: "Presenting data (Section C)", title: "Histograms, cumulative frequency and box plots" },
  { code: "C3a", section: "Presenting data (Section C)", title: "Choosing and producing accurate visualisations" },
  { code: "C3b", section: "Presenting data (Section C)", title: "Spotting misleading graphs" },
  { code: "C4a", section: "Presenting data (Section C)", title: "Comparing data in different formats" },
  { code: "C4b", section: "Presenting data (Section C)", title: "Choosing a suitable representation" },
  { code: "D1a", section: "Summarising data (Section D)", title: "Calculating averages" },
  { code: "D1b", section: "Summarising data (Section D)", title: "Choosing an average" },
  { code: "D2", section: "Summarising data (Section D)", title: "Skewness" },
  { code: "D3a", section: "Summarising data (Section D)", title: "Measures of spread" },
  { code: "D3b", section: "Summarising data (Section D)", title: "Identifying outliers" },
  { code: "D4", section: "Summarising data (Section D)", title: "Trends and moving averages" },
  { code: "D5", section: "Summarising data (Section D)", title: "Line of best fit" },
  { code: "D6", section: "Summarising data (Section D)", title: "Standard deviation and related measures" },
  { code: "D7", section: "Summarising data (Section D)", title: "Estimating probabilities from data" },
  { code: "E1a", section: "Interpreting and analysing data (Section E)", title: "Comparing probabilities on a scale" },
  { code: "E1b", section: "Interpreting and analysing data (Section E)", title: "Expected frequency" },
  { code: "E1c", section: "Interpreting and analysing data (Section E)", title: "Relative and absolute risk" },
  { code: "E2a", section: "Interpreting and analysing data (Section E)", title: "Experimental versus theoretical results and bias" },
  { code: "E2b", section: "Interpreting and analysing data (Section E)", title: "Experimental probability tends to theoretical with more trials" },
  { code: "E2c", section: "Interpreting and analysing data (Section E)", title: "Two-way tables, sample spaces, tree and Venn diagrams" },
  { code: "E3a", section: "Interpreting and analysing data (Section E)", title: "Interpreting and comparing data in tables" },
  { code: "E3b", section: "Interpreting and analysing data (Section E)", title: "Comparing data sets" },
  { code: "E3c", section: "Interpreting and analysing data (Section E)", title: "Comparing with median and interquartile range, or mean and standard deviation" },
  { code: "E3d", section: "Interpreting and analysing data (Section E)", title: "Interpreting tabular data" },
  { code: "E4a", section: "Interpreting and analysing data (Section E)", title: "Independent events and notation" },
  { code: "E4b", section: "Interpreting and analysing data (Section E)", title: "Conditional probability and notation" },
  { code: "E5a", section: "Interpreting and analysing data (Section E)", title: "Interpreting skewness" },
  { code: "E5b", section: "Interpreting and analysing data (Section E)", title: "Commenting on outliers" },
  { code: "E6", section: "Interpreting and analysing data (Section E)", title: "Seasonal and cyclic trends" },
  { code: "E7a", section: "Interpreting and analysing data (Section E)", title: "Rates of change over time" },
  { code: "E7b", section: "Interpreting and analysing data (Section E)", title: "Calculating rates from tables" },
  { code: "E7c", section: "Interpreting and analysing data (Section E)", title: "Index numbers (CPI, RPI and others)" },
  { code: "E8a", section: "Interpreting and analysing data (Section E)", title: "Vocabulary of correlation" },
  { code: "E8b", section: "Interpreting and analysing data (Section E)", title: "Strength of correlation" },
  { code: "E8c", section: "Interpreting and analysing data (Section E)", title: "Correlation is not causation" },
  { code: "E9a", section: "Interpreting and analysing data (Section E)", title: "Spearman rank correlation" },
  { code: "E9b", section: "Interpreting and analysing data (Section E)", title: "Pearson product moment correlation" },
  { code: "E9c", section: "Interpreting and analysing data (Section E)", title: "Interpreting correlation coefficients" },
  { code: "E10a", section: "Interpreting and analysing data (Section E)", title: "Experimental and theoretical values and bias" },
  { code: "E10b", section: "Interpreting and analysing data (Section E)", title: "Binomial distribution" },
  { code: "E11a", section: "Interpreting and analysing data (Section E)", title: "Normal distribution" },
  { code: "E11b", section: "Interpreting and analysing data (Section E)", title: "Normal distribution: unusual values and the 95% rule" },
  { code: "E11c", section: "Interpreting and analysing data (Section E)", title: "Action and warning lines in quality assurance" },
  { code: "E11d", section: "Interpreting and analysing data (Section E)", title: "Standardised scores" },
  { code: "E12a", section: "Interpreting and analysing data (Section E)", title: "Estimating population characteristics from samples" },
  { code: "E12b", section: "Interpreting and analysing data (Section E)", title: "Estimating population values from sample statistics" },
  { code: "E12c", section: "Interpreting and analysing data (Section E)", title: "Predicting population proportions" },
  { code: "E12d", section: "Interpreting and analysing data (Section E)", title: "Capture-recapture estimates" },
  { code: "E13a", section: "Interpreting and analysing data (Section E)", title: "Sample size, reliability and replication" },
  { code: "E13b", section: "Interpreting and analysing data (Section E)", title: "Distribution of sample means" },
];

export const STATISTICS_PAPERS = [
  { code: "8382/1", tiers: ["foundation", "higher"], minutes: 105, marks: 80, weighting: "50% of the GCSE" },
  { code: "8382/2", tiers: ["foundation", "higher"], minutes: 105, marks: 80, weighting: "50% of the GCSE" },
] as const;

/** Assessment objective weightings from the specification (same for both tiers, plus or minus 3%). */
export const STATISTICS_AO_WEIGHTS = {
  AO1: { meaning: "Knowledge of standard techniques to collect and represent data and to calculate summary statistics and probabilities", percent: 55 },
  AO2: { meaning: "Interpret statistical information and results in context and reason statistically", percent: 25 },
  AO3: { meaning: "Assess the appropriateness of methods and conclusions using the statistical enquiry cycle", percent: 20 },
} as const;

/** Mark types from the June 2022 mark scheme glossary (the same letters as GCSE Maths). */
export const STATISTICS_MARK_TYPES = ["M", "A", "B", "ft", "SC", "M dep", "B dep", "oe"] as const;

export const STATISTICS_COVERAGE: StatisticsCoverage[] = [
  { code: "A1", series: "June 2022", paper: "83821H", q: "15a", marks: 1, confidence: "ok" },
  { code: "A2", series: "June 2022", paper: "83821H", q: "15b", marks: 2, confidence: "check" },
  { code: "B1a", series: "June 2022", paper: "83821F", q: "5a", marks: 1, confidence: "ok" },
  { code: "B1a", series: "June 2022", paper: "83821F", q: "5b", marks: 2, confidence: "ok" },
  { code: "B1c", series: "June 2023", paper: "83822F", q: "10", marks: 6, confidence: "check" },
  { code: "B2a", series: "June 2022", paper: "83821F", q: "10c", marks: 2, confidence: "ok" },
  { code: "B2b", series: "June 2022", paper: "83821H", q: "14b", marks: 2, confidence: "check" },
  { code: "B2b", series: "June 2022", paper: "83822F", q: "16", marks: 7, confidence: "ok" },
  { code: "B2c", series: "June 2022", paper: "83822H", q: "4", marks: 1, confidence: "ok" },
  { code: "B2c", series: "June 2022", paper: "83822F", q: "16b", marks: 1, confidence: "ok" },
  { code: "B2d", series: "June 2022", paper: "83822H", q: "6b", marks: 2, confidence: "check" },
  { code: "B3c", series: "June 2022", paper: "83822H", q: "6e", marks: 4, confidence: "ok" },
  { code: "B3d", series: "June 2022", paper: "83822H", q: "3", marks: 1, confidence: "ok" },
  { code: "B3d", series: "June 2022", paper: "83822H", q: "6d", marks: 2, confidence: "ok" },
  { code: "B3f", series: "June 2022", paper: "83821H", q: "4", marks: 1, confidence: "check" },
  { code: "B4", series: "June 2022", paper: "83822H", q: "6b", marks: 2, confidence: "ok" },
  { code: "B4", series: "June 2022", paper: "83822H", q: "6c", marks: 1, confidence: "ok" },
  { code: "B5b", series: "June 2022", paper: "83821F", q: "2", marks: 2, confidence: "ok" },
  { code: "B5c", series: "June 2022", paper: "83821H", q: "14c", marks: 2, confidence: "ok" },
  { code: "C1a", series: "June 2022", paper: "83822F", q: "10", marks: 4, confidence: "ok" },
  { code: "C1a", series: "June 2022", paper: "83821F", q: "5c", marks: 4, confidence: "check" },
  { code: "C1b", series: "June 2022", paper: "83821F", q: "13b", marks: 7, confidence: "ok" },
  { code: "C2", series: "June 2022", paper: "83821H", q: "11a", marks: 3, confidence: "ok" },
  { code: "C2", series: "June 2022", paper: "83822F", q: "11b", marks: 3, confidence: "ok" },
  { code: "C3a", series: "June 2022", paper: "83821F", q: "8b", marks: 1, confidence: "ok" },
  { code: "C3b", series: "June 2022", paper: "83821F", q: "14", marks: 2, confidence: "ok" },
  { code: "C4b", series: "June 2022", paper: "83821F", q: "8b", marks: 1, confidence: "check" },
  { code: "D1a", series: "June 2022", paper: "83821H", q: "13a", marks: 3, confidence: "ok" },
  { code: "D1a", series: "June 2022", paper: "83822F", q: "6b", marks: 2, confidence: "ok" },
  { code: "D1b", series: "June 2023", paper: "83822F", q: "4c", marks: 1, confidence: "check" },
  { code: "D2", series: "June 2022", paper: "83822H", q: "14b", marks: 6, confidence: "ok" },
  { code: "D3a", series: "June 2022", paper: "83822F", q: "1", marks: 1, confidence: "ok" },
  { code: "D4", series: "June 2022", paper: "83822H", q: "7c", marks: 2, confidence: "ok" },
  { code: "D5", series: "June 2022", paper: "83822F", q: "6c", marks: 2, confidence: "ok" },
  { code: "D6", series: "June 2022", paper: "83822H", q: "14b", marks: 6, confidence: "check" },
  { code: "E1a", series: "June 2022", paper: "83821F", q: "1", marks: 1, confidence: "ok" },
  { code: "E1b", series: "June 2022", paper: "83822F", q: "13", marks: 1, confidence: "ok" },
  { code: "E1c", series: "June 2022", paper: "83821H", q: "7a", marks: 5, confidence: "ok" },
  { code: "E2c", series: "June 2022", paper: "83821H", q: "10a", marks: 4, confidence: "ok" },
  { code: "E2c", series: "June 2022", paper: "83822F", q: "8a", marks: 3, confidence: "ok" },
  { code: "E3a", series: "June 2022", paper: "83821F", q: "6b", marks: 2, confidence: "check" },
  { code: "E3b", series: "June 2022", paper: "83821H", q: "8c", marks: 2, confidence: "ok" },
  { code: "E3c", series: "June 2022", paper: "83822H", q: "10a", marks: 4, confidence: "check" },
  { code: "E3d", series: "June 2022", paper: "83821F", q: "13a", marks: 2, confidence: "check" },
  { code: "E4a", series: "June 2023", paper: "83821H", q: "4", marks: 1, confidence: "ok" },
  { code: "E4b", series: "June 2023", paper: "83821H", q: "4", marks: 1, confidence: "ok" },
  { code: "E4b", series: "June 2022", paper: "83821H", q: "3", marks: 1, confidence: "check" },
  { code: "E5a", series: "June 2022", paper: "83822H", q: "14c", marks: 1, confidence: "ok" },
  { code: "E6", series: "June 2023", paper: "83821H", q: "18b", marks: 6, confidence: "ok" },
  { code: "E7a", series: "June 2022", paper: "83821F", q: "10f", marks: 4, confidence: "ok" },
  { code: "E7b", series: "June 2022", paper: "83822F", q: "15b", marks: 3, confidence: "ok" },
  { code: "E7c", series: "June 2022", paper: "83821H", q: "8d", marks: 3, confidence: "ok" },
  { code: "E8a", series: "June 2022", paper: "83822F", q: "12a", marks: 1, confidence: "check" },
  { code: "E8b", series: "June 2022", paper: "83821F", q: "12", marks: 1, confidence: "ok" },
  { code: "E8c", series: "June 2022", paper: "83821F", q: "12", marks: 1, confidence: "ok" },
  { code: "E9a", series: "June 2022", paper: "83821H", q: "1", marks: 1, confidence: "ok" },
  { code: "E9a", series: "June 2022", paper: "83822H", q: "13a", marks: 1, confidence: "ok" },
  { code: "E9b", series: "June 2022", paper: "83821H", q: "12b", marks: 2, confidence: "ok" },
  { code: "E9c", series: "June 2022", paper: "83821H", q: "12c", marks: 2, confidence: "ok" },
  { code: "E10b", series: "June 2022", paper: "83822H", q: "12b", marks: 4, confidence: "ok" },
  { code: "E11a", series: "June 2023", paper: "83821H", q: "17", marks: 3, confidence: "ok" },
  { code: "E11c", series: "June 2022", paper: "83821H", q: "2", marks: 1, confidence: "ok" },
  { code: "E11c", series: "June 2023", paper: "83822H", q: "13b", marks: 2, confidence: "ok" },
  { code: "E11d", series: "June 2023", paper: "83822H", q: "14a", marks: 2, confidence: "ok" },
  { code: "E12c", series: "June 2022", paper: "83822F", q: "13", marks: 1, confidence: "ok" },
  { code: "E12d", series: "June 2022", paper: "83822H", q: "10c", marks: 2, confidence: "ok" },
  { code: "E13a", series: "June 2022", paper: "83821F", q: "4", marks: 1, confidence: "ok" },
];

/** Topics with no clear question in the June 2022 and June 2023 papers checked. */
export const STATISTICS_NO_QUESTION_FOUND = ["A3", "B1b", "B3a", "B3b", "B3e", "B5a", "C4a", "D3b", "D7", "E2a", "E2b", "E5b", "E10a", "E11b", "E12a", "E12b", "E13b"];
