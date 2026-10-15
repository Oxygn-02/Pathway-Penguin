/* ── Source-grounding helpers ──────────────────────────────────── */
export const SOURCE_STOP_WORDS = new Set([
  "the","and","for","with","from","that","this","into","what","when","which","their","there",
  "have","been","each","other","than","then","they","were","will","more","also","such","only",
  "about","using","based","between","while","over","under","upon","through","within","because",
  "where","whose","across","being","both","like","make","many","much","some","such","into",
  "given","does","could","would","should","into","onto","once","its","not","can","you","your",
  "is","of","to","in","on","an","or","as","at","be","by","it","if","do","we","us","my","me","so","up",
  "no","yes","may","via","two","one","new","old","all","any","get","off","out","own","per","top","why",
  "how","who","but","nor","yet","got","let","etc","i.e","e.g","vs",
]);

// Lightweight Porter-style stemmer tuned for GCSE science / humanities
// terminology. Maps common suffix variants to a shared stem so e.g.
// "mitosis"/"mitotic" → "mito", "photosynthesis"/"photosynthetic" →
// "photosynthe", and "cellular"/"cells" → "cell". Tokens shorter than 4
// chars (e.g. "dna", "atp", "ph") are returned unchanged.
//
// Each rule is [suffix, replacement, minResultLen]. A rule only fires if
// removing the suffix (and appending the replacement) leaves at least
// minResultLen characters — this prevents over-aggressive stemming of
// short words (e.g. "modular" must NOT become "mod").
export const STEM_RULES = [
  ["ologically", "ology", 3], ["iological", "iology", 3], ["ological", "ology", 3],
  ["ically", "", 4], ["ations", "", 4], ["ation", "", 4], ["atory", "", 4],
  ["ities", "ity", 3],
  ["esis", "e", 4], ["etic", "e", 4], ["sis", "", 4], ["tic", "", 4], ["ical", "", 4],
  ["ization", "ize", 3], ["isation", "ise", 3],
  ["izing", "", 4], ["ising", "", 4], ["ized", "", 4], ["ised", "", 4],
  ["ize", "", 4], ["ise", "", 4],
  ["tion", "", 4], ["sion", "", 4], ["ment", "", 4], ["ness", "", 4], ["ity", "", 4],
  ["ous", "", 4], ["ative", "", 4], ["ive", "", 4], ["able", "", 4], ["ible", "", 4],
  ["ulation", "ul", 4], ["ulate", "ul", 4], ["ate", "", 4],
  // Plurals — keep the stem letter so e.g. boxes → box, classes → class.
  ["sses", "ss", 2], ["xes", "x", 2], ["zes", "ze", 2],
  ["ches", "ch", 2], ["shes", "sh", 2],
  // Greek/Latin "is → es" plurals: hypotheses → hypothe, mitoses → mito.
  ["eses", "e", 4], ["oses", "o", 4], ["yses", "y", 4],
  ["ies", "y", 3], ["ied", "y", 3], ["ying", "y", 3],
  ["ing", "", 4], ["ed", "", 4], ["est", "", 4], ["ers", "", 4], ["er", "", 4], ["ly", "", 4],
  ["ular", "", 4], ["ary", "", 4], ["ory", "", 4], ["al", "", 4], ["ic", "", 4],
  ["s", "", 3],
].sort((a, b) => b[0].length - a[0].length);

export function stemWord(w) {
  if (!w) return "";
  let s = w.toLowerCase();
  if (s.length < 4) return s;
  // Up to two suffix-stripping passes so e.g. "replication" → "replic" → "repl".
  for (let pass = 0; pass < 2; pass++) {
    let changed = false;
    for (const [suf, rep, minLen] of STEM_RULES) {
      // Don't strip the bare trailing "s" when preceded by another "s"
      // (e.g. "class" must stay "class", not become "cla").
      if (suf === "s" && s.endsWith("ss")) continue;
      const newLen = s.length - suf.length + rep.length;
      if (s.endsWith(suf) && newLen >= minLen) {
        s = s.slice(0, -suf.length) + rep;
        changed = true;
        break;
      }
    }
    if (!changed) break;
  }
  return s;
}

// Synonym groups for terms that don't share a stem but cover the same concept.
// Each group is a list of related terms (single words or short phrases). At
// match time, every stem of every term in a group is treated as equivalent —
// so "mitosis" in a topic will also match a source that only says "cell
// division", and vice versa.
export const SOURCE_SYNONYM_GROUPS = [
  // Biology
  ["mitosis", "mitotic", "cell division", "cytokinesis"],
  ["meiosis", "meiotic", "gamete", "gametes"],
  ["photosynthesis", "photosynthetic", "chlorophyll", "chloroplast"],
  ["respiration", "respiratory", "aerobic", "anaerobic", "atp"],
  ["enzyme", "enzymatic", "catalyst", "substrate", "active site"],
  ["dna", "deoxyribonucleic", "genome", "chromosome", "chromosomes"],
  ["gene", "genetics", "genotype", "phenotype", "allele", "alleles"],
  ["evolution", "natural selection", "adaptation", "darwin"],
  ["homeostasis", "thermoregulation", "osmoregulation"],
  ["immunity", "immune", "antibody", "antibodies", "antigen", "pathogen"],
  ["hormone", "hormonal", "endocrine", "gland"],
  ["nervous system", "neuron", "neurone", "synapse", "reflex"],
  ["ecosystem", "ecology", "biodiversity", "habitat", "food web"],
  ["osmosis", "diffusion", "active transport"],
  ["mitochondria", "mitochondrion", "mitochondrial"],
  // Chemistry
  ["atom", "atomic", "element", "subatomic"],
  ["electron", "shell", "orbital", "valence"],
  ["bond", "bonding", "covalent", "ionic", "metallic"],
  ["acid", "alkali", "alkaline", "base", "ph", "neutralisation", "neutralization"],
  ["electrolysis", "electrolyte", "electrolytic"],
  ["oxidation", "reduction", "redox"],
  ["exothermic", "endothermic", "enthalpy"],
  ["mole", "molar", "molarity", "concentration"],
  ["polymer", "polymerisation", "polymerization", "monomer"],
  ["organic", "alkane", "alkene", "alcohol", "carboxylic"],
  // Physics
  ["force", "newton", "newtons"],
  ["motion", "kinematics", "velocity", "acceleration", "speed"],
  ["energy", "kinetic", "potential", "joule", "joules"],
  ["electricity", "current", "voltage", "resistance", "ohm", "circuit"],
  ["magnetism", "magnetic", "electromagnetic", "electromagnet"],
  ["wave", "waves", "wavelength", "frequency", "amplitude"],
  ["nuclear", "nucleus", "radioactive", "radioactivity", "half-life", "isotope"],
  ["optics", "refraction", "reflection", "lens"],
  ["gravity", "gravitational", "weight"],
  // Maths
  ["algebra", "equation", "expression", "simultaneous"],
  ["geometry", "area", "perimeter", "volume", "surface area"],
  ["trigonometry", "sine", "cosine", "tangent", "sin", "cos", "tan"],
  ["statistics", "probability", "mean", "median", "mode", "range"],
  ["fraction", "decimal", "percentage", "ratio"],
  // Computer Science
  ["algorithm", "pseudocode", "flowchart"],
  ["binary", "decimal", "hexadecimal", "denary"],
  ["loop", "iteration", "for loop", "while loop", "recursion"],
  ["array", "list", "queue", "stack", "data structure"],
  ["sorting", "bubble sort", "merge sort", "insertion sort"],
  ["function", "procedure", "subroutine", "method"],
  ["network", "protocol", "tcp", "ip", "lan", "wan"],
  ["database", "sql", "query", "primary key"],
  ["encryption", "cryptography", "cipher", "decryption"],
  // English
  ["metaphor", "simile", "imagery", "figurative language"],
  ["narrator", "narrative", "protagonist", "antagonist"],
  ["theme", "motif", "symbolism"],
  ["poem", "poetry", "stanza", "verse", "rhyme"],
];

// Index: stem -> Set of all stems in any synonym group containing it.
// Generic words that, when they appear inside a multi-word synonym phrase
// (e.g. "active site", "primary key", "natural selection", "surface area",
// "mean range"), would cause too many false-positive matches if registered
// as standalone match keys. They're still allowed in single-word synonym
// entries (where the word IS the concept).
export const SYNONYM_GENERIC_WORDS = new Set([
  "active","site","key","area","surface","selection","mean","range","system",
  "set","material","group","table","method","function","data","structure",
  "natural","primary","secondary","law","rule","type","form","sort","list",
  "loop","field","wave","flow","rate","value","number","line","point","force",
  "state","change","level","power","time","space","unit","class","object",
  "model","theory","process","effect","cause","result","factor","term",
]);

// Phrase entries used for literal substring matching when a multi-word
// synonym phrase consists entirely of generic tokens (e.g. "natural
// selection", "active site", "primary key"). These can't safely be
// indexed as individual stems but should still expand the synonym group
// when the exact phrase appears verbatim in a topic or source.
export const SOURCE_SYNONYM_PHRASES = [];

export const SOURCE_SYNONYM_INDEX = (() => {
  const idx = new Map();
  // Pass 1: collect each group's safe stems and pending phrase entries.
  const groupData = SOURCE_SYNONYM_GROUPS.map((group) => {
    const allStems = new Set();
    const pendingPhrases = [];
    for (const term of group) {
      const lower = term.toLowerCase();
      const parts = lower.split(/\s+/)
        .map((p) => p.replace(/[^a-z0-9]/g, ""))
        .filter((p) => p.length >= 3 && !SOURCE_STOP_WORDS.has(p));
      const isMultiWord = parts.length > 1;
      const safeParts = isMultiWord
        ? parts.filter((p) => !SYNONYM_GENERIC_WORDS.has(p))
        : parts;
      if (isMultiWord && safeParts.length === 0) {
        // All tokens were generic — keep the literal phrase for
        // substring matching instead of indexing each generic word.
        pendingPhrases.push(lower);
      } else {
        for (const part of safeParts) allStems.add(stemWord(part));
      }
    }
    return { allStems, pendingPhrases };
  });
  // Pass 2: register stems and phrases now that each group's full stem
  // set is known (so phrases bridge bidirectionally).
  for (const { allStems, pendingPhrases } of groupData) {
    for (const st of allStems) {
      let bucket = idx.get(st);
      if (!bucket) { bucket = new Set(); idx.set(st, bucket); }
      for (const other of allStems) bucket.add(other);
    }
    for (const phrase of pendingPhrases) {
      SOURCE_SYNONYM_PHRASES.push({ phrase, stems: new Set(allStems) });
    }
  }
  return idx;
})();

// Extract candidate keywords from a topic description for source matching.
// Returns lowercased tokens minus stop words. Includes short acronyms like
// "CPU", "RAM", "DNA", "pH" so source matching catches them.
export function topicKeywords(description) {
  if (!description) return [];
  return (description.toLowerCase().match(/[a-z][a-z0-9]+/g) || [])
    .filter((w) => !SOURCE_STOP_WORDS.has(w));
}

// Stem a topic's keywords and expand with synonym-related stems so that, for
// example, a topic mentioning "mitosis" will match a source that only talks
// about "cell division" (and vice versa). When a description string is
// provided, also look for any registered multi-word synonym phrase
// (e.g. "natural selection", "primary key") and pull in its group stems.
export function expandedTopicStems(keywords, description) {
  const out = new Set();
  for (const k of keywords) {
    const st = stemWord(k);
    if (!st) continue;
    out.add(st);
    const related = SOURCE_SYNONYM_INDEX.get(st);
    if (related) for (const r of related) out.add(r);
  }
  if (description) {
    const lower = description.toLowerCase();
    for (const { phrase, stems } of SOURCE_SYNONYM_PHRASES) {
      if (lower.includes(phrase)) for (const s of stems) out.add(s);
    }
  }
  return out;
}

// Build the SOURCE MATERIAL section appended to the user prompt for one topic.
// Returns { text, sourceIds } where text is "" if there are no sources or if
// the topic isn't covered by any source (in which case Claude will fall back
// to general knowledge for that topic) and sourceIds lists the IDs of the
// sources that were actually included in the prompt body.
//
// Matching is stem-based with a small per-subject synonym list so e.g.
// "mitosis" matches "mitotic division" or "cell division" in the source.
// Total payload is hard-capped at TOTAL_BUDGET characters across all relevant
// sources to keep us well within the model's context window.
export function sourceContextSection(topic, sources) {
  const empty = { text: "", sourceIds: [], excerpts: [] };
  if (!Array.isArray(sources) || sources.length === 0) return empty;
  const desc = (topic?.description || "").toLowerCase().trim();
  const keywords = topicKeywords(desc);
  if (!keywords.length && !desc) return empty;
  const expanded = expandedTopicStems(keywords, desc);
  const tokenize = (s) => (s.toLowerCase().match(/[a-z][a-z0-9]+/g) || []);
  const relevant = sources.filter((s) => {
    const lowered = (s.content || "").toLowerCase();
    // Substring check on the full topic description first — catches multi-word
    // phrases ("cell cycle") even if individual tokens look generic.
    if (desc && desc.length >= 4 && lowered.includes(desc)) return true;
    // Check registered synonym phrases against the source content too, so
    // a topic about "evolution" matches a source that only says
    // "natural selection" (or vice versa).
    for (const { phrase, stems } of SOURCE_SYNONYM_PHRASES) {
      if (!lowered.includes(phrase)) continue;
      for (const st of stems) if (expanded.has(st)) return true;
    }
    const tokens = tokenize(lowered);
    for (const t of tokens) {
      if (SOURCE_STOP_WORDS.has(t)) continue;
      const st = stemWord(t);
      if (expanded.has(st)) return true;
    }
    return false;
  });
  if (!relevant.length) return empty;

  // Hard global character budget shared across all relevant sources.
  const TOTAL_BUDGET = 12000;
  const SEPARATOR = "\n\n---\n\n";
  const headerCost = (name) => `[Source: ${name}]\n`.length;
  const sepCost = SEPARATOR.length;

  let remaining = TOTAL_BUDGET;
  const parts = [];
  const usedIds = [];
  const usedExcerpts = [];
  for (let i = 0; i < relevant.length; i++) {
    const s = relevant[i];
    const sliceCount = relevant.length - i; // sources still to add (including this one)
    // Reserve a fair share of the remaining budget for this source so later sources
    // aren't starved when the first source happens to be huge.
    const sepBetween = i > 0 ? sepCost : 0;
    const overhead = headerCost(s.name) + sepBetween;
    const fairShare = Math.floor((remaining - overhead) / sliceCount);
    if (fairShare <= 0) break;
    const take = Math.min(s.content?.length ?? 0, fairShare);
    parts.push(`[Source: ${s.name}]\n${(s.content || "").slice(0, take)}`);
    usedIds.push(s.id);
    usedExcerpts.push({ id: s.id, start: 0, end: take });
    remaining -= overhead + take;
    if (remaining <= 0) break;
  }
  if (!parts.length) return empty;
  const body = parts.join(SEPARATOR);
  return {
    text: `\n\nSOURCE MATERIAL (base your question ONLY on the content below — do not introduce facts that aren't here):\n${body}`,
    sourceIds: usedIds,
    excerpts: usedExcerpts,
  };
}

// Lazy-load pdfjs-dist and extract plain text from a PDF File.
// Returns { text, pageCount } so callers can persist the page count alongside
// the extracted content.
export async function extractPdfText(file) {
  const pdfjsLib = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pageTexts = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((it) => ("str" in it ? it.str : "")).join(" ");
    pageTexts.push(text);
  }
  const text = pageTexts.join("\n\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return { text, pageCount: pdf.numPages };
}
