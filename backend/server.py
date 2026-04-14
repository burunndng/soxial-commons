from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta
from contextlib import asynccontextmanager
import os, jwt, random, hashlib, asyncio, ssl as ssl_lib
import asyncpg

# ─── Config ──────────────────────────────────────────────────────────────────

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
REPORT_THRESHOLD = 3
CONSENSUS_REQUIRED = 3

COMMUNITIES = [
    {"slug": "technology", "name": "Technology", "description": "Technology, programming, AI, and digital craft."},
    {"slug": "design",     "name": "Design",     "description": "Design thinking, UX/UI, visual language, and creative process."},
    {"slug": "science",    "name": "Science",     "description": "Scientific discoveries, research, and the pursuit of understanding."},
    {"slug": "books",      "name": "Books",       "description": "Literature, reading, and thoughtful textual analysis."},
    {"slug": "general",    "name": "General",     "description": "Philosophy, culture, society, and everything else."},
]

ADJECTIVES = ["amber","swift","quiet","bright","keen","calm","bold","deep","free","wise",
               "mild","rare","pure","soft","true","sharp","still","warm","cool","vast"]
NOUNS = ["circuit","signal","beacon","prism","vector","matrix","node","pulse","wave",
         "byte","nexus","qubit","spark","helix","datum","logic","frame","index","token","graph"]

# ─── DB Pool ─────────────────────────────────────────────────────────────────

pool: asyncpg.Pool = None  # type: ignore


def get_pool() -> asyncpg.Pool:
    return pool


def row(r) -> Optional[dict]:
    if r is None:
        return None
    d = dict(r)
    for k, v in d.items():
        if hasattr(v, "hex"):       # UUID → str
            d[k] = str(v)
        elif isinstance(v, datetime):
            d[k] = v.isoformat()
    return d


def rows(rs) -> list:
    return [row(r) for r in rs]


# ─── Schema ──────────────────────────────────────────────────────────────────

SCHEMA = """
CREATE TABLE IF NOT EXISTS sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pseudonym   VARCHAR(64) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    expires_at  TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS posts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_slug      VARCHAR(64) NOT NULL,
    session_id          UUID,
    pseudonym           VARCHAR(64) NOT NULL,
    title               VARCHAR(300) NOT NULL,
    body                TEXT DEFAULT '',
    url                 VARCHAR(2048),
    score               INTEGER DEFAULT 0,
    comment_count       INTEGER DEFAULT 0,
    is_stub             BOOLEAN DEFAULT FALSE,
    requires_consensus  BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id         UUID REFERENCES posts(id) ON DELETE CASCADE,
    session_id      UUID,
    pseudonym       VARCHAR(64) NOT NULL,
    body            TEXT NOT NULL,
    score           INTEGER DEFAULT 0,
    parent_id       UUID REFERENCES comments(id) ON DELETE CASCADE,
    is_steelmanned  BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_votes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id     UUID REFERENCES posts(id) ON DELETE CASCADE,
    session_id  VARCHAR(64) NOT NULL,
    value       INTEGER NOT NULL CHECK (value IN (1, -1)),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (post_id, session_id)
);

CREATE TABLE IF NOT EXISTS comment_votes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id  UUID REFERENCES comments(id) ON DELETE CASCADE,
    session_id  VARCHAR(64) NOT NULL,
    value       INTEGER NOT NULL CHECK (value IN (1, -1)),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (comment_id, session_id)
);

CREATE TABLE IF NOT EXISTS endorsements (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id     UUID REFERENCES posts(id) ON DELETE CASCADE,
    session_id  VARCHAR(64) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (post_id, session_id)
);

CREATE TABLE IF NOT EXISTS reports (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id   VARCHAR(64) NOT NULL,
    target_type VARCHAR(16) NOT NULL CHECK (target_type IN ('post','comment')),
    session_id  VARCHAR(64) NOT NULL,
    reason      VARCHAR(64) NOT NULL,
    details     TEXT,
    status      VARCHAR(16) DEFAULT 'pending',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS jury_cases (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id   VARCHAR(64) NOT NULL,
    target_type VARCHAR(16) NOT NULL,
    report_count INTEGER DEFAULT 0,
    status      VARCHAR(16) DEFAULT 'open',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS thread_pseudonyms (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  VARCHAR(64) NOT NULL,
    post_id     VARCHAR(64) NOT NULL,
    pseudonym   VARCHAR(64) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (session_id, post_id)
);

CREATE TABLE IF NOT EXISTS voter_similarity (
    session_a   VARCHAR(64) NOT NULL,
    session_b   VARCHAR(64) NOT NULL,
    score       FLOAT NOT NULL,
    post_count  INTEGER NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (session_a, session_b)
);

CREATE TABLE IF NOT EXISTS voter_clusters (
    session_id  VARCHAR(64) PRIMARY KEY,
    cluster_id  INTEGER NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);
"""

SEED_POSTS = [
    ("design",     "The future of AI in design systems",         "Exploring how AI can help designers create more accessible and inclusive interfaces. The intersection of algorithmic generation and human intent opens fascinating questions about authorship and craft.", "amber-circuit-2841", False, False, 2),
    ("technology", "Why decentralization matters for communities","A discussion on how decentralized platforms can empower users and prevent monopolistic control over discourse. The architecture of a platform determines the culture it produces.",       "swift-signal-7302", False, False, 5),
    ("science",    "Recent breakthroughs in quantum computing",   "Scientists achieve new milestones in quantum error correction, bringing practical quantum computers closer to reality. What are the implications for cryptography and simulation?",                "keen-matrix-4417",  False, True,  8),
    ("books",      "Favorite fiction books of 2025",              "Let's share and discuss the best fiction books we've read this year. What made them stand out? How did they challenge your thinking?",                                                            "bold-prism-9183",   True,  False, 12),
    ("technology", "Building accessible web components",          "Best practices for creating components that work for everyone, regardless of ability. Accessibility is not a feature — it is a fundamental quality attribute.",                                    "deep-vector-6629",  False, False, 18),
    ("general",    "What makes an idea worth sharing?",           "Not all ideas are created equal. What criteria do you use to decide whether to share a thought publicly? The act of articulation itself changes the idea.",                                        "calm-beacon-1155",  False, False, 20),
    ("design",     "On the aesthetics of functional typography",  "Typography is not decoration — it is the structure of meaning. How do we balance readability with visual identity in the age of variable fonts?",                                                  "pure-helix-3872",   True,  False, 24),
    ("science",    "The philosophy of measurement",               "Every measurement is a theory. When we decide what to measure, we shape what becomes real. A reflection on the epistemology of quantification.",                                                   "rare-datum-5544",   False, False, 30),
    ("general",    "Against productivity culture",                "The obsession with productivity has made us efficient at the wrong things. What if the most valuable activities resist quantification entirely?",                                                   "wise-spark-8810",   False, False, 36),
    ("technology", "The case for boring technology",              "Choosing established, well-understood tools over novel ones is often the wisest engineering decision. Boredom in infrastructure is a feature, not a bug.",                                         "still-frame-3301",  False, False, 48),
]


async def seed_if_empty(conn):
    count = await conn.fetchval("SELECT COUNT(*) FROM posts")
    if count > 0:
        return
    for (community_slug, title, body, pseudonym, is_stub, requires_consensus, hours_ago) in SEED_POSTS:
        created_at = datetime.now(timezone.utc) - timedelta(hours=hours_ago)
        await conn.execute(
            """INSERT INTO posts (community_slug, pseudonym, title, body, is_stub, requires_consensus, created_at)
               VALUES ($1,$2,$3,$4,$5,$6,$7)""",
            community_slug, pseudonym, title, body, is_stub, requires_consensus, created_at
        )
    # Seed 3 comments on first post
    first_post = await conn.fetchrow("SELECT id FROM posts ORDER BY created_at ASC LIMIT 1")
    if first_post:
        pid = first_post["id"]
        for body, pseudo, sm, offset in [
            ("Great perspective! The tension between generative tools and human craft is exactly what designers need to be discussing.", "swift-signal-7302", False, 105),
            ("I'd push back — AI in design risks homogenizing aesthetics. When everyone uses the same tools, the outputs converge.",      "keen-matrix-4417",  True,  90),
            ("That's a fair point. Though the same was said of Photoshop in the 90s. The question is how designers use the tool.",       "bold-prism-9183",   False, 60),
        ]:
            created_at = datetime.now(timezone.utc) - timedelta(minutes=offset)
            await conn.execute(
                "INSERT INTO comments (post_id, pseudonym, body, is_steelmanned, created_at) VALUES ($1,$2,$3,$4,$5)",
                pid, pseudo, body, sm, created_at
            )
        await conn.execute("UPDATE posts SET comment_count = 3 WHERE id = $1", pid)


# ─── Startup / Shutdown ──────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app_instance):
    global pool
    db_url = os.environ.get("DATABASE_URL", "")
    if db_url.startswith("postgres://"):
        db_url = "postgresql://" + db_url[11:]
    try:
        ssl_ctx = ssl_lib.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl_lib.CERT_NONE
        pool = await asyncpg.create_pool(db_url, ssl=ssl_ctx, min_size=1, max_size=5, timeout=5)
        async with pool.acquire() as conn:
            await conn.execute(SCHEMA)
            await seed_if_empty(conn)
        print("✓ Connected to Supabase PostgreSQL")
    except Exception as e:
        print(f"⚠ DB unavailable ({e}). API will return empty data.")
        pool = None
    task = asyncio.create_task(_cluster_loop())
    yield
    task.cancel()
    if pool:
        await pool.close()


app = FastAPI(title="Soxial Commons API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000", "https://soxial-commons.up.railway.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Auth Helpers ─────────────────────────────────────────────────────────────

def generate_pseudonym() -> str:
    return f"{random.choice(ADJECTIVES)}-{random.choice(NOUNS)}-{random.randint(1000,9999)}"


def create_session_token(session_id: str, pseudonym: str) -> str:
    payload = {"sub": session_id, "pseudonym": pseudonym,
               "exp": datetime.now(timezone.utc) + timedelta(days=30), "type": "session"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_session(request: Request) -> Optional[dict]:
    token = request.cookies.get("session_token")
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "session":
            return None
        async with pool.acquire() as conn:
            r = await conn.fetchrow("SELECT id, pseudonym FROM sessions WHERE id = $1::uuid", payload["sub"])
        if not r:
            return None
        return {"id": str(r["id"]), "pseudonym": r["pseudonym"]}
    except Exception:
        return None


# ─── Auth ─────────────────────────────────────────────────────────────────────

@app.post("/api/auth/session")
async def create_session(response: Response):
    pseudonym = generate_pseudonym()
    expires_at = datetime.now(timezone.utc) + timedelta(days=30)
    async with pool.acquire() as conn:
        r = await conn.fetchrow(
            "INSERT INTO sessions (pseudonym, expires_at) VALUES ($1,$2) RETURNING id",
            pseudonym, expires_at
        )
    session_id = str(r["id"])
    token = create_session_token(session_id, pseudonym)
    response.set_cookie("session_token", token, httponly=True, secure=True, samesite="none", max_age=30*24*3600, path="/")
    return {"id": session_id, "pseudonym": pseudonym}


@app.get("/api/auth/me")
async def get_me(request: Request):
    session = await get_current_session(request)
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return session


@app.post("/api/auth/logout")
async def logout(response: Response):
    response.delete_cookie("session_token", path="/", secure=True, samesite="none")
    return {"success": True}


# ─── Communities ──────────────────────────────────────────────────────────────

@app.get("/api/communities")
async def list_communities():
    return COMMUNITIES


@app.get("/api/communities/{slug}")
async def get_community(slug: str):
    c = next((c for c in COMMUNITIES if c["slug"] == slug), None)
    if not c:
        raise HTTPException(status_code=404, detail="Not found")
    return c


# ─── Posts ────────────────────────────────────────────────────────────────────

def require_db():
    if pool is None:
        raise HTTPException(status_code=503, detail="Database not available")


@app.get("/api/feed")
async def get_feed(limit: int = 25, community: Optional[str] = None, request: Request = None):
    require_db()
    session = await get_current_session(request)
    async with pool.acquire() as conn:
        if community:
            rs = await conn.fetch(
                "SELECT * FROM posts WHERE community_slug = $1 ORDER BY created_at DESC LIMIT $2",
                community, limit * 2
            )
        else:
            rs = await conn.fetch("SELECT * FROM posts ORDER BY created_at DESC LIMIT $1", limit * 2)

        posts = rows(rs)
        random.shuffle(posts)
        posts = posts[:limit]

        if session:
            post_ids = [p["id"] for p in posts]
            vote_rs = await conn.fetch(
                "SELECT post_id::text, value FROM post_votes WHERE session_id = $1 AND post_id::text = ANY($2)",
                session["id"], post_ids
            )
            vote_map = {str(v["post_id"]): v["value"] for v in vote_rs}
            for p in posts:
                p["myVote"] = vote_map.get(p["id"], 0)

        # Endorsement counts for consensus posts
        for p in posts:
            if p.get("requires_consensus"):
                p["endorsementCount"] = await conn.fetchval(
                    "SELECT COUNT(*) FROM endorsements WHERE post_id = $1::uuid", p["id"]
                )
            else:
                p["endorsementCount"] = 0

    return posts


@app.get("/api/posts/{post_id}")
async def get_post(post_id: str, request: Request = None):
    async with pool.acquire() as conn:
        r = await conn.fetchrow("SELECT * FROM posts WHERE id = $1::uuid", post_id)
        if not r:
            raise HTTPException(status_code=404, detail="Post not found")
        p = row(r)
        p["endorsementCount"] = await conn.fetchval(
            "SELECT COUNT(*) FROM endorsements WHERE post_id = $1::uuid", post_id
        )
        p["reportCount"] = await conn.fetchval(
            "SELECT COUNT(*) FROM reports WHERE target_id = $1 AND target_type = 'post'", post_id
        )
        jury = await conn.fetchrow(
            "SELECT status FROM jury_cases WHERE target_id = $1 AND status != 'decided' LIMIT 1", post_id
        )
        p["hasJuryCase"] = jury is not None
        p["juryStatus"] = jury["status"] if jury else None
    return p


class CreatePostRequest(BaseModel):
    communitySlug: str
    title: str
    body: Optional[str] = None
    url: Optional[str] = None
    isStub: bool = False
    requiresConsensus: bool = False


@app.post("/api/posts")
async def create_post(data: CreatePostRequest, request: Request):
    session = await get_current_session(request)
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if not any(c["slug"] == data.communitySlug for c in COMMUNITIES):
        raise HTTPException(status_code=400, detail="Invalid community")
    async with pool.acquire() as conn:
        r = await conn.fetchrow(
            """INSERT INTO posts (community_slug, session_id, pseudonym, title, body, url, is_stub, requires_consensus)
               VALUES ($1,$2::uuid,$3,$4,$5,$6,$7,$8) RETURNING id""",
            data.communitySlug, session["id"], session["pseudonym"],
            data.title, data.body or "", data.url, data.isStub, data.requiresConsensus
        )
    return {"id": str(r["id"])}


# ─── Comments ─────────────────────────────────────────────────────────────────

@app.get("/api/posts/{post_id}/comments")
async def get_comments(post_id: str):
    async with pool.acquire() as conn:
        rs = await conn.fetch(
            "SELECT * FROM comments WHERE post_id = $1::uuid ORDER BY created_at ASC", post_id
        )
    return rows(rs)


class CreateCommentRequest(BaseModel):
    body: str
    parentId: Optional[str] = None


@app.post("/api/posts/{post_id}/comments")
async def create_comment(post_id: str, data: CreateCommentRequest, request: Request):
    session = await get_current_session(request)
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    async with pool.acquire() as conn:
        # Use thread pseudonym if one exists for this session+post
        tp = await conn.fetchrow(
            "SELECT pseudonym FROM thread_pseudonyms WHERE session_id = $1 AND post_id = $2",
            session["id"], post_id
        )
        pseudonym = tp["pseudonym"] if tp else session["pseudonym"]
        parent_uuid = data.parentId if data.parentId else None
        r = await conn.fetchrow(
            """INSERT INTO comments (post_id, session_id, pseudonym, body, parent_id)
               VALUES ($1::uuid,$2::uuid,$3,$4,$5::uuid) RETURNING id""",
            post_id, session["id"], pseudonym, data.body, parent_uuid
        )
        await conn.execute(
            "UPDATE posts SET comment_count = comment_count + 1 WHERE id = $1::uuid", post_id
        )
    return {"id": str(r["id"])}


# ─── Voting ───────────────────────────────────────────────────────────────────

class VoteRequest(BaseModel):
    value: int


@app.post("/api/posts/{post_id}/vote")
async def vote_post(post_id: str, vote: VoteRequest, request: Request):
    session = await get_current_session(request)
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if vote.value not in [1, -1]:
        raise HTTPException(status_code=400, detail="Vote must be 1 or -1")
    async with pool.acquire() as conn:
        existing = await conn.fetchrow(
            "SELECT value FROM post_votes WHERE post_id = $1::uuid AND session_id = $2",
            post_id, session["id"]
        )
        if existing:
            old = existing["value"]
            if old == vote.value:
                await conn.execute(
                    "DELETE FROM post_votes WHERE post_id = $1::uuid AND session_id = $2",
                    post_id, session["id"]
                )
                await conn.execute(
                    "UPDATE posts SET score = score - $1 WHERE id = $2::uuid", old, post_id
                )
            else:
                await conn.execute(
                    "UPDATE post_votes SET value = $1 WHERE post_id = $2::uuid AND session_id = $3",
                    vote.value, post_id, session["id"]
                )
                await conn.execute(
                    "UPDATE posts SET score = score + $1 WHERE id = $2::uuid", vote.value - old, post_id
                )
        else:
            await conn.execute(
                "INSERT INTO post_votes (post_id, session_id, value) VALUES ($1::uuid,$2,$3)",
                post_id, session["id"], vote.value
            )
            await conn.execute(
                "UPDATE posts SET score = score + $1 WHERE id = $2::uuid", vote.value, post_id
            )
        new_score = await conn.fetchval("SELECT score FROM posts WHERE id = $1::uuid", post_id)
    return {"success": True, "score": new_score}


@app.post("/api/comments/{comment_id}/vote")
async def vote_comment(comment_id: str, vote: VoteRequest, request: Request):
    session = await get_current_session(request)
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if vote.value not in [1, -1]:
        raise HTTPException(status_code=400, detail="Vote must be 1 or -1")
    async with pool.acquire() as conn:
        existing = await conn.fetchrow(
            "SELECT value FROM comment_votes WHERE comment_id = $1::uuid AND session_id = $2",
            comment_id, session["id"]
        )
        if existing:
            old = existing["value"]
            if old == vote.value:
                await conn.execute(
                    "DELETE FROM comment_votes WHERE comment_id = $1::uuid AND session_id = $2",
                    comment_id, session["id"]
                )
                await conn.execute(
                    "UPDATE comments SET score = score - $1 WHERE id = $2::uuid", old, comment_id
                )
            else:
                await conn.execute(
                    "UPDATE comment_votes SET value = $1 WHERE comment_id = $2::uuid AND session_id = $3",
                    vote.value, comment_id, session["id"]
                )
                await conn.execute(
                    "UPDATE comments SET score = score + $1 WHERE id = $2::uuid", vote.value - old, comment_id
                )
        else:
            await conn.execute(
                "INSERT INTO comment_votes (comment_id, session_id, value) VALUES ($1::uuid,$2,$3)",
                comment_id, session["id"], vote.value
            )
            await conn.execute(
                "UPDATE comments SET score = score + $1 WHERE id = $2::uuid", vote.value, comment_id
            )
        new_score = await conn.fetchval("SELECT score FROM comments WHERE id = $1::uuid", comment_id)
    return {"success": True, "score": new_score}


@app.get("/api/posts/{post_id}/my-vote")
async def get_my_vote(post_id: str, request: Request):
    session = await get_current_session(request)
    if not session:
        return {"voted": False, "value": 0, "score": None}
    async with pool.acquire() as conn:
        v = await conn.fetchrow(
            "SELECT value FROM post_votes WHERE post_id = $1::uuid AND session_id = $2",
            post_id, session["id"]
        )
        if not v:
            return {"voted": False, "value": 0, "score": None}
        score = await conn.fetchval("SELECT score FROM posts WHERE id = $1::uuid", post_id)
    return {"voted": True, "value": v["value"], "score": score}


# ─── Consensus Gate ───────────────────────────────────────────────────────────

@app.get("/api/posts/{post_id}/consensus")
async def get_consensus(post_id: str, request: Request = None):
    session = await get_current_session(request)
    async with pool.acquire() as conn:
        count = await conn.fetchval(
            "SELECT COUNT(*) FROM endorsements WHERE post_id = $1::uuid", post_id
        )
        has_endorsed = False
        if session:
            e = await conn.fetchrow(
                "SELECT id FROM endorsements WHERE post_id = $1::uuid AND session_id = $2",
                post_id, session["id"]
            )
            has_endorsed = e is not None
    status = "open" if count >= CONSENSUS_REQUIRED else ("partial" if count > 0 else "pending")
    return {"status": status, "endorsed": count, "required": CONSENSUS_REQUIRED, "hasEndorsed": has_endorsed}


@app.post("/api/posts/{post_id}/endorse")
async def endorse_post(post_id: str, request: Request):
    session = await get_current_session(request)
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    async with pool.acquire() as conn:
        try:
            await conn.execute(
                "INSERT INTO endorsements (post_id, session_id) VALUES ($1::uuid, $2)",
                post_id, session["id"]
            )
        except asyncpg.UniqueViolationError:
            raise HTTPException(status_code=400, detail="Already endorsed")
        count = await conn.fetchval(
            "SELECT COUNT(*) FROM endorsements WHERE post_id = $1::uuid", post_id
        )
    return {"success": True, "endorsed": count, "required": CONSENSUS_REQUIRED}


# ─── Reports & Jury ───────────────────────────────────────────────────────────

class ReportRequest(BaseModel):
    reason: str
    details: Optional[str] = None


@app.post("/api/posts/{post_id}/report")
async def report_post(post_id: str, data: ReportRequest, request: Request):
    session = await get_current_session(request)
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    async with pool.acquire() as conn:
        exists = await conn.fetchrow(
            "SELECT id FROM reports WHERE target_id = $1 AND session_id = $2 AND target_type = 'post'",
            post_id, session["id"]
        )
        if exists:
            raise HTTPException(status_code=400, detail="Already reported")
        await conn.execute(
            "INSERT INTO reports (target_id, target_type, session_id, reason, details) VALUES ($1,$2,$3,$4,$5)",
            post_id, "post", session["id"], data.reason, data.details
        )
        count = await conn.fetchval(
            "SELECT COUNT(*) FROM reports WHERE target_id = $1 AND target_type = 'post'", post_id
        )
        if count >= REPORT_THRESHOLD:
            existing_case = await conn.fetchrow(
                "SELECT id FROM jury_cases WHERE target_id = $1 AND status != 'decided'", post_id
            )
            if not existing_case:
                await conn.execute(
                    "INSERT INTO jury_cases (target_id, target_type, report_count) VALUES ($1,'post',$2)",
                    post_id, count
                )
    return {"success": True, "reportCount": count, "juryTriggered": count >= REPORT_THRESHOLD}


@app.post("/api/comments/{comment_id}/report")
async def report_comment(comment_id: str, data: ReportRequest, request: Request):
    session = await get_current_session(request)
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    async with pool.acquire() as conn:
        exists = await conn.fetchrow(
            "SELECT id FROM reports WHERE target_id = $1 AND session_id = $2 AND target_type = 'comment'",
            comment_id, session["id"]
        )
        if exists:
            raise HTTPException(status_code=400, detail="Already reported")
        await conn.execute(
            "INSERT INTO reports (target_id, target_type, session_id, reason, details) VALUES ($1,$2,$3,$4,$5)",
            comment_id, "comment", session["id"], data.reason, data.details
        )
        count = await conn.fetchval(
            "SELECT COUNT(*) FROM reports WHERE target_id = $1 AND target_type = 'comment'", comment_id
        )
    return {"success": True, "reportCount": count}


@app.get("/api/posts/{post_id}/report-status")
async def get_report_status(post_id: str, request: Request = None):
    session = await get_current_session(request)
    async with pool.acquire() as conn:
        count = await conn.fetchval(
            "SELECT COUNT(*) FROM reports WHERE target_id = $1 AND target_type = 'post'", post_id
        )
        has_reported = False
        if session:
            r = await conn.fetchrow(
                "SELECT id FROM reports WHERE target_id = $1 AND session_id = $2 AND target_type = 'post'",
                post_id, session["id"]
            )
            has_reported = r is not None
        jury = await conn.fetchrow(
            "SELECT status FROM jury_cases WHERE target_id = $1 AND status != 'decided' LIMIT 1", post_id
        )
    return {
        "reportCount": count,
        "hasReported": has_reported,
        "hasJuryCase": jury is not None,
        "juryStatus": jury["status"] if jury else None,
    }


# ─── Per-thread Pseudonym ─────────────────────────────────────────────────────

@app.get("/api/posts/{post_id}/thread-pseudonym")
async def get_thread_pseudonym(post_id: str, request: Request):
    session = await get_current_session(request)
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    async with pool.acquire() as conn:
        existing = await conn.fetchrow(
            "SELECT pseudonym FROM thread_pseudonyms WHERE session_id = $1 AND post_id = $2",
            session["id"], post_id
        )
        if existing:
            return {"pseudonym": existing["pseudonym"]}
        raw = f"{session['id']}:thread:{post_id}".encode()
        h = int(hashlib.sha256(raw).hexdigest(), 16)
        pseudonym = f"{ADJECTIVES[h % len(ADJECTIVES)]}-{NOUNS[(h >> 8) % len(NOUNS)]}-{h % 10000:04d}"
        await conn.execute(
            "INSERT INTO thread_pseudonyms (session_id, post_id, pseudonym) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING",
            session["id"], post_id, pseudonym
        )
    return {"pseudonym": pseudonym}


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "ok"}


# ─── Cluster Detection Background Job ────────────────────────────────────────

async def _cluster_loop():
    while True:
        await asyncio.sleep(300)
        try:
            await compute_voter_clusters()
        except Exception:
            pass


async def compute_voter_clusters():
    """Compute voter similarity from co-votes. decentralized-moderation skill."""
    async with pool.acquire() as conn:
        pairs = await conn.fetch("""
            SELECT
                LEAST(a.session_id, b.session_id)    AS session_a,
                GREATEST(a.session_id, b.session_id) AS session_b,
                COUNT(*)                              AS total,
                SUM(CASE WHEN a.value = b.value THEN 1 ELSE -1 END) AS raw_score
            FROM post_votes a
            JOIN post_votes b ON a.post_id = b.post_id AND a.session_id != b.session_id
            WHERE a.session_id < b.session_id
            GROUP BY session_a, session_b
            HAVING COUNT(*) >= 3
        """)
        cluster_map: dict = {}
        next_id = [0]
        for p in pairs:
            score = p["raw_score"] / p["total"]
            await conn.execute(
                """INSERT INTO voter_similarity (session_a, session_b, score, post_count, updated_at)
                   VALUES ($1,$2,$3,$4,NOW())
                   ON CONFLICT (session_a, session_b) DO UPDATE
                   SET score=$3, post_count=$4, updated_at=NOW()""",
                p["session_a"], p["session_b"], round(score, 3), p["total"]
            )
            if score >= 0.4:
                ca = cluster_map.get(p["session_a"])
                cb = cluster_map.get(p["session_b"])
                if ca is None and cb is None:
                    cluster_map[p["session_a"]] = cluster_map[p["session_b"]] = next_id[0]
                    next_id[0] += 1
                elif ca is None:
                    cluster_map[p["session_a"]] = cb
                elif cb is None:
                    cluster_map[p["session_b"]] = ca
            else:
                if p["session_a"] not in cluster_map:
                    cluster_map[p["session_a"]] = next_id[0]; next_id[0] += 1
                if p["session_b"] not in cluster_map:
                    cluster_map[p["session_b"]] = next_id[0]; next_id[0] += 1
        for sid, cid in cluster_map.items():
            await conn.execute(
                """INSERT INTO voter_clusters (session_id, cluster_id, updated_at)
                   VALUES ($1,$2,NOW())
                   ON CONFLICT (session_id) DO UPDATE SET cluster_id=$2, updated_at=NOW()""",
                sid, cid
            )
