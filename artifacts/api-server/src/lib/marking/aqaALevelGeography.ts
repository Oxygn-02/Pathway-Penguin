/**
 * AQA A-level Geography (7037) marking structure.
 *
 * Sources, all downloaded from AQA's file server and read as text:
 *  - Specification 7037, "A-level exams June 2018 onwards. Version 1.2 2 September 2019".
 *  - Question papers and mark schemes 7037/1 (physical) and 7037/2 (human), June 2022 and June 2023, mark schemes "Version: 1.0 Final".
 *
 * Topics are the specification's numbered content sections (for example 3.1.3.3) with AQA's headings. The "Quantitative and qualitative skills"
 * and "Case studies" sections, and parent headings with no content of their own, are not listed as topics. Which question tests which
 * section is our judgement; `confidence: "check"` marks looser matches. A question code "2.3" means paper question 2, part 3, and `marks`
 * is the total printed for that part. Data-response parts whose figures could not be read from the text are not mapped.
 */

export interface ALevelGeographyTopic {
  code: string;
  group: string;
  title: string;
}

export interface ALevelGeographyCoverage {
  code: string;
  series: "June 2022" | "June 2023";
  paper: "7037/1" | "7037/2";
  q: string;
  marks: number;
  confidence: "ok" | "check";
}

export const ALEVEL_GEOG_PAPERS = [
  { code: "7037/1", title: "Physical geography: water and carbon cycles; one of hot deserts, coasts, glaciers; one of hazards, ecosystems under stress", minutes: 150, marks: 120, weighting: "40% of the A level" },
  { code: "7037/2", title: "Human geography: global systems; changing places; one of urban, population, resource security", minutes: 150, marks: 120, weighting: "40% of the A level" },
  { code: "7037/3", title: "Geography fieldwork investigation (non-exam assessment, 3,000 to 4,000 words)", minutes: 0, marks: 60, weighting: "20% of the A level" },
] as const;

/** Overall ranges from section 4.2.1 of the specification (approximate %). AO3 includes fieldwork skills. */
export const ALEVEL_GEOG_AO_WEIGHTS = { AO1: [30, 40], AO2: [30, 40], AO3: [20, 30] } as const;

/** Mark structure of the written papers, read from the June 2022 and June 2023 mark schemes. */
export const ALEVEL_GEOG_QUESTION_TYPES = [
  { marks: 4, method: "point marked: one mark per valid point, extra marks for developed points", ao: "AO1" },
  { marks: 6, method: "levels of response: Level 2 4-6, Level 1 1-3", ao: "AO3 (data analysis) or AO1 2 + AO2 4" },
  { marks: 9, method: "levels of response: Level 3 7-9, Level 2 4-6, Level 1 1-3", ao: "AO1 4 + AO2 5" },
  { marks: 20, method: "levels of response: Level 4 16-20, Level 3 11-15, Level 2 6-10, Level 1 1-5", ao: "AO1 10 + AO2 10" },
] as const;

export const ALEVEL_GEOG_TOPICS: ALevelGeographyTopic[] = [
  { code: "3.1.1.1", group: "Water and carbon cycles", title: "Water and carbon cycles as natural systems" },
  { code: "3.1.1.2", group: "Water and carbon cycles", title: "The water cycle" },
  { code: "3.1.1.3", group: "Water and carbon cycles", title: "The carbon cycle" },
  { code: "3.1.1.4", group: "Water and carbon cycles", title: "Water, carbon, climate and life on Earth" },
  { code: "3.1.2.1", group: "Hot desert systems and landscapes", title: "Deserts as natural systems" },
  { code: "3.1.2.2", group: "Hot desert systems and landscapes", title: "Systems and processes" },
  { code: "3.1.2.3", group: "Hot desert systems and landscapes", title: "Arid landscape development in contrasting settings" },
  { code: "3.1.2.4", group: "Hot desert systems and landscapes", title: "Desertification" },
  { code: "3.1.3.1", group: "Coastal systems and landscapes", title: "Coasts as natural systems" },
  { code: "3.1.3.2", group: "Coastal systems and landscapes", title: "Systems and processes" },
  { code: "3.1.3.3", group: "Coastal systems and landscapes", title: "Coastal landscape development" },
  { code: "3.1.3.4", group: "Coastal systems and landscapes", title: "Coastal management" },
  { code: "3.1.4.1", group: "Glacial systems and landscapes", title: "Glaciers as natural systems" },
  { code: "3.1.4.2", group: "Glacial systems and landscapes", title: "The nature and distribution of cold environments" },
  { code: "3.1.4.3", group: "Glacial systems and landscapes", title: "Systems and processes" },
  { code: "3.1.4.4", group: "Glacial systems and landscapes", title: "Glaciated landscape development" },
  { code: "3.1.4.5", group: "Glacial systems and landscapes", title: "Human impacts on cold environments" },
  { code: "3.1.5.1", group: "Hazards", title: "The concept of hazard in a geographical context" },
  { code: "3.1.5.2", group: "Hazards", title: "Plate tectonics" },
  { code: "3.1.5.3", group: "Hazards", title: "Volcanic hazards" },
  { code: "3.1.5.4", group: "Hazards", title: "Seismic hazards" },
  { code: "3.1.5.5", group: "Hazards", title: "Storm hazards" },
  { code: "3.1.5.6", group: "Hazards", title: "Fires in nature" },
  { code: "3.1.6.1", group: "Ecosystems under stress", title: "Ecosystems and sustainability" },
  { code: "3.1.6.2", group: "Ecosystems under stress", title: "Ecosystems and processes" },
  { code: "3.1.6.3", group: "Ecosystems under stress", title: "Biomes" },
  { code: "3.1.6.4", group: "Ecosystems under stress", title: "Ecosystems in the British Isles over time" },
  { code: "3.1.6.5", group: "Ecosystems under stress", title: "Marine ecosystems" },
  { code: "3.1.6.6", group: "Ecosystems under stress", title: "Local ecosystems" },
  { code: "3.2.1.1", group: "Global systems and global governance", title: "Globalisation" },
  { code: "3.2.1.2", group: "Global systems and global governance", title: "Global systems" },
  { code: "3.2.1.3", group: "Global systems and global governance", title: "International trade and access to markets" },
  { code: "3.2.1.4", group: "Global systems and global governance", title: "Global governance" },
  { code: "3.2.1.5.1", group: "Global systems and global governance", title: "Antarctica as a global common" },
  { code: "3.2.1.6", group: "Global systems and global governance", title: "Globalisation critique" },
  { code: "3.2.2.1", group: "Changing places", title: "The nature and importance of places" },
  { code: "3.2.2.2.1", group: "Changing places", title: "Relationships and connections" },
  { code: "3.2.2.2.2", group: "Changing places", title: "Meaning and representation" },
  { code: "3.2.2.4", group: "Changing places", title: "Place studies" },
  { code: "3.2.3.1", group: "Contemporary urban environments", title: "Urbanisation" },
  { code: "3.2.3.2", group: "Contemporary urban environments", title: "Urban forms" },
  { code: "3.2.3.3", group: "Contemporary urban environments", title: "Social and economic issues associated with urbanisation" },
  { code: "3.2.3.4", group: "Contemporary urban environments", title: "Urban climate" },
  { code: "3.2.3.5", group: "Contemporary urban environments", title: "Urban drainage" },
  { code: "3.2.3.6", group: "Contemporary urban environments", title: "Urban waste and its disposal" },
  { code: "3.2.3.7", group: "Contemporary urban environments", title: "Other contemporary urban environmental issues" },
  { code: "3.2.3.8", group: "Contemporary urban environments", title: "Sustainable urban development" },
  { code: "3.2.4.1", group: "Population and the environment", title: "Introduction" },
  { code: "3.2.4.2", group: "Population and the environment", title: "Environment and population" },
  { code: "3.2.4.3", group: "Population and the environment", title: "Environment, health and well-being" },
  { code: "3.2.4.4", group: "Population and the environment", title: "Population change" },
  { code: "3.2.4.5", group: "Population and the environment", title: "Principles of population ecology and their application to human populations" },
  { code: "3.2.4.6", group: "Population and the environment", title: "Global population futures" },
  { code: "3.2.5.1", group: "Resource security", title: "Resource development" },
  { code: "3.2.5.2", group: "Resource security", title: "Natural resource issues" },
  { code: "3.2.5.3", group: "Resource security", title: "Water security" },
  { code: "3.2.5.4", group: "Resource security", title: "Energy security" },
  { code: "3.2.5.5", group: "Resource security", title: "Mineral security" },
  { code: "3.2.5.6", group: "Resource security", title: "Resource futures" },
];

export const ALEVEL_GEOG_COVERAGE: ALevelGeographyCoverage[] = [
  { code: "3.1.1.3", series: "June 2022", paper: "7037/1", q: "1.1", marks: 4, confidence: "ok" },
  { code: "3.1.1.2", series: "June 2022", paper: "7037/1", q: "1.2", marks: 6, confidence: "ok" },
  { code: "3.1.1.3", series: "June 2022", paper: "7037/1", q: "1.3", marks: 6, confidence: "check" },
  { code: "3.1.1.4", series: "June 2022", paper: "7037/1", q: "1.4", marks: 20, confidence: "ok" },
  { code: "3.1.2.1", series: "June 2022", paper: "7037/1", q: "2.1", marks: 4, confidence: "ok" },
  { code: "3.1.2.1", series: "June 2022", paper: "7037/1", q: "2.2", marks: 6, confidence: "check" },
  { code: "3.1.2.2", series: "June 2022", paper: "7037/1", q: "2.3", marks: 6, confidence: "ok" },
  { code: "3.1.2.3", series: "June 2022", paper: "7037/1", q: "2.3", marks: 6, confidence: "check" },
  { code: "3.1.2.4", series: "June 2022", paper: "7037/1", q: "2.4", marks: 20, confidence: "ok" },
  { code: "3.1.3.3", series: "June 2022", paper: "7037/1", q: "3.1", marks: 4, confidence: "ok" },
  { code: "3.1.3.3", series: "June 2022", paper: "7037/1", q: "3.2", marks: 6, confidence: "ok" },
  { code: "3.1.3.2", series: "June 2022", paper: "7037/1", q: "3.3", marks: 6, confidence: "ok" },
  { code: "3.1.3.4", series: "June 2022", paper: "7037/1", q: "3.4", marks: 20, confidence: "check" },
  { code: "3.1.4.4", series: "June 2022", paper: "7037/1", q: "4.1", marks: 4, confidence: "ok" },
  { code: "3.1.4.3", series: "June 2022", paper: "7037/1", q: "4.3", marks: 6, confidence: "ok" },
  { code: "3.1.4.5", series: "June 2022", paper: "7037/1", q: "4.4", marks: 20, confidence: "ok" },
  { code: "3.1.5.3", series: "June 2022", paper: "7037/1", q: "5.1", marks: 4, confidence: "ok" },
  { code: "3.1.5.5", series: "June 2022", paper: "7037/1", q: "5.3", marks: 9, confidence: "ok" },
  { code: "3.1.5.6", series: "June 2022", paper: "7037/1", q: "5.4", marks: 9, confidence: "ok" },
  { code: "3.1.5.4", series: "June 2022", paper: "7037/1", q: "5.5", marks: 20, confidence: "ok" },
  { code: "3.1.5.3", series: "June 2022", paper: "7037/1", q: "5.5", marks: 20, confidence: "check" },
  { code: "3.1.6.2", series: "June 2022", paper: "7037/1", q: "6.1", marks: 4, confidence: "ok" },
  { code: "3.1.6.3", series: "June 2022", paper: "7037/1", q: "6.3", marks: 9, confidence: "ok" },
  { code: "3.1.6.4", series: "June 2022", paper: "7037/1", q: "6.4", marks: 9, confidence: "ok" },
  { code: "3.1.6.6", series: "June 2022", paper: "7037/1", q: "6.5", marks: 20, confidence: "ok" },
  { code: "3.1.1.2", series: "June 2023", paper: "7037/1", q: "1.1", marks: 4, confidence: "ok" },
  { code: "3.1.1.2", series: "June 2023", paper: "7037/1", q: "1.2", marks: 6, confidence: "ok" },
  { code: "3.1.1.3", series: "June 2023", paper: "7037/1", q: "1.3", marks: 6, confidence: "ok" },
  { code: "3.1.1.3", series: "June 2023", paper: "7037/1", q: "1.4", marks: 20, confidence: "ok" },
  { code: "3.1.2.2", series: "June 2023", paper: "7037/1", q: "2.1", marks: 4, confidence: "ok" },
  { code: "3.1.2.4", series: "June 2023", paper: "7037/1", q: "2.2", marks: 6, confidence: "check" },
  { code: "3.1.2.2", series: "June 2023", paper: "7037/1", q: "2.3", marks: 6, confidence: "ok" },
  { code: "3.1.2.3", series: "June 2023", paper: "7037/1", q: "2.4", marks: 20, confidence: "ok" },
  { code: "3.1.3.2", series: "June 2023", paper: "7037/1", q: "3.1", marks: 4, confidence: "ok" },
  { code: "3.1.3.4", series: "June 2023", paper: "7037/1", q: "3.3", marks: 6, confidence: "check" },
  { code: "3.1.3.3", series: "June 2023", paper: "7037/1", q: "3.4", marks: 20, confidence: "ok" },
  { code: "3.1.4.3", series: "June 2023", paper: "7037/1", q: "4.1", marks: 4, confidence: "ok" },
  { code: "3.1.4.2", series: "June 2023", paper: "7037/1", q: "4.3", marks: 6, confidence: "check" },
  { code: "3.1.4.4", series: "June 2023", paper: "7037/1", q: "4.4", marks: 20, confidence: "ok" },
  { code: "3.1.5.1", series: "June 2023", paper: "7037/1", q: "5.1", marks: 4, confidence: "ok" },
  { code: "3.1.5.6", series: "June 2023", paper: "7037/1", q: "5.2", marks: 6, confidence: "ok" },
  { code: "3.1.5.4", series: "June 2023", paper: "7037/1", q: "5.3", marks: 9, confidence: "ok" },
  { code: "3.1.5.3", series: "June 2023", paper: "7037/1", q: "5.4", marks: 9, confidence: "ok" },
  { code: "3.1.5.1", series: "June 2023", paper: "7037/1", q: "5.5", marks: 20, confidence: "check" },
  { code: "3.1.6.2", series: "June 2023", paper: "7037/1", q: "6.1", marks: 4, confidence: "ok" },
  { code: "3.1.6.6", series: "June 2023", paper: "7037/1", q: "6.3", marks: 9, confidence: "ok" },
  { code: "3.1.6.2", series: "June 2023", paper: "7037/1", q: "6.4", marks: 9, confidence: "check" },
  { code: "3.1.6.3", series: "June 2023", paper: "7037/1", q: "6.5", marks: 20, confidence: "ok" },
  { code: "3.2.1.5.1", series: "June 2022", paper: "7037/2", q: "1.1", marks: 4, confidence: "ok" },
  { code: "3.2.1.1", series: "June 2022", paper: "7037/2", q: "1.3", marks: 6, confidence: "ok" },
  { code: "3.2.1.3", series: "June 2022", paper: "7037/2", q: "1.4", marks: 20, confidence: "ok" },
  { code: "3.2.2.1", series: "June 2022", paper: "7037/2", q: "2.1", marks: 4, confidence: "ok" },
  { code: "3.2.2.2.1", series: "June 2022", paper: "7037/2", q: "2.3", marks: 6, confidence: "ok" },
  { code: "3.2.2.2.2", series: "June 2022", paper: "7037/2", q: "2.4", marks: 20, confidence: "ok" },
  { code: "3.2.3.4", series: "June 2022", paper: "7037/2", q: "3.1", marks: 4, confidence: "ok" },
  { code: "3.2.3.5", series: "June 2022", paper: "7037/2", q: "3.2", marks: 6, confidence: "ok" },
  { code: "3.2.3.1", series: "June 2022", paper: "7037/2", q: "3.3", marks: 9, confidence: "ok" },
  { code: "3.2.3.6", series: "June 2022", paper: "7037/2", q: "3.4", marks: 9, confidence: "ok" },
  { code: "3.2.3.2", series: "June 2022", paper: "7037/2", q: "3.5", marks: 20, confidence: "ok" },
  { code: "3.2.4.5", series: "June 2022", paper: "7037/2", q: "4.1", marks: 4, confidence: "ok" },
  { code: "3.2.4.2", series: "June 2022", paper: "7037/2", q: "4.3", marks: 9, confidence: "ok" },
  { code: "3.2.4.2", series: "June 2022", paper: "7037/2", q: "4.4", marks: 9, confidence: "check" },
  { code: "3.2.4.3", series: "June 2022", paper: "7037/2", q: "4.5", marks: 20, confidence: "ok" },
  { code: "3.2.5.1", series: "June 2022", paper: "7037/2", q: "5.1", marks: 4, confidence: "ok" },
  { code: "3.2.5.5", series: "June 2022", paper: "7037/2", q: "5.3", marks: 9, confidence: "ok" },
  { code: "3.2.5.3", series: "June 2022", paper: "7037/2", q: "5.4", marks: 9, confidence: "check" },
  { code: "3.2.5.4", series: "June 2022", paper: "7037/2", q: "5.5", marks: 20, confidence: "ok" },
  { code: "3.2.1.1", series: "June 2023", paper: "7037/2", q: "1.1", marks: 4, confidence: "ok" },
  { code: "3.2.1.6", series: "June 2023", paper: "7037/2", q: "1.3", marks: 6, confidence: "check" },
  { code: "3.2.1.5.1", series: "June 2023", paper: "7037/2", q: "1.4", marks: 20, confidence: "ok" },
  { code: "3.2.2.4", series: "June 2023", paper: "7037/2", q: "2.1", marks: 4, confidence: "ok" },
  { code: "3.2.2.2.2", series: "June 2023", paper: "7037/2", q: "2.3", marks: 6, confidence: "ok" },
  { code: "3.2.2.2.1", series: "June 2023", paper: "7037/2", q: "2.4", marks: 20, confidence: "check" },
  { code: "3.2.3.1", series: "June 2023", paper: "7037/2", q: "3.1", marks: 4, confidence: "ok" },
  { code: "3.2.3.7", series: "June 2023", paper: "7037/2", q: "3.3", marks: 9, confidence: "ok" },
  { code: "3.2.3.6", series: "June 2023", paper: "7037/2", q: "3.4", marks: 9, confidence: "ok" },
  { code: "3.2.3.3", series: "June 2023", paper: "7037/2", q: "3.5", marks: 20, confidence: "ok" },
  { code: "3.2.4.2", series: "June 2023", paper: "7037/2", q: "4.1", marks: 4, confidence: "ok" },
  { code: "3.2.4.4", series: "June 2023", paper: "7037/2", q: "4.2", marks: 6, confidence: "check" },
  { code: "3.2.4.3", series: "June 2023", paper: "7037/2", q: "4.3", marks: 9, confidence: "ok" },
  { code: "3.2.4.3", series: "June 2023", paper: "7037/2", q: "4.4", marks: 9, confidence: "ok" },
  { code: "3.2.4.3", series: "June 2023", paper: "7037/2", q: "4.5", marks: 20, confidence: "check" },
  { code: "3.2.5.1", series: "June 2023", paper: "7037/2", q: "5.1", marks: 4, confidence: "ok" },
  { code: "3.2.5.2", series: "June 2023", paper: "7037/2", q: "5.3", marks: 9, confidence: "ok" },
  { code: "3.2.5.5", series: "June 2023", paper: "7037/2", q: "5.4", marks: 9, confidence: "ok" },
  { code: "3.2.5.3", series: "June 2023", paper: "7037/2", q: "5.5", marks: 20, confidence: "ok" },
];

export const ALEVEL_GEOG_NO_QUESTION_FOUND: string[] = ["3.1.1.1", "3.1.3.1", "3.1.4.1", "3.1.5.2", "3.1.6.1", "3.1.6.5", "3.2.1.2", "3.2.1.4", "3.2.3.8", "3.2.4.1", "3.2.4.6", "3.2.5.6"];
