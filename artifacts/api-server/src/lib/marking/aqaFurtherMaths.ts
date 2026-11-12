/**
 * AQA Level 2 Certificate in Further Mathematics (8365) marking structure.
 *
 * Sources, all downloaded from AQA's file server and read as text:
 *  - Specification 8365, "For exams in May/June 2020 onwards. Version 1.4 November 2020".
 *  - Question papers 8365/1 (non-calculator) and 8365/2 (calculator), June 2022 and June 2023,
 *    mark schemes "Version: 1.0 Final" (June 2023 Paper 1 confirmed).
 *
 * Topic titles are ours, written from the specification's content statements (codes follow the
 * specification: 1.1 Number to 6.10 Geometry). Which question tests which topic is our judgement;
 * `confidence: "check"` marks looser matches.
 */

export interface FurtherMathsTopic {
  code: string;
  section: string;
  title: string;
}

export interface FurtherMathsCoverage {
  code: string;
  series: "June 2022" | "June 2023";
  /** "83651" is Paper 1 (non-calculator), "83652" is Paper 2 (calculator). */
  paper: string;
  q: string;
  marks: number;
  confidence: "ok" | "check";
}

export const FURTHER_MATHS_TOPICS: FurtherMathsTopic[] = [
  { code: "1.1", section: "Number", title: "Number and the number system" },
  { code: "1.2", section: "Number", title: "The product rule for counting" },
  { code: "1.3", section: "Number", title: "Manipulating surds" },
  { code: "2.1", section: "Algebra", title: "Basic processes of algebra" },
  { code: "2.2", section: "Algebra", title: "Definition of a function" },
  { code: "2.3", section: "Algebra", title: "Domain and range of a function" },
  { code: "2.4", section: "Algebra", title: "Composite functions" },
  { code: "2.5", section: "Algebra", title: "Inverse functions" },
  { code: "2.6", section: "Algebra", title: "Expanding brackets and collecting like terms" },
  { code: "2.7", section: "Algebra", title: "Binomial expansion of (a + b) to the n" },
  { code: "2.8", section: "Algebra", title: "Factorising" },
  { code: "2.9", section: "Algebra", title: "Algebraic fractions" },
  { code: "2.10", section: "Algebra", title: "Using and rearranging formulae and expressions" },
  { code: "2.11", section: "Algebra", title: "Factor theorem for polynomials" },
  { code: "2.12", section: "Algebra", title: "Completing the square" },
  { code: "2.13", section: "Algebra", title: "Drawing and sketching functions; interpreting graphs" },
  { code: "2.14", section: "Algebra", title: "Solving linear and quadratic equations" },
  { code: "2.15", section: "Algebra", title: "Simultaneous equations (linear and non-linear)" },
  { code: "2.16", section: "Algebra", title: "Linear equations in three unknowns" },
  { code: "2.17", section: "Algebra", title: "Linear and quadratic inequalities" },
  { code: "2.18", section: "Algebra", title: "Index laws including fractional and negative indices" },
  { code: "2.19", section: "Algebra", title: "Algebraic proof" },
  { code: "2.20", section: "Algebra", title: "Using nth terms; limiting values of sequences" },
  { code: "2.21", section: "Algebra", title: "nth term of linear sequences" },
  { code: "2.22", section: "Algebra", title: "nth term of quadratic sequences" },
  { code: "3.1", section: "Coordinate geometry (2D)", title: "Definition of a gradient" },
  { code: "3.2", section: "Coordinate geometry (2D)", title: "Gradients of parallel and perpendicular lines" },
  { code: "3.3", section: "Coordinate geometry (2D)", title: "Distance between two points" },
  { code: "3.4", section: "Coordinate geometry (2D)", title: "Coordinates of a point on a line using ratio" },
  { code: "3.5", section: "Coordinate geometry (2D)", title: "Equation of a straight line" },
  { code: "3.6", section: "Coordinate geometry (2D)", title: "Drawing a straight line from given information" },
  { code: "3.7", section: "Coordinate geometry (2D)", title: "Equation of a circle, centre the origin" },
  { code: "3.8", section: "Coordinate geometry (2D)", title: "Equation of a circle, centre (a, b)" },
  { code: "3.9", section: "Coordinate geometry (2D)", title: "Tangent to a circle at a point" },
  { code: "4.1", section: "Calculus", title: "The gradient function and rate of change" },
  { code: "4.2", section: "Calculus", title: "Gradient of a function as the gradient of the tangent" },
  { code: "4.3", section: "Calculus", title: "Differentiating kx to the n" },
  { code: "4.4", section: "Calculus", title: "Tangent and normal to a curve" },
  { code: "4.5", section: "Calculus", title: "Increasing and decreasing functions" },
  { code: "4.6", section: "Calculus", title: "Second derivative notation" },
  { code: "4.7", section: "Calculus", title: "Maxima and minima by differentiation" },
  { code: "4.8", section: "Calculus", title: "Calculus in simple optimisation problems" },
  { code: "4.9", section: "Calculus", title: "Sketching a curve from its maximum and minimum points" },
  { code: "5.1", section: "Matrix transformations", title: "Multiplying matrices" },
  { code: "5.2", section: "Matrix transformations", title: "The identity matrix" },
  { code: "5.3", section: "Matrix transformations", title: "Transformations of the unit square" },
  { code: "5.4", section: "Matrix transformations", title: "Combining transformations" },
  { code: "6.1", section: "Geometry", title: "Perimeter, area and volume" },
  { code: "6.2", section: "Geometry", title: "Geometrical proofs" },
  { code: "6.3", section: "Geometry", title: "Sine and cosine rules; area of a triangle" },
  { code: "6.4", section: "Geometry", title: "Pythagoras in 2D and 3D" },
  { code: "6.5", section: "Geometry", title: "Trigonometry in 2D and 3D problems" },
  { code: "6.6", section: "Geometry", title: "Graphs of sine, cosine and tangent" },
  { code: "6.7", section: "Geometry", title: "Trigonometric ratios for any angle" },
  { code: "6.8", section: "Geometry", title: "Exact values from 30-60-90 and 45-45-90 triangles" },
  { code: "6.9", section: "Geometry", title: "tan = sin over cos, and sin squared plus cos squared" },
  { code: "6.10", section: "Geometry", title: "Solving simple trigonometric equations" },
];

export const FURTHER_MATHS_PAPERS = [
  { code: "8365/1", calculator: false, minutes: 105, marks: 80, weighting: "50% of the certificate" },
  { code: "8365/2", calculator: true, minutes: 105, marks: 80, weighting: "50% of the certificate" },
] as const;

/** Assessment objective weightings from the specification (approximate, overall). */
export const FURTHER_MATHS_AO_WEIGHTS = {
  AO1: { meaning: "Recall and use knowledge of the prescribed content for routine and multi-step procedures", percentLow: 56, percentHigh: 64 },
  AO2: { meaning: "Apply mathematical reasoning, skills and knowledge to solve problems, including rigorous justification and formal proof", percentLow: 36, percentHigh: 44 },
} as const;

export const FURTHER_MATHS_COVERAGE: FurtherMathsCoverage[] = [
  { code: "1.1", series: "June 2022", paper: "83651", q: "1", marks: 3, confidence: "check" },
  { code: "1.2", series: "June 2022", paper: "83652", q: "7", marks: 2, confidence: "ok" },
  { code: "1.2", series: "June 2023", paper: "83652", q: "22", marks: 3, confidence: "ok" },
  { code: "1.3", series: "June 2022", paper: "83651", q: "10", marks: 3, confidence: "ok" },
  { code: "1.3", series: "June 2023", paper: "83651", q: "10", marks: 4, confidence: "ok" },
  { code: "2.1", series: "June 2023", paper: "83652", q: "1", marks: 3, confidence: "check" },
  { code: "2.2", series: "June 2022", paper: "83651", q: "3a", marks: 4, confidence: "ok" },
  { code: "2.2", series: "June 2023", paper: "83651", q: "1a", marks: 2, confidence: "ok" },
  { code: "2.3", series: "June 2023", paper: "83652", q: "15", marks: 4, confidence: "ok" },
  { code: "2.4", series: "June 2023", paper: "83651", q: "1b", marks: 2, confidence: "ok" },
  { code: "2.5", series: "June 2022", paper: "83651", q: "3b", marks: 2, confidence: "ok" },
  { code: "2.6", series: "June 2022", paper: "83652", q: "19", marks: 3, confidence: "ok" },
  { code: "2.6", series: "June 2023", paper: "83652", q: "11", marks: 4, confidence: "ok" },
  { code: "2.7", series: "June 2022", paper: "83651", q: "11", marks: 4, confidence: "ok" },
  { code: "2.7", series: "June 2023", paper: "83652", q: "16", marks: 4, confidence: "check" },
  { code: "2.8", series: "June 2022", paper: "83652", q: "1", marks: 2, confidence: "ok" },
  { code: "2.8", series: "June 2023", paper: "83651", q: "2", marks: 2, confidence: "ok" },
  { code: "2.9", series: "June 2022", paper: "83652", q: "15", marks: 5, confidence: "ok" },
  { code: "2.9", series: "June 2023", paper: "83652", q: "14", marks: 4, confidence: "ok" },
  { code: "2.10", series: "June 2022", paper: "83651", q: "14", marks: 3, confidence: "ok" },
  { code: "2.10", series: "June 2023", paper: "83651", q: "9", marks: 4, confidence: "ok" },
  { code: "2.11", series: "June 2022", paper: "83652", q: "20a", marks: 2, confidence: "ok" },
  { code: "2.11", series: "June 2023", paper: "83652", q: "16", marks: 4, confidence: "ok" },
  { code: "2.12", series: "June 2022", paper: "83651", q: "19", marks: 3, confidence: "ok" },
  { code: "2.12", series: "June 2023", paper: "83651", q: "19", marks: 3, confidence: "ok" },
  { code: "2.13", series: "June 2022", paper: "83652", q: "10", marks: 1, confidence: "ok" },
  { code: "2.14", series: "June 2022", paper: "83652", q: "8b", marks: 2, confidence: "ok" },
  { code: "2.14", series: "June 2022", paper: "83651", q: "1", marks: 3, confidence: "ok" },
  { code: "2.15", series: "June 2022", paper: "83651", q: "16", marks: 6, confidence: "ok" },
  { code: "2.15", series: "June 2023", paper: "83651", q: "8", marks: 6, confidence: "ok" },
  { code: "2.16", series: "June 2022", paper: "83652", q: "17", marks: 5, confidence: "ok" },
  { code: "2.16", series: "June 2023", paper: "83651", q: "18", marks: 5, confidence: "ok" },
  { code: "2.17", series: "June 2022", paper: "83652", q: "5", marks: 3, confidence: "ok" },
  { code: "2.17", series: "June 2023", paper: "83651", q: "14", marks: 4, confidence: "ok" },
  { code: "2.18", series: "June 2022", paper: "83651", q: "13", marks: 3, confidence: "ok" },
  { code: "2.18", series: "June 2022", paper: "83652", q: "22", marks: 4, confidence: "ok" },
  { code: "2.19", series: "June 2022", paper: "83652", q: "6", marks: 3, confidence: "ok" },
  { code: "2.19", series: "June 2023", paper: "83651", q: "5", marks: 3, confidence: "ok" },
  { code: "2.20", series: "June 2022", paper: "83651", q: "12b", marks: 1, confidence: "ok" },
  { code: "2.21", series: "June 2023", paper: "83652", q: "2a", marks: 2, confidence: "ok" },
  { code: "2.22", series: "June 2022", paper: "83651", q: "9a", marks: 3, confidence: "ok" },
  { code: "3.1", series: "June 2023", paper: "83651", q: "4a", marks: 2, confidence: "ok" },
  { code: "3.2", series: "June 2022", paper: "83652", q: "4", marks: 4, confidence: "ok" },
  { code: "3.2", series: "June 2023", paper: "83652", q: "10", marks: 3, confidence: "ok" },
  { code: "3.3", series: "June 2023", paper: "83651", q: "4b", marks: 3, confidence: "ok" },
  { code: "3.4", series: "June 2022", paper: "83652", q: "2", marks: 2, confidence: "ok" },
  { code: "3.4", series: "June 2023", paper: "83652", q: "4", marks: 4, confidence: "ok" },
  { code: "3.5", series: "June 2022", paper: "83651", q: "2", marks: 2, confidence: "ok" },
  { code: "3.7", series: "June 2023", paper: "83651", q: "8", marks: 6, confidence: "ok" },
  { code: "3.8", series: "June 2023", paper: "83652", q: "6", marks: 2, confidence: "ok" },
  { code: "3.8", series: "June 2022", paper: "83652", q: "13", marks: 3, confidence: "ok" },
  { code: "3.9", series: "June 2022", paper: "83651", q: "17b", marks: 4, confidence: "ok" },
  { code: "4.1", series: "June 2023", paper: "83652", q: "5", marks: 3, confidence: "ok" },
  { code: "4.2", series: "June 2022", paper: "83652", q: "12", marks: 5, confidence: "ok" },
  { code: "4.3", series: "June 2022", paper: "83651", q: "6", marks: 3, confidence: "ok" },
  { code: "4.4", series: "June 2023", paper: "83651", q: "6", marks: 4, confidence: "ok" },
  { code: "4.5", series: "June 2023", paper: "83652", q: "17", marks: 4, confidence: "ok" },
  { code: "4.6", series: "June 2023", paper: "83651", q: "11", marks: 3, confidence: "ok" },
  { code: "4.7", series: "June 2022", paper: "83651", q: "20", marks: 6, confidence: "ok" },
  { code: "4.8", series: "June 2023", paper: "83652", q: "9c", marks: 3, confidence: "ok" },
  { code: "5.1", series: "June 2022", paper: "83652", q: "3a", marks: 3, confidence: "ok" },
  { code: "5.2", series: "June 2023", paper: "83651", q: "3b", marks: 2, confidence: "ok" },
  { code: "5.3", series: "June 2023", paper: "83651", q: "3a", marks: 1, confidence: "ok" },
  { code: "5.4", series: "June 2022", paper: "83651", q: "8", marks: 3, confidence: "ok" },
  { code: "6.1", series: "June 2023", paper: "83651", q: "7", marks: 4, confidence: "ok" },
  { code: "6.2", series: "June 2022", paper: "83651", q: "15", marks: 5, confidence: "ok" },
  { code: "6.3", series: "June 2022", paper: "83652", q: "16", marks: 4, confidence: "ok" },
  { code: "6.3", series: "June 2023", paper: "83651", q: "20", marks: 6, confidence: "ok" },
  { code: "6.4", series: "June 2022", paper: "83652", q: "18", marks: 5, confidence: "ok" },
  { code: "6.5", series: "June 2023", paper: "83652", q: "12", marks: 3, confidence: "ok" },
  { code: "6.6", series: "June 2022", paper: "83651", q: "4b", marks: 2, confidence: "ok" },
  { code: "6.7", series: "June 2023", paper: "83652", q: "18", marks: 3, confidence: "ok" },
  { code: "6.8", series: "June 2022", paper: "83651", q: "4a", marks: 1, confidence: "ok" },
  { code: "6.9", series: "June 2022", paper: "83651", q: "21", marks: 3, confidence: "ok" },
  { code: "6.9", series: "June 2023", paper: "83652", q: "20", marks: 3, confidence: "ok" },
  { code: "6.10", series: "June 2022", paper: "83652", q: "21", marks: 4, confidence: "ok" },
  { code: "6.10", series: "June 2023", paper: "83651", q: "12b", marks: 3, confidence: "ok" },
];

/** Topics with no clear question in the June 2022 and June 2023 papers checked. */
export const FURTHER_MATHS_NO_QUESTION_FOUND = ["3.6", "4.9"];
