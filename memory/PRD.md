# Soxial Commons — Product Requirements Document

## Original Problem Statement
"Let's turn this into nextjs and improve it at all levels. Begin by exploring the repository and prep a plan"

---

## Architecture

### Previous Stack
- Vite + React (frontend) with wouter routing
- Express + tRPC (backend)  
- Drizzle ORM + MySQL (Supabase)
- In-memory mock data

### New Stack (Migrated)
- **Frontend**: Next.js 16 App Router + React 19 + Tailwind v3 (port 3000)
- **Backend**: Python FastAPI (port 8001)
- **Database**: MongoDB (local, motor async driver)
- **Auth**: JWT anonymous ephemeral sessions (httpOnly cookies)
- **Fonts**: Instrument Serif (editorial), DM Sans (UI), DM Mono (metadata)
- **Animations**: Framer Motion

---

## User Personas
- Intellectually curious adults seeking substantive discourse
- Users who want ideas to compete on merit, not social capital
- Privacy-conscious users who prefer anonymity

---

## Core Requirements (Static)

### Anti-Vanity Mechanics
- [x] Vote counts hidden until user votes (shows `·`)
- [x] Score revealed only after voting (amber on upvote, red on downvote)
- [x] Randomized feed (no algorithmic ranking)
- [x] Ephemeral pseudonyms (adjective-noun-number format)
- [x] No persistent user profiles

### Platform Features
- [x] Home feed with sort by Recent/Top
- [x] Community pages (Technology, Design, Science, Books, General)
- [x] Post detail with full content
- [x] Threaded comments (2-level nesting)
- [x] Steelmanning modal (must restate opposing view before replying)
- [x] Stub posts (incomplete, open for co-authoring)
- [x] Consensus gate posts (require opposing endorsements)
- [x] Compose page with community selector, title/body/url, post mechanics
- [x] Anonymous login (Enter button → random pseudonym → JWT cookie)
- [x] Mobile-responsive navigation with hamburger menu

---

## What's Been Implemented

### 2026-02-xx - Phase 2: Server-side Features + Decentralized Moderation
- **Vote persistence**: `myVote` field returned in feed API; PostCard initializes from server state
- **Consensus gate indicator**: Animated dot progress (●●○ 1/3) per skill spec, hover tooltip, endorse button
- **Report system**: 6-reason report modal on posts & comments, 3-report jury threshold, `jury_cases` collection
- **Jury banner**: Live jury status strip on reported posts (UNDER JURY REVIEW / deliberating / decided)
- **Per-thread ephemeral pseudonym**: FNV-1a hash of localStorage rootSeed+postId; shown as identity strip in post detail; consistent within thread, unlinkable across threads (ephemeral-identity skill)
- **New API endpoints**: `/endorse`, `/report`, `/consensus`, `/report-status`, `/thread-pseudonym`
- Backend test suite: Phase 2 tests 19/19 passing
- Migrated frontend from Vite/React/wouter → Next.js 16 App Router
- Migrated backend from Express/tRPC → Python FastAPI
- Migrated data storage from in-memory mock → MongoDB
- Implemented anonymous JWT session auth
- Full UI redesign: dark theme, glassmorphism nav, flat list posts
- Framer Motion animations (page loads, post card entrances)
- Steelman modal (30-char minimum restatement)
- Mobile-first navigation with slide drawer
- Seeded 10 posts across all communities
- Backend tests: 20/20 passing

---

## Prioritized Backlog

### P0 — Critical (Blocking)
- None currently

### P1 — High Priority (Next Sprint)
- Real vote persistence per session (currently optimistic client-side)
- Jury system UI (Phase 2 from ARCHITECTURE.md)
- Report button on posts/comments
- Consensus gate progress indicator (show endorsement count)

### P2 — Medium Priority
- Per-thread pseudonym consistency (same pseudonym within a thread)
- Steelman UX: author accept/reject flow
- Search/filter posts
- Post editing (for stub co-authoring)
- URL link previews

### Future/Backlog
- Supabase integration (real database migration)
- Cluster-based serendipity engine (30% outside-cluster content)
- Background jobs for similarity computation
- Security audit of cryptographic implementation
- Production deployment optimization

---

## Next Tasks List
1. Add real vote persistence (server-side vote tracking per session, client state synced)
2. Implement report button on posts/comments (calls jury system)
3. Add consensus gate progress indicator on post cards
4. Implement per-thread pseudonym consistency
5. Add steelman author verdict UI (accept/reject)
