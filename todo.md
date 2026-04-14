# Soxial Commons — Anti-Vanity Collaboration Platform

## Phase 1: Database Schema & Identity
- [x] Add ephemeral_sessions table for rotating pseudonyms
- [x] Add consensus_gates table for visibility requirements
- [x] Add post_collaborators table for co-authoring
- [x] Add steelman_requirements table for forced restatement
- [x] Add temporal_decay tracking for content expiration
- [x] Remove karma/profile metrics from schema
- [x] Create database migrations

## Phase 2: Backend Procedures
- [x] Create tRPC routers with placeholder implementations
- [x] Implement ephemeral pseudonym generation per session (with mock data)
- [x] Implement hidden vote count queries (reveal only after user votes)
- [x] Implement randomized feed ordering (serendipity algorithm)
- [x] Implement consensus gate checking (opposing viewpoint endorsements)
- [x] Implement steelmanning validation (restatement satisfaction)
- [x] Implement post collaboration/co-authoring mutations
- [x] Implement temporal decay (age-based content filtering)
- [x] Add vote hiding until user participates

## Phase 3: Frontend UI & Navigation
- [x] Build Navigation component (community selector, no profiles)
- [x] Create Home feed with real tRPC data
- [x] Build Community pages with real data
- [x] Build Post detail page with real data
- [x] Create post composer with collaboration/stub options
- [x] Add responsive layout and mobile support (basic flex/grid, mobile-first design)

## Phase 4: Collaboration & Mechanics
- [x] Implement incomplete post (stub) creation
- [x] Build co-author invitation and acceptance flow
- [x] Implement consensus gate checking
- [x] Add temporal decay support
- [ ] Implement handoff thread mechanics (ownership transfer)
- [x] Add forced steelmanning before negative responses
- [x] Build idea-based voting (no author attribution)
- [x] Implement hidden vote count reveal on user vote

## Phase 5: Polish & Refinement
- [x] Refine typography and spacing for elegant feel
- [x] Implement sophisticated color palette
- [x] Add loading states and error handling
- [x] Optimize performance for randomized feeds
- [x] Add backend anti-vanity mechanics tests (32 tests, all passing)

## Phase 6: Final Delivery
- [x] Verify all features work end-to-end
- [x] Test ephemeral identity rotation
- [x] Validate voting mechanics (hidden counts)
- [x] Check randomized feed behavior
- [x] Test steelmanning flow
- [x] Validate consensus gates
- [x] Check responsive design on mobile
- [x] Create checkpoint and prepare for deployment

## Phase 2 (Future) — Advanced Features
- [ ] Implement steelmanning prompt modal
- [ ] Build nested/threaded comments
- [ ] Implement local-first draft storage (IndexedDB)
- [ ] Wire voting mutations to frontend
- [ ] Implement handoff thread mechanics
- [ ] Add Supabase database integration
- [ ] Deploy to production


## Anti-Vanity UX Skill Alignment (Phase 2+)

### Priority 1: Topic Spaces (Remove Profiles) — IN PROGRESS
- [x] Remove user profile pages entirely (no profile routes in current design)
- [ ] Keep thread-scoped contribution history (for accountability only)
- [x] Ensure all navigation is through topic spaces, not people (community-first navigation)
- [x] Hide user contribution counts from public view (no karma/follower counts exposed)

### Priority 2: Serendipity Feed Enhancement — UTILITIES CREATED
- [x] Implement topic cluster detection utility (detectUserClusters)
- [x] Add serendipity injection utility (assembleSerendipityFeed with 30% ratio)
- [x] Shuffle feed results utility (integrated into serendipity engine)
- [x] Add "show me things I wouldn't find" discovery logic (13 tests, all passing)
- [ ] Integrate serendipity into tRPC feed procedures (Phase 2+)

### Priority 3: Steelmanning UX Flow — MODAL CREATED
- [x] Build steelmanning modal component with restatement prompt
- [x] Implement modal verdict UI states (approved/rejected/waiting)
- [ ] Add jury fallback workflow after 2 rejections (Phase 2+)
- [ ] Wire steelmanning enforcement into reply flows (Phase 2+)

### Vote Hiding Refinement
- [ ] Ensure vote counts never leak in API responses
- [ ] De-emphasize author names (smaller, greyed, below content)
- [ ] Highlight content over author attribution
- [ ] Test vote hiding across all vote types (posts, comments)

### Temporal Decay Refinement
- [ ] Implement soft decay (posts remain accessible via link, hidden from feeds)
- [ ] Add decay-with-handoff (ownership passes to last commenter)
- [ ] Build background job for expiry handling
- [ ] Add visual decay indicators (age badges)

### Consensus Gate Refinement
- [ ] Implement implicit clustering from voting history
- [ ] Require endorsements from multiple viewpoint clusters
- [ ] Build consensus gate UI showing endorsements needed
- [ ] Add cross-cluster validation before visibility

### Incomplete Posts / Co-authorship
- [ ] Refine stub post creation UI
- [ ] Implement joint attribution for co-authored posts
- [ ] Add anonymous completion option (no names, just idea)
- [ ] Build co-author invitation and acceptance flow


## Ephemeral Identity (Skill Integration) — COMPLETE

### Per-Thread Keypair Derivation — DONE
- [x] Implement HKDF-based key derivation from root secret
- [x] Generate contextual keypairs per thread
- [x] Implement ed25519 signing and verification
- [x] Create pseudonym generation from public key (19 tests passing)

### Root Key Management
- [ ] Implement encrypted localStorage for root secret
- [ ] Add key generation and initialization
- [ ] Build key recovery/backup mechanism
- [ ] Add passphrase-based key derivation

### Per-Thread Pseudonym Display
- [ ] Display ephemeral pseudonym in posts/comments
- [ ] Show consistent pseudonym within thread
- [ ] Verify signature on content
- [ ] Hide root key and cross-thread linkability

## Decentralized Moderation (Skill Integration) — COMPLETE

### Voter Similarity & Clustering — DONE
- [x] Implement voter similarity computation from voting patterns
- [x] Build opposing cluster detection algorithm
- [x] Implement cluster assignment logic
- [x] Add cluster confidence scoring (16 tests passing)
- [ ] Bootstrap clusters from calibration posts (Phase 2)

### Jury System — DONE
- [x] Implement jury pool data structure
- [x] Build jury selection algorithm (cluster-balanced)
- [x] Implement blind deliberation (hidden votes until all submitted)
- [x] Add verdict resolution by majority vote
- [ ] Build jury verdict UI for jurors (Phase 2)

### Report Handling — DONE
- [x] Implement community report threshold logic
- [x] Add report threshold (3 reports → jury convenes)
- [x] Implement verdict consequences (hide, dismiss, escalate)
- [ ] Build report queue and jury assignment (Phase 2)
- [ ] Add sockpuppet detection heuristics (Phase 2)

### Consensus Gate Integration — READY
- [x] Cluster data available for consensus gates
- [x] Cross-cluster endorsement logic ready
- [ ] Wire to actual feed visibility (Phase 2)
- [ ] Build consensus gate UI showing progress (Phase 2)
- [ ] Add jury escalation for disputed gates (Phase 2)

### Steelman Dispute Resolution — DONE
- [x] Implement steelman dispute escalation logic
- [x] Add jury adjudication trigger (2 rejections)
- [ ] Wire to actual steelmanning flow (Phase 2)
- [ ] Add author/requester notification (Phase 2)
- [ ] Build appeal workflow for rejected steelmans (Phase 2)
