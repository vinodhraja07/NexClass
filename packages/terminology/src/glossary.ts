import type { LanguageCode } from "@nexclass/shared";

export type GlossarySubject =
  | "general"
  | "mechanics"
  | "linear-algebra"
  | "computer-science";

export type GlossaryReviewStatus = "approved" | "needs-review" | "draft";

export interface GlossaryTerm {
  id: string;
  /** Canonical English term. */
  term: string;
  /** Alternative surface forms that should also be protected. */
  aliases?: string[];
  subjects: GlossarySubject[];
  category: string;
  reviewStatus: GlossaryReviewStatus;
  /** When true the original English term is always kept next to the localized equivalent. */
  preserveOriginal: boolean;
  /** Short English definition shown in the terminology inspector. */
  definition: string;
  /** Localized equivalent / short explanation per target language. */
  equivalents: Partial<Record<LanguageCode, string>>;
  /** Transliterated loanword shown when a localized equivalent is not yet verified. */
  transliteration?: Partial<Record<LanguageCode, string>>;
  notes?: string;
}

const LOCALES: LanguageCode[] = ["ta", "hi", "bn", "mr", "or"];

function localized(
  ta?: string,
  hi?: string,
  bn?: string,
  mr?: string,
  or?: string,
): Partial<Record<LanguageCode, string>> {
  const out: Partial<Record<LanguageCode, string>> = {};
  if (ta) out.ta = ta;
  if (hi) out.hi = hi;
  if (bn) out.bn = bn;
  if (mr) out.mr = mr;
  if (or) out.or = or;
  return out;
}

/**
 * Engineering / science glossary used to protect technical vocabulary during
 * translation. Localised equivalents are conservative: where a verified local
 * academic term is unavailable we fall back to a transliterated loanword and
 * always keep the English original visible (preserveOriginal).
 */
export const GLOSSARY: GlossaryTerm[] = [
  {
    id: "eigenvalue",
    term: "eigenvalue",
    aliases: ["eigen values", "eigen-values", "eigenvalue's"],
    subjects: ["linear-algebra", "general"],
    category: "Linear algebra",
    reviewStatus: "approved",
    preserveOriginal: true,
    definition:
      "A scalar for which a matrix has a non-trivial vector that is mapped to a multiple of itself.",
    equivalents: {},
    transliteration: localized(
      "ஈஜன்வில்யூ",
      "आइजनवैल्यू",
      "ইজেনভ্যালিউ",
      "आइजनव्हॅल्यू",
      "ଆଇଜନଭ୍ୟାଲ୍ୟୂ",
    ),
    notes: "Locally verified academic equivalents are still under review; original term is always shown.",
  },
  {
    id: "eigenvector",
    term: "eigenvector",
    aliases: ["eigen vectors", "eigen-vector"],
    subjects: ["linear-algebra", "general"],
    category: "Linear algebra",
    reviewStatus: "approved",
    preserveOriginal: true,
    definition: "A non-zero vector that is transformed only by scaling when a matrix is applied.",
    equivalents: {},
    transliteration: localized(
      "ஈஜன்வெக்டர்",
      "आइजनवेक्टर",
      "ইজেনভেক্টর",
      "आइजनव्हेक्टर",
      "ଆଇଜନଭେକ୍ଟର",
    ),
  },
  {
    id: "eigenvector-matrix",
    term: "eigenvector matrix",
    subjects: ["linear-algebra"],
    category: "Linear algebra",
    reviewStatus: "draft",
    preserveOriginal: true,
    definition: "The matrix whose columns are the linearly independent eigenvectors of a system.",
    equivalents: {},
    transliteration: localized(
      "ஈஜன்வெக்டர் அணி",
      "आइजनवेक्टर मैट्रिक्स",
      "ইজেনভেক্টর ম্যাট্রিক্স",
      "आइजनव्हेक्टर मॅट्रिक्स",
      "ଆଇଜନଭେକ୍ଟର ମ୍ୟାଟ୍ରିକ୍ସ",
    ),
  },
  {
    id: "torque",
    term: "torque",
    aliases: ["moment", "turning moment"],
    subjects: ["mechanics", "general"],
    category: "Mechanics",
    reviewStatus: "approved",
    preserveOriginal: true,
    definition: "The turning effect of a force applied about an axis.",
    equivalents: localized(
      "வட்டவிசை",
      "आघूर्ण बल",
      "বলের ঘূর্ণনের মাত্রা",
      "आघूर्ण बल",
      "ଆଘୂର୍ଣ ବଳ",
    ),
  },
  {
    id: "angular-velocity",
    term: "angular velocity",
    aliases: ["angular speed"],
    subjects: ["mechanics"],
    category: "Mechanics",
    reviewStatus: "approved",
    preserveOriginal: true,
    definition: "Rate of change of angular displacement with time.",
    equivalents: localized(
      "கோண வேகம்",
      "कोणीय वेग",
      "কোণীয় বেগ",
      "कोणीय वेग",
      "କୋଣୀୟ ବେଗ",
    ),
  },
  {
    id: "angular-acceleration",
    term: "angular acceleration",
    aliases: ["angular accelerations"],
    subjects: ["mechanics"],
    category: "Mechanics",
    reviewStatus: "approved",
    preserveOriginal: true,
    definition: "Rate of change of angular velocity with time.",
    equivalents: localized(
      "கோண முடக்கம்",
      "कोणीय त्वरण",
      "কোণীয় ত্বরণ",
      "कोणीय त्वरण",
      "କୋଣୀୟ ତ୍ୱରଣ",
    ),
  },
  {
    id: "acceleration",
    term: "acceleration",
    aliases: ["accelerations"],
    subjects: ["mechanics"],
    category: "Mechanics",
    reviewStatus: "approved",
    preserveOriginal: true,
    definition: "Rate of change of velocity with respect to time.",
    equivalents: localized(
      "முடக்கம்",
      "त्वरण",
      "ত্বরণ",
      "त्वरण",
      "ତ୍ୱରଣ",
    ),
  },
  {
    id: "velocity",
    term: "velocity",
    subjects: ["mechanics"],
    category: "Mechanics",
    reviewStatus: "approved",
    preserveOriginal: true,
    definition: "Rate of change of displacement with time, including direction.",
    equivalents: localized(
      "வேகம்",
      "वेग",
      "বেগ",
      "वेग",
      "ବେଗ",
    ),
  },
  {
    id: "momentum",
    term: "momentum",
    subjects: ["mechanics"],
    category: "Mechanics",
    reviewStatus: "needs-review",
    preserveOriginal: true,
    definition: "Product of the mass of a body and its velocity.",
    equivalents: {},
    transliteration: localized(
      "மொமென்டம்",
      "संवेग",
      "বলের পরিমাণ",
      "संवेग",
      "ଗତିଶକ୍ତି",
    ),
  },
  {
    id: "inertia",
    term: "inertia",
    subjects: ["mechanics"],
    category: "Mechanics",
    reviewStatus: "approved",
    preserveOriginal: true,
    definition: "Resistance of a body to a change in its state of motion.",
    equivalents: localized(
      "நிலைமாற்று எதிர்ப்பு",
      "जड़त्व",
      "বিরোধিতা",
      "जडत्व",
      "ନିଷ୍ପ୍ରତିକ୍ଷିପକ୍ଷ",
    ),
  },
  {
    id: "friction",
    term: "friction",
    subjects: ["mechanics"],
    category: "Mechanics",
    reviewStatus: "approved",
    preserveOriginal: true,
    definition: "Force opposing relative motion between two surfaces in contact.",
    equivalents: localized(
      "நேர்ப்பு விசை",
      "घर्षण",
      "ঘর্ষণ",
      "घर्षण",
      "ଘର୍ଷଣ",
    ),
  },
  {
    id: "newtons-second-law",
    term: "Newton's second law",
    aliases: ["newtons second law", "newton second law"],
    subjects: ["mechanics"],
    category: "Mechanics",
    reviewStatus: "approved",
    preserveOriginal: true,
    definition: "The net force on a body equals its mass multiplied by its acceleration.",
    equivalents: {},
    transliteration: localized(
      "நியூட்டனின் இரண்டாம் விதி",
      "न्यूटन का दूसरा नियम",
      "নিউটনের দ্বিতীয় সূত্র",
      "न्यूटनचा दुसरा नियम",
      "ନ୍ୟୁଟନର ଦ୍ୱିତୀୟ ନିୟମ",
    ),
  },
  {
    id: "equilibrium",
    term: "equilibrium",
    subjects: ["mechanics", "general"],
    category: "Mechanics",
    reviewStatus: "approved",
    preserveOriginal: true,
    definition: "A state in which the net force and net torque on a body are both zero.",
    equivalents: localized(
      "சமநிலை",
      "संतुलन",
      "সামঞ্জ্য",
      "संतुलन",
      "ସନ୍ତୁଳନ",
    ),
  },
  {
    id: "lever",
    term: "lever",
    subjects: ["mechanics"],
    category: "Mechanics",
    reviewStatus: "approved",
    preserveOriginal: true,
    definition: "A rigid bar pivoting about a fulcrum to lift or move a load.",
    equivalents: localized(
      "ஒருக்கை",
      "लीवर",
      "দণ্ড",
      "तराजू",
      "ଲେଭର",
    ),
  },
  {
    id: "pulley",
    term: "pulley",
    subjects: ["mechanics"],
    category: "Mechanics",
    reviewStatus: "approved",
    preserveOriginal: true,
    definition: "A wheel with a groove for a rope, used to change the force needed to lift a load.",
    equivalents: localized(
      "புல்லி",
      "पुली",
      "পালা",
      "पुली",
      "ପୁଲି",
    ),
  },
  {
    id: "matrix",
    term: "matrix",
    aliases: ["matrices"],
    subjects: ["linear-algebra"],
    category: "Linear algebra",
    reviewStatus: "approved",
    preserveOriginal: true,
    definition: "A rectangular array of numbers used to represent linear transformations.",
    equivalents: localized(
      "அணி",
      "मैट्रिक्स",
      "ম্যাট্রিক্স",
      "मॅट्रिक्स",
      "ମ୍ୟାଟ୍ରିକ୍ସ",
    ),
  },
  {
    id: "determinant",
    term: "determinant",
    subjects: ["linear-algebra"],
    category: "Linear algebra",
    reviewStatus: "approved",
    preserveOriginal: true,
    definition: "A scalar value computed from a square matrix that indicates invertibility.",
    equivalents: localized(
      "நிர்ணயாக்கம்",
      "सारणिक",
      "সারণি",
      "सारणिक",
      "ନିର୍ଣୟକ",
    ),
  },
  {
    id: "derivative",
    term: "derivative",
    aliases: ["differential"],
    subjects: ["general"],
    category: "Calculus",
    reviewStatus: "approved",
    preserveOriginal: true,
    definition: "The instantaneous rate of change of a function.",
    equivalents: localized(
      "வேதித்தொகை",
      "अवकलज",
      "অন্তরক",
      "अवकलज",
      "ଅବକଲଜ",
    ),
  },
  {
    id: "integration",
    term: "integration",
    aliases: ["integrate", "integral"],
    subjects: ["general"],
    category: "Calculus",
    reviewStatus: "approved",
    preserveOriginal: true,
    definition: "The process of finding an antiderivative, or accumulating area under a curve.",
    equivalents: localized(
      "ஒருங்கல்",
      "समाकलन",
      "সমাকলন",
      "समाकलन",
      "ସମାକଲନ",
    ),
  },
  {
    id: "algorithm",
    term: "algorithm",
    subjects: ["computer-science", "general"],
    category: "Computer science",
    reviewStatus: "approved",
    preserveOriginal: true,
    definition: "A finite sequence of well-defined steps that solves a class of problems.",
    equivalents: localized(
      "அல்காரிதம்",
      "एल्गोरिदम",
      "অ্যালগরিদম",
      "अल्गोरिदम",
      "ଆଲ୍ଗୋରିଦମ",
    ),
  },
  {
    id: "neural-network",
    term: "neural network",
    aliases: ["neural networks", "neural net"],
    subjects: ["computer-science"],
    category: "Computer science",
    reviewStatus: "approved",
    preserveOriginal: true,
    definition: "A layered graph of connected units whose weights are learned from data.",
    equivalents: localized(
      "நரம்பு வலைப்பின்னல்",
      "तंत्रिका नेटवर्क",
      "স্নায়ুজাল নেটওয়ার্ক",
      "न्यूरल नेटवर्क",
      "ନ୍ୟୁରାଲ ନେଟୱାର୍କ",
    ),
  },
  {
    id: "gradient",
    term: "gradient",
    aliases: ["gradients"],
    subjects: ["general", "computer-science"],
    category: "Calculus",
    reviewStatus: "approved",
    preserveOriginal: true,
    definition: "The vector of partial derivatives giving the direction of steepest increase.",
    equivalents: localized(
      "சாய்வு",
      "प्रवणता",
      "ঢাল",
      "ढाल",
      "ଢଲ",
    ),
  },
  {
    id: "vector",
    term: "vector",
    subjects: ["general", "linear-algebra", "mechanics"],
    category: "Mathematics",
    reviewStatus: "approved",
    preserveOriginal: true,
    definition: "A quantity with both magnitude and direction.",
    equivalents: localized(
      "வெக்டர்",
      "सदिश",
      "ভেক্টর",
      "सदिश",
      "ଭେକ୍ଟର",
    ),
  },
  {
    id: "scalar",
    term: "scalar",
    subjects: ["general", "linear-algebra"],
    category: "Mathematics",
    reviewStatus: "approved",
    preserveOriginal: true,
    definition: "A quantity with magnitude only and no direction.",
    equivalents: localized(
      "எண்",
      "अदिश राशि",
      "স্কেলার",
      "अदिश राशि",
      "ସ୍କେଲାର",
    ),
  },
  {
    id: "energy",
    term: "energy",
    subjects: ["general", "mechanics"],
    category: "Physics",
    reviewStatus: "approved",
    preserveOriginal: true,
    definition: "The capacity of a system to do work or cause change.",
    equivalents: localized(
      "ஆற்றல்",
      "ऊर्जा",
      "শক্তি",
      "ऊर्जा",
      "ଶକ୍ତି",
    ),
  },
  {
    id: "potential",
    term: "potential",
    aliases: ["potential energy", "potential difference"],
    subjects: ["general", "mechanics"],
    category: "Physics",
    reviewStatus: "approved",
    preserveOriginal: true,
    definition: "Energy stored per unit charge or per unit mass in a field.",
    equivalents: localized(
      "அழுத்தம்",
      "विभव",
      "বিভব",
      "विभव",
      "ବିଭବ",
    ),
  },
  {
    id: "circuit",
    term: "circuit",
    subjects: ["general"],
    category: "Electronics",
    reviewStatus: "approved",
    preserveOriginal: true,
    definition: "A closed conducting path through which current can flow.",
    equivalents: localized(
      "சுற்றுப்பாதை",
      "परिपथ",
      "বর্তনী",
      "परिपथ",
      "ବଳ ପଥ",
    ),
  },
  {
    id: "resistance",
    term: "resistance",
    subjects: ["general"],
    category: "Electronics",
    reviewStatus: "approved",
    preserveOriginal: true,
    definition: "Opposition to the flow of electric current.",
    equivalents: localized(
      "மின்தடை",
      "प्रतिरोध",
      "প্রতিরোধ",
      "प्रतिरोध",
      "ପ୍ରତିରୋଧ",
    ),
  },
  {
    id: "photosynthesis",
    term: "photosynthesis",
    subjects: ["general"],
    category: "Biology",
    reviewStatus: "approved",
    preserveOriginal: true,
    definition: "The process by which green plants convert light energy into chemical energy.",
    equivalents: localized(
      "ஒளித்தொகுப்பு",
      "प्रकाश संश्लेषण",
      "সালোকসংশ্লেষণ",
      "प्रकाशसंश्लेषण",
      "ପ୍ରକାଶ ସଂଶ୍ଲେଷଣ",
    ),
  },
  {
    id: "protein",
    term: "protein",
    subjects: ["general"],
    category: "Biology",
    reviewStatus: "approved",
    preserveOriginal: true,
    definition: "A biological molecule built from amino acids that performs structural and enzymatic roles.",
    equivalents: localized(
      "புரதம்",
      "प्रोटीन",
      "প্রোটিন",
      "प्रोटीन",
      "ପ୍ରୋଟିନ",
    ),
  },
  {
    id: "mitosis",
    term: "mitosis",
    subjects: ["general"],
    category: "Biology",
    reviewStatus: "needs-review",
    preserveOriginal: true,
    definition: "Cell division producing two genetically identical daughter cells.",
    equivalents: {},
    transliteration: localized(
      "இழையுருப்பிரிவு",
      "माइटोसिस",
      "মাইটোসিস",
      "मायटोसिस",
      "ମାଇଟୋସିସ",
    ),
  },
];

export const GLOSSARY_BY_ID = new Map(GLOSSARY.map((t) => [t.id, t]));

export function glossaryForSubjects(subjects: GlossarySubject[]): GlossaryTerm[] {
  return GLOSSARY.filter((t) => t.subjects.some((s) => subjects.includes(s)));
}

export function localizedEquivalent(
  term: GlossaryTerm,
  language: LanguageCode,
): { text: string; verified: boolean } | null {
  const exact = term.equivalents[language];
  if (exact) return { text: exact, verified: true };
  const loan = term.transliteration?.[language];
  if (loan) return { text: loan, verified: false };
  const english = term.equivalents.en;
  if (english) return { text: english, verified: true };
  return null;
}

export const GLOSSARY_LANGUAGES = LOCALES;
