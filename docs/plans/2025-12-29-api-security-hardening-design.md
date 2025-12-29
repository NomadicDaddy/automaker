# API Security Hardening Design

**Date:** 2025-12-29
**Branch:** protect-api-with-api-key
**Status:** Approved

## Overview

Security improvements for the API authentication system before merging the PR. These changes harden the existing implementation for production deployment scenarios (local, Docker, internet-exposed).

## Fixes to Implement

### 1. Use Short-Lived wsToken for WebSocket Authentication

**Problem:** The client currently passes `sessionToken` in WebSocket URL query parameters. Query params get logged and can leak credentials.

**Solution:** Update the client to:

1. Fetch a wsToken from `/api/auth/token` before each WebSocket connection
2. Use `wsToken` query param instead of `sessionToken`
3. Never put session tokens in URLs

**Files to modify:**

- `apps/ui/src/lib/http-api-client.ts` - Update `connectWebSocket()` to fetch wsToken first

---

### 2. Add Environment Variable to Hide API Key from Logs

**Problem:** The API key is printed to console on startup, which gets captured by logging systems in production.

**Solution:** Add `AUTOMAKER_HIDE_API_KEY=true` env var to suppress the banner.

**Files to modify:**

- `apps/server/src/lib/auth.ts` - Wrap console.log banner in env var check

---

### 3. Add Rate Limiting to Login Endpoint

**Problem:** No brute force protection on `/api/auth/login`. Attackers could attempt many API keys.

**Solution:** Add basic in-memory rate limiting:

- ~5 attempts per minute per IP
- In-memory Map tracking (resets on server restart)
- Return 429 Too Many Requests when exceeded

**Files to modify:**

- `apps/server/src/routes/auth/index.ts` - Add rate limiting logic to login handler

---

### 4. Use Timing-Safe Comparison for API Key

**Problem:** Using `===` for API key comparison is vulnerable to timing attacks.

**Solution:** Use `crypto.timingSafeEqual()` for constant-time comparison.

**Files to modify:**

- `apps/server/src/lib/auth.ts` - Update `validateApiKey()` function

---

### 5. Make WebSocket Tokens Single-Use

**Problem:** wsTokens can be reused within the 5-minute window. If intercepted, attackers have time to use them.

**Solution:** Delete the token after first successful validation.

**Files to modify:**

- `apps/server/src/lib/auth.ts` - Update `validateWsConnectionToken()` to delete after use

---

## Implementation Order

1. Fix #4 (timing-safe comparison) - Simple, isolated change
2. Fix #5 (single-use wsToken) - Simple, isolated change
3. Fix #2 (hide API key env var) - Simple, isolated change
4. Fix #3 (rate limiting) - Moderate complexity
5. Fix #1 (client wsToken usage) - Requires coordination with server

## Testing Notes

- Test login with rate limiting (verify 429 after 5 attempts)
- Test WebSocket connection with new wsToken flow
- Test wsToken is invalidated after first use
- Verify `AUTOMAKER_HIDE_API_KEY=true` suppresses banner
