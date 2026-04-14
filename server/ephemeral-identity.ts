/**
 * Ephemeral Identity System
 * 
 * Per-thread rotating pseudonyms using HKDF-based keypair derivation.
 * Users maintain a root secret (never transmitted) and derive contextual
 * keypairs per thread. Pseudonyms are deterministic, unlinkable across threads.
 */

import { hkdf } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { ed25519 } from "@noble/curves/ed25519.js";

type BytesLike = Uint8Array | string;

// Wordlists for pseudonym generation (256 words each)
const ADJECTIVES = [
  "amber", "azure", "bold", "bright", "calm", "clear", "cool", "crisp",
  "dark", "deep", "dull", "eager", "early", "easy", "empty", "even",
  "fair", "fast", "fine", "firm", "flat", "free", "fresh", "full",
  "glad", "gold", "good", "grand", "great", "green", "grey", "gross",
  "happy", "hard", "harsh", "high", "holy", "hot", "huge", "human",
  "icy", "ideal", "idle", "ill", "inner", "iron", "ivory", "jaded",
  "keen", "kind", "known", "large", "late", "lazy", "left", "legal",
  "light", "like", "lively", "local", "lone", "long", "loud", "low",
  "lucky", "lunar", "mad", "main", "major", "many", "marked", "merry",
  "mild", "minor", "mixed", "modern", "moral", "most", "moving", "much",
  "naked", "narrow", "near", "neat", "new", "next", "nice", "noble",
  "normal", "noted", "novel", "odd", "old", "only", "open", "other",
  "outer", "oval", "over", "pale", "past", "perfect", "plain", "pleased",
  "poor", "popular", "prime", "proper", "proud", "pure", "quick", "quiet",
  "rare", "raw", "real", "red", "right", "ripe", "rising", "royal",
  "rude", "rural", "safe", "sage", "same", "sandy", "sane", "secret",
  "sharp", "sheer", "short", "shy", "sick", "silent", "silver", "simple",
  "single", "small", "smart", "smooth", "soft", "solid", "some", "sore",
  "sound", "south", "spare", "special", "stable", "stark", "steep", "stiff",
  "still", "stout", "strange", "strict", "strong", "subtle", "sudden", "sure",
  "sweet", "swift", "tall", "tame", "tart", "tender", "tense", "thick",
  "thin", "tight", "tiny", "tired", "total", "tough", "true", "twin",
  "ugly", "ultimate", "unable", "unique", "united", "unjust", "unknown", "unlike",
  "unlit", "unreal", "unsafe", "unseen", "untidy", "until", "unusual", "upper",
  "upset", "urban", "urgent", "used", "useful", "usual", "vague", "valid",
  "vast", "verbal", "very", "viable", "vicious", "vital", "vivid", "vocal",
  "void", "volatile", "vulgar", "warm", "wary", "weak", "weary", "weird",
  "well", "west", "wet", "white", "whole", "wicked", "wide", "wild",
  "willing", "wise", "with", "witty", "woeful", "wonderful", "wooden", "wrong",
  "yellow", "young", "youthful", "zealous", "zero", "zesty", "zigzag", "zoned",
];

const NOUNS = [
  "abyss", "accent", "access", "accord", "account", "ace", "ache", "acid",
  "acorn", "acre", "act", "action", "actor", "actual", "adapt", "add",
  "adder", "address", "adjust", "admin", "admit", "adobe", "adopt", "adore",
  "adult", "advance", "advent", "adverb", "advice", "affair", "affect", "afford",
  "afresh", "after", "again", "against", "age", "agent", "agile", "agony",
  "agree", "ahead", "aid", "aim", "air", "aisle", "alarm", "album",
  "alert", "alias", "alien", "align", "alike", "alive", "all", "alloy",
  "allow", "allure", "ally", "almanac", "almost", "alms", "aloe", "aloft",
  "alone", "along", "aloud", "alpha", "already", "also", "altar", "alter",
  "alto", "always", "amalgam", "amateur", "amaze", "amber", "ambiance", "ambition",
  "amble", "ambush", "amend", "amenity", "amid", "amidst", "amiss", "ammo",
  "amnesty", "among", "amount", "amour", "amp", "ampere", "ample", "amuse",
  "amusement", "anaconda", "analog", "analogy", "analyze", "ancestor", "anchor", "ancient",
  "and", "anew", "angel", "anger", "angle", "angry", "anguish", "animal",
  "animate", "ankle", "annals", "annex", "annihilate", "anniversary", "announce", "annoy",
  "annoyance", "annual", "annul", "anode", "anoint", "anomaly", "anon", "anonymous",
  "another", "answer", "ant", "antagonism", "antagonist", "antacid", "antage", "antalgic",
  "antarctic", "antecedent", "antelope", "anthem", "anther", "anthill", "anthology", "antic",
  "anticipate", "antidote", "antigen", "antique", "antiquity", "antiseptic", "antithesis", "antitoxin",
  "antler", "antonym", "anvil", "anxiety", "anxious", "any", "anybody", "anyhow",
  "anyone", "anything", "anyway", "anywhere", "aorta", "apace", "apart", "apartheid",
  "apartment", "apathy", "ape", "aperture", "apex", "aphelion", "aphid", "aphorism",
  "aphrodisiac", "apiary", "apical", "apiculture", "apiece", "aplomb", "apocalypse", "apocrypha",
  "apogee", "apologetic", "apologia", "apologize", "apology", "apoplexy", "apostasy", "apostate",
  "apostle", "apostrophe", "apothecary", "apotheosis", "appall", "appalling", "apparatus", "apparel",
  "apparent", "apparently", "apparition", "appeal", "appear", "appearance", "appease", "appellant",
  "appellation", "append", "appendage", "appendicitis", "appendix", "appertain", "appetite", "appetizer",
  "applaud", "applause", "apple", "appliance", "applicable", "applicant", "application", "applicator",
  "applied", "applique", "apply", "appoint", "appointment", "apportion", "apposite", "apposition",
  "appraisal", "appraise", "appreciable", "appreciate", "appreciation", "apprentice", "apprenticeship", "apprise",
  "apprize", "approach", "approbation", "appropriate", "appropriation", "approval", "approve", "approximate",
  "approximation", "appurtenance", "apricot", "april", "apron", "apropos", "apse", "apt",
  "aptitude", "aptly", "aqua", "aquamarine", "aquanaut", "aquaplane", "aquarium", "aquatic",
  "aqueduct", "aqueous", "aquifer", "aquiline", "arab", "arabesque", "arable", "arachnid",
  "arbiter", "arbitrage", "arbitral", "arbitrament", "arbitrary", "arbitrate", "arbitration", "arbitrator",
  "arbor", "arboreal", "arborescence", "arborescent", "arboretum", "arboricultural", "arboriculture", "arborous",
  "arbutus", "arc", "arcade", "arcadia", "arcane", "arcanum", "arch", "archaeology",
  "archaeopteryx", "archaeozoic", "archaic", "archaism", "archangel", "archbishop", "archdeacon", "archdiocese",
  "archduchess", "archduke", "archer", "archery", "archetypal", "archetype", "archfiend", "archidiaconal",
  "archiepiscopal", "archil", "archimedean", "archimedes", "archipelago", "architect", "architectonic", "architecture",
  "architrave", "archive", "archivist", "archly", "archness", "archon", "archway", "arctic",
  "arcuate", "ardency", "ardent", "ardor", "arduous", "are", "area", "areaway",
  "arena", "arenaceous", "arenite", "areola", "areolate", "areometer", "arere", "aretes",
  "argal", "argent", "argentiferous", "argentite", "argentum", "argil", "argillaceous", "argillite",
  "arginine", "argol", "argon", "argosy", "argot", "arguable", "argue", "argument",
  "argumentation", "argumentative", "argus", "arhat", "aria", "arian", "arianism", "arid",
  "aridity", "ariel", "aries", "aright", "arise", "arisen", "aristocracy", "aristocrat",
  "aristocratic", "aristotelian", "aristotle", "arithmetic", "arithmetical", "arithmetician", "arizona", "ark",
  "arkose", "arm", "armada", "armadillo", "armament", "armamentarium", "armature", "armed",
  "armenia", "armenian", "armful", "armhole", "armiger", "armigerous", "armillary", "armillated",
  "arming", "armistice", "armlet", "armor", "armored", "armorer", "armorial", "armory",
  "armour", "armoured", "armoury", "armpit", "armrest", "arms", "army", "arnica",
  "arnold", "aroid", "aroma", "aromatic", "aromaticity", "aromatize", "around", "arouse",
  "arp", "arpeggio", "arquebus", "arrack", "arraign", "arraignment", "arrange", "arrangement",
  "arrant", "arras", "array", "arrear", "arrears", "arrest", "arrestation", "arrestee",
  "arrester", "arrestor", "arrhythmia", "arrhythmic", "arrival", "arrive", "arriviste", "arrogance",
  "arrogant", "arrogate", "arrogation", "arrondissement", "arrow", "arrowhead", "arrowroot", "arroyo",
  "arsenal", "arsenic", "arsenical", "arsenide", "arsenious", "arsenite", "arsenopyrite", "arsis",
  "art", "artal", "artanthe", "artefact", "artemis", "artemisia", "arterial", "arterialization",
  "arteriectomy", "arteriitis", "arteriogram", "arteriography", "arteriole", "arteriosclerosis", "arteriosclerotic", "arteriotomy",
  "arteritis", "artery", "artful", "artfully", "artfulness", "arthralgia", "arthritis", "arthropod",
  "arthroscope", "arthroscopy", "arthur", "artichoke", "article", "articular", "articulate", "articulated",
  "articulation", "artifact", "artifice", "artificer", "artificial", "artificiality", "artificially", "artillery",
  "artilleryman", "artily", "artiness", "artisan", "artisanal", "artist", "artiste", "artistic",
  "artistically", "artistry", "artless", "artlessly", "artlessness", "artocarpus", "arts", "artwork",
  "arty", "arum", "arval", "arval", "arval", "arval", "arval", "arval",
];

/**
 * Derives a contextual keypair from a root secret and a context ID.
 * Same root + same context always produces the same keypair (deterministic).
 * Different contexts produce unlinkable keypairs.
 */
export function deriveContextualKeypair(
  rootSecret: Uint8Array,
  contextId: string
): { privateKey: Uint8Array; publicKey: Uint8Array } {
  // HKDF: extract + expand
  const keyMaterial = hkdf(
    sha256,
    rootSecret,
    undefined, // salt: undefined = use hash-length zero salt
    new TextEncoder().encode(contextId), // info: the context string binds this key to this context
    32 // output length: 32 bytes for ed25519 seed
  ) as Uint8Array;

  const privateKey = keyMaterial; // ed25519 seed
  const publicKey = ed25519.getPublicKey(privateKey); // corresponding public key

  return { privateKey, publicKey };
}

/**
 * Generates a human-readable pseudonym from a public key.
 * Format: "adjective-noun-number" (e.g., "amber-circuit-3847")
 */
export function keyToPseudonym(publicKey: Uint8Array): string {
  const adj = ADJECTIVES[publicKey[0]];
  const noun = NOUNS[publicKey[1]];
  const num = ((publicKey[2] << 8) | publicKey[3]).toString().padStart(4, "0");
  return `${adj}-${noun}-${num}`;
}

/**
 * Signs content with a contextual private key.
 */
export function signContent(
  content: string,
  contextPrivateKey: Uint8Array
): string {
  const message = new TextEncoder().encode(content);
  const sig = ed25519.sign(message, contextPrivateKey);
  return Buffer.from(sig).toString("base64");
}

/**
 * Verifies a signature against a contextual public key.
 */
export function verifySignature(
  content: string,
  signature: string,
  contextPublicKey: Uint8Array
): boolean {
  try {
    const message = new TextEncoder().encode(content);
    const sig = Buffer.from(signature, "base64");
    return ed25519.verify(sig, message, contextPublicKey);
  } catch {
    return false;
  }
}

/**
 * Generates a root secret (32 bytes of random data).
 * This should be encrypted and stored locally.
 */
export function generateRootSecret(): Uint8Array {
  return new Uint8Array(crypto.getRandomValues(new Uint8Array(32)));
}

/**
 * Derives a thread-specific context ID.
 */
export function getThreadContextId(threadId: number): string {
  return `thread:${threadId}`;
}

/**
 * Derives a day-specific context ID (ISO date format).
 */
export function getDayContextId(date: Date = new Date()): string {
  const isoDate = date.toISOString().split("T")[0];
  return `day:${isoDate}`;
}

/**
 * Derives a session-specific context ID.
 */
export function getSessionContextId(sessionNonce: string): string {
  return `session:${sessionNonce}`;
}
