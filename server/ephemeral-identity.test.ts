import { describe, it, expect } from "vitest";
import {
  deriveContextualKeypair,
  keyToPseudonym,
  signContent,
  verifySignature,
  generateRootSecret,
  getThreadContextId,
  getDayContextId,
  getSessionContextId,
} from "./ephemeral-identity";

describe("Ephemeral Identity System", () => {
  describe("deriveContextualKeypair", () => {
    it("should derive a keypair from root secret and context", () => {
      const rootSecret = new Uint8Array(32);
      rootSecret[0] = 42; // Seed with a value for reproducibility

      const keypair = deriveContextualKeypair(rootSecret, "thread:1");

      expect(keypair.privateKey).toBeInstanceOf(Uint8Array);
      expect(keypair.publicKey).toBeInstanceOf(Uint8Array);
      expect(keypair.privateKey.length).toBe(32);
      expect(keypair.publicKey.length).toBe(32);
    });

    it("should be deterministic: same root + context = same keypair", () => {
      const rootSecret = new Uint8Array(32);
      rootSecret[0] = 42;

      const keypair1 = deriveContextualKeypair(rootSecret, "thread:1");
      const keypair2 = deriveContextualKeypair(rootSecret, "thread:1");

      expect(keypair1.privateKey).toEqual(keypair2.privateKey);
      expect(keypair1.publicKey).toEqual(keypair2.publicKey);
    });

    it("should produce unlinkable keypairs for different contexts", () => {
      const rootSecret = new Uint8Array(32);
      rootSecret[0] = 42;

      const keypair1 = deriveContextualKeypair(rootSecret, "thread:1");
      const keypair2 = deriveContextualKeypair(rootSecret, "thread:2");

      // Different contexts should produce different keys
      expect(keypair1.publicKey).not.toEqual(keypair2.publicKey);
      expect(keypair1.privateKey).not.toEqual(keypair2.privateKey);
    });

    it("should produce unlinkable keypairs for different roots", () => {
      const root1 = new Uint8Array(32);
      root1[0] = 42;

      const root2 = new Uint8Array(32);
      root2[0] = 43;

      const keypair1 = deriveContextualKeypair(root1, "thread:1");
      const keypair2 = deriveContextualKeypair(root2, "thread:1");

      // Different roots should produce different keys even with same context
      expect(keypair1.publicKey).not.toEqual(keypair2.publicKey);
    });
  });

  describe("keyToPseudonym", () => {
    it("should generate a human-readable pseudonym from a public key", () => {
      const rootSecret = new Uint8Array(32);
      rootSecret[0] = 42;

      const { publicKey } = deriveContextualKeypair(rootSecret, "thread:1");
      const pseudonym = keyToPseudonym(publicKey);

      expect(pseudonym).toMatch(/^[a-z]+-[a-z]+-\d{4,5}$/);
    });

    it("should be deterministic: same key = same pseudonym", () => {
      const rootSecret = new Uint8Array(32);
      rootSecret[0] = 42;

      const { publicKey } = deriveContextualKeypair(rootSecret, "thread:1");
      const pseudonym1 = keyToPseudonym(publicKey);
      const pseudonym2 = keyToPseudonym(publicKey);

      expect(pseudonym1).toBe(pseudonym2);
    });

    it("should produce different pseudonyms for different keys", () => {
      const rootSecret = new Uint8Array(32);
      rootSecret[0] = 42;

      const { publicKey: key1 } = deriveContextualKeypair(rootSecret, "thread:1");
      const { publicKey: key2 } = deriveContextualKeypair(rootSecret, "thread:2");

      const pseudonym1 = keyToPseudonym(key1);
      const pseudonym2 = keyToPseudonym(key2);

      expect(pseudonym1).not.toBe(pseudonym2);
    });
  });

  describe("signContent and verifySignature", () => {
    it("should sign and verify content", () => {
      const rootSecret = new Uint8Array(32);
      rootSecret[0] = 42;

      const { privateKey, publicKey } = deriveContextualKeypair(
        rootSecret,
        "thread:1"
      );
      const content = "This is a test message";

      const signature = signContent(content, privateKey);
      const isValid = verifySignature(content, signature, publicKey);

      expect(isValid).toBe(true);
    });

    it("should reject tampered content", () => {
      const rootSecret = new Uint8Array(32);
      rootSecret[0] = 42;

      const { privateKey, publicKey } = deriveContextualKeypair(
        rootSecret,
        "thread:1"
      );
      const content = "This is a test message";

      const signature = signContent(content, privateKey);
      const tampered = "This is a tampered message";
      const isValid = verifySignature(tampered, signature, publicKey);

      expect(isValid).toBe(false);
    });

    it("should reject signature from different key", () => {
      const rootSecret1 = new Uint8Array(32);
      rootSecret1[0] = 42;

      const rootSecret2 = new Uint8Array(32);
      rootSecret2[0] = 43;

      const { privateKey: key1 } = deriveContextualKeypair(
        rootSecret1,
        "thread:1"
      );
      const { publicKey: key2 } = deriveContextualKeypair(
        rootSecret2,
        "thread:1"
      );

      const content = "This is a test message";
      const signature = signContent(content, key1);
      const isValid = verifySignature(content, signature, key2);

      expect(isValid).toBe(false);
    });

    it("should handle invalid base64 signatures gracefully", () => {
      const rootSecret = new Uint8Array(32);
      rootSecret[0] = 42;

      const { publicKey } = deriveContextualKeypair(rootSecret, "thread:1");
      const content = "This is a test message";
      const invalidSignature = "not-valid-base64!!!";

      const isValid = verifySignature(content, invalidSignature, publicKey);

      expect(isValid).toBe(false);
    });
  });

  describe("generateRootSecret", () => {
    it("should generate a 32-byte secret", () => {
      const secret = generateRootSecret();

      expect(secret).toBeInstanceOf(Uint8Array);
      expect(secret.length).toBe(32);
    });

    it("should generate different secrets on each call", () => {
      const secret1 = generateRootSecret();
      const secret2 = generateRootSecret();

      expect(secret1).not.toEqual(secret2);
    });
  });

  describe("Context ID generation", () => {
    it("should generate thread context IDs", () => {
      const contextId = getThreadContextId(42);

      expect(contextId).toBe("thread:42");
    });

    it("should generate day context IDs", () => {
      const date = new Date("2026-04-14");
      const contextId = getDayContextId(date);

      expect(contextId).toBe("day:2026-04-14");
    });

    it("should generate session context IDs", () => {
      const nonce = "abc123xyz";
      const contextId = getSessionContextId(nonce);

      expect(contextId).toBe("session:abc123xyz");
    });
  });

  describe("Per-thread accountability", () => {
    it("should maintain consistent pseudonym within a thread", () => {
      const rootSecret = new Uint8Array(32);
      rootSecret[0] = 42;

      // Same user, same thread
      const { publicKey: key1 } = deriveContextualKeypair(
        rootSecret,
        "thread:1"
      );
      const { publicKey: key2 } = deriveContextualKeypair(
        rootSecret,
        "thread:1"
      );

      const pseudonym1 = keyToPseudonym(key1);
      const pseudonym2 = keyToPseudonym(key2);

      expect(pseudonym1).toBe(pseudonym2);
    });

    it("should rotate pseudonym across threads", () => {
      const rootSecret = new Uint8Array(32);
      rootSecret[0] = 42;

      // Same user, different threads
      const { publicKey: key1 } = deriveContextualKeypair(
        rootSecret,
        "thread:1"
      );
      const { publicKey: key2 } = deriveContextualKeypair(
        rootSecret,
        "thread:2"
      );

      const pseudonym1 = keyToPseudonym(key1);
      const pseudonym2 = keyToPseudonym(key2);

      expect(pseudonym1).not.toBe(pseudonym2);
    });

    it("should prevent cross-thread identity linkage", () => {
      const rootSecret = new Uint8Array(32);
      rootSecret[0] = 42;

      const keypair1 = deriveContextualKeypair(rootSecret, "thread:1");
      const keypair2 = deriveContextualKeypair(rootSecret, "thread:2");

      // No mathematical relationship between the keys
      expect(keypair1.publicKey).not.toEqual(keypair2.publicKey);
      expect(keypair1.privateKey).not.toEqual(keypair2.privateKey);

      // Different pseudonyms
      const pseudonym1 = keyToPseudonym(keypair1.publicKey);
      const pseudonym2 = keyToPseudonym(keypair2.publicKey);
      expect(pseudonym1).not.toBe(pseudonym2);
    });
  });
});
