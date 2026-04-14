# Soxial Commons — Chain-of-Thought Implementation Plan

## Architecture Overview

**Core Principle:** Anti-vanity, collaboration-focused discussion platform with ephemeral identities and idea-based voting.

### Key Mechanics

1. **Ephemeral Pseudonyms** — Each session gets a rotating pseudonym. No persistent profiles, no karma tracking, no follower counts.
2. **Idea-Based Voting** — Votes attach to content, not authors. Vote counts hidden until user participates.
3. **Randomized Feed** — Serendipitous ordering prevents engagement-based ranking.
4. **Forced Steelmanning** — Before negative responses, users must restate opposing view to satisfaction.
5. **Consensus Gates** — Posts need opposing viewpoint endorsements to become visible.
6. **Collaboration** — Incomplete posts (stubs) can be co-authored by multiple sessions.
7. **Temporal Decay** — Old content fades with time.
8. **Topic Rooms** — Interaction around ideas, not user profiles.

---

## Implementation Sequence

### Phase 1: Backend Infrastructure (Database + Procedures)

**Goal:** Set up all database tables and tRPC procedures for core mechanics.

**Steps:**

1. **Database Schema** ✓ (Done)
   - `ephemeralSessions` — rotating pseudonyms per session
   - `communities` — topic rooms
   - `posts` — collaborative, stub-able, consensus-gated
   - `postVotes` — hidden until user votes
   - `comments` — threaded with steelmanning
   - `commentVotes` — hidden until user votes
   - `steelmanRequirements` — restatement validation
   - `consensusEndorsements` — opposing viewpoint tracking
   - `postCollaborators` — co-authoring

2. **Database Helpers** (Next)
   - Ephemeral session creation/rotation
   - Randomized feed queries
   - Hidden vote count queries (reveal only after user votes)
   - Consensus gate checking
   - Steelmanning validation
   - Post collaboration mutations
   - Temporal decay filtering

3. **tRPC Procedures** (After helpers)
   - `sessions.create` — generate ephemeral pseudonym
   - `sessions.rotate` — rotate pseudonym
   - `posts.create` — with stub/collaborative flags
   - `posts.getFeed` — randomized ordering
   - `posts.getById` — with consensus gate status
   - `postVotes.vote` — hide count until user votes
   - `comments.create` — with steelmanning requirement
   - `comments.getSteelmanRequirement` — get restatement prompt
   - `comments.submitSteelman` — validate restatement
   - `consensusEndorsements.endorse` — opposing viewpoint tracking
   - `postCollaborators.join` — co-author a stub

### Phase 2: Frontend Core UI

**Goal:** Build basic page structure and navigation without vanity metrics.

**Steps:**

1. **Layout & Navigation**
   - Top nav with community selector (no user profile)
   - Topic room selector (Technology, Design, Science, Books, General)
   - No user profile links, no karma display

2. **Home Feed Page**
   - Randomized post ordering
   - Post card showing: title, community, snippet, comment count (no author, no vote count)
   - "Vote" button (reveals count after clicking)
   - "Comment" button
   - "Save" button (if authenticated)

3. **Post Composer**
   - Title + body/URL fields
   - Community selector
   - Checkbox: "This is a stub (open for co-authoring)"
   - Checkbox: "Require consensus (need opposing endorsements)"
   - Submit button

4. **Post Detail Page**
   - Full post + metadata
   - Consensus gate indicator (if applicable)
   - Comment thread
   - Vote buttons (hidden counts)

### Phase 3: Voting & Interaction Mechanics

**Goal:** Implement hidden vote counts, steelmanning, and consensus gates.

**Steps:**

1. **Hidden Vote Counts**
   - Query: `getVoteCount(postId, sessionId)` — returns count only if user voted
   - UI: Show "Vote" until user votes, then show count
   - Mutation: `postVotes.vote` — reveal count after vote

2. **Steelmanning Flow**
   - When user tries to comment negatively, show modal: "Restate their argument first"
   - User submits restatement
   - Original author approves/rejects
   - Only after approval can negative reply be posted

3. **Consensus Gates**
   - Query: Check if post needs consensus + how many opposing endorsements needed
   - UI: Show "Needs X opposing endorsements to be visible"
   - Mutation: `consensusEndorsements.endorse` — add supporting/opposing endorsement
   - Auto-check: When threshold reached, set `isVisibleToWider = true`

### Phase 4: Collaboration & Advanced Mechanics

**Goal:** Implement post collaboration, temporal decay, and serendipity.

**Steps:**

1. **Post Collaboration**
   - Stub posts show "Join as co-author" button
   - Mutation: `postCollaborators.join` — add session as collaborator
   - UI: Show list of collaborators (pseudonyms only)
   - Co-authors can edit post body

2. **Randomized Feed**
   - Instead of `ORDER BY score DESC`, use:
     - `ORDER BY RAND()` for pure randomness
     - Or: `ORDER BY (score + RAND() * 10)` for slight score bias
   - Pagination: Load 25 posts at random offset

3. **Temporal Decay**
   - Query: Filter out posts where `expiresAt < NOW()`
   - UI: Show age badge "3 days old" with fading opacity
   - Mutation: Auto-set `expiresAt = createdAt + 7 days` on post creation

4. **Ephemeral Session Rotation**
   - On page load: Check if session expired
   - If expired: Generate new pseudonym, new session token
   - UI: Show "Your pseudonym rotated" notification
   - Preserve: User's votes/comments stay (linked to old sessions)

### Phase 5: Polish & Refinement

**Goal:** Elegant design, performance, and comprehensive testing.

**Steps:**

1. **Design System**
   - Sophisticated color palette (no bright engagement colors)
   - Elegant typography (serif for posts, sans-serif for UI)
   - Refined spacing and shadows
   - Remove all vanity metrics visually

2. **Performance**
   - Randomized feed queries optimized (use RAND() with LIMIT efficiently)
   - Vote count queries cached (reveal only after user votes)
   - Lazy-load comments on post detail page

3. **Testing**
   - Ephemeral session rotation
   - Hidden vote counts (verify hidden → revealed)
   - Steelmanning flow (restatement validation)
   - Consensus gates (visibility toggle)
   - Randomized feed ordering
   - Temporal decay filtering

---

## Data Flow Examples

### Example 1: Voting with Hidden Counts

```
User loads feed
→ Posts show "Vote" button (no count visible)
→ User clicks upvote on Post #5
→ Vote recorded: postVotes(postId=5, sessionId=123, value=1, isHidden=false)
→ Vote count query now returns count
→ UI shows "1 upvote" next to button
```

### Example 2: Steelmanning Before Negative Reply

```
User tries to comment negatively on Comment #42
→ System checks: Is this a negative response to a positive comment?
→ Modal appears: "Restate their argument first"
→ User submits restatement
→ Original author gets notification: "Someone restated your argument"
→ Author approves restatement
→ Negative reply now allowed
→ Both restatement + reply posted
```

### Example 3: Consensus Gate

```
User posts in Technology community with requiresConsensus=true
→ Post created with isVisibleToWider=false
→ Consensus gate shows: "Needs 2 opposing endorsements"
→ User A (supporting view) endorses
→ User B (opposing view) endorses
→ System auto-updates: opposingEndorsementsReceived=1, checks threshold
→ Still needs 1 more opposing endorsement
→ User C (opposing view) endorses
→ System auto-updates: opposingEndorsementsReceived=2
→ Threshold reached! isVisibleToWider=true
→ Post now visible to wider community
```

### Example 4: Ephemeral Session Rotation

```
Session created: pseudonym="Curious Badger", expiresAt=tomorrow
→ User posts, votes, comments (all linked to this session)
→ Tomorrow: User loads page
→ System checks: expiresAt < NOW()
→ New session created: pseudonym="Thoughtful Owl", expiresAt=tomorrow+1
→ UI shows: "Your pseudonym rotated to Thoughtful Owl"
→ Old posts/votes/comments still visible under "Curious Badger"
→ New posts/votes/comments linked to "Thoughtful Owl"
```

---

## Database Queries (Pseudocode)

### Get Randomized Feed
```sql
SELECT posts.* 
FROM posts 
WHERE communityId = ? 
  AND isVisibleToWider = true 
  AND expiresAt > NOW()
ORDER BY RAND()
LIMIT 25
```

### Get Vote Count (Only if User Voted)
```sql
SELECT COUNT(*) as upvotes, 
       (SELECT COUNT(*) FROM postVotes WHERE postId = ? AND value = '-1') as downvotes
FROM postVotes 
WHERE postId = ? 
  AND (SELECT COUNT(*) FROM postVotes WHERE postId = ? AND sessionId = ?) > 0
```

### Check Consensus Gate Status
```sql
SELECT 
  requiresConsensus,
  opposingEndorsementsNeeded,
  (SELECT COUNT(*) FROM consensusEndorsements WHERE postId = ? AND viewpoint = 'opposing') as opposingReceived,
  isVisibleToWider
FROM posts 
WHERE id = ?
```

### Get Steelmanning Requirement
```sql
SELECT requiredRestatement, isApproved 
FROM steelmanRequirements 
WHERE targetCommentId = ? 
  AND respondingSessionId = ?
```

---

## Implementation Order (Optimal Path)

1. **Backend Helpers** — All database query functions
2. **tRPC Procedures** — All API endpoints
3. **Frontend Layout** — Navigation, basic structure
4. **Home Feed** — Randomized post listing
5. **Post Detail** — Full post + comments
6. **Voting UI** — Hidden counts, reveal on vote
7. **Steelmanning** — Modal + restatement flow
8. **Consensus Gates** — Visibility toggle
9. **Collaboration** — Co-authoring stubs
10. **Polish** — Design, performance, testing

---

## Success Criteria

- [ ] Ephemeral pseudonyms rotate per session
- [ ] Vote counts hidden until user votes
- [ ] Feed randomized (not engagement-ranked)
- [ ] Steelmanning required before negative replies
- [ ] Consensus gates prevent premature visibility
- [ ] Post collaboration works (stubs + co-authors)
- [ ] Temporal decay filters old posts
- [ ] No vanity metrics visible (no karma, followers, profiles)
- [ ] Design feels elegant and refined
- [ ] All mechanics tested end-to-end
