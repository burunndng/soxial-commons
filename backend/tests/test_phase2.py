"""Phase 2 feature tests: vote persistence, consensus, report, jury, thread-pseudonym"""

import pytest
import requests
import os

BASE_URL = os.environ.get("NEXT_PUBLIC_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    BASE_URL = "https://674e33b3-f6ac-4f0c-9ab0-76420ca93d84.preview.emergentagent.com"


def create_session():
    """Create a new anonymous session and return session id + cookie jar"""
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/session")
    assert r.status_code == 200
    return s, r.json()


def get_consensus_post_id():
    """Find a post with requiresConsensus=true"""
    r = requests.get(f"{BASE_URL}/api/feed", params={"limit": 50})
    posts = r.json()
    for p in posts:
        if p.get("requiresConsensus"):
            return p["id"]
    return None


def get_any_post_id():
    r = requests.get(f"{BASE_URL}/api/feed", params={"limit": 50})
    posts = r.json()
    if posts:
        return posts[0]["id"]
    return None


# ─── Feed / Vote Persistence ────────────────────────────────────────────────

class TestFeedVotePersistence:
    """GET /api/feed returns myVote when authenticated"""

    def test_feed_unauthenticated_no_my_vote(self):
        r = requests.get(f"{BASE_URL}/api/feed")
        assert r.status_code == 200
        posts = r.json()
        assert isinstance(posts, list)
        # myVote should not be present (or absent) for unauthenticated
        for p in posts:
            assert "myVote" not in p, "myVote should not be present for unauthenticated"

    def test_feed_authenticated_has_my_vote(self):
        s, _ = create_session()
        r = s.get(f"{BASE_URL}/api/feed")
        assert r.status_code == 200
        posts = r.json()
        assert len(posts) > 0
        for p in posts:
            assert "myVote" in p, f"myVote missing from post {p['id']}"

    def test_feed_vote_persists_correctly(self):
        """Vote a post, then check feed returns correct myVote"""
        s, _ = create_session()
        posts = s.get(f"{BASE_URL}/api/feed").json()
        post_id = posts[0]["id"]

        # Cast vote
        vote_r = s.post(f"{BASE_URL}/api/posts/{post_id}/vote", json={"value": 1})
        assert vote_r.status_code == 200

        # Check feed returns myVote=1 for that post
        feed_r = s.get(f"{BASE_URL}/api/feed")
        feed_posts = {p["id"]: p for p in feed_r.json()}
        # Note: feed shuffles, so the post might not appear every time
        if post_id in feed_posts:
            assert feed_posts[post_id]["myVote"] == 1


# ─── Consensus ──────────────────────────────────────────────────────────────

class TestConsensus:
    """Consensus gate endpoints"""

    def test_get_consensus_unauthenticated(self):
        post_id = get_consensus_post_id()
        if not post_id:
            pytest.skip("No consensus post found")
        r = requests.get(f"{BASE_URL}/api/posts/{post_id}/consensus")
        assert r.status_code == 200
        data = r.json()
        assert "status" in data
        assert "endorsed" in data
        assert "required" in data
        assert data["required"] == 3
        assert data["status"] in ["pending", "partial", "open"]

    def test_endorse_requires_auth(self):
        post_id = get_consensus_post_id()
        if not post_id:
            pytest.skip("No consensus post found")
        r = requests.post(f"{BASE_URL}/api/posts/{post_id}/endorse")
        assert r.status_code == 401

    def test_endorse_increments_count(self):
        post_id = get_consensus_post_id()
        if not post_id:
            pytest.skip("No consensus post found")
        s, _ = create_session()
        before = requests.get(f"{BASE_URL}/api/posts/{post_id}/consensus").json()["endorsed"]
        r = s.post(f"{BASE_URL}/api/posts/{post_id}/endorse")
        assert r.status_code == 200
        data = r.json()
        assert data["endorsed"] == before + 1
        assert data["required"] == 3

    def test_endorse_idempotent_returns_400(self):
        post_id = get_consensus_post_id()
        if not post_id:
            pytest.skip("No consensus post found")
        s, _ = create_session()
        s.post(f"{BASE_URL}/api/posts/{post_id}/endorse")
        r2 = s.post(f"{BASE_URL}/api/posts/{post_id}/endorse")
        assert r2.status_code == 400

    def test_consensus_status_labels(self):
        """Status is pending/partial/open based on endorsed count"""
        post_id = get_consensus_post_id()
        if not post_id:
            pytest.skip("No consensus post found")
        r = requests.get(f"{BASE_URL}/api/posts/{post_id}/consensus")
        data = r.json()
        count = data["endorsed"]
        expected_status = "pending" if count == 0 else ("partial" if count < 3 else "open")
        assert data["status"] == expected_status

    def test_feed_has_endorsement_count_for_consensus_posts(self):
        r = requests.get(f"{BASE_URL}/api/feed", params={"limit": 50})
        posts = r.json()
        for p in posts:
            if p.get("requiresConsensus"):
                assert "endorsementCount" in p
                break


# ─── Reports & Jury ─────────────────────────────────────────────────────────

class TestReportAndJury:
    """Report and jury endpoints"""

    def test_report_requires_auth(self):
        post_id = get_any_post_id()
        r = requests.post(f"{BASE_URL}/api/posts/{post_id}/report", json={"reason": "spam"})
        assert r.status_code == 401

    def test_report_post_success(self):
        s, _ = create_session()
        # Create a fresh post to report
        post_r = s.post(f"{BASE_URL}/api/posts", json={
            "communitySlug": "general",
            "title": "TEST_report_target_post",
            "body": "Test body for report",
        })
        assert post_r.status_code == 200
        post_id = post_r.json()["id"]

        r = s.post(f"{BASE_URL}/api/posts/{post_id}/report", json={"reason": "spam"})
        assert r.status_code == 200
        data = r.json()
        assert data["success"] is True
        assert data["reportCount"] >= 1

    def test_report_duplicate_returns_400(self):
        s, _ = create_session()
        post_r = s.post(f"{BASE_URL}/api/posts", json={
            "communitySlug": "general",
            "title": "TEST_report_dup",
            "body": "Test",
        })
        post_id = post_r.json()["id"]
        s.post(f"{BASE_URL}/api/posts/{post_id}/report", json={"reason": "spam"})
        r2 = s.post(f"{BASE_URL}/api/posts/{post_id}/report", json={"reason": "spam"})
        assert r2.status_code == 400

    def test_jury_triggers_at_threshold(self):
        """3 reports from different sessions should trigger a jury case"""
        # Create post with session1
        s1, _ = create_session()
        post_r = s1.post(f"{BASE_URL}/api/posts", json={
            "communitySlug": "general",
            "title": "TEST_jury_trigger",
            "body": "Test",
        })
        post_id = post_r.json()["id"]

        # 3 different sessions report it
        sessions = [s1]
        for _ in range(2):
            s, _ = create_session()
            sessions.append(s)

        results = []
        for s in sessions:
            r = s.post(f"{BASE_URL}/api/posts/{post_id}/report", json={"reason": "harassment"})
            results.append(r)

        last = results[-1].json()
        assert last["juryTriggered"] is True
        assert last["reportCount"] >= 3

    def test_report_status_endpoint(self):
        post_id = get_any_post_id()
        r = requests.get(f"{BASE_URL}/api/posts/{post_id}/report-status")
        assert r.status_code == 200
        data = r.json()
        assert "reportCount" in data
        assert "hasJuryCase" in data

    def test_get_post_has_jury_fields(self):
        post_id = get_any_post_id()
        r = requests.get(f"{BASE_URL}/api/posts/{post_id}")
        assert r.status_code == 200
        data = r.json()
        assert "reportCount" in data
        assert "hasJuryCase" in data


# ─── Thread Pseudonym ────────────────────────────────────────────────────────

class TestThreadPseudonym:
    """Per-thread ephemeral pseudonym endpoint"""

    def test_thread_pseudonym_requires_auth(self):
        post_id = get_any_post_id()
        r = requests.get(f"{BASE_URL}/api/posts/{post_id}/thread-pseudonym")
        assert r.status_code == 401

    def test_thread_pseudonym_returns_deterministic_value(self):
        s, _ = create_session()
        post_id = get_any_post_id()
        r1 = s.get(f"{BASE_URL}/api/posts/{post_id}/thread-pseudonym")
        assert r1.status_code == 200
        p1 = r1.json()["pseudonym"]
        # Call again — should return same value
        r2 = s.get(f"{BASE_URL}/api/posts/{post_id}/thread-pseudonym")
        p2 = r2.json()["pseudonym"]
        assert p1 == p2, f"Pseudonym changed: {p1} vs {p2}"

    def test_thread_pseudonym_differs_across_posts(self):
        s, _ = create_session()
        r = requests.get(f"{BASE_URL}/api/feed", params={"limit": 50})
        posts = r.json()
        if len(posts) < 2:
            pytest.skip("Need at least 2 posts")
        p1 = s.get(f"{BASE_URL}/api/posts/{posts[0]['id']}/thread-pseudonym").json()["pseudonym"]
        p2 = s.get(f"{BASE_URL}/api/posts/{posts[1]['id']}/thread-pseudonym").json()["pseudonym"]
        assert p1 != p2, "Thread pseudonyms should differ across posts"

    def test_thread_pseudonym_format(self):
        s, _ = create_session()
        post_id = get_any_post_id()
        r = s.get(f"{BASE_URL}/api/posts/{post_id}/thread-pseudonym")
        assert r.status_code == 200
        pseudo = r.json()["pseudonym"]
        parts = pseudo.split("-")
        assert len(parts) == 3, f"Expected adjective-noun-number format, got: {pseudo}"
        assert parts[2].isdigit()
