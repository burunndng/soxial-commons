/**
 * Client-side ephemeral identity derivation.
 *
 * Based on the ephemeral-identity skill: per-thread pseudonyms derived
 * deterministically from (sessionId + threadId) using a hash function.
 * Same session + same thread always → same pseudonym.
 * Different sessions or different threads → unlinked pseudonyms.
 *
 * For a full cryptographic implementation (HKDF + ed25519), upgrade to
 * @noble/hashes and @noble/curves with an encrypted localStorage root secret.
 */

const ADJECTIVES = [
  "amber", "swift", "quiet", "bright", "keen", "calm", "bold", "deep", "free", "wise",
  "mild", "rare", "pure", "soft", "true", "sharp", "still", "warm", "cool", "vast",
  "dark", "pale", "grey", "jade", "gold", "iron", "coal", "dawn", "dusk", "tide",
  "keen", "live", "null", "open", "pine", "quill", "rust", "sage", "thin", "undo",
];

const NOUNS = [
  "circuit", "signal", "beacon", "prism", "vector", "matrix", "node", "pulse", "wave",
  "byte", "nexus", "qubit", "spark", "helix", "datum", "logic", "frame", "index", "token", "graph",
  "field", "layer", "stack", "scope", "trace", "relay", "cache", "block", "chain", "epoch",
  "orbit", "patch", "query", "realm", "shard", "table", "union", "vault", "width", "yield",
];

/**
 * FNV-1a 32-bit hash for deterministic pseudonym derivation.
 * Consistent across JS engines (unlike Math.random seeding).
 */
function fnv1a(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash;
}

/**
 * Derive a per-thread pseudonym from sessionId + postId.
 * - Deterministic: same inputs always produce the same pseudonym
 * - Unlinkable across threads: different postIds produce different pseudonyms
 *   even for the same session (no correlation visible to observers)
 */
export function deriveThreadPseudonym(sessionId: string, postId: string): string {
  const combined = `${sessionId}:thread:${postId}`;
  const hash = fnv1a(combined);

  // Use different bit ranges for each component to reduce collision
  const adjIdx = hash % ADJECTIVES.length;
  const nounIdx = (hash >>> 8) % NOUNS.length;
  const num = String(hash % 10000).padStart(4, "0");

  return `${ADJECTIVES[adjIdx]}-${NOUNS[nounIdx]}-${num}`;
}

/**
 * Get or create a persistent root identity seed for this browser.
 * Stored in localStorage — distinct from session, survives logout.
 * Used only as input to thread derivation; never transmitted.
 */
export function getOrCreateRootSeed(): string {
  if (typeof window === "undefined") return "server";
  const KEY = "soxial:root_seed";
  let seed = localStorage.getItem(KEY);
  if (!seed) {
    // Generate a random 32-char hex seed
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    seed = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    localStorage.setItem(KEY, seed);
  }
  return seed;
}

/**
 * Derive thread pseudonym using browser root seed (more private than sessionId).
 * The root seed is never transmitted — only derived outputs leave the device.
 */
export function deriveThreadPseudonymFromRoot(postId: string): string {
  const rootSeed = getOrCreateRootSeed();
  return deriveThreadPseudonym(rootSeed, postId);
}
