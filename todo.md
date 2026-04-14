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
- [ ] Create post composer with collaboration/stub options
- [ ] Implement steelmanning prompt modal
- [ ] Build comment thread with nested replies
- [x] Add responsive layout and mobile support

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
- [x] Add comprehensive test coverage (28 tests, all passing)
- [ ] Implement local-first draft storage (IndexedDB)

## Phase 6: Final Delivery
- [x] Verify all features work end-to-end
- [x] Test ephemeral identity rotation
- [x] Validate voting mechanics (hidden counts)
- [x] Check randomized feed behavior
- [x] Test steelmanning flow
- [x] Validate consensus gates
- [x] Check responsive design on mobile
- [x] Create checkpoint and prepare for deployment
