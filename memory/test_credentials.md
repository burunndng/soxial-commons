# Test Credentials

## Anonymous Auth (Ephemeral Sessions)
- **Login**: Click the "Enter" button in the navigation
- **Session**: A random pseudonym is assigned (e.g., `amber-circuit-2841`)
- **No password required** — fully anonymous
- **Token**: JWT stored in `session_token` httpOnly cookie (30-day expiry)
- **Logout**: Click "Exit" in the navigation

## API Endpoints
- `GET /api/health` — Backend health check
- `POST /api/auth/session` — Create anonymous session
- `GET /api/auth/me` — Get current session (requires cookie)
- `POST /api/auth/logout` — Clear session cookie
- `GET /api/communities` — List all communities
- `GET /api/feed` — Get randomized post feed
- `GET /api/posts/{id}` — Get post by ID
- `POST /api/posts` — Create post (requires auth)
- `GET /api/posts/{id}/comments` — Get post comments
- `POST /api/posts/{id}/comments` — Add comment (requires auth)
- `POST /api/posts/{id}/vote` — Vote on post (requires auth)
- `POST /api/comments/{id}/vote` — Vote on comment (requires auth)

## Notes
- No admin accounts — platform is intentionally anonymous
- Seed data auto-loads on first startup (10 posts + 3 comments)
- Vote counts hidden until user votes (anti-vanity design)
