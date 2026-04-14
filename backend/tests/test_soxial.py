"""Backend tests for Soxial Commons API"""
import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://674e33b3-f6ac-4f0c-9ab0-76420ca93d84.preview.emergentagent.com").rstrip("/")


@pytest.fixture
def session_client():
    """Client with an anonymous session"""
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/session")
    assert r.status_code == 200
    return s, r.json()


# ─── Health ───────────────────────────────────────────────────────────────────
class TestHealth:
    def test_health(self):
        r = requests.get(f"{BASE_URL}/api/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"


# ─── Auth ─────────────────────────────────────────────────────────────────────
class TestAuth:
    def test_get_me_unauthenticated(self):
        r = requests.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401

    def test_create_session(self):
        r = requests.post(f"{BASE_URL}/api/auth/session")
        assert r.status_code == 200
        data = r.json()
        assert "pseudonym" in data
        assert "id" in data
        assert len(data["pseudonym"]) > 0

    def test_get_me_authenticated(self, session_client):
        s, session_data = session_client
        r = s.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200
        data = r.json()
        assert data["pseudonym"] == session_data["pseudonym"]

    def test_logout(self, session_client):
        s, _ = session_client
        r = s.post(f"{BASE_URL}/api/auth/logout")
        assert r.status_code == 200
        # After logout, /me should return 401
        r2 = s.get(f"{BASE_URL}/api/auth/me")
        assert r2.status_code == 401


# ─── Communities ─────────────────────────────────────────────────────────────
class TestCommunities:
    def test_list_communities(self):
        r = requests.get(f"{BASE_URL}/api/communities")
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 5
        slugs = [c["slug"] for c in data]
        for s in ["technology", "design", "science", "books", "general"]:
            assert s in slugs

    def test_get_community(self):
        r = requests.get(f"{BASE_URL}/api/communities/technology")
        assert r.status_code == 200
        assert r.json()["slug"] == "technology"

    def test_get_community_not_found(self):
        r = requests.get(f"{BASE_URL}/api/communities/nonexistent")
        assert r.status_code == 404


# ─── Feed / Posts ─────────────────────────────────────────────────────────────
class TestFeed:
    def test_get_feed(self):
        r = requests.get(f"{BASE_URL}/api/feed")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) > 0
        post = data[0]
        assert "id" in post
        assert "title" in post
        assert "pseudonym" in post
        assert "_id" not in post

    def test_get_feed_with_community_filter(self):
        r = requests.get(f"{BASE_URL}/api/feed?community=technology")
        assert r.status_code == 200
        data = r.json()
        for p in data:
            assert p["communitySlug"] == "technology"

    def test_get_post(self):
        posts = requests.get(f"{BASE_URL}/api/feed").json()
        post_id = posts[0]["id"]
        r = requests.get(f"{BASE_URL}/api/posts/{post_id}")
        assert r.status_code == 200
        assert r.json()["id"] == post_id

    def test_get_post_not_found(self):
        r = requests.get(f"{BASE_URL}/api/posts/000000000000000000000000")
        assert r.status_code == 404

    def test_create_post_unauthenticated(self):
        r = requests.post(f"{BASE_URL}/api/posts", json={"communitySlug": "general", "title": "test"})
        assert r.status_code == 401

    def test_create_post_authenticated(self, session_client):
        s, _ = session_client
        r = s.post(f"{BASE_URL}/api/posts", json={
            "communitySlug": "general",
            "title": "TEST_ automated test post",
            "body": "Testing post creation"
        })
        assert r.status_code == 200
        assert "id" in r.json()


# ─── Comments ─────────────────────────────────────────────────────────────────
class TestComments:
    def test_get_comments(self):
        posts = requests.get(f"{BASE_URL}/api/feed").json()
        post_id = posts[0]["id"]
        r = requests.get(f"{BASE_URL}/api/posts/{post_id}/comments")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_comment_unauthenticated(self):
        posts = requests.get(f"{BASE_URL}/api/feed").json()
        post_id = posts[0]["id"]
        r = requests.post(f"{BASE_URL}/api/posts/{post_id}/comments", json={"body": "test comment"})
        assert r.status_code == 401

    def test_create_comment_authenticated(self, session_client):
        s, _ = session_client
        posts = requests.get(f"{BASE_URL}/api/feed").json()
        post_id = posts[0]["id"]
        r = s.post(f"{BASE_URL}/api/posts/{post_id}/comments", json={"body": "TEST_ automated comment"})
        assert r.status_code == 200
        assert "id" in r.json()


# ─── Voting ───────────────────────────────────────────────────────────────────
class TestVoting:
    def test_vote_unauthenticated(self):
        posts = requests.get(f"{BASE_URL}/api/feed").json()
        post_id = posts[0]["id"]
        r = requests.post(f"{BASE_URL}/api/posts/{post_id}/vote", json={"value": 1})
        assert r.status_code == 401

    def test_vote_authenticated(self, session_client):
        s, _ = session_client
        posts = requests.get(f"{BASE_URL}/api/feed").json()
        post_id = posts[0]["id"]
        r = s.post(f"{BASE_URL}/api/posts/{post_id}/vote", json={"value": 1})
        assert r.status_code == 200
        data = r.json()
        assert data["success"] is True
        assert "score" in data

    def test_my_vote(self, session_client):
        s, _ = session_client
        posts = requests.get(f"{BASE_URL}/api/feed").json()
        post_id = posts[0]["id"]
        r = s.get(f"{BASE_URL}/api/posts/{post_id}/my-vote")
        assert r.status_code == 200
