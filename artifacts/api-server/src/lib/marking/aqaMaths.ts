/**
 * AQA GCSE Mathematics (8300) marking structure.
 *
 * Sources (all read in full from AQA's own PDFs, see docs/marking/aqa-gcse-maths.md):
 *  - Specification 8300, Version 1.0, 12 September 2014 (content codes N1 to S6, assessment structure and AO weightings).
 *  - Question papers and mark schemes, June 2023 series, Foundation and Higher, Papers 1 to 3
 *    (8300/1F, 2F, 3F, 1H, 2H, 3H), mark schemes "Version: Final 1.0".
 *
 * The topic codes on each past-paper question were assigned by us from the question text.
 * AQA does not publish them, so treat them as a study aid and check them against the paper.
 * Where a question's symbols did not extract cleanly, `check: true` marks the tag as less sure.
 */

export type MathsTier = "foundation" | "higher";
export type MathsArea = "Number" | "Algebra" | "Ratio, proportion and rates of change" | "Geometry and measures" | "Probability" | "Statistics";

export interface MathsTopic {
  code: string;
  area: MathsArea;
  group: string;
  /** Short title written by us from the specification's content statement. */
  title: string;
}

const T = (area: MathsArea, group: string, rows: Array<[string, string]>): MathsTopic[] =>
  rows.map(([code, title]) => ({ code, area, group, title }));

export const MATHS_TOPICS: MathsTopic[] = [
  ...T("Number", "Structure and calculation", [
    ["N1", "Ordering integers, decimals and fractions"], ["N2", "The four operations and place value"],
    ["N3", "Inverse operations and order of operations"], ["N4", "Primes, factors, multiples and prime factorisation"],
    ["N5", "Systematic listing strategies"], ["N6", "Powers and roots"], ["N7", "Calculating with roots and indices"],
    ["N8", "Exact calculation with fractions, pi and surds"], ["N9", "Standard form"],
  ]),
  ...T("Number", "Fractions, decimals and percentages", [
    ["N10", "Terminating and recurring decimals and fractions"], ["N11", "Fractions in ratio problems"], ["N12", "Fractions and percentages as operators"],
  ]),
  ...T("Number", "Measures and accuracy", [
    ["N13", "Standard units of measure"], ["N14", "Estimation and checking"], ["N15", "Rounding and degrees of accuracy"], ["N16", "Limits of accuracy (bounds)"],
  ]),
  ...T("Algebra", "Notation, vocabulary and manipulation", [
    ["A1", "Algebraic notation"], ["A2", "Substituting into formulae and expressions"], ["A3", "Vocabulary of expressions, equations, formulae, inequalities and identities"],
    ["A4", "Simplifying and manipulating expressions"], ["A5", "Using and rearranging formulae"], ["A6", "Equations versus identities; algebraic proof"],
    ["A7", "Functions, inverse functions and composite functions"],
  ]),
  ...T("Algebra", "Graphs", [
    ["A8", "Coordinates in all four quadrants"], ["A9", "Straight-line graphs; parallel and perpendicular lines"], ["A10", "Gradients and intercepts"],
    ["A11", "Roots, intercepts and turning points of quadratics"], ["A12", "Recognising and sketching graphs of functions"],
    ["A13", "Translations and reflections of functions"], ["A14", "Graphs of real-life and non-standard functions"],
    ["A15", "Gradients and areas under graphs"], ["A16", "Equations of circles and tangents"],
  ]),
  ...T("Algebra", "Solving equations and inequalities", [
    ["A17", "Linear equations"], ["A18", "Quadratic equations"], ["A19", "Simultaneous equations"], ["A20", "Iterative methods"],
    ["A21", "Translating situations into equations and solving them"], ["A22", "Linear and quadratic inequalities"],
  ]),
  ...T("Algebra", "Sequences", [
    ["A23", "Generating terms from term-to-term or position-to-term rules"], ["A24", "Special sequences"], ["A25", "nth term of sequences"],
  ]),
  ...T("Ratio, proportion and rates of change", "Ratio, proportion and rates of change", [
    ["R1", "Converting between units, including compound units"], ["R2", "Scale factors, scale diagrams and maps"],
    ["R3", "Expressing one quantity as a fraction of another"], ["R4", "Ratio notation and simplest form"],
    ["R5", "Dividing quantities in a ratio and applying ratio in context"], ["R6", "Multiplicative relationships as ratios or fractions"],
    ["R7", "Proportion as equality of ratios"], ["R8", "Relating ratios to fractions and linear functions"],
    ["R9", "Percentages, percentage change and financial maths"], ["R10", "Direct and inverse proportion"],
    ["R11", "Compound units such as speed, density and pressure"], ["R12", "Comparing lengths, areas and volumes"],
    ["R13", "Equations describing direct and inverse proportion"], ["R14", "Gradient as a rate of change; proportion graphs"],
    ["R15", "Instantaneous and average rates of change"], ["R16", "Growth and decay, compound interest and iterative processes"],
  ]),
  ...T("Geometry and measures", "Properties and constructions", [
    ["G1", "Geometric terminology, notation and diagrams"], ["G2", "Ruler and compass constructions and loci"], ["G3", "Angle properties"],
    ["G4", "Properties of quadrilaterals, triangles and polygons"], ["G5", "Congruence criteria for triangles"], ["G6", "Geometric reasoning and proof"],
    ["G7", "Congruence and similarity through transformations"], ["G8", "Combined transformations and invariance"], ["G9", "Circle definitions and properties"],
    ["G10", "Circle theorems"], ["G11", "Geometry on coordinate axes"], ["G12", "Properties of 3D shapes"], ["G13", "Plans and elevations"],
  ]),
  ...T("Geometry and measures", "Mensuration and calculation", [
    ["G14", "Standard units and related concepts"], ["G15", "Measuring lines and angles; bearings and scale drawings"],
    ["G16", "Areas and volumes of triangles, parallelograms, trapezia and prisms"], ["G17", "Circles, composite shapes, spheres, cones and pyramids"],
    ["G18", "Arc lengths, sector angles and sector areas"], ["G19", "Similarity and the relationships between lengths, areas and volumes"],
    ["G20", "Pythagoras' theorem and trigonometry"], ["G21", "Exact trigonometric values"], ["G22", "Sine and cosine rules"], ["G23", "Area of a triangle using sine"],
  ]),
  ...T("Geometry and measures", "Vectors", [["G24", "Translations as 2D vectors"], ["G25", "Vector operations and geometric proof"]]),
  ...T("Probability", "Probability", [
    ["P1", "Frequency of outcomes; tables and frequency trees"], ["P2", "Randomness, fairness and expected outcomes"],
    ["P3", "Relative expected frequency and theoretical probability"], ["P4", "Probabilities of exhaustive outcomes sum to 1"],
    ["P5", "Empirical and theoretical distributions as sample size grows"], ["P6", "Systematic enumeration of sets and combinations"],
    ["P7", "Possibility spaces and theoretical probabilities"], ["P8", "Independent and dependent combined events"], ["P9", "Conditional probability"],
  ]),
  ...T("Statistics", "Statistics", [
    ["S1", "Inferring population properties from samples, and sampling limitations"], ["S2", "Tables, charts and diagrams for categorical and time series data"],
    ["S3", "Histograms and cumulative frequency graphs"], ["S4", "Comparing distributions (graphs, box plots, averages and spread)"],
    ["S5", "Describing a population"], ["S6", "Scatter graphs, correlation and lines of best fit"],
  ]),
];

/** Mark types as defined in the June 2023 mark schemes. */
export const MATHS_MARK_TYPES: Record<string, string> = {
  M: "Method mark: a correct method, even if it does not reach the right answer.",
  A: "Accuracy mark: a correct answer, only after a correct method.",
  B: "Mark given independent of method.",
  ft: "Follow-through: credit for correct working that uses an earlier wrong answer.",
  SC: "Special case: a common misreading that still shows some maths worth rewarding.",
};

export interface MathsPaperSpec {
  id: string;
  tier: MathsTier;
  paper: 1 | 2 | 3;
  code: string;
  calculator: boolean;
  marks: 80;
  minutes: 90;
  weighting: "33⅓% of the qualification";
}

export const MATHS_PAPERS: MathsPaperSpec[] = (["foundation", "higher"] as MathsTier[]).flatMap((tier) =>
  ([1, 2, 3] as const).map((paper) => ({
    id: `${tier === "higher" ? "H" : "F"}${paper}`, tier, paper, code: `8300/${paper}${tier === "higher" ? "H" : "F"}`,
    calculator: paper !== 1, marks: 80 as const, minutes: 90 as const, weighting: "33⅓% of the qualification" as const,
  })),
);

/** Assessment objective weightings from the specification (approximate, overall for the tier). */
export const MATHS_AO_WEIGHTS = {
  AO1: { meaning: "Use and apply standard techniques", foundation: 50, higher: 40 },
  AO2: { meaning: "Reason, interpret and communicate mathematically", foundation: 25, higher: 30 },
  AO3: { meaning: "Solve problems within mathematics and in other contexts", foundation: 25, higher: 30 },
} as const;

export interface PastPaperQuestion {
  paper: string; // MathsPaperSpec.id
  q: string;
  marks: number;
  topics: string[];
  /** Tag is less sure because the question's symbols did not extract cleanly. */
  check?: boolean;
}

type Row = [string, number, string, boolean?];
const rows = (paper: string, list: Row[]): PastPaperQuestion[] =>
  list.map(([q, marks, topics, check]) => ({ paper, q, marks, topics: topics.split(" "), ...(check ? { check } : {}) }));

/** AQA 8300 June 2023 (mark scheme Version: Final 1.0). Topic codes assigned by us. */
export const MATHS_JUN23: PastPaperQuestion[] = [
  ...rows("H1", [
    ["1a", 1, "N2"], ["1b", 1, "N8"], ["1c", 1, "N2"], ["2", 1, "A22"], ["3", 1, "N7", true], ["4", 3, "R5 G3"], ["5", 3, "N4"],
    ["6", 4, "R5 N12"], ["7", 3, "N4 N7"], ["8", 2, "A4"], ["9", 2, "A12"], ["10", 5, "A21 N14"], ["11a", 1, "P7"], ["11b", 1, "P7"], ["11c", 1, "P7"],
    ["12a", 1, "N9"], ["12b", 2, "N9"], ["13a", 2, "A7 A6"], ["13b", 2, "A7 R10"], ["14", 2, "S4"], ["15", 4, "G5 G7 G4"], ["16", 4, "A19"],
    ["17", 3, "G17 R12"], ["18", 1, "N6", true], ["19", 2, "N5 P6"], ["20", 3, "A21"], ["21", 2, "A11"], ["22", 3, "N8", true], ["23", 3, "N10"],
    ["24", 5, "A9 G11"], ["25", 4, "G21 N8"], ["26", 4, "G9 G20"], ["27", 3, "R11 A4"],
  ]),
  ...rows("H2", [
    ["1", 1, "R4"], ["2", 1, "A24"], ["3", 1, "N3"], ["4", 2, "R9"], ["5", 4, "A21 N12"], ["6a", 2, "G4"], ["6b", 1, "G4"], ["7a", 2, "P7"], ["7b", 1, "P7"], ["7c", 2, "P3"],
    ["8", 2, "A6"], ["9", 4, "G11 G16"], ["10", 2, "G24"], ["11", 4, "G17 R11"], ["12", 2, "G7"], ["13", 2, "A4 R1", true], ["14a", 3, "S4 S1"], ["14b", 1, "S1"],
    ["14c", 3, "S5"], ["14d", 1, "S5"], ["15", 2, "A4"], ["16", 3, "A9"], ["17", 4, "G10 G3"], ["18", 3, "A5"], ["19", 4, "A25"], ["20a", 1, "G10"], ["20b", 1, "G10"],
    ["20c", 1, "G10"], ["21", 3, "R16"], ["22a", 2, "A20"], ["22b", 1, "A20"], ["23", 4, "P8"], ["24", 3, "N16"], ["25", 3, "A4"], ["26a", 1, "A13"], ["26b", 1, "A13"], ["26c", 2, "A13"],
  ]),
  ...rows("H3", [
    ["1", 1, "A9"], ["2", 1, "N10"], ["3", 2, "A17"], ["4", 2, "R2"], ["5", 3, "R16"], ["6", 2, "R12"], ["7a", 2, "A12"], ["7b", 2, "A12"], ["8", 4, "R5"], ["9", 3, "S2"],
    ["10", 3, "G20"], ["11a", 2, "N14"], ["11b", 1, "N14"], ["12a", 1, "P5"], ["12b", 1, "P5"], ["12c", 2, "P3"], ["13", 4, "R11"], ["14", 4, "R9"], ["15a", 3, "S3"], ["15b", 3, "S3 S5"],
    ["16", 4, "G20 R4"], ["17", 4, "A17"], ["18a", 3, "A7"], ["18b", 3, "A7 A18"], ["19", 3, "A6"], ["20a", 1, "R10"], ["20b", 4, "R13"], ["21", 3, "G13"], ["22", 3, "G8"],
    ["23a", 2, "G20 G22"], ["23b", 4, "G15 G22"],
  ]),
  ...rows("F1", [
    ["1a", 1, "N4"], ["1b", 1, "N6"], ["1c", 1, "N2"], ["1d", 1, "N2"], ["2a", 1, "G15"], ["2b", 1, "G15"], ["2c", 1, "G16"], ["2d", 1, "G16"], ["3a", 1, "N2"], ["3b", 1, "N2"],
    ["3c", 1, "N6"], ["3d", 1, "N6"], ["4", 2, "R3"], ["5", 4, "R9 N2"], ["6a", 1, "N8"], ["6b", 1, "N10"], ["7", 4, "S2"], ["8a", 2, "A2"], ["8b", 3, "A5"], ["9", 3, "N3"],
    ["10", 3, "N3"], ["11", 2, "R1"], ["12", 1, "R9"], ["13", 3, "R5"], ["14", 3, "S4"], ["15", 3, "R9 G16"], ["16", 3, "R11"], ["17", 3, "R5 G3"], ["18", 3, "N4"], ["19", 4, "R5 N12"],
    ["20a", 1, "S6"], ["20b", 6, "R9 N2"], ["22", 2, "A4"], ["23", 2, "A12"], ["24", 5, "A21"], ["25", 4, "N8"],
  ]),
  ...rows("F2", [
    ["1a", 1, "N1"], ["1b", 1, "N1"], ["2", 4, "A4"], ["3a", 2, "G16"], ["3b", 1, "G5"], ["3c", 1, "G4"], ["3d", 2, "G7"], ["4a", 1, "A8"], ["4b", 1, "A8 G4"], ["5a", 2, "N2"], ["5b", 4, "R7"],
    ["6", 2, "P6"], ["7a", 2, "N4"], ["7b", 2, "N4"], ["7c", 2, "N6 N4"], ["8a", 3, "P1"], ["8b", 2, "P3"], ["9a", 2, "N2"], ["9b", 3, "N13"], ["10a", 2, "N12"], ["10b", 1, "R6"], ["10c", 2, "R3 R9"],
    ["11a", 2, "P7"], ["11b", 1, "P7"], ["11c", 1, "A21"], ["12", 2, "R4"], ["13", 4, "R9"], ["14", 1, "A4"], ["15", 2, "A22"], ["16", 2, "A25"], ["17", 4, "A21 N12"],
    ["18a", 2, "P7"], ["18b", 1, "P7"], ["18c", 2, "P3"], ["19a", 2, "G4"], ["19b", 1, "G4"], ["20", 2, "G24"], ["21", 4, "G17 R11"], ["22", 2, "G7"], ["23", 2, "A4 R1", true],
  ]),
  ...rows("F3", [
    ["1a", 1, "A17"], ["1b", 1, "A17"], ["1c", 1, "A17"], ["2a", 1, "S5"], ["2b", 2, "S5"], ["2c", 1, "S5"], ["3a", 2, "P2"], ["3b", 2, "P7"], ["4", 3, "N13 R3"], ["5a", 2, "A23"], ["5b", 2, "A23"],
    ["6a", 1, "R11 A14"], ["6b", 1, "A14"], ["6c", 2, "R11"], ["7", 4, "R9"], ["8", 3, "N16"], ["9", 3, "A3"], ["10a", 1, "A1"], ["10b", 2, "A4"], ["11", 2, "R5 G3"], ["12a", 2, "A22"],
    ["12b", 2, "A22"], ["13", 2, "G3"], ["14", 3, "A3"], ["15", 4, "R5"], ["16", 3, "G16 A17"], ["17", 2, "A24"], ["18", 3, "R16"], ["19", 2, "R12"], ["20a", 2, "A12"], ["20b", 2, "A12"],
    ["21", 4, "R5"], ["22", 3, "S2"], ["23", 3, "G20"], ["24a", 2, "N14"], ["24b", 1, "N14"], ["25a", 2, "A4"], ["25b", 1, "A18"],
  ]),
];


export interface ExtraSeriesQuestion extends PastPaperQuestion {
  /** Series the question comes from, e.g. "June 2022". */
  series: string;
  note?: string;
}

/**
 * Questions from other series, used only to give a real question for topics that the June 2023
 * papers do not test. Mark schemes: AQA "Version: Final" documents for the same series.
 * `paper` here is the AQA paper code, e.g. "83001H".
 */
export const MATHS_COVERAGE_EXTRAS: ExtraSeriesQuestion[] = [
  { series: "November 2022", paper: "83001H", q: "18", marks: 3, topics: ["N11"] },
  { series: "June 2022", paper: "83002F", q: "5c", marks: 1, topics: ["N15"] },
  { series: "June 2022", paper: "83002F", q: "19c", marks: 1, topics: ["A10"] },
  { series: "November 2022", paper: "83002H", q: "26", marks: 4, topics: ["A15"], note: "Area under a speed-time graph." },
  { series: "June 2022", paper: "83001H", q: "25b", marks: 2, topics: ["A15"], note: "Total distance from a speed-time graph." },
  { series: "November 2022", paper: "83001H", q: "22", marks: 5, topics: ["A16"], note: "Tangent to a circle at a point." },
  { series: "November 2022", paper: "83003H", q: "19", marks: 1, topics: ["A16"], note: "Equation of a circle." },
  { series: "June 2019", paper: "83002F", q: "27", marks: 1, topics: ["R8"] },
  { series: "June 2022", paper: "83001H", q: "25a", marks: 1, topics: ["R14"], note: "Acceleration read as the gradient of a speed-time graph." },
  { series: "June 2022", paper: "83001F", q: "17", marks: 1, topics: ["G1"], note: "Naming the shaded part of a circle." },
  { series: "June 2022", paper: "83001H", q: "10", marks: 3, topics: ["G2"], note: "Ruler and compasses." },
  { series: "June 2022", paper: "83002H", q: "28", marks: 4, topics: ["G6"], note: "Geometric proof." },
  { series: "June 2022", paper: "83001H", q: "15", marks: 1, topics: ["G12"], note: "Faces of a prism." },
  { series: "November 2022", paper: "83002H", q: "15", marks: 1, topics: ["G14"], note: "Area unit conversions." },
  { series: "November 2022", paper: "83003H", q: "11", marks: 4, topics: ["G18"], check: true, note: "Arc of a semicircle." },
  { series: "June 2022", paper: "83002H", q: "13b", marks: 3, topics: ["G19"], note: "Similar solids." },
  { series: "June 2023", paper: "83003H", q: "16", marks: 4, topics: ["G23"], check: true, note: "The mark scheme's Alternative method 2 uses the half ab sin C formula; the main question is solvable without it." },
  { series: "June 2022", paper: "83001H", q: "21", marks: 4, topics: ["G25"], note: "Vectors." },
  { series: "November 2022", paper: "83003H", q: "13a", marks: 1, topics: ["P4"] },
  { series: "November 2020", paper: "83001H", q: "7", marks: 4, topics: ["P9"], check: true, note: "Closest match found: a Venn diagram built from a stated fraction of a group. Not a clear conditional probability question." },
];

/** Topics with no clear question found in the papers checked (June 2018, 2019, 2022, 2023; November 2020, 2022). */
export const MATHS_NO_QUESTION_FOUND = ["R15"];

export const MATHS_SOURCES = [
  { id: "spec", title: "AQA GCSE Mathematics 8300 specification, Version 1.0, 12 September 2014 (exams May/June 2017 onwards)", url: "https://filestore.aqa.org.uk/resources/mathematics/specifications/AQA-8300-SP-2015.PDF" },
  ...MATHS_PAPERS.flatMap((p) => {
    const c = p.code.replace("8300/", "8300");
    return [
      { id: `${p.id}-qp`, title: `${p.code} question paper, June 2023`, url: `https://filestore.aqa.org.uk/sample-papers-and-mark-schemes/2023/june/AQA-${c}-QP-JUN23.PDF` },
      { id: `${p.id}-ms`, title: `${p.code} mark scheme, June 2023, Version: Final 1.0`, url: `https://filestore.aqa.org.uk/sample-papers-and-mark-schemes/2023/june/AQA-${c}-MS-JUN23.PDF` },
    ];
  }),
];

export function mathsTopicByCode(code: string): MathsTopic | undefined {
  return MATHS_TOPICS.find((t) => t.code === code);
}
