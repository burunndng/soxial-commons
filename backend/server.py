from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import os, jwt, random, bcrypt

app = FastAPI(title="Soxial Commons API")

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ.get("DB_NAME", "soxial")
_client = AsyncIOMotorClient(MONGO_URL)
db = _client[DB_NAME]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"

COMMUNITIES = [
    {"slug": "technology", "name": "Technology", "description": "Technology, programming, AI, and digital craft."},
    {"slug": "design", "name": "Design", "description": "Design thinking, UX/UI, visual language, and creative process."},
    {"slug": "science", "name": "Science", "description": "Scientific discoveries, research, and the pursuit of understanding."},
    {"slug": "books", "name": "Books", "description": "Literature, reading, and thoughtful textual analysis."},
    {"slug": "general", "name": "General", "description": "Philosophy, culture, society, and everything else."},
]

ADJECTIVES = ["amber", "swift", "quiet", "bright", "keen", "calm", "bold", "deep", "free", "wise",
               "mild", "rare", "pure", "soft", "true", "sharp", "still", "warm", "cool", "vast"]
NOUNS = ["circuit", "signal", "beacon", "prism", "vector", "matrix", "node", "pulse", "wave",
         "byte", "nexus", "qubit", "spark", "helix", "datum", "logic", "frame", "index", "token", "graph"]


def generate_pseudonym():
    return f"{random.choice(ADJECTIVES)}-{random.choice(NOUNS)}-{random.randint(1000, 9999)}"


def serialize(doc):
    if doc is None:
        return None
    doc = dict(doc)
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    for key, val in list(doc.items()):
        if isinstance(val, datetime):
            doc[key] = val.isoformat()
        elif isinstance(val, ObjectId):
            doc[key] = str(val)
    return doc


def create_session_token(session_id: str, pseudonym: str) -> str:
    payload = {
        "sub": session_id,
        "pseudonym": pseudonym,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
        "type": "session",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_session(request: Request) -> Optional[dict]:
    token = request.cookies.get("session_token")
    if not token:
        return None
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "session":
            return None
        session = await db.sessions.find_one({"_id": ObjectId(payload["sub"])})
        if not session:
            return None
        return {"id": str(session["_id"]), "pseudonym": session["pseudonym"]}
    except Exception:
        return None


@app.on_event("startup")
async def startup():
    await db.posts.create_index("communitySlug")
    await db.posts.create_index("createdAt")
    await db.comments.create_index("postId")
    try:
        await db.post_votes.create_index([("postId", 1), ("sessionId", 1)], unique=True)
        await db.comment_votes.create_index([("commentId", 1), ("sessionId", 1)], unique=True)
    except Exception:
        pass

    if await db.posts.count_documents({}) == 0:
        seed_posts = [
            {"communitySlug": "design", "title": "The future of AI in design systems", "body": "Exploring how AI can help designers create more accessible and inclusive interfaces. The intersection of algorithmic generation and human intent opens fascinating questions about authorship and craft.", "pseudonym": "amber-circuit-2841", "score": 0, "commentCount": 3, "isStub": False, "requiresConsensus": False, "createdAt": datetime.now(timezone.utc) - timedelta(hours=2)},
            {"communitySlug": "technology", "title": "Why decentralization matters for communities", "body": "A discussion on how decentralized platforms can empower users and prevent monopolistic control over discourse. The architecture of a platform determines the culture it produces.", "pseudonym": "swift-signal-7302", "score": 0, "commentCount": 8, "isStub": False, "requiresConsensus": False, "createdAt": datetime.now(timezone.utc) - timedelta(hours=5)},
            {"communitySlug": "science", "title": "Recent breakthroughs in quantum computing", "body": "Scientists achieve new milestones in quantum error correction, bringing practical quantum computers closer to reality. What are the implications for cryptography and simulation?", "pseudonym": "keen-matrix-4417", "score": 0, "commentCount": 5, "isStub": False, "requiresConsensus": True, "createdAt": datetime.now(timezone.utc) - timedelta(hours=8)},
            {"communitySlug": "books", "title": "Favorite fiction books of 2025", "body": "Let's share and discuss the best fiction books we've read this year. What made them stand out? How did they challenge your thinking?", "pseudonym": "bold-prism-9183", "score": 0, "commentCount": 12, "isStub": True, "requiresConsensus": False, "createdAt": datetime.now(timezone.utc) - timedelta(hours=12)},
            {"communitySlug": "technology", "title": "Building accessible web components", "body": "Best practices for creating components that work for everyone, regardless of ability. Accessibility is not a feature — it is a fundamental quality attribute.", "pseudonym": "deep-vector-6629", "score": 0, "commentCount": 2, "isStub": False, "requiresConsensus": False, "createdAt": datetime.now(timezone.utc) - timedelta(hours=18)},
            {"communitySlug": "general", "title": "What makes an idea worth sharing?", "body": "Not all ideas are created equal. What criteria do you use to decide whether to share a thought publicly? The act of articulation itself changes the idea.", "pseudonym": "calm-beacon-1155", "score": 0, "commentCount": 7, "isStub": False, "requiresConsensus": False, "createdAt": datetime.now(timezone.utc) - timedelta(hours=20)},
            {"communitySlug": "design", "title": "On the aesthetics of functional typography", "body": "Typography is not decoration — it is the structure of meaning. How do we balance readability with visual identity in the age of variable fonts?", "pseudonym": "pure-helix-3872", "score": 0, "commentCount": 4, "isStub": True, "requiresConsensus": False, "createdAt": datetime.now(timezone.utc) - timedelta(hours=24)},
            {"communitySlug": "science", "title": "The philosophy of measurement", "body": "Every measurement is a theory. When we decide what to measure, we shape what becomes real. A reflection on the epistemology of quantification.", "pseudonym": "rare-datum-5544", "score": 0, "commentCount": 9, "isStub": False, "requiresConsensus": False, "createdAt": datetime.now(timezone.utc) - timedelta(hours=30)},
            {"communitySlug": "general", "title": "Against productivity culture", "body": "The obsession with productivity has made us efficient at the wrong things. What if the most valuable activities resist quantification entirely?", "pseudonym": "wise-spark-8810", "score": 0, "commentCount": 14, "isStub": False, "requiresConsensus": False, "createdAt": datetime.now(timezone.utc) - timedelta(hours=36)},
            {"communitySlug": "technology", "title": "The case for boring technology", "body": "Choosing established, well-understood tools over novel ones is often the wisest engineering decision. Boredom in infrastructure is a feature, not a bug.", "pseudonym": "still-frame-3301", "score": 0, "commentCount": 6, "isStub": False, "requiresConsensus": False, "createdAt": datetime.now(timezone.utc) - timedelta(hours=48)},
        ]
        result = await db.posts.insert_many(seed_posts)

        if result.inserted_ids:
            first_id = str(result.inserted_ids[0])
            seed_comments = [
                {"postId": first_id, "body": "Great perspective! The tension between generative tools and human craft is exactly what designers need to be discussing.", "pseudonym": "swift-signal-7302", "score": 0, "parentId": None, "isSteelmanned": False, "createdAt": datetime.now(timezone.utc) - timedelta(hours=1, minutes=45)},
                {"postId": first_id, "body": "I'd push back — AI in design risks homogenizing aesthetics. When everyone uses the same tools, the outputs converge.", "pseudonym": "keen-matrix-4417", "score": 0, "parentId": None, "isSteelmanned": True, "createdAt": datetime.now(timezone.utc) - timedelta(hours=1, minutes=30)},
                {"postId": first_id, "body": "That's a fair point. Though the same was said of Photoshop in the 90s. The question is how designers use the tool, not whether the tool exists.", "pseudonym": "bold-prism-9183", "score": 0, "parentId": None, "isSteelmanned": False, "createdAt": datetime.now(timezone.utc) - timedelta(hours=1)},
            ]
            await db.comments.insert_many(seed_comments)


# ─── Auth ────────────────────────────────────────────────────────────────────

@app.post("/api/auth/session")
async def create_session(response: Response):
    pseudonym = generate_pseudonym()
    result = await db.sessions.insert_one({
        "pseudonym": pseudonym,
        "createdAt": datetime.now(timezone.utc),
        "expiresAt": datetime.now(timezone.utc) + timedelta(days=30),
    })
    token = create_session_token(str(result.inserted_id), pseudonym)
    response.set_cookie(key="session_token", value=token, httponly=True, secure=False, samesite="lax", max_age=30 * 24 * 60 * 60, path="/")
    return {"id": str(result.inserted_id), "pseudonym": pseudonym}


@app.get("/api/auth/me")
async def get_me(request: Request):
    session = await get_current_session(request)
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return session


@app.post("/api/auth/logout")
async def logout(response: Response):
    response.delete_cookie("session_token", path="/")
    return {"success": True}


# ─── Communities ─────────────────────────────────────────────────────────────

@app.get("/api/communities")
async def list_communities():
    return COMMUNITIES


@app.get("/api/communities/{slug}")
async def get_community(slug: str):
    community = next((c for c in COMMUNITIES if c["slug"] == slug), None)
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    return community


# ─── Posts ───────────────────────────────────────────────────────────────────

@app.get("/api/feed")
async def get_feed(limit: int = 25, community: Optional[str] = None):
    query = {}
    if community:
        query["communitySlug"] = community
    cursor = db.posts.find(query).sort("createdAt", -1).limit(limit * 2)
    posts = [serialize(p) async for p in cursor]
    random.shuffle(posts)
    return posts[:limit]


@app.get("/api/posts/{post_id}")
async def get_post(post_id: str):
    try:
        post = await db.posts.find_one({"_id": ObjectId(post_id)})
    except Exception:
        raise HTTPException(status_code=404, detail="Post not found")
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return serialize(post)


class CreatePostRequest(BaseModel):
    communitySlug: str
    title: str
    body: Optional[str] = None
    url: Optional[str] = None
    isStub: bool = False
    requiresConsensus: bool = False


@app.post("/api/posts")
async def create_post(post_data: CreatePostRequest, request: Request):
    session = await get_current_session(request)
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    community = next((c for c in COMMUNITIES if c["slug"] == post_data.communitySlug), None)
    if not community:
        raise HTTPException(status_code=400, detail="Invalid community")
    result = await db.posts.insert_one({
        "communitySlug": post_data.communitySlug,
        "sessionId": session["id"],
        "pseudonym": session["pseudonym"],
        "title": post_data.title,
        "body": post_data.body or "",
        "url": post_data.url,
        "score": 0,
        "commentCount": 0,
        "isStub": post_data.isStub,
        "requiresConsensus": post_data.requiresConsensus,
        "createdAt": datetime.now(timezone.utc),
    })
    return {"id": str(result.inserted_id)}


# ─── Comments ────────────────────────────────────────────────────────────────

@app.get("/api/posts/{post_id}/comments")
async def get_comments(post_id: str):
    cursor = db.comments.find({"postId": post_id}).sort("createdAt", 1)
    return [serialize(c) async for c in cursor]


class CreateCommentRequest(BaseModel):
    body: str
    parentId: Optional[str] = None


@app.post("/api/posts/{post_id}/comments")
async def create_comment(post_id: str, data: CreateCommentRequest, request: Request):
    session = await get_current_session(request)
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    result = await db.comments.insert_one({
        "postId": post_id,
        "sessionId": session["id"],
        "pseudonym": session["pseudonym"],
        "body": data.body,
        "score": 0,
        "parentId": data.parentId,
        "isSteelmanned": False,
        "createdAt": datetime.now(timezone.utc),
    })
    await db.posts.update_one({"_id": ObjectId(post_id)}, {"$inc": {"commentCount": 1}})
    return {"id": str(result.inserted_id)}


# ─── Voting ──────────────────────────────────────────────────────────────────

class VoteRequest(BaseModel):
    value: int


@app.post("/api/posts/{post_id}/vote")
async def vote_post(post_id: str, vote: VoteRequest, request: Request):
    session = await get_current_session(request)
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if vote.value not in [1, -1]:
        raise HTTPException(status_code=400, detail="Vote value must be 1 or -1")

    existing = await db.post_votes.find_one({"postId": post_id, "sessionId": session["id"]})
    if existing:
        old = existing["value"]
        if old == vote.value:
            await db.post_votes.delete_one({"postId": post_id, "sessionId": session["id"]})
            await db.posts.update_one({"_id": ObjectId(post_id)}, {"$inc": {"score": -old}})
        else:
            await db.post_votes.update_one({"postId": post_id, "sessionId": session["id"]}, {"$set": {"value": vote.value}})
            await db.posts.update_one({"_id": ObjectId(post_id)}, {"$inc": {"score": vote.value - old}})
    else:
        await db.post_votes.insert_one({"postId": post_id, "sessionId": session["id"], "value": vote.value})
        await db.posts.update_one({"_id": ObjectId(post_id)}, {"$inc": {"score": vote.value}})

    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    return {"success": True, "score": post["score"] if post else 0}


@app.post("/api/comments/{comment_id}/vote")
async def vote_comment(comment_id: str, vote: VoteRequest, request: Request):
    session = await get_current_session(request)
    if not session:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if vote.value not in [1, -1]:
        raise HTTPException(status_code=400, detail="Vote value must be 1 or -1")

    existing = await db.comment_votes.find_one({"commentId": comment_id, "sessionId": session["id"]})
    if existing:
        old = existing["value"]
        if old == vote.value:
            await db.comment_votes.delete_one({"commentId": comment_id, "sessionId": session["id"]})
            await db.comments.update_one({"_id": ObjectId(comment_id)}, {"$inc": {"score": -old}})
        else:
            await db.comment_votes.update_one({"commentId": comment_id, "sessionId": session["id"]}, {"$set": {"value": vote.value}})
            await db.comments.update_one({"_id": ObjectId(comment_id)}, {"$inc": {"score": vote.value - old}})
    else:
        await db.comment_votes.insert_one({"commentId": comment_id, "sessionId": session["id"], "value": vote.value})
        await db.comments.update_one({"_id": ObjectId(comment_id)}, {"$inc": {"score": vote.value}})

    comment = await db.comments.find_one({"_id": ObjectId(comment_id)})
    return {"success": True, "score": comment["score"] if comment else 0}


@app.get("/api/posts/{post_id}/my-vote")
async def get_my_post_vote(post_id: str, request: Request):
    session = await get_current_session(request)
    if not session:
        return {"voted": False, "value": 0, "score": None}
    vote = await db.post_votes.find_one({"postId": post_id, "sessionId": session["id"]})
    if not vote:
        return {"voted": False, "value": 0, "score": None}
    post = await db.posts.find_one({"_id": ObjectId(post_id)})
    return {"voted": True, "value": vote["value"], "score": post["score"] if post else 0}


@app.get("/api/health")
async def health():
    return {"status": "ok"}
