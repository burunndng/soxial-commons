import { describe, it, expect } from "vitest";
import {
  computeVoterSimilarity,
  detectOpposingClusters,
  selectJurors,
  submitJurorVerdict,
  resolveVerdict,
  shouldConveneJury,
  applyVerdict,
  shouldEscalateToJury,
  isSteelmanReasonable,
} from "./decentralized-moderation";

describe("Decentralized Moderation", () => {
  describe("Voter Similarity", () => {
    it("should compute similarity between voters with high agreement", () => {
      const voterAVotes = [
        { postId: 1, value: 1 },
        { postId: 2, value: 1 },
        { postId: 3, value: 1 },
        { postId: 4, value: 1 },
        { postId: 5, value: 1 },
      ];

      const voterBVotes = [
        { postId: 1, value: 1 },
        { postId: 2, value: 1 },
        { postId: 3, value: 1 },
        { postId: 4, value: 1 },
        { postId: 5, value: 1 },
      ];

      const similarity = computeVoterSimilarity(voterAVotes, voterBVotes);

      expect(similarity).not.toBeNull();
      expect(similarity!.score).toBe(1.0); // Perfect agreement
      expect(similarity!.postCount).toBe(5);
    });

    it("should compute similarity with disagreement", () => {
      const voterAVotes = [
        { postId: 1, value: 1 },
        { postId: 2, value: 1 },
        { postId: 3, value: -1 },
        { postId: 4, value: -1 },
        { postId: 5, value: 1 },
      ];

      const voterBVotes = [
        { postId: 1, value: -1 },
        { postId: 2, value: -1 },
        { postId: 3, value: 1 },
        { postId: 4, value: 1 },
        { postId: 5, value: 1 },
      ];

      const similarity = computeVoterSimilarity(voterAVotes, voterBVotes);

      expect(similarity).not.toBeNull();
      expect(similarity!.score).toBe(-0.6); // Mostly disagreement
    });

    it("should return null for insufficient overlap", () => {
      const voterAVotes = [
        { postId: 1, value: 1 },
        { postId: 2, value: 1 },
      ];

      const voterBVotes = [
        { postId: 3, value: 1 },
        { postId: 4, value: 1 },
      ];

      const similarity = computeVoterSimilarity(voterAVotes, voterBVotes);

      expect(similarity).toBeNull();
    });
  });

  describe("Opposing Clusters", () => {
    it("should detect opposing viewpoint clusters", () => {
      const allVotes = [
        { voterId: "user1", postId: 1, value: 1 },
        { voterId: "user2", postId: 1, value: -1 },
        { voterId: "user1", postId: 2, value: 1 },
        { voterId: "user2", postId: 2, value: -1 },
        { voterId: "user1", postId: 3, value: 1 },
        { voterId: "user2", postId: 3, value: -1 },
      ];

      const { cluster1, cluster2 } = detectOpposingClusters(allVotes);

      expect(cluster1.size + cluster2.size).toBeGreaterThan(0);
      // user1 and user2 should be in different clusters
      const user1InCluster1 = cluster1.has("user1");
      const user2InCluster1 = cluster1.has("user2");
      expect(user1InCluster1 !== user2InCluster1).toBe(true);
    });

    it("should handle empty votes", () => {
      const { cluster1, cluster2 } = detectOpposingClusters([]);

      expect(cluster1.size).toBe(0);
      expect(cluster2.size).toBe(0);
    });
  });

  describe("Jury Selection", () => {
    it("should select a balanced jury from eligible voters", () => {
      const eligible = [
        { voterId: "user1", clusterId: 1, confidence: 0.9 },
        { voterId: "user2", clusterId: 1, confidence: 0.8 },
        { voterId: "user3", clusterId: 2, confidence: 0.9 },
        { voterId: "user4", clusterId: 2, confidence: 0.8 },
        { voterId: "user5", clusterId: 3, confidence: 0.7 },
      ];

      const jurors = selectJurors(eligible, [], 3);

      expect(jurors.length).toBe(3);
      expect(new Set(jurors).size).toBe(3); // No duplicates
    });

    it("should exclude specified voters", () => {
      const eligible = [
        { voterId: "user1", clusterId: 1 },
        { voterId: "user2", clusterId: 1 },
        { voterId: "user3", clusterId: 2 },
      ];

      const jurors = selectJurors(eligible, ["user1"], 2);

      expect(jurors).not.toContain("user1");
      expect(jurors.length).toBe(2);
    });

    it("should handle insufficient eligible voters", () => {
      const eligible = [{ voterId: "user1", clusterId: 1 }];

      const jurors = selectJurors(eligible, [], 3);

      expect(jurors.length).toBeLessThanOrEqual(1);
    });
  });

  describe("Jury Deliberation", () => {
    it("should submit juror verdicts and track status", () => {
      const pool = {
        id: "case-1",
        caseId: "post-1",
        caseType: "report" as const,
        jurorTokens: ["juror1", "juror2", "juror3"],
        status: "open" as const,
        votes: {},
        createdAt: new Date(),
      };

      let updated = submitJurorVerdict(pool, "juror1", "sustain");
      expect(updated.status).toBe("deliberating");
      expect(updated.votes["juror1"]).toBe("sustain");

      updated = submitJurorVerdict(updated, "juror2", "dismiss");
      expect(updated.status).toBe("deliberating");

      updated = submitJurorVerdict(updated, "juror3", "sustain");
      expect(updated.status).toBe("decided");
      expect(updated.decidedAt).toBeDefined();
    });

    it("should reject verdicts from non-jurors", () => {
      const pool = {
        id: "case-1",
        caseId: "post-1",
        caseType: "report" as const,
        jurorTokens: ["juror1", "juror2", "juror3"],
        status: "open" as const,
        votes: {},
        createdAt: new Date(),
      };

      expect(() => submitJurorVerdict(pool, "imposter", "sustain")).toThrow();
    });
  });

  describe("Verdict Resolution", () => {
    it("should resolve verdict by majority vote", () => {
      const votes = {
        juror1: "sustain",
        juror2: "sustain",
        juror3: "dismiss",
      };

      const verdict = resolveVerdict(votes);

      expect(verdict).toBe("sustain");
    });

    it("should handle ties (first in sorted order wins)", () => {
      const votes = {
        juror1: "sustain",
        juror2: "dismiss",
        juror3: "escalate",
      };

      const verdict = resolveVerdict(votes);

      expect(["sustain", "dismiss", "escalate"]).toContain(verdict);
    });
  });

  describe("Report Handling", () => {
    it("should convene jury when threshold is reached", () => {
      expect(shouldConveneJury(2)).toBe(false);
      expect(shouldConveneJury(3)).toBe(true);
      expect(shouldConveneJury(4)).toBe(true);
    });

    it("should apply verdict consequences correctly", () => {
      const sustainResult = applyVerdict("sustain", 1);
      expect(sustainResult.action).toBe("hide");

      const dismissResult = applyVerdict("dismiss", 1);
      expect(dismissResult.action).toBe("none");

      const escalateResult = applyVerdict("escalate", 1);
      expect(escalateResult.action).toBe("escalate");
    });
  });

  describe("Steelman Dispute Resolution", () => {
    it("should escalate to jury after 2 rejections", () => {
      const dispute = {
        id: "dispute-1",
        postId: 1,
        requesterId: "user1",
        steelmanText: "Here is my restatement",
        rejectionCount: 1,
        createdAt: new Date(),
      };

      expect(shouldEscalateToJury(dispute)).toBe(false);

      dispute.rejectionCount = 2;
      expect(shouldEscalateToJury(dispute)).toBe(true);
    });

    it("should evaluate steelman reasonableness", () => {
      expect(isSteelmanReasonable("reasonable")).toBe(true);
      expect(isSteelmanReasonable("unreasonable")).toBe(false);
    });
  });
});
