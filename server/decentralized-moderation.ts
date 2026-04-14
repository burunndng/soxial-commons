/**
 * Decentralized Moderation System
 * 
 * Jury-based moderation without central authority. Uses voting history
 * to detect viewpoint clusters, selects balanced juries, and implements
 * blind deliberation for fair verdicts.
 */

// ============================================================================
// Part 1: Voter Similarity & Clustering
// ============================================================================

export interface VoterSimilarity {
  tokenA: string;
  tokenB: string;
  score: number; // -1.0 (always oppose) to 1.0 (always agree)
  postCount: number; // confidence weight
}

export interface VoterCluster {
  voterId: string;
  clusterId: number;
  confidence: number; // 0.0–1.0
}

const MIN_OVERLAP = 5; // minimum co-votes to compute meaningful similarity

/**
 * Compute similarity between two voters based on voting patterns.
 * score = (agreements - disagreements) / total_co-votes
 */
export function computeVoterSimilarity(
  voterAVotes: Array<{ postId: number; value: number }>,
  voterBVotes: Array<{ postId: number; value: number }>
): VoterSimilarity | null {
  const aMap = new Map(voterAVotes.map((v) => [v.postId, v.value]));
  const bMap = new Map(voterBVotes.map((v) => [v.postId, v.value]));

  const commonPosts = Array.from(aMap.keys()).filter((p) => bMap.has(p));

  if (commonPosts.length < MIN_OVERLAP) {
    return null; // Not enough overlap to compute meaningful score
  }

  let agreements = 0;
  let disagreements = 0;

  for (const postId of commonPosts) {
    const aVal = aMap.get(postId)!;
    const bVal = bMap.get(postId)!;

    if ((aVal > 0 && bVal > 0) || (aVal < 0 && bVal < 0)) {
      agreements++;
    } else if ((aVal > 0 && bVal < 0) || (aVal < 0 && bVal > 0)) {
      disagreements++;
    }
  }

  const score = (agreements - disagreements) / commonPosts.length;

  return {
    tokenA: voterAVotes[0]?.postId ? "voter-a" : "voter-a", // Placeholder
    tokenB: voterBVotes[0]?.postId ? "voter-b" : "voter-b", // Placeholder
    score,
    postCount: commonPosts.length,
  };
}

/**
 * Detect opposing viewpoint clusters from voting patterns.
 * Returns users who consistently vote opposite on the same posts.
 */
export function detectOpposingClusters(
  allVotes: Array<{ voterId: string; postId: number; value: number }>
): { cluster1: Set<string>; cluster2: Set<string> } {
  const cluster1 = new Set<string>();
  const cluster2 = new Set<string>();

  // Group votes by post
  const votesByPost = new Map<
    number,
    Array<{ voterId: string; value: number }>
  >();
  for (const vote of allVotes) {
    if (!votesByPost.has(vote.postId)) {
      votesByPost.set(vote.postId, []);
    }
    votesByPost.get(vote.postId)!.push({ voterId: vote.voterId, value: vote.value });
  }

  // Find voters who consistently vote opposite
  const voterPairs = new Map<string, { pro: number; con: number }>();

  for (const votes of Array.from(votesByPost.values())) {
    for (let i = 0; i < votes.length; i++) {
      for (let j = i + 1; j < votes.length; j++) {
        const a = votes[i];
        const b = votes[j];

        if ((a.value > 0 && b.value < 0) || (a.value < 0 && b.value > 0)) {
          // Opposing votes
          const key = [a.voterId, b.voterId].sort().join("|");
          if (!voterPairs.has(key)) {
            voterPairs.set(key, { pro: 0, con: 0 });
          }
          const pair = voterPairs.get(key)!;
          if (a.value > 0) {
            pair.pro++;
          } else {
            pair.con++;
          }
        }
      }
    }
  }

  // Assign to clusters based on majority opposition
  const assignments = new Map<string, number>();
  for (const [key, counts] of Array.from(voterPairs.entries())) {
    const [voter1, voter2] = key.split("|");
    if (counts.pro > counts.con) {
      assignments.set(voter1, 1);
      assignments.set(voter2, 2);
    } else {
      assignments.set(voter1, 2);
      assignments.set(voter2, 1);
    }
  }

  // Populate clusters
  for (const [voterId, clusterId] of Array.from(assignments.entries())) {
    if (clusterId === 1) {
      cluster1.add(voterId);
    } else {
      cluster2.add(voterId);
    }
  }

  return { cluster1, cluster2 };
}

// ============================================================================
// Part 2: Jury System
// ============================================================================

export interface JuryPool {
  id: string;
  caseId: string;
  caseType: "report" | "steelman_dispute";
  jurorTokens: string[];
  status: "open" | "deliberating" | "decided" | "appealed";
  verdict?: "sustain" | "dismiss" | "escalate";
  votes: Record<string, string>; // { jurorToken: verdict }
  createdAt: Date;
  decidedAt?: Date;
}

/**
 * Select a balanced jury from active voters in a topic.
 * Aims for at least one juror from each known cluster.
 */
export function selectJurors(
  eligibleVoters: Array<{
    voterId: string;
    clusterId?: number;
    confidence?: number;
  }>,
  excludeVoters: string[],
  jurySize: number = 3
): string[] {
  const eligible = eligibleVoters.filter(
    (v) => !excludeVoters.includes(v.voterId)
  );

  if (eligible.length === 0) {
    return [];
  }

  // Group by cluster
  const byCluster = new Map<number | string, string[]>();
  for (const voter of eligible) {
    const clusterId = voter.clusterId ?? "unknown";
    if (!byCluster.has(clusterId)) {
      byCluster.set(clusterId, []);
    }
    byCluster.get(clusterId)!.push(voter.voterId);
  }

  // Pick one from each cluster first
  const selected: string[] = [];
  for (const [, voters] of Array.from(byCluster.entries())) {
    if (selected.length >= jurySize) break;
    // Shuffle and pick first
    const shuffled = [...voters].sort(() => Math.random() - 0.5);
    selected.push(shuffled[0]);
  }

  // Fill remaining slots randomly
  while (selected.length < jurySize) {
    const remaining = eligible.filter(
      (v) => !selected.includes(v.voterId)
    );
    if (!remaining.length) break;
    const shuffled = remaining.sort(() => Math.random() - 0.5);
    selected.push(shuffled[0].voterId);
  }

  return selected;
}

/**
 * Submit a juror verdict (blind: hidden until all 3 submit).
 */
export function submitJurorVerdict(
  pool: JuryPool,
  jurorToken: string,
  verdict: "sustain" | "dismiss" | "escalate"
): JuryPool {
  if (!pool.jurorTokens.includes(jurorToken)) {
    throw new Error("Juror not in this pool");
  }

  const updated = { ...pool };
  updated.votes = { ...pool.votes, [jurorToken]: verdict };
  updated.status = "deliberating";

  // Check if all have voted
  if (Object.keys(updated.votes).length === pool.jurorTokens.length) {
    updated.status = "decided";
    updated.decidedAt = new Date();
  }

  return updated;
}

/**
 * Resolve verdict by majority vote.
 */
export function resolveVerdict(
  votes: Record<string, string>
): "sustain" | "dismiss" | "escalate" {
  const counts: Record<string, number> = {};

  for (const verdict of Object.values(votes)) {
    counts[verdict] = (counts[verdict] || 0) + 1;
  }

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return sorted[0][0] as "sustain" | "dismiss" | "escalate";
}

// ============================================================================
// Part 3: Report Handling
// ============================================================================

export interface CommunityReport {
  id: string;
  postId: number;
  reporterId: string;
  reason: "spam" | "harassment" | "bad_faith" | "sockpuppet" | "other";
  description: string;
  createdAt: Date;
  status: "open" | "under_review" | "resolved";
}

const REPORT_THRESHOLD = 3; // reports needed before jury convenes

/**
 * Check if a post has reached the report threshold for jury convening.
 */
export function shouldConveneJury(reportCount: number): boolean {
  return reportCount >= REPORT_THRESHOLD;
}

/**
 * Determine consequences of a verdict.
 */
export function applyVerdict(
  verdict: "sustain" | "dismiss" | "escalate",
  postId: number
): {
  action: "hide" | "delete" | "escalate" | "none";
  message: string;
} {
  switch (verdict) {
    case "sustain":
      return {
        action: "hide",
        message: "Post hidden from feed (soft removal). Author notified.",
      };
    case "dismiss":
      return {
        action: "none",
        message: "Report dismissed. Post remains visible.",
      };
    case "escalate":
      return {
        action: "escalate",
        message: "Escalated to larger jury (7 members).",
      };
  }
}

// ============================================================================
// Part 4: Steelman Dispute Resolution
// ============================================================================

export interface SteelmanDispute {
  id: string;
  postId: number;
  requesterId: string;
  steelmanText: string;
  authorVerdict?: "accept" | "reject";
  rejectionCount: number;
  juryVerdict?: "reasonable" | "unreasonable";
  createdAt: Date;
}

/**
 * Check if a steelman dispute should escalate to jury.
 * After 2 rejections, a jury adjudicates.
 */
export function shouldEscalateToJury(dispute: SteelmanDispute): boolean {
  return dispute.rejectionCount >= 2;
}

/**
 * Determine if a steelman meets the standard after jury review.
 */
export function isSteelmanReasonable(
  juryVerdict: "reasonable" | "unreasonable"
): boolean {
  return juryVerdict === "reasonable";
}
