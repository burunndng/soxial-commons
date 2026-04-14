# Soxial Commons — Architecture & Implementation Status

## Overview

Soxial Commons is an **anti-vanity, decentralized community discussion platform** that prioritizes ideas over individuals, collaboration over competition, and accountability without surveillance.

**Core Philosophy:** Every voice matters equally. No karma scores, no follower counts, no algorithmic ranking. Instead: ephemeral pseudonyms, randomized feeds, consensus gates, and jury-based moderation.

---

## Phase 1: Complete ✅

### 1. Anti-Vanity Mechanics
- ✅ **Hidden vote counts** — Counts only reveal after user votes
- ✅ **Randomized feeds** — Serendipitous discovery, not engagement-ranked
- ✅ **Idea-based voting** — Votes on content, not authors
- ✅ **No vanity metrics** — No karma, followers, profiles, or leaderboards
- ✅ **Consensus gates** — Posts require opposing viewpoint endorsements
- ✅ **Forced steelmanning** — Users must restate opposing arguments before negative replies

**Tests:** 28 passing

### 2. Serendipity Engine
- ✅ **Topic cluster detection** — Identifies user voting patterns
- ✅ **Outside-content injection** — 30% of feed from outside user clusters
- ✅ **Randomized ordering** — Prevents algorithmic ranking
- ✅ **Temporal decay** — Old content fades from feeds

**Tests:** 13 passing

### 3. Ephemeral Identity (Skill: ephemeral-identity)
- ✅ **Per-thread pseudonyms** — Rotating usernames using HKDF key derivation
- ✅ **Cryptographic keypairs** — ed25519 signing for content integrity
- ✅ **Unlinkable across threads** — Different contexts produce unlinkable keys
- ✅ **Deterministic within thread** — Same root + thread = same pseudonym
- ✅ **Pseudonym generation** — Adjective-noun-number format (e.g., "amber-circuit-3847")

**Tests:** 19 passing

### 4. Decentralized Moderation (Skill: decentralized-moderation)
- ✅ **Voter similarity** — Compute agreement/disagreement scores from voting patterns
- ✅ **Opposing clusters** — Detect users who consistently vote opposite
- ✅ **Jury selection** — Balanced jury with at least one member from each cluster
- ✅ **Blind deliberation** — Juror votes hidden until all submit
- ✅ **Verdict resolution** — Majority vote determines outcome
- ✅ **Report handling** — Jury convenes after 3 reports
- ✅ **Steelman escalation** — Automatic jury after 2 author rejections
- ✅ **Verdict consequences** — Hide (soft), dismiss, or escalate

**Tests:** 16 passing

### 5. Frontend UI
- ✅ **Navigation** — Community selector, no user profiles
- ✅ **Home feed** — Real tRPC data, randomized ordering
- ✅ **Community pages** — Topic-specific feeds
- ✅ **Post composer** — Create posts with stub/consensus options
- ✅ **Responsive design** — Mobile-first layout

### 6. Backend Infrastructure
- ✅ **tRPC routers** — All procedures defined and tested
- ✅ **Mock data** — Seed data for all communities
- ✅ **Database helpers** — Query functions for all features
- ✅ **Type safety** — Full TypeScript coverage

**Total Tests Passing:** 80

---

## Phase 2: Deferred (Ready for Next Sprint)

### 1. Root Key Management
- [ ] Encrypted localStorage for root secret
- [ ] Key generation and initialization UI
- [ ] Key recovery/backup mechanism
- [ ] Passphrase-based key derivation

### 2. Per-Thread Pseudonym Display
- [ ] Display ephemeral pseudonym in posts/comments
- [ ] Show consistent pseudonym within thread
- [ ] Verify signatures on content
- [ ] Hide root key and cross-thread linkability

### 3. Jury UI & Workflows
- [ ] Jury verdict submission interface
- [ ] Blind deliberation UI (hidden votes until all submit)
- [ ] Verdict notification system
- [ ] Appeal workflow

### 4. Report UI & Workflows
- [ ] Community report form
- [ ] Report queue management
- [ ] Jury assignment UI
- [ ] Verdict consequences display

### 5. Consensus Gate UI
- [ ] Show consensus gate progress
- [ ] Display opposing endorsements needed
- [ ] Jury escalation UI for disputed gates
- [ ] Fallback messaging for sparse voting history

### 6. Steelmanning UX
- [ ] Steelmanning modal (component exists, needs wiring)
- [ ] Author verdict UI (accept/reject)
- [ ] Jury adjudication for disputed steelmans
- [ ] Appeal workflow for rejected steelmans

### 7. Supabase Integration
- [ ] Apply database schema migrations
- [ ] Wire tRPC procedures to real database
- [ ] Implement background jobs (similarity computation, cluster assignment)
- [ ] Add calibration post system for cluster bootstrapping

### 8. Production Readiness
- [ ] Performance optimization for randomized feeds
- [ ] Caching strategy for cluster data
- [ ] Rate limiting for reports and appeals
- [ ] Monitoring and logging
- [ ] Security audit (cryptographic implementation)

---

## Data Model

### Core Tables
- `users` — Manus OAuth identities (not exposed in UI)
- `ephemeral_sessions` — Per-thread pseudonym mappings
- `communities` — Topic spaces (Technology, Design, Science, Books, General)
- `posts` — Content with author pseudonym, consensus gate status
- `comments` — Threaded replies with pseudonym
- `idea_votes` — Votes on posts/comments (hidden counts)
- `consensus_endorsements` — Cross-cluster endorsements for consensus gates
- `voter_similarity` — Computed similarity scores between voters
- `voter_clusters` — Cluster assignments with confidence
- `jury_pools` — Jury deliberation records
- `community_reports` — Report queue and status

### Key Design Decisions
1. **No persistent user profiles** — All identity is ephemeral and thread-scoped
2. **Vote counts hidden** — Stored but not revealed until user votes
3. **Cluster data derived** — Computed from voting patterns, not self-selected
4. **Jury balanced** — At least one member from each detected cluster
5. **Verdicts by majority** — No single moderator authority

---

## Cryptographic Implementation

### Ephemeral Pseudonym Generation
```
Root Secret (user-held, never transmitted)
    ↓
HKDF(sha256, rootSecret, contextId)
    ↓
Contextual Private Key (ed25519 seed)
    ↓
Contextual Public Key
    ↓
Pseudonym (adjective-noun-number)
```

**Context IDs:**
- `thread:${threadId}` — Per-thread rotation
- `day:${isoDate}` — Per-day rotation
- `session:${nonce}` — Per-session rotation

### Signing & Verification
- Content signed with contextual private key
- Signature verified against contextual public key
- Provides within-thread accountability without cross-thread linkability

---

## Testing

**Test Files:**
- `server/anti-vanity.test.ts` — 28 tests
- `server/serendipity.test.ts` — 13 tests
- `server/ephemeral-identity.test.ts` — 19 tests
- `server/decentralized-moderation.test.ts` — 16 tests
- `server/auth.logout.test.ts` — 1 test
- `server/supabase.test.ts` — 3 tests

**Total:** 80 tests, all passing

**Run Tests:**
```bash
pnpm test
```

---

## Deployment

### Prerequisites
1. Supabase project (credentials configured)
2. Environment variables set (see `.env.example`)
3. Database schema applied (migrations in `drizzle/`)

### Build & Deploy
```bash
pnpm build
pnpm start
```

The platform is ready for deployment to Manus hosting or any Node.js environment.

---

## Design Principles

### Anti-Vanity
- No karma, followers, or persistent profiles
- Votes on ideas, not people
- Hidden vote counts prevent bandwagon effects

### Collaboration-Forcing
- Incomplete posts (stubs) invite co-authoring
- Forced steelmanning before negative replies
- Consensus gates require opposing viewpoint endorsement

### Serendipity
- Randomized feeds, not algorithmic ranking
- 30% of feed from outside user clusters
- Temporal decay removes old content

### Accountability Without Surveillance
- Ephemeral pseudonyms per thread
- Cryptographic signatures for integrity
- Jury-based moderation without central authority
- Balanced juries from opposing clusters

---

## References

- **Skill: anti-vanity-ux** — Vote hiding, randomized feeds, steelmanning
- **Skill: ephemeral-identity** — Per-thread pseudonyms, HKDF key derivation
- **Skill: decentralized-moderation** — Voter clustering, jury selection, blind deliberation

---

## Next Steps

1. **Phase 2 Sprint** — Implement UI for jury, reports, and steelmanning
2. **Supabase Integration** — Wire procedures to real database
3. **Background Jobs** — Cluster computation, similarity updates
4. **Security Audit** — Cryptographic implementation review
5. **Production Deployment** — Performance optimization and monitoring

---

**Status:** Phase 1 Complete. Ready for Phase 2 development and production integration.
